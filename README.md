# StockFlow - Digital Inventory Management System

## Overview

StockFlow is a digital inventory management system designed for small retail stores. It provides a streamlined solution for tracking inventory, recording sales, managing product categories, and generating business reports. The application emphasizes simplicity and mobile-friendliness, enabling store owners to manage their inventory efficiently without requiring technical expertise.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Tooling:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast hot module replacement
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management, caching, and synchronization

**UI Component System:**
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Design system follows a "utility-focused" approach inspired by Linear, Notion, and Asana
- Custom CSS variables for theming with light/dark mode support
- Component configuration in `components.json` defines aliases and paths

**State Management:**
- Server state: TanStack Query with configured query client
- Authentication state: Custom `useAuth` hook with query-based user fetching
- Form state: React Hook Form with Zod schema validation via `@hookform/resolvers`
- UI state: Local component state using React hooks

**Design Principles:**
- Mobile-first responsive design with touch-friendly interactions
- Consistent spacing system using Tailwind's spacing scale (units of 2, 4, 6, 8, 12, 16)
- Typography system using Inter for UI text and JetBrains Mono for numerical data
- Grid-based layouts: 1-column mobile, 2-3 columns desktop
- Maximum content width of 7xl for main containers

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript running on Node.js
- HTTP server created using Node's native `http.createServer`
- Custom request logging middleware for API monitoring
- JSON body parsing with raw body preservation for webhook verification

**API Design:**
- RESTful API endpoints under `/api` prefix
- Authentication-protected routes using Replit Auth middleware
- Route registration in `server/routes.ts` with Express router
- Consistent error handling with HTTP status codes and JSON responses

**Authentication & Session Management:**
- Replit OpenID Connect (OIDC) authentication via Passport.js
- Session storage using connect-pg-simple for PostgreSQL-backed sessions
- Session configuration: 7-day TTL, HTTP-only cookies, secure in production
- User session includes OIDC claims, access token, and refresh token
- Custom `isAuthenticated` middleware for route protection

**Data Access Layer:**
- Storage interface pattern (`IStorage`) for abstraction of data operations
- Concrete implementation in `server/storage.ts`
- All database operations scoped by `userId` for multi-tenant data isolation
- Methods grouped by domain: users, categories, products, sales, reports

### Database Architecture

**ORM & Schema:**
- Drizzle ORM for type-safe database queries and migrations
- Schema defined in `shared/schema.ts` using Drizzle's declarative API
- PostgreSQL as the primary database (configured via `DATABASE_URL`)
- Zod integration via `drizzle-zod` for runtime validation of insert/update operations

**Data Model:**
- **Users**: Stores user profiles from Replit Auth (id, email, name, profile image)
- **Categories**: Product categorization with user ownership
- **Products**: Core inventory with SKU, pricing, quantities, and low-stock thresholds
- **Sales**: Transaction records with product references and automatic stock updates
- **Suppliers**: Vendor information with contact details for purchase order management
- **Purchase Orders**: Orders placed with suppliers, tracking status (pending, partial, received)
- **Purchase Order Items**: Line items for purchase orders with quantity and cost tracking
- **Sessions**: PostgreSQL-backed session storage for authentication

**Key Relationships:**
- Products belong to Users (userId foreign key)
- Products optionally belong to Categories (categoryId nullable foreign key)
- Sales reference Products (productId foreign key) and Users (userId foreign key)
- Categories belong to Users (userId foreign key)
- Suppliers belong to Users (userId foreign key)
- Purchase Orders belong to Suppliers (supplierId foreign key) and Users (userId foreign key)
- Purchase Order Items reference Purchase Orders (purchaseOrderId) and Products (productId)

**Database Features:**
- Automatic timestamp tracking (createdAt, updatedAt)
- Generated identity columns for primary keys
- Decimal precision for monetary values
- Index on session expiration for efficient cleanup

### External Dependencies

**Authentication Provider:**
- Replit Auth (OpenID Connect) for user authentication
- Environment variables: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`

**Database:**
- PostgreSQL database provisioned via `DATABASE_URL` environment variable
- Migrations managed through Drizzle Kit (`drizzle-kit push` command)

**Third-Party Libraries:**
- **Radix UI**: Unstyled, accessible UI primitives (dialogs, dropdowns, popovers, etc.)
- **Recharts**: Charting library for sales reports and analytics visualization
- **date-fns**: Date manipulation and formatting utilities
- **class-variance-authority**: Type-safe variant styling for components
- **Zod**: Schema validation for forms and API data

**Development Tools:**
- Replit-specific plugins for Vite (error overlay, cartographer, dev banner)
- ESBuild for server-side bundling in production
- tsx for TypeScript execution in development

**Build & Deployment:**
- Development: Vite dev server with HMR and ESBuild for backend
- Production: Static frontend build to `dist/public`, bundled server to `dist/index.cjs`
- Allowlist of dependencies bundled with server for reduced cold start times
- Session store uses pre-existing sessions table (createTableIfMissing: false)
