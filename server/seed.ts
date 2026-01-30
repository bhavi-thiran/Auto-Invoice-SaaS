import { db } from "./db";
import { companies, documents, type LineItem } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDemoData(userId: string) {
  // Check if company already exists for this user
  const [existingCompany] = await db.select().from(companies).where(eq(companies.userId, userId));
  
  if (existingCompany) {
    // Check if there are already documents
    const [existingDoc] = await db.select().from(documents).where(eq(documents.companyId, existingCompany.id)).limit(1);
    if (existingDoc) {
      return; // Already seeded
    }
  }

  // Create demo company if needed
  let companyId = existingCompany?.id;
  
  if (!existingCompany) {
    const [newCompany] = await db.insert(companies).values({
      userId,
      name: "Acme Solutions Sdn Bhd",
      address: "123 Jalan Teknologi, Cyberjaya, 63000 Selangor, Malaysia",
      phone: "+60123456789",
      email: "hello@acmesolutions.my",
      subscriptionPlan: "starter",
      documentsUsedThisMonth: 3,
    }).returning();
    companyId = newCompany.id;
  }

  if (!companyId) return;

  // Seed demo documents
  const demoDocuments = [
    {
      companyId,
      documentNumber: "INV-2024-0001",
      documentType: "invoice",
      customerName: "Ahmad bin Ibrahim",
      customerEmail: "ahmad@example.com",
      customerPhone: "+60198765432",
      lineItems: [
        { description: "Website Development", quantity: 1, unitPrice: 500000, total: 500000 },
        { description: "SEO Optimization", quantity: 2, unitPrice: 75000, total: 150000 },
      ] as LineItem[],
      subtotal: 650000,
      taxRate: 600,
      taxAmount: 39000,
      total: 689000,
      status: "sent",
      notes: "Payment due within 30 days.",
    },
    {
      companyId,
      documentNumber: "QUO-2024-0001",
      documentType: "quotation",
      customerName: "Siti Nurhaliza Enterprise",
      customerEmail: "siti@enterprise.my",
      customerPhone: "+60177654321",
      lineItems: [
        { description: "Mobile App Development", quantity: 1, unitPrice: 1500000, total: 1500000 },
        { description: "Backend API Integration", quantity: 1, unitPrice: 300000, total: 300000 },
        { description: "Maintenance (12 months)", quantity: 12, unitPrice: 50000, total: 600000 },
      ] as LineItem[],
      subtotal: 2400000,
      taxRate: 600,
      taxAmount: 144000,
      total: 2544000,
      status: "draft",
      notes: "Quote valid for 14 days.",
    },
    {
      companyId,
      documentNumber: "REC-2024-0001",
      documentType: "receipt",
      customerName: "Tech Dynamics Sdn Bhd",
      customerEmail: "accounts@techdynamics.com",
      customerPhone: "+60166543210",
      lineItems: [
        { description: "Cloud Hosting (Annual)", quantity: 1, unitPrice: 120000, total: 120000 },
      ] as LineItem[],
      subtotal: 120000,
      taxRate: 600,
      taxAmount: 7200,
      total: 127200,
      status: "paid",
      notes: "Thank you for your payment.",
    },
  ];

  for (const doc of demoDocuments) {
    await db.insert(documents).values(doc);
  }

  console.log("Demo data seeded successfully");
}
