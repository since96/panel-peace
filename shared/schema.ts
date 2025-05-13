import { pgTable, text, serial, integer, boolean, timestamp, json, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (already defined, extended with additional fields)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  role: text("role"),
  avatarUrl: text("avatar_url"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
  avatarUrl: true,
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  issue: text("issue"),
  description: text("description"),
  status: text("status").notNull().default("in_progress"),
  coverImage: text("cover_image"),
  progress: integer("progress").notNull().default(0),
  pageCount: integer("page_count").notNull().default(22), // Default comic page count
  pageSize: text("page_size").default("standard"), // standard, oversized, etc.
  formatType: text("format_type").default("print"), // print, digital, web, etc.
  dueDate: timestamp("due_date"),
  createdBy: integer("created_by").notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
});

// Collaborators table (linking users to projects)
export const collaborators = pgTable("collaborators", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  projectId: integer("project_id").notNull(),
  role: text("role").notNull(),
});

export const insertCollaboratorSchema = createInsertSchema(collaborators).omit({
  id: true,
});

// Feedback items table
export const feedbackItems = pgTable("feedback_items", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("pending"),
  assetType: text("asset_type").notNull(),
  assetId: integer("asset_id"),
  requestedBy: integer("requested_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  thumbnailUrl: text("thumbnail_url"),
});

export const insertFeedbackItemSchema = createInsertSchema(feedbackItems).omit({
  id: true,
  createdAt: true,
});

// Assets table (for scripts, artworks, etc.)
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  filePath: text("file_path"),
  thumbnailUrl: text("thumbnail_url"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Deadlines table
export const deadlines = pgTable("deadlines", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("pending"),
});

export const insertDeadlineSchema = createInsertSchema(deadlines).omit({
  id: true,
});

// Panel layouts table
export const panelLayouts = pgTable("panel_layouts", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  pageNumber: integer("page_number").notNull(),
  layout: json("layout").notNull(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPanelLayoutSchema = createInsertSchema(panelLayouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Comments table (for feedback)
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  feedbackId: integer("feedback_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Collaborator = typeof collaborators.$inferSelect;
export type InsertCollaborator = z.infer<typeof insertCollaboratorSchema>;

export type FeedbackItem = typeof feedbackItems.$inferSelect;
export type InsertFeedbackItem = z.infer<typeof insertFeedbackItemSchema>;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type Deadline = typeof deadlines.$inferSelect;
export type InsertDeadline = z.infer<typeof insertDeadlineSchema>;

export type PanelLayout = typeof panelLayouts.$inferSelect;
export type InsertPanelLayout = z.infer<typeof insertPanelLayoutSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

// Workflow steps table for tracking comic book production process
export const workflowSteps = pgTable("workflow_steps", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  stepType: varchar("step_type", { length: 50 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("not_started"),
  progress: integer("progress").notNull().default(0),
  assignedTo: integer("assigned_to"),
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
  sortOrder: integer("sort_order").notNull(),
  prevStepId: integer("prev_step_id"),
  nextStepId: integer("next_step_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWorkflowStepSchema = createInsertSchema(workflowSteps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type InsertWorkflowStep = z.infer<typeof insertWorkflowStepSchema>;
