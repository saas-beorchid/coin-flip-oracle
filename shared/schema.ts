import { pgTable, text, serial, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Flip history table
export const flipHistory = pgTable("flip_history", {
  id: serial("id").primaryKey(),
  outcome: text("outcome").notNull(), // 'heads' or 'tails'
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  context: text("context"), // Optional decision context
  aiSuggestion: text("ai_suggestion"), // OpenAI suggestion response
  headsLabel: varchar("heads_label", { length: 10 }).notNull().default("HEADS"), 
  tailsLabel: varchar("tails_label", { length: 10 }).notNull().default("TAILS"),
  coinStyle: varchar("coin_style", { length: 20 }).notNull().default("copper"), // 'copper', 'gold', 'silver'
});

export const insertFlipHistorySchema = createInsertSchema(flipHistory).omit({
  id: true,
  timestamp: true,
});

// Extended schema with validation
export const flipHistorySchema = insertFlipHistorySchema.extend({
  outcome: z.enum(["heads", "tails"]),
  context: z.string().optional().nullable(),
  aiSuggestion: z.string().optional().nullable(),
  headsLabel: z.string().max(10).default("HEADS"),
  tailsLabel: z.string().max(10).default("TAILS"),
  coinStyle: z.enum(["copper", "gold", "silver"]).default("copper"),
});

export type InsertFlipHistory = z.infer<typeof insertFlipHistorySchema>;
export type FlipHistory = typeof flipHistory.$inferSelect;

// Coin customization settings
export const coinSettings = pgTable("coin_settings", {
  id: serial("id").primaryKey(),
  headsLabel: varchar("heads_label", { length: 10 }).notNull().default("HEADS"),
  tailsLabel: varchar("tails_label", { length: 10 }).notNull().default("TAILS"),
  coinStyle: varchar("coin_style", { length: 20 }).notNull().default("copper"),
});

export const insertCoinSettingsSchema = createInsertSchema(coinSettings).omit({
  id: true,
});

export const coinSettingsSchema = insertCoinSettingsSchema.extend({
  headsLabel: z.string().max(10).default("HEADS"),
  tailsLabel: z.string().max(10).default("TAILS"),
  coinStyle: z.enum(["copper", "gold", "silver"]).default("copper"),
});

export type InsertCoinSettings = z.infer<typeof insertCoinSettingsSchema>;
export type CoinSettings = typeof coinSettings.$inferSelect;
