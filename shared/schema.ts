import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// Subscription plans enum
export const subscriptionPlans = ["starter", "pro", "business"] as const;
export type SubscriptionPlan = typeof subscriptionPlans[number];

// Document types enum
export const documentTypes = ["invoice", "quotation", "receipt"] as const;
export type DocumentType = typeof documentTypes[number];

// Document status enum
export const documentStatuses = ["draft", "sent", "paid"] as const;
export type DocumentStatus = typeof documentStatuses[number];

// Company profiles table
export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  logoUrl: text("logo_url"),
  subscriptionPlan: text("subscription_plan").notNull().default("starter"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  documentsUsedThisMonth: integer("documents_used_this_month").notNull().default(0),
  monthlyResetDate: timestamp("monthly_reset_date").defaultNow(),
  whatsappNumberId: text("whatsapp_number_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Line items for documents
export const lineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  total: z.number().min(0),
});

export type LineItem = z.infer<typeof lineItemSchema>;

// Documents table (invoices, quotations, receipts)
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  documentNumber: text("document_number").notNull(),
  documentType: text("document_type").notNull(), // invoice, quotation, receipt
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  lineItems: jsonb("line_items").notNull().$type<LineItem[]>(),
  subtotal: integer("subtotal").notNull(), // stored in cents
  taxRate: integer("tax_rate").default(0), // percentage * 100
  taxAmount: integer("tax_amount").default(0), // stored in cents
  total: integer("total").notNull(), // stored in cents
  status: text("status").notNull().default("draft"),
  pdfUrl: text("pdf_url"),
  sentViaWhatsapp: boolean("sent_via_whatsapp").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WhatsApp messages log
export const whatsappMessages = pgTable("whatsapp_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id"),
  fromNumber: text("from_number").notNull(),
  messageBody: text("message_body").notNull(),
  parsed: boolean("parsed").default(false),
  documentId: varchar("document_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  documents: many(documents),
  whatsappMessages: many(whatsappMessages),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  company: one(companies, {
    fields: [documents.companyId],
    references: [companies.id],
  }),
}));

export const whatsappMessagesRelations = relations(whatsappMessages, ({ one }) => ({
  company: one(companies, {
    fields: [whatsappMessages.companyId],
    references: [companies.id],
  }),
  document: one(documents, {
    fields: [whatsappMessages.documentId],
    references: [documents.id],
  }),
}));

// Insert schemas
export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  documentsUsedThisMonth: true,
  monthlyResetDate: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  pdfUrl: true,
  sentViaWhatsapp: true,
});

export const insertWhatsappMessageSchema = createInsertSchema(whatsappMessages).omit({
  id: true,
  createdAt: true,
  parsed: true,
  documentId: true,
});

// Types
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = z.infer<typeof insertWhatsappMessageSchema>;

// Plan limits
export const planLimits: Record<SubscriptionPlan, number> = {
  starter: 10,
  pro: 50,
  business: Infinity,
};

export const planPrices: Record<SubscriptionPlan, number> = {
  starter: 0,
  pro: 19,
  business: 49,
};
