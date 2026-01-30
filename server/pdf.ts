import PDFDocument from "pdfkit";
import type { Document, Company } from "@shared/schema";
import { Readable } from "stream";

async function fetchLogoBuffer(logoUrl: string): Promise<Buffer | null> {
  try {
    if (!logoUrl) return null;
    
    // For object storage paths, fetch from local server
    let url = logoUrl;
    if (logoUrl.startsWith('/')) {
      const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] || 
                      process.env.REPLIT_DEV_DOMAIN ||
                      'localhost:5000';
      const protocol = baseUrl.includes('localhost') ? 'http' : 'https';
      url = `${protocol}://${baseUrl}${logoUrl}`;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log(`Logo fetch failed: ${response.status} for ${url}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      console.error("Logo fetch timed out");
    } else {
      console.error("Error fetching logo:", error);
    }
    return null;
  }
}

export async function generateDocumentPDF(
  document: Document,
  company: Company
): Promise<Buffer> {
  // Pre-fetch logo if available
  let logoBuffer: Buffer | null = null;
  if (company.logoUrl) {
    logoBuffer = await fetchLogoBuffer(company.logoUrl);
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header with logo
      let headerStartX = 50;
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, 50, 50, { width: 60, height: 60 });
          headerStartX = 120;
        } catch (e) {
          console.error("Error embedding logo:", e);
        }
      }
      
      doc.fontSize(24).font("Helvetica-Bold");
      doc.text(company.name || "Company Name", headerStartX, 50, { align: "left" });
      
      doc.fontSize(10).font("Helvetica");
      if (company.address) {
        doc.text(company.address);
      }
      if (company.phone) {
        doc.text(`Phone: ${company.phone}`);
      }
      if (company.email) {
        doc.text(`Email: ${company.email}`);
      }

      doc.moveDown(2);

      // Document title
      const documentTitle =
        document.documentType === "invoice"
          ? "INVOICE"
          : document.documentType === "quotation"
          ? "QUOTATION"
          : "RECEIPT";

      doc.fontSize(18).font("Helvetica-Bold");
      doc.text(documentTitle, { align: "right" });
      doc.fontSize(12).font("Helvetica");
      doc.text(`${document.documentNumber}`, { align: "right" });
      doc.text(
        `Date: ${document.createdAt ? new Date(document.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}`,
        { align: "right" }
      );

      doc.moveDown(2);

      // Bill To
      doc.fontSize(12).font("Helvetica-Bold");
      doc.text("Bill To:");
      doc.font("Helvetica");
      doc.text(document.customerName);
      if (document.customerEmail) {
        doc.text(document.customerEmail);
      }
      if (document.customerPhone) {
        doc.text(document.customerPhone);
      }

      doc.moveDown(2);

      // Table header
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 280;
      const col3 = 350;
      const col4 = 420;
      const col5 = 490;

      doc.font("Helvetica-Bold").fontSize(10);
      doc.text("Description", col1, tableTop);
      doc.text("Qty", col2, tableTop, { width: 50, align: "right" });
      doc.text("Unit Price", col3, tableTop, { width: 60, align: "right" });
      doc.text("Total", col4, tableTop, { width: 70, align: "right" });

      // Separator line
      doc.moveTo(col1, tableTop + 15).lineTo(520, tableTop + 15).stroke();

      // Table rows
      doc.font("Helvetica").fontSize(10);
      let rowY = tableTop + 25;

      for (const item of document.lineItems) {
        doc.text(item.description, col1, rowY, { width: 220 });
        doc.text(item.quantity.toString(), col2, rowY, { width: 50, align: "right" });
        doc.text(`RM ${(item.unitPrice / 100).toFixed(2)}`, col3, rowY, {
          width: 60,
          align: "right",
        });
        doc.text(`RM ${(item.total / 100).toFixed(2)}`, col4, rowY, {
          width: 70,
          align: "right",
        });
        rowY += 20;
      }

      // Separator line
      doc.moveTo(col1, rowY + 5).lineTo(520, rowY + 5).stroke();

      // Totals
      rowY += 20;
      doc.text("Subtotal:", col3, rowY, { width: 60, align: "right" });
      doc.text(`RM ${(document.subtotal / 100).toFixed(2)}`, col4, rowY, {
        width: 70,
        align: "right",
      });

      if (document.taxRate && document.taxRate > 0) {
        rowY += 15;
        const taxPercent = (document.taxRate / 100).toFixed(1);
        doc.text(`Tax (${taxPercent}%):`, col3, rowY, { width: 60, align: "right" });
        doc.text(`RM ${((document.taxAmount || 0) / 100).toFixed(2)}`, col4, rowY, {
          width: 70,
          align: "right",
        });
      }

      rowY += 20;
      doc.font("Helvetica-Bold").fontSize(12);
      doc.text("TOTAL:", col3, rowY, { width: 60, align: "right" });
      doc.text(`RM ${(document.total / 100).toFixed(2)}`, col4, rowY, {
        width: 70,
        align: "right",
      });

      // Notes
      if (document.notes) {
        doc.moveDown(3);
        doc.font("Helvetica-Bold").fontSize(10);
        doc.text("Notes:", col1);
        doc.font("Helvetica");
        doc.text(document.notes, col1, doc.y, { width: 450 });
      }

      // Footer
      doc.fontSize(8).font("Helvetica");
      doc.text(
        "Generated by AutoInvoice - Thank you for your business!",
        50,
        750,
        { align: "center", width: 500 }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
