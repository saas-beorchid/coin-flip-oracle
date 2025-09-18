# Environment Variables Setup

This document outlines all the environment variables required for the CoinFlip Oracle application.

## Required Environment Variables

Create a `.env` file in the root directory with the following variables:

### Database Configuration
```bash
# PostgreSQL connection string
DATABASE_URL=postgresql://username:password@localhost:5432/coinfliporacle
```

### OpenAI Configuration
```bash
# Get your API key from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your_openai_api_key_here
```

### Stripe Configuration
```bash
# Get your keys from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here
```

### Clerk Authentication Configuration
```bash
# Get your publishable key from https://dashboard.clerk.com/
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
```

### Stripe Public Key (for client-side)
```bash
# Get your publishable key from https://dashboard.stripe.com/apikeys
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key_here
```

### Server Configuration
```bash
PORT=5000
NODE_ENV=development
DEFAULT_ORIGIN=http://localhost:5000
```

### Optional: Replit Configuration
```bash
# Only needed if deploying on Replit
REPL_ID=your_repl_id_here
```

## Security Notes

- Never commit the `.env` file to version control
- Use different API keys for development and production
- Keep your secret keys secure and rotate them regularly
- The `.env` file is already included in `.gitignore`

## Current Status

✅ All secrets are properly externalized to environment variables
✅ No hardcoded secrets found in the codebase
✅ Proper error handling for missing environment variables
✅ Environment variables are properly validated on startup
