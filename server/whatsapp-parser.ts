import type { LineItem } from "@shared/schema";

interface ParsedInvoice {
  documentType: "invoice" | "quotation" | "receipt";
  customerName: string;
  customerPhone?: string;
  lineItems: LineItem[];
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  notes?: string;
}

export function parseWhatsAppMessage(message: string): ParsedInvoice | null {
  const lines = message.trim().split("\n").map(l => l.trim()).filter(l => l);
  
  if (lines.length < 2) {
    return null;
  }

  let documentType: "invoice" | "quotation" | "receipt" = "invoice";
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes("quotation") || lowerMessage.includes("quote")) {
    documentType = "quotation";
  } else if (lowerMessage.includes("receipt")) {
    documentType = "receipt";
  }

  let customerName = "";
  let customerPhone = "";
  const lineItems: LineItem[] = [];
  let notes = "";
  let taxRate = 0;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.startsWith("customer:") || lowerLine.startsWith("name:") || lowerLine.startsWith("to:")) {
      customerName = line.split(":").slice(1).join(":").trim();
    } else if (lowerLine.startsWith("phone:") || lowerLine.startsWith("tel:")) {
      customerPhone = line.split(":").slice(1).join(":").trim();
    } else if (lowerLine.startsWith("tax:")) {
      const taxMatch = line.match(/(\d+(?:\.\d+)?)\s*%?/);
      if (taxMatch) {
        taxRate = parseFloat(taxMatch[1]) * 100;
      }
    } else if (lowerLine.startsWith("note:") || lowerLine.startsWith("notes:")) {
      notes = line.split(":").slice(1).join(":").trim();
    } else {
      const parsed = parseLineItem(line);
      if (parsed) {
        lineItems.push(parsed);
      } else if (!customerName && lines.indexOf(line) === 0) {
        customerName = line;
      }
    }
  }

  if (!customerName || lineItems.length === 0) {
    return null;
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = taxRate > 0 ? Math.round((subtotal * taxRate) / 10000) : 0;
  const total = subtotal + taxAmount;

  return {
    documentType,
    customerName,
    customerPhone: customerPhone || undefined,
    lineItems,
    subtotal,
    taxRate: taxRate || undefined,
    taxAmount: taxAmount || undefined,
    total,
    notes: notes || undefined,
  };
}

function parseLineItem(line: string): LineItem | null {
  const patterns = [
    /^(.+?)\s*[-x]\s*(\d+)\s*[@xX]\s*(?:RM\s*)?(\d+(?:\.\d{1,2})?)/i,
    /^(.+?)\s+(\d+)\s+(?:RM\s*)?(\d+(?:\.\d{1,2})?)/i,
    /^(\d+)\s*[xX]\s*(.+?)\s+(?:RM\s*)?(\d+(?:\.\d{1,2})?)/i,
    /^(.+?)\s*[-:]\s*(?:RM\s*)?(\d+(?:\.\d{1,2})?)/i,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      if (pattern === patterns[2]) {
        const quantity = parseInt(match[1], 10);
        const description = match[2].trim();
        const unitPrice = Math.round(parseFloat(match[3]) * 100);
        return {
          description,
          quantity,
          unitPrice,
          total: quantity * unitPrice,
        };
      } else if (pattern === patterns[3]) {
        const description = match[1].trim();
        const unitPrice = Math.round(parseFloat(match[2]) * 100);
        return {
          description,
          quantity: 1,
          unitPrice,
          total: unitPrice,
        };
      } else {
        const description = match[1].trim();
        const quantity = parseInt(match[2], 10);
        const unitPrice = Math.round(parseFloat(match[3]) * 100);
        return {
          description,
          quantity,
          unitPrice,
          total: quantity * unitPrice,
        };
      }
    }
  }

  return null;
}

export function formatInvoiceConfirmation(invoice: ParsedInvoice, documentNumber: string): string {
  const docTypeLabel = invoice.documentType.charAt(0).toUpperCase() + invoice.documentType.slice(1);
  
  let message = `${docTypeLabel} Created!\n\n`;
  message += `Document: ${documentNumber}\n`;
  message += `Customer: ${invoice.customerName}\n\n`;
  message += `Items:\n`;
  
  for (const item of invoice.lineItems) {
    message += `- ${item.description}: ${item.quantity} x RM${(item.unitPrice / 100).toFixed(2)} = RM${(item.total / 100).toFixed(2)}\n`;
  }
  
  message += `\nSubtotal: RM${(invoice.subtotal / 100).toFixed(2)}`;
  
  if (invoice.taxAmount && invoice.taxAmount > 0) {
    message += `\nTax (${((invoice.taxRate || 0) / 100).toFixed(1)}%): RM${(invoice.taxAmount / 100).toFixed(2)}`;
  }
  
  message += `\nTotal: RM${(invoice.total / 100).toFixed(2)}`;
  
  return message;
}
