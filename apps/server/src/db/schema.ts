import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  model: text("model").notNull(),
  provider: text("provider").notNull(),
  messages: text("messages").notNull().default("[]"),
});
