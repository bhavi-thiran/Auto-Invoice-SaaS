import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { insertDocumentSchema, planLimits, type SubscriptionPlan, type LineItem } from "@shared/schema";
import { z } from "zod";
import { seedDemoData } from "./seed";
import { generateDocumentPDF } from "./pdf";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { parseWhatsAppMessage, formatInvoiceConfirmation } from "./whatsapp-parser";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Register object storage routes for file uploads
  registerObjectStorageRoutes(app);

  // Get or create company for authenticated user (with optional seeding)
  const getOrCreateCompany = async (userId: string, shouldSeed = false) => {
    let company = await storage.getCompanyByUserId(userId);
    if (!company) {
      company = await storage.createCompany({
        userId,
        name: "My Company",
        subscriptionPlan: "starter",
      });
      // Seed demo data for new users
      if (shouldSeed) {
        try {
          await seedDemoData(userId);
          // Refresh company to get updated data
          company = await storage.getCompanyByUserId(userId);
        } catch (e) {
          console.error("Failed to seed demo data:", e);
        }
      }
    }
    return company!;
  };

  // Check plan limits
  const checkPlanLimit = (company: { subscriptionPlan: string; documentsUsedThisMonth: number }) => {
    const plan = company.subscriptionPlan as SubscriptionPlan;
    const limit = planLimits[plan];
    if (limit === Infinity) return true;
    return company.documentsUsedThisMonth < limit;
  };

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await getOrCreateCompany(userId, true); // Enable seeding for dashboard
      
      const counts = await storage.getDocumentCountByType(company.id);
      const recentDocuments = await storage.getRecentDocuments(company.id, 5);
      
      res.json({
        totalDocuments: counts.invoices + counts.quotations + counts.receipts,
        invoices: counts.invoices,
        quotations: counts.quotations,
        receipts: counts.receipts,
        recentDocuments,
        company,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Get company profile
  app.get("/api/company", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await getOrCreateCompany(userId);
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  // Update company profile
  app.patch("/api/company", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await getOrCreateCompany(userId);
      
      const updateSchema = z.object({
        name: z.string().min(1).optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        logoUrl: z.string().url().optional().or(z.literal("")),
        whatsappNumberId: z.string().optional(),
      });
      
      const validatedData = updateSchema.parse(req.body);
      const updated = await storage.updateCompany(company.id, validatedData);
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating company:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  // Get all documents
  app.get("/api/documents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await getOrCreateCompany(userId);
      const documents = await storage.getDocumentsByCompanyId(company.id);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Get single document
  app.get("/api/documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await getOrCreateCompany(userId);
      const document = await storage.getDocumentById(req.params.id);
      
      if (!document || document.companyId !== company.id) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  // Create document
  app.post("/api/documents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await getOrCreateCompany(userId);
      
      // Check plan limits
      if (!checkPlanLimit(company)) {
        return res.status(403).json({ 
          message: "Document limit reached. Please upgrade your plan." 
        });
      }
      
      const createSchema = z.object({
        documentType: z.enum(["invoice", "quotation", "receipt"]),
        customerName: z.string().min(1),
        customerEmail: z.string().email().nullable().optional(),
        customerPhone: z.string().nullable().optional(),
        lineItems: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          total: z.number(),
        })),
        subtotal: z.number(),
        taxRate: z.number().optional(),
        taxAmount: z.number().optional(),
        total: z.number(),
        notes: z.string().nullable().optional(),
        status: z.enum(["draft", "sent", "paid"]).optional(),
      });
      
      const validatedData = createSchema.parse(req.body);
      const documentNumber = await storage.generateDocumentNumber(
        company.id, 
        validatedData.documentType
      );
      
      const document = await storage.createDocument({
        companyId: company.id,
        documentNumber,
        documentType: validatedData.documentType,
        customerName: validatedData.customerName,
        customerEmail: validatedData.customerEmail || null,
        customerPhone: validatedData.customerPhone || null,
        lineItems: validatedData.lineItems as LineItem[],
        subtotal: validatedData.subtotal,
        taxRate: validatedData.taxRate || 0,
        taxAmount: validatedData.taxAmount || 0,
        total: validatedData.total,
        notes: validatedData.notes || null,
        status: validatedData.status || "draft",
      });
      
      // Increment usage
      await storage.incrementDocumentsUsed(company.id);
      
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  // Download document PDF
  app.get("/api/documents/:id/pdf", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await getOrCreateCompany(userId);
      const document = await storage.getDocumentById(req.params.id);
      
      if (!document || document.companyId !== company.id) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const pdfBuffer = await generateDocumentPDF(document, company);
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${document.documentNumber}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Update document
  app.patch("/api/documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await getOrCreateCompany(userId);
      const document = await storage.getDocumentById(req.params.id);
      
      if (!document || document.companyId !== company.id) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      const updateSchema = z.object({
        customerName: z.string().min(1).optional(),
        customerEmail: z.string().email().nullable().optional(),
        customerPhone: z.string().nullable().optional(),
        lineItems: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          total: z.number(),
        })).optional(),
        subtotal: z.number().optional(),
        taxRate: z.number().optional(),
        taxAmount: z.number().optional(),
        total: z.number().optional(),
        notes: z.string().nullable().optional(),
        status: z.enum(["draft", "sent", "paid"]).optional(),
      });
      
      const validatedData = updateSchema.parse(req.body);
      const updated = await storage.updateDocument(req.params.id, validatedData as any);
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating document:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  // Stripe - Get publishable key
  app.get("/api/stripe/config", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error getting Stripe config:", error);
      res.status(500).json({ message: "Failed to get Stripe config" });
    }
  });

  // Stripe - Get subscription plans
  app.get("/api/stripe/plans", async (req, res) => {
    try {
      const result = await db.execute(sql`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring
        FROM stripe.products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = true
        ORDER BY pr.unit_amount ASC
      `);
      res.json({ plans: result.rows });
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Failed to fetch plans" });
    }
  });

  // Stripe - Create checkout session
  app.post("/api/stripe/checkout", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userEmail = req.user.claims.email;
      const company = await getOrCreateCompany(userId);
      const { priceId } = req.body;

      if (!priceId) {
        return res.status(400).json({ message: "Price ID is required" });
      }

      const stripe = await getUncachableStripeClient();

      let customerId = company.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: userEmail,
          metadata: { companyId: company.id, visibleUserId: userId },
        });
        await storage.updateCompany(company.id, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${req.protocol}://${req.get('host')}/settings?tab=subscription&success=true`,
        cancel_url: `${req.protocol}://${req.get('host')}/settings?tab=subscription&canceled=true`,
        metadata: { companyId: company.id },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Stripe - Customer portal
  app.post("/api/stripe/portal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await getOrCreateCompany(userId);

      if (!company.stripeCustomerId) {
        return res.status(400).json({ message: "No subscription found" });
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.billingPortal.sessions.create({
        customer: company.stripeCustomerId,
        return_url: `${req.protocol}://${req.get('host')}/settings?tab=subscription`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ message: "Failed to create portal session" });
    }
  });

  // WhatsApp Webhook - Verify (GET)
  app.get("/api/webhook/whatsapp", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    
    // Verify token should be set in environment
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "autoinvoice_verify_token";
    
    if (mode === "subscribe" && token === verifyToken) {
      console.log("WhatsApp webhook verified");
      res.status(200).send(challenge);
    } else {
      res.status(403).send("Forbidden");
    }
  });

  // WhatsApp Webhook - Receive Messages (POST)
  app.post("/api/webhook/whatsapp", async (req, res) => {
    try {
      const body = req.body;
      
      if (body.object === "whatsapp_business_account") {
        for (const entry of body.entry || []) {
          for (const change of entry.changes || []) {
            if (change.field === "messages") {
              const value = change.value;
              const phoneNumberId = value.metadata?.phone_number_id;
              
              for (const message of value.messages || []) {
                if (message.type === "text") {
                  const fromNumber = message.from;
                  const messageBody = message.text?.body || "";
                  
                  // Find company by WhatsApp number ID
                  const company = await storage.getCompanyByWhatsappNumber(phoneNumberId);
                  
                  if (!company) {
                    console.log(`No company found for WhatsApp number ID: ${phoneNumberId}`);
                    continue;
                  }

                  // Log the message
                  const whatsappMessage = await storage.createWhatsappMessage({
                    companyId: company.id,
                    fromNumber,
                    messageBody,
                  });
                  
                  // Parse the message and create document
                  const parsed = parseWhatsAppMessage(messageBody);
                  
                  if (parsed) {
                    // Check plan limits
                    const plan = company.subscriptionPlan as SubscriptionPlan;
                    const limit = planLimits[plan];
                    if (limit !== Infinity && company.documentsUsedThisMonth >= limit) {
                      console.log(`Plan limit reached for company ${company.id}`);
                      continue;
                    }

                    // Generate document number
                    const documentNumber = await storage.generateDocumentNumber(
                      company.id,
                      parsed.documentType
                    );

                    // Create the document
                    const document = await storage.createDocument({
                      companyId: company.id,
                      documentNumber,
                      documentType: parsed.documentType,
                      customerName: parsed.customerName,
                      customerPhone: parsed.customerPhone || fromNumber,
                      lineItems: parsed.lineItems,
                      subtotal: parsed.subtotal,
                      taxRate: parsed.taxRate,
                      taxAmount: parsed.taxAmount,
                      total: parsed.total,
                      notes: parsed.notes,
                      status: "sent",
                    });

                    // Update message with document ID
                    await storage.updateWhatsappMessage(whatsappMessage.id, {
                      parsed: true,
                      documentId: document.id,
                    });

                    // Increment usage counter
                    await storage.incrementDocumentsUsed(company.id);

                    const confirmation = formatInvoiceConfirmation(parsed, documentNumber);
                    console.log(`Created ${parsed.documentType} ${documentNumber} for ${parsed.customerName}`);
                    console.log(confirmation);
                    
                    // TODO: Send WhatsApp reply with PDF
                    // This requires WhatsApp Business API credentials to send messages
                  } else {
                    console.log(`Could not parse message from ${fromNumber}: ${messageBody}`);
                  }
                }
              }
            }
          }
        }
      }
      
      res.status(200).send("OK");
    } catch (error) {
      console.error("Error processing WhatsApp webhook:", error);
      res.status(500).send("Error");
    }
  });

  return httpServer;
}
