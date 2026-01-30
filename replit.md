# AutoInvoice

## Overview

AutoInvoice is a full-stack SaaS web application that enables small business owners to generate professional Invoices, Quotations, and Receipts via WhatsApp messaging. The system automatically creates PDF documents with company branding and delivers them to customers. Built with a React frontend, Express backend, and PostgreSQL database using Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite

The frontend follows a page-based structure in `client/src/pages/` with shared components in `client/src/components/`. Protected routes require authentication, with unauthenticated users seeing a landing page.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with tsx for development
- **API Design**: RESTful JSON API under `/api/*` prefix
- **PDF Generation**: PDFKit for creating invoice/quotation/receipt documents
- **Authentication**: Custom email/password with bcrypt hashing
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple

The server uses a modular structure:
- `server/routes.ts` - API endpoint definitions
- `server/storage.ts` - Database access layer implementing IStorage interface
- `server/pdf.ts` - PDF document generation
- `server/auth.ts` - Authentication routes and middleware (register, login, logout)

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` (shared between frontend and backend)

Key database tables:
- `users` - User accounts with email/password authentication
- `sessions` - Session storage for authentication
- `companies` - Business profiles with subscription info
- `documents` - Invoices, quotations, and receipts
- `whatsappMessages` - Message tracking for WhatsApp integration

### Authentication
Custom email/password authentication with bcrypt password hashing:
1. User registers with email, password, first name, last name at `/register`
2. Password hashed with bcrypt (12 rounds) and stored in `users` table
3. Login verifies credentials and creates session stored in PostgreSQL
4. Protected routes check `req.session.userId` via `isAuthenticated` middleware

Auth API endpoints:
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/logout` - End session
- `GET /api/auth/user` - Get current user

### Subscription System
Three-tier subscription model with document limits:
- **Starter**: Limited documents per month (default)
- **Pro**: Higher document limit
- **Business**: Unlimited documents

Plan limits enforced via middleware before document creation.

## External Dependencies

### Third-Party Services
- **Stripe**: Payment processing for subscriptions (Pro $19/mo, Business $49/mo)
- **WhatsApp Business API**: Message-based document generation with natural language parsing
- **Object Storage**: Company logo storage with presigned URLs

### Key NPM Packages
- `drizzle-orm` + `drizzle-kit`: Database ORM and migrations
- `pdfkit`: Server-side PDF generation
- `bcrypt`: Password hashing for authentication
- `express-session` + `connect-pg-simple`: Session management
- `@tanstack/react-query`: Client-side data fetching
- `zod`: Schema validation (shared between client/server)

### Database
- PostgreSQL accessed via `DATABASE_URL` environment variable
- Migrations stored in `/migrations` directory
- Schema push via `npm run db:push`

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret for subscription events

## Recent Changes (January 2026)

### Stripe Payment Integration
- Added `server/stripeClient.ts` for credential management
- Added `server/webhookHandlers.ts` for processing subscription webhooks
- Checkout creates subscriptions and stores stripeCustomerId on company
- Webhooks handle subscription.created/updated/deleted and checkout.session.completed
- Plan determination falls back to price amount when metadata unavailable

### Company Logo Upload
- Object storage integration for logo uploads via presigned URLs
- Settings page has drag-and-drop logo upload with preview
- Logos stored at `/objects/public/logos/<companyId>/<filename>`
- PDF generation fetches and embeds logos in document headers

### WhatsApp Message Parsing
- `server/whatsapp-parser.ts` parses natural language messages into invoice data
- Supports formats like "Customer: Name", "Item - qty x RM price", "Tax: X%", "Note: text"
- Webhook automatically creates documents from parsed messages
- Respects plan limits and usage tracking

### Email/Password Authentication (January 2026)
- Replaced Replit Auth with custom email/password authentication
- Added `server/auth.ts` with bcrypt password hashing
- Created `/login` and `/register` pages in frontend
- Users table now includes password field (nullable for migration compatibility)
- Session-based authentication with PostgreSQL session store