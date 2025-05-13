import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProjectSchema, 
  insertFeedbackItemSchema, 
  insertAssetSchema,
  insertDeadlineSchema,
  insertPanelLayoutSchema,
  insertCommentSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Project routes
  app.get("/api/projects", async (_req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      // Pre-process the date field to handle string date from client
      const requestData = { ...req.body };
      
      // If dueDate is a string, convert it to a Date object for Zod validation
      if (requestData.dueDate && typeof requestData.dueDate === 'string') {
        try {
          // Parse the ISO date string to a JavaScript Date
          requestData.dueDate = new Date(requestData.dueDate);
        } catch (e) {
          return res.status(400).json({ 
            message: "Invalid date format", 
            errors: { dueDate: { _errors: ["Invalid date format"] } } 
          });
        }
      }
      
      const parsedData = insertProjectSchema.safeParse(requestData);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid project data", errors: parsedData.error.format() });
      }

      const newProject = await storage.createProject(parsedData.data);
      res.status(201).json(newProject);
    } catch (error) {
      console.error("Project creation error:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const updateSchema = insertProjectSchema.partial();
      const parsedData = updateSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid project data", errors: parsedData.error.format() });
      }

      const updatedProject = await storage.updateProject(id, parsedData.data);
      res.json(updatedProject);
    } catch (error) {
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      await storage.deleteProject(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Feedback routes
  app.get("/api/feedback", async (_req, res) => {
    try {
      const feedback = await storage.getPendingFeedback();
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch feedback items" });
    }
  });

  app.get("/api/projects/:projectId/feedback", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const feedback = await storage.getFeedbackByProject(projectId);
      res.json(feedback);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch feedback items" });
    }
  });

  app.post("/api/feedback", async (req, res) => {
    try {
      const parsedData = insertFeedbackItemSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid feedback data", errors: parsedData.error.format() });
      }

      const newFeedback = await storage.createFeedbackItem(parsedData.data);
      res.status(201).json(newFeedback);
    } catch (error) {
      res.status(500).json({ message: "Failed to create feedback item" });
    }
  });

  app.patch("/api/feedback/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid feedback ID" });
      }

      const feedback = await storage.getFeedbackItem(id);
      if (!feedback) {
        return res.status(404).json({ message: "Feedback item not found" });
      }

      const updateSchema = insertFeedbackItemSchema.partial();
      const parsedData = updateSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid feedback data", errors: parsedData.error.format() });
      }

      const updatedFeedback = await storage.updateFeedbackItem(id, parsedData.data);
      res.json(updatedFeedback);
    } catch (error) {
      res.status(500).json({ message: "Failed to update feedback item" });
    }
  });

  // Assets routes
  app.get("/api/projects/:projectId/assets", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const assets = await storage.getAssetsByProject(projectId);
      res.json(assets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assets" });
    }
  });

  app.post("/api/assets", async (req, res) => {
    try {
      const parsedData = insertAssetSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid asset data", errors: parsedData.error.format() });
      }

      const newAsset = await storage.createAsset(parsedData.data);
      res.status(201).json(newAsset);
    } catch (error) {
      res.status(500).json({ message: "Failed to create asset" });
    }
  });

  // Deadlines routes
  app.get("/api/deadlines", async (_req, res) => {
    try {
      const deadlines = await storage.getUpcomingDeadlines();
      res.json(deadlines);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deadlines" });
    }
  });

  app.get("/api/projects/:projectId/deadlines", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const deadlines = await storage.getDeadlinesByProject(projectId);
      res.json(deadlines);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deadlines" });
    }
  });

  app.post("/api/deadlines", async (req, res) => {
    try {
      const parsedData = insertDeadlineSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid deadline data", errors: parsedData.error.format() });
      }

      const newDeadline = await storage.createDeadline(parsedData.data);
      res.status(201).json(newDeadline);
    } catch (error) {
      res.status(500).json({ message: "Failed to create deadline" });
    }
  });

  // Panel layout routes
  app.get("/api/projects/:projectId/panel-layouts", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const layouts = await storage.getPanelLayoutsByProject(projectId);
      res.json(layouts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch panel layouts" });
    }
  });

  app.post("/api/panel-layouts", async (req, res) => {
    try {
      const parsedData = insertPanelLayoutSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid panel layout data", errors: parsedData.error.format() });
      }

      const newLayout = await storage.createPanelLayout(parsedData.data);
      res.status(201).json(newLayout);
    } catch (error) {
      res.status(500).json({ message: "Failed to create panel layout" });
    }
  });

  app.patch("/api/panel-layouts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid panel layout ID" });
      }

      const layout = await storage.getPanelLayout(id);
      if (!layout) {
        return res.status(404).json({ message: "Panel layout not found" });
      }

      const updateSchema = insertPanelLayoutSchema.partial();
      const parsedData = updateSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid panel layout data", errors: parsedData.error.format() });
      }

      const updatedLayout = await storage.updatePanelLayout(id, parsedData.data);
      res.json(updatedLayout);
    } catch (error) {
      res.status(500).json({ message: "Failed to update panel layout" });
    }
  });

  // Comments routes
  app.get("/api/feedback/:feedbackId/comments", async (req, res) => {
    try {
      const feedbackId = parseInt(req.params.feedbackId);
      if (isNaN(feedbackId)) {
        return res.status(400).json({ message: "Invalid feedback ID" });
      }

      const comments = await storage.getCommentsByFeedback(feedbackId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/comments", async (req, res) => {
    try {
      const parsedData = insertCommentSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid comment data", errors: parsedData.error.format() });
      }

      const newComment = await storage.createComment(parsedData.data);
      res.status(201).json(newComment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
