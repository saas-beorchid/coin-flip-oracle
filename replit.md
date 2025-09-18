# Coin Oracle

## Overview

This is a full-stack coin flip simulator application built with React, TypeScript, Express, and PostgreSQL. The application allows authenticated users to flip virtual coins with customizable labels and styles, track flip history, and get AI-powered decision insights through OpenAI integration. The app features Clerk authentication, Stripe payment integration for premium features, a copper-themed design with 3D coin animations, and responsive mobile-friendly layout.

### Recent Changes (January 28, 2025)
- ✅ Removed all test payment endpoints from production code
- ✅ Implemented proper Stripe payment verification with session ID validation
- ✅ Fixed frontend payment flow to include proper session_id URL parameter
- ✅ Added comprehensive error handling for payment verification failures
- ✅ Updated schema to properly support copper, gold, and silver coin styles
- ✅ Enhanced payment status tracking with real-time verification
- ✅ Implemented pay-per-flip model requiring payment for each coin flip
- ✅ Fixed decision context preservation through payment flow via URL parameters
- ✅ Removed all console logs and debug code for production deployment
- ✅ Optimized error handling and logging for production environment
- ✅ Added temporary debugging logs to diagnose production deployment issues
- ✅ Enhanced health check endpoint with detailed system status reporting

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **UI Library**: Radix UI components with shadcn/ui for consistent, accessible design
- **Styling**: Tailwind CSS with custom copper color theme (#D87A3F) and dark mode support
- **State Management**: TanStack Query for server state management and caching
- **3D Graphics**: Three.js for realistic coin flip animations with material-based rendering
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with Express server and TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Storage Strategy**: Dual storage implementation - PostgreSQL for production with in-memory fallback for development
- **Caching**: In-memory TTL-based caching for statistics and frequently accessed data
- **API Design**: RESTful endpoints with proper error handling and validation
- **Development**: Hot module replacement with Vite integration for seamless development

### Database Design
- **Users Table**: Basic user management with username/password authentication
- **Flip History Table**: Comprehensive flip tracking with outcomes, timestamps, context, AI suggestions, and customization settings
- **Coin Settings Table**: User preferences for coin labels and visual styles
- **Migration Strategy**: Drizzle Kit for schema management and database migrations

### External Dependencies

#### Authentication
- **Clerk**: Complete user authentication and management solution
- **Environment Configuration**: Uses VITE_CLERK_PUBLISHABLE_KEY for secure setup
- **User Integration**: Seamless integration with payment tracking and flip history

#### Payment Processing
- **Stripe**: Complete payment processing for premium features
- **Environment Configuration**: Uses STRIPE_SECRET_KEY and VITE_STRIPE_PUBLIC_KEY
- **Payment Tracking**: User-specific payment status tracking with webhook integration
- **Premium Access**: Payment required for coin flip functionality

#### AI Integration
- **OpenAI API**: GPT-4o model for generating contextual decision-making suggestions
- **Caching Strategy**: In-memory suggestion cache with 1-hour TTL to reduce API costs
- **Error Handling**: Graceful fallbacks when AI service is unavailable

#### Database Services
- **PostgreSQL**: Primary database with Neon serverless PostgreSQL for cloud deployment
- **Connection Management**: Connection pooling with postgres.js client for optimal performance

#### UI and Styling
- **Radix UI**: Comprehensive component library for accessibility and consistent behavior
- **Tailwind CSS**: Utility-first CSS framework with custom copper color palette
- **Three.js**: 3D graphics library for realistic coin physics and rendering

#### Development Tools
- **Vite**: Modern build tool with HMR and optimized bundling
- **TypeScript**: Full type safety across frontend and backend
- **Zod**: Runtime type validation for API requests and responses
- **ESBuild**: Fast JavaScript bundler for production builds