import {
  companies,
  documents,
  whatsappMessages,
  type Company,
  type InsertCompany,
  type Document,
  type InsertDocument,
  type WhatsappMessage,
  type InsertWhatsappMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Company operations
  getCompanyByUserId(userId: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined>;
  
  // Document operations
  getDocumentsByCompanyId(companyId: string): Promise<Document[]>;
  getDocumentById(id: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, document: Partial<InsertDocument>): Promise<Document | undefined>;
  getDocumentCountByType(companyId: string): Promise<{ invoices: number; quotations: number; receipts: number }>;
  getRecentDocuments(companyId: string, limit: number): Promise<Document[]>;
  generateDocumentNumber(companyId: string, type: string): Promise<string>;
  
  // WhatsApp message operations
  createWhatsappMessage(message: InsertWhatsappMessage): Promise<WhatsappMessage>;
  getWhatsappMessagesByCompanyId(companyId: string): Promise<WhatsappMessage[]>;
  updateWhatsappMessage(id: string, update: Partial<WhatsappMessage>): Promise<WhatsappMessage | undefined>;
  
  // Company by WhatsApp number
  getCompanyByWhatsappNumber(whatsappNumberId: string): Promise<Company | undefined>;
  
  // Usage tracking
  incrementDocumentsUsed(companyId: string): Promise<void>;
  resetMonthlyUsage(companyId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Company operations
  async getCompanyByUserId(userId: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.userId, userId));
    return company || undefined;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    // Normalize phone number before storing
    const normalizedCompany = { ...company };
    if (normalizedCompany.phone) {
      normalizedCompany.phone = this.normalizePhone(normalizedCompany.phone);
    }
    
    const [newCompany] = await db.insert(companies).values(normalizedCompany).returning();
    return newCompany;
  }

  async updateCompany(id: string, update: Partial<InsertCompany>): Promise<Company | undefined> {
    // Normalize phone number before storing
    const normalizedUpdate = { ...update };
    if (normalizedUpdate.phone) {
      normalizedUpdate.phone = this.normalizePhone(normalizedUpdate.phone);
    }
    
    const [updated] = await db
      .update(companies)
      .set({ ...normalizedUpdate, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return updated || undefined;
  }

  // Document operations
  async getDocumentsByCompanyId(companyId: string): Promise<Document[]> {
    return db
      .select()
      .from(documents)
      .where(eq(documents.companyId, companyId))
      .orderBy(desc(documents.createdAt));
  }

  async getDocumentById(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async updateDocument(id: string, update: Partial<InsertDocument>): Promise<Document | undefined> {
    const [updated] = await db
      .update(documents)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return updated || undefined;
  }

  async getDocumentCountByType(companyId: string): Promise<{ invoices: number; quotations: number; receipts: number }> {
    const docs = await db
      .select()
      .from(documents)
      .where(eq(documents.companyId, companyId));
    
    return {
      invoices: docs.filter(d => d.documentType === "invoice").length,
      quotations: docs.filter(d => d.documentType === "quotation").length,
      receipts: docs.filter(d => d.documentType === "receipt").length,
    };
  }

  async getRecentDocuments(companyId: string, limit: number): Promise<Document[]> {
    return db
      .select()
      .from(documents)
      .where(eq(documents.companyId, companyId))
      .orderBy(desc(documents.createdAt))
      .limit(limit);
  }

  async generateDocumentNumber(companyId: string, type: string): Promise<string> {
    const prefix = type === "invoice" ? "INV" : type === "quotation" ? "QUO" : "REC";
    const year = new Date().getFullYear();
    
    // Use count with lock to ensure atomic increment
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents)
      .where(
        and(
          eq(documents.companyId, companyId),
          eq(documents.documentType, type)
        )
      );
    
    const count = (result[0]?.count || 0) + 1;
    const timestamp = Date.now().toString(36).slice(-4);
    return `${prefix}-${year}-${String(count).padStart(4, "0")}-${timestamp}`;
  }

  // WhatsApp message operations
  async createWhatsappMessage(message: InsertWhatsappMessage): Promise<WhatsappMessage> {
    const [newMessage] = await db.insert(whatsappMessages).values(message).returning();
    return newMessage;
  }

  async getWhatsappMessagesByCompanyId(companyId: string): Promise<WhatsappMessage[]> {
    return db
      .select()
      .from(whatsappMessages)
      .where(eq(whatsappMessages.companyId, companyId))
      .orderBy(desc(whatsappMessages.createdAt));
  }

  async updateWhatsappMessage(id: string, update: Partial<WhatsappMessage>): Promise<WhatsappMessage | undefined> {
    const [updated] = await db
      .update(whatsappMessages)
      .set(update)
      .where(eq(whatsappMessages.id, id))
      .returning();
    return updated || undefined;
  }

  // Company by WhatsApp number
  async getCompanyByWhatsappNumber(whatsappNumberId: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.whatsappNumberId, whatsappNumberId));
    return company || undefined;
  }

  // Company by Stripe customer ID
  async getCompanyByStripeCustomerId(stripeCustomerId: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.stripeCustomerId, stripeCustomerId));
    return company || undefined;
  }

  // Normalize phone number for consistent storage and lookup
  normalizePhone(phone: string): string {
    // Remove spaces, dashes, parentheses
    return phone.replace(/[\s\-\(\)]/g, '');
  }

  // Company by phone number (for WhatsApp identification)
  async getCompanyByPhone(phone: string): Promise<Company | undefined> {
    const normalizedPhone = this.normalizePhone(phone);
    
    // Try exact match with normalized phone
    let [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.phone, normalizedPhone));
    
    if (company) return company;
    
    // Try matching last 9-10 digits (handles country code variations like +60 vs 60)
    const lastDigits = normalizedPhone.slice(-10);
    const [companyByDigits] = await db
      .select()
      .from(companies)
      .where(sql`RIGHT(REGEXP_REPLACE(${companies.phone}, '[^0-9+]', '', 'g'), 10) = ${lastDigits}`);
    
    return companyByDigits || undefined;
  }

  // Usage tracking
  async incrementDocumentsUsed(companyId: string): Promise<void> {
    await db
      .update(companies)
      .set({
        documentsUsedThisMonth: sql`${companies.documentsUsedThisMonth} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId));
  }

  async resetMonthlyUsage(companyId: string): Promise<void> {
    await db
      .update(companies)
      .set({
        documentsUsedThisMonth: 0,
        monthlyResetDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId));
  }
}

export const storage = new DatabaseStorage();
