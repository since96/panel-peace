import { pgTable, text, serial, integer, boolean, timestamp, json, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table (already defined, extended with additional fields)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // For admin/editors only
  password: text("password"), // For admin/editors only
  fullName: text("full_name").notNull(),
  email: text("email").notNull(), // Mandatory for all users
  phone: text("phone"),
  socialMedia: text("social_media"), // JSON string of social media links
  isEditor: boolean("is_editor").default(false), // Flag to separate editors from talent
  editorRole: text("editor_role"), // Editor role type: editor, senior_editor, editor_in_chief
  assignedProjects: integer("assigned_projects").array(), // Projects assigned to editor (only relevant for editors)
  role: text("role"), // Primary role (backwards compatibility)
  roles: text("roles").array(), // Multiple roles support
  avatarUrl: text("avatar_url"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  phone: true,
  socialMedia: true,
  isEditor: true,
  editorRole: true,
  assignedProjects: true,
  role: true,
  roles: true,
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
  
  // Deadline fields
  plotDeadline: timestamp("plot_deadline"), // Manual plot deadline
  coverDeadline: timestamp("cover_deadline"), // Manual cover deadline
  
  // Metadata fields
  createdBy: integer("created_by").notNull(), // User ID of creator
  createdAt: timestamp("created_at").defaultNow(),
  
  // Comic book metrics
  coverCount: integer("cover_count").default(1), // Number of covers
  interiorPageCount: integer("interior_page_count").notNull().default(22), // Number of interior comic pages
  fillerPageCount: integer("filler_page_count").default(0), // Number of supplementary editorial pages
  
  // Talent speed metrics
  pencilerPagesPerWeek: integer("penciler_pages_per_week").default(5),
  inkerPagesPerWeek: integer("inker_pages_per_week").default(7),
  coloristPagesPerWeek: integer("colorist_pages_per_week").default(10),
  lettererPagesPerWeek: integer("letterer_pages_per_week").default(15),
  
  // Batch processing metrics
  pencilBatchSize: integer("pencil_batch_size").default(5), // How many pages before moving to inks
  inkBatchSize: integer("ink_batch_size").default(5), // How many pages before moving to colors
  letterBatchSize: integer("letter_batch_size").default(5), // How many pages before final approval
  
  // Approval metrics
  approvalDays: integer("approval_days").default(2), // Days needed for approval between stages
  
  // Format info
  pageSize: text("page_size").default("standard"), // standard, oversized, etc.
  formatType: text("format_type").default("print"), // print, digital, web, etc.
  
  dueDate: timestamp("due_date"),
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
  pagesPerDay: integer("pages_per_day"), // Productivity metric
  specialties: text("specialties").array(), // Areas of expertise
  hourlyRate: integer("hourly_rate"), // For budget calculations  
  availability: text("availability").default("full_time"), // Availability status
  startDate: timestamp("start_date"), // When they start on the project
  endDate: timestamp("end_date"), // When their work is expected to be complete
});

// Project Editors table (linking editors to projects)
export const projectEditors = pgTable("project_editors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Editor user ID
  projectId: integer("project_id").notNull(),
  assignedBy: integer("assigned_by"), // ID of the editor who made the assignment
  assignmentRole: text("assignment_role").default("editor"), // Role within this specific project
  createdAt: timestamp("created_at").defaultNow(), // Renamed from assignedAt to match convention
});

export const insertCollaboratorSchema = createInsertSchema(collaborators).omit({
  id: true,
});

export const insertProjectEditorSchema = createInsertSchema(projectEditors).omit({
  id: true,
  createdAt: true,
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
  assignedTo: integer("assigned_to"), // Legacy field, keeping for compatibility
  assignees: text("assignees").array(), // New field storing array of user IDs
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
  sortOrder: integer("sort_order").notNull(),
  prevStepId: integer("prev_step_id"),
  nextStepId: integer("next_step_id"),
  comments: text("comments"), // Internal comments for editorial team
  
  // Talent rating metrics (1-10 scale)
  qualityRating: integer("quality_rating"), // Overall quality of work
  attentionToDetailRating: integer("attention_detail_rating"), // Attention to detail 
  storytellingRating: integer("storytelling_rating"), // Following the script/storytelling
  communicationRating: integer("communication_rating"), // Communication
  punctualityRating: integer("punctuality_rating"), // Meeting deadlines
  dispositionRating: integer("disposition_rating"), // Attitude and collaboration
  ratingComments: text("rating_comments"), // Additional notes on talent performance
  
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

// File uploads table for submissions and feedback
export const fileUploads = pgTable("file_uploads", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  filePath: text("file_path").notNull(),
  thumbnailPath: text("thumbnail_path"),
  uploadedBy: integer("uploaded_by").notNull(),
  workflowStepId: integer("workflow_step_id"),
  feedbackItemId: integer("feedback_item_id"),
  projectId: integer("project_id").notNull(),
  version: integer("version").notNull().default(1),
  notes: text("notes"),
  status: text("status").notNull().default("pending_review"),
  fileTag: text("file_tag").notNull().default("misc"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFileUploadSchema = createInsertSchema(fileUploads).omit({
  id: true,
  uploadedAt: true,
  updatedAt: true,
});

export type FileUpload = typeof fileUploads.$inferSelect;
export type InsertFileUpload = z.infer<typeof insertFileUploadSchema>;

// File links for simplifying external file sharing
export const fileLinks = pgTable("file_links", {
  id: serial("id").primaryKey(),
  workflowStepId: integer("workflow_step_id").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  addedBy: integer("added_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertFileLinkSchema = createInsertSchema(fileLinks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type FileLink = typeof fileLinks.$inferSelect;
export type InsertFileLink = z.infer<typeof insertFileLinkSchema>;

export type ProjectEditor = typeof projectEditors.$inferSelect;
export type InsertProjectEditor = z.infer<typeof insertProjectEditorSchema>;
