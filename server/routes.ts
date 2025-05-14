import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProjectSchema, 
  insertFeedbackItemSchema, 
  insertAssetSchema,
  insertDeadlineSchema,
  insertPanelLayoutSchema,
  insertCommentSchema,
  insertWorkflowStepSchema,
  insertFileUploadSchema,
  insertFileLinkSchema
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
      
      // Handle all date fields by converting string dates to Date objects for Zod validation
      const dateFields = ['dueDate', 'plotDeadline', 'coverDeadline'];
      
      for (const field of dateFields) {
        if (requestData[field] && typeof requestData[field] === 'string') {
          try {
            // Parse the ISO date string to a JavaScript Date
            requestData[field] = new Date(requestData[field]);
          } catch (e) {
            return res.status(400).json({ 
              message: `Invalid date format for ${field}`, 
              errors: { [field]: { _errors: ["Invalid date format"] } } 
            });
          }
        }
      }
      
      const parsedData = insertProjectSchema.safeParse(requestData);
      if (!parsedData.success) {
        console.error("Project validation errors:", JSON.stringify(parsedData.error.format()));
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

      // Pre-process the date field to handle string date from client
      const requestData = { ...req.body };
      
      // Handle all date fields by converting string dates to Date objects for Zod validation
      const dateFields = ['dueDate', 'plotDeadline', 'coverDeadline'];
      
      for (const field of dateFields) {
        if (requestData[field] && typeof requestData[field] === 'string') {
          try {
            // Parse the ISO date string to a JavaScript Date
            requestData[field] = new Date(requestData[field]);
          } catch (e) {
            return res.status(400).json({ 
              message: `Invalid date format for ${field}`, 
              errors: { [field]: { _errors: ["Invalid date format"] } } 
            });
          }
        }
      }

      const updateSchema = insertProjectSchema.partial();
      const parsedData = updateSchema.safeParse(requestData);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid project data", errors: parsedData.error.format() });
      }

      // Check if due date is being updated
      const dueDateChanged = 'dueDate' in parsedData.data && 
        parsedData.data.dueDate !== null && parsedData.data.dueDate !== undefined &&
        (!project.dueDate || parsedData.data.dueDate.getTime() !== new Date(project.dueDate).getTime());

      const updatedProject = await storage.updateProject(id, parsedData.data);
      
      // If due date changed and there are workflow steps, reinitialize them
      if (dueDateChanged) {
        console.log("Project due date: " + parsedData.data.dueDate);
        // Check if there are already workflow steps for this project
        const existingSteps = await storage.getWorkflowStepsByProject(id);
        if (existingSteps.length > 0) {
          // Reinitialize workflow with the new due date
          await storage.initializeProjectWorkflow(id);
        }
      }

      res.json(updatedProject);
    } catch (error) {
      console.error("Update project error:", error);
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

  // Workflow steps routes
  app.get("/api/projects/:projectId/workflow-steps", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const workflowSteps = await storage.getWorkflowStepsByProject(projectId);
      res.json(workflowSteps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflow steps" });
    }
  });

  app.get("/api/workflow-steps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid workflow step ID" });
      }

      const workflowStep = await storage.getWorkflowStep(id);
      if (!workflowStep) {
        return res.status(404).json({ message: "Workflow step not found" });
      }

      res.json(workflowStep);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflow step" });
    }
  });

  app.post("/api/workflow-steps", async (req, res) => {
    try {
      const parsedData = insertWorkflowStepSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid workflow step data", errors: parsedData.error.format() });
      }

      const newWorkflowStep = await storage.createWorkflowStep(parsedData.data);
      res.status(201).json(newWorkflowStep);
    } catch (error) {
      res.status(500).json({ message: "Failed to create workflow step" });
    }
  });

  app.post("/api/projects/:projectId/initialize-workflow", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      console.log("Initializing workflow for project:", JSON.stringify(project, null, 2));
      
      const workflowSteps = await storage.initializeProjectWorkflow(projectId);
      res.status(201).json(workflowSteps);
    } catch (error: any) {
      console.error("Error initializing workflow:", error);
      res.status(500).json({ message: `Failed to initialize workflow: ${error.message}` });
    }
  });

  app.patch("/api/workflow-steps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid workflow step ID" });
      }

      const workflowStep = await storage.getWorkflowStep(id);
      if (!workflowStep) {
        return res.status(404).json({ message: "Workflow step not found" });
      }

      // For debugging
      console.log("Update payload:", req.body);

      // Handle date parsing for dueDate if it's a string
      const requestData = { ...req.body };
      if (requestData.dueDate && typeof requestData.dueDate === 'string') {
        try {
          requestData.dueDate = new Date(requestData.dueDate);
        } catch (e) {
          return res.status(400).json({ 
            message: "Invalid date format", 
            errors: { dueDate: { _errors: ["Invalid date format"] } } 
          });
        }
      }

      const updateSchema = insertWorkflowStepSchema.partial();
      const parsedData = updateSchema.safeParse(requestData);
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid workflow step data", 
          errors: parsedData.error.format(),
          received: requestData 
        });
      }

      const updatedWorkflowStep = await storage.updateWorkflowStep(id, parsedData.data);
      res.json(updatedWorkflowStep);
    } catch (error) {
      console.error("Update workflow step error:", error);
      res.status(500).json({ message: "Failed to update workflow step" });
    }
  });

  // File upload routes
  app.get("/api/projects/:projectId/file-uploads", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const fileUploads = await storage.getFileUploadsByProject(projectId);
      res.json(fileUploads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch file uploads" });
    }
  });

  app.get("/api/workflow-steps/:stepId/file-uploads", async (req, res) => {
    try {
      const stepId = parseInt(req.params.stepId);
      if (isNaN(stepId)) {
        return res.status(400).json({ message: "Invalid workflow step ID" });
      }

      const fileUploads = await storage.getFileUploadsByWorkflowStep(stepId);
      res.json(fileUploads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch file uploads" });
    }
  });

  app.get("/api/feedback/:feedbackId/file-uploads", async (req, res) => {
    try {
      const feedbackId = parseInt(req.params.feedbackId);
      if (isNaN(feedbackId)) {
        return res.status(400).json({ message: "Invalid feedback ID" });
      }

      const fileUploads = await storage.getFileUploadsByFeedback(feedbackId);
      res.json(fileUploads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch file uploads" });
    }
  });

  app.post("/api/file-uploads", async (req, res) => {
    try {
      const parsedData = insertFileUploadSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid file upload data", errors: parsedData.error.format() });
      }

      const newFileUpload = await storage.createFileUpload(parsedData.data);
      res.status(201).json(newFileUpload);
    } catch (error) {
      res.status(500).json({ message: "Failed to create file upload record" });
    }
  });

  app.patch("/api/file-uploads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid file upload ID" });
      }

      const fileUpload = await storage.getFileUpload(id);
      if (!fileUpload) {
        return res.status(404).json({ message: "File upload not found" });
      }

      const updateSchema = insertFileUploadSchema.partial();
      const parsedData = updateSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid file upload data", errors: parsedData.error.format() });
      }

      const updatedFileUpload = await storage.updateFileUpload(id, parsedData.data);
      res.json(updatedFileUpload);
    } catch (error) {
      res.status(500).json({ message: "Failed to update file upload" });
    }
  });

  // File Link routes for external file references
  app.get("/api/workflow-steps/:stepId/file-links", async (req, res) => {
    try {
      const stepId = parseInt(req.params.stepId);
      if (isNaN(stepId)) {
        return res.status(400).json({ message: "Invalid workflow step ID" });
      }

      const links = await storage.getFileLinksByWorkflowStep(stepId);
      res.json(links);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch file links" });
    }
  });

  app.post("/api/workflow-steps/:stepId/file-links", async (req, res) => {
    try {
      const stepId = parseInt(req.params.stepId);
      if (isNaN(stepId)) {
        return res.status(400).json({ message: "Invalid workflow step ID" });
      }

      // Validate workflow step exists
      const step = await storage.getWorkflowStep(stepId);
      if (!step) {
        return res.status(404).json({ message: "Workflow step not found" });
      }

      // Add the step ID to the request data
      const requestData = { 
        ...req.body,
        workflowStepId: stepId
      };

      const parsedData = insertFileLinkSchema.safeParse(requestData);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid file link data", errors: parsedData.error.format() });
      }

      const newLink = await storage.createFileLink(parsedData.data);
      res.status(201).json(newLink);
    } catch (error) {
      res.status(500).json({ message: "Failed to create file link" });
    }
  });

  app.delete("/api/file-links/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid file link ID" });
      }

      const success = await storage.deleteFileLink(id);
      if (!success) {
        return res.status(404).json({ message: "File link not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete file link" });
    }
  });
  
  // Project file links
  app.get("/api/projects/:projectId/file-links", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      // Get all file links associated with this project's workflow steps
      const workflowSteps = await storage.getWorkflowStepsByProject(projectId);
      const allLinks = [];
      
      for (const step of workflowSteps) {
        const links = await storage.getFileLinksByWorkflowStep(step.id);
        allLinks.push(...links);
      }
      
      res.json(allLinks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch file links" });
    }
  });

  app.post("/api/projects/:projectId/file-links", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      // Validate project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Since file links are tied to workflow steps, we need to create a link
      // for a specific step. If not specified, we'll use the first step.
      const workflowSteps = await storage.getWorkflowStepsByProject(projectId);
      
      if (!workflowSteps || workflowSteps.length === 0) {
        return res.status(400).json({ 
          message: "Cannot add file link - project has no workflow steps" 
        });
      }
      
      // Use the first step as default if none is specified
      const workflowStepId = req.body.workflowStepId || workflowSteps[0].id;
      
      // Add the step ID to the request data
      const requestData = { 
        ...req.body,
        workflowStepId
      };

      const parsedData = insertFileLinkSchema.safeParse(requestData);
      if (!parsedData.success) {
        return res.status(400).json({ message: "Invalid file link data", errors: parsedData.error.format() });
      }

      const newLink = await storage.createFileLink(parsedData.data);
      res.status(201).json(newLink);
    } catch (error) {
      console.error("Error creating file link:", error);
      res.status(500).json({ message: "Failed to create file link" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
