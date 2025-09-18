import dotenv from 'dotenv';
dotenv.config();
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

const DATABASE_URL = process.env.DATABASE_URL;

// Ensure DATABASE_URL is defined
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not defined");
}

// Create a PostgreSQL client
const client = postgres(process.env.DATABASE_URL || "", {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Timeout in seconds
  connect_timeout: 10, // Connect timeout in seconds
});

// Initialize drizzle with our schema
export const db = drizzle(client, { schema });

// Function to ensure all tables are created
export async function initializeDatabase() {
  try {
    // Test the connection with a simple query
    await client`SELECT version()`;
    // Verify each table exists (will create them if they don't exist)
    await ensureTablesExist();
    return true;
  } catch (error) {
    return false;
  }
}

async function ensureTablesExist() {
  try {
    // Create users table
    await client`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    `;

    // Create flip_history table
    await client`
      CREATE TABLE IF NOT EXISTS flip_history (
        id SERIAL PRIMARY KEY,
        outcome TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        context TEXT,
        ai_suggestion TEXT,
        heads_label VARCHAR(10) NOT NULL DEFAULT 'HEADS',
        tails_label VARCHAR(10) NOT NULL DEFAULT 'TAILS',
        coin_style VARCHAR(20) NOT NULL DEFAULT 'default'
      )
    `;

    // Create coin_settings table
    await client`
      CREATE TABLE IF NOT EXISTS coin_settings (
        id SERIAL PRIMARY KEY,
        heads_label VARCHAR(10) NOT NULL DEFAULT 'HEADS',
        tails_label VARCHAR(10) NOT NULL DEFAULT 'TAILS',
        coin_style VARCHAR(20) NOT NULL DEFAULT 'default'
      )
    `;

    // Check if we need to insert default coin settings
    const settingsCount = await client`SELECT COUNT(*) FROM coin_settings`;
    if (settingsCount[0].count === '0') {
      await client`
        INSERT INTO coin_settings (heads_label, tails_label, coin_style)
        VALUES ('HEADS', 'TAILS', 'default')
      `;
    }
  } catch (error) {
    throw error;
  }
}