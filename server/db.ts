import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a PostgreSQL client with postgres.js
const client = postgres(process.env.DATABASE_URL || "", {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Timeout in seconds
  connect_timeout: 10, // Connect timeout in seconds
});

// Initialize drizzle with our schema
export const db = drizzle(client, { schema });
