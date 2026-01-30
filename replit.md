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
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple

The server uses a modular structure:
- `server/routes.ts` - API endpoint definitions
- `server/storage.ts` - Database access layer implementing IStorage interface
- `server/pdf.ts` - PDF document generation
- `server/replit_integrations/auth/` - Authentication middleware and routes

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` (shared between frontend and backend)

Key database tables:
- `users` - User accounts (managed by Replit Auth)
- `sessions` - Session storage for authentication
- `companies` - Business profiles with subscription info
- `documents` - Invoices, quotations, and receipts
- `whatsappMessages` - Message tracking for WhatsApp integration

### Authentication
Uses Replit Auth with OpenID Connect. The authentication flow:
1. User clicks login, redirected to Replit's OIDC provider
2. On success, user info stored/updated in `users` table
3. Session maintained via PostgreSQL-backed session store
4. Protected routes check authentication via `isAuthenticated` middleware

### Subscription System
Three-tier subscription model with document limits:
- **Starter**: Limited documents per month (default)
- **Pro**: Higher document limit
- **Business**: Unlimited documents

Plan limits enforced via middleware before document creation.

## External Dependencies

### Third-Party Services
- **Replit Auth**: OpenID Connect authentication provider
- **Stripe**: Payment processing for subscriptions (planned/mock)
- **WhatsApp Business API**: Message-based document generation (planned)

### Key NPM Packages
- `drizzle-orm` + `drizzle-kit`: Database ORM and migrations
- `pdfkit`: Server-side PDF generation
- `passport` + `openid-client`: Authentication
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
- `REPL_ID`: Replit environment identifier (auto-set in Replit)
- `ISSUER_URL`: OIDC issuer URL (defaults to Replit)