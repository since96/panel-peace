import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as crypto from "crypto";
import { setupDirectAuth, isAuthenticated, hasEditAccess } from "./direct-auth";
import sgMail from '@sendgrid/mail';

// Define the session data interface
declare module 'express-session' {
  interface SessionData {
    userId: number | undefined;
  }
}
import { 
  insertProjectSchema, 
  insertFeedbackItemSchema, 
  insertAssetSchema,
  insertDeadlineSchema,
  insertPanelLayoutSchema,
  insertCommentSchema,
  insertWorkflowStepSchema,
  insertFileUploadSchema,
  insertFileLinkSchema,
  insertProjectEditorSchema,
  Studio
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication is already setup in index.ts
  
  // API routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  
  // This is a special route to handle Replit's auth_with_repl_site_closer callback
  // We simply serve a static HTML file with a button that will take users back to the app
  app.get("/auth_with_repl_site_closer", (req, res) => {
    console.log("Auth closer route hit, query params:", req.query);
    
    // Redirect to our static HTML file with a prominent return button
    res.redirect("/auth_with_repl_site_closer.html");
  });
  
  // Auto-login for demo purposes
  app.post("/api/auto-login-demo", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (username === 'admin' && password === 'admin123') {
        // Get the admin user
        const user = await storage.getUserByUsername('admin');
        
        if (!user) {
          return res.status(404).json({ success: false, message: 'Admin user not found' });
        }
        
        // Log the user in
        if (req.session) {
          req.session.userId = user.id;
          return res.status(200).json({ success: true, user: user });
        } else {
          return res.status(500).json({ success: false, message: 'Session not available' });
        }
      } else {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Auto-login error:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  // Authentication status route
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      // Check if user is logged in via session
      if (req.session && req.session.userId) {
        const userId = req.session.userId;
        console.log("Found userId in session:", userId);
        const user = await storage.getUser(userId);
        
        if (!user) {
          console.error("User not found in database");
          return res.status(404).json({ message: "User not found" });
        }
        
        // TEMPORARY FIX: Ensure admin is site admin for development
        if (user.id === 1 && !user.isSiteAdmin) {
          await storage.updateUser(1, {
            isSiteAdmin: true
          });
          // Fetch updated user
          const updatedUser = await storage.getUser(1);
          if (updatedUser) {
            const safeUser = { ...updatedUser } as any;
            if (safeUser.password) delete safeUser.password;
            return res.json(safeUser);
          }
        }
        
        // Create a safe user object without password
        const safeUser = { ...user } as any;
        if (safeUser.password) delete safeUser.password;
        
        console.log("User found:", user.username, "isSiteAdmin:", user.isSiteAdmin);
        return res.json(safeUser);
      } else {
        // For development, auto-login as admin if no session exists
        console.log("No user in session - auto-logging in as admin for development");
        const user = await storage.getUserByUsername('admin');
        if (user) {
          // Set session
          if (req.session) {
            req.session.userId = user.id;
          }
          
          // Create a safe user object without password
          const safeUser = { ...user } as any;
          if (safeUser.password) delete safeUser.password;
          
          return res.json(safeUser);
        } else {
          return res.status(401).json({ message: "Not authenticated" });
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.get("/api/users", async (_req, res) => {
    try {
      // Get all users from storage
      const users = [];
      
      // Create only admin user if it doesn't exist
      const defaultUsers = [
        {
          username: "admin",
          password: "admin123",
          fullName: "Admin",
          email: "admin@comicsmanagement.com",
          role: "Editor",
          roles: ["editor"],
          isEditor: true,
          isSiteAdmin: true, // Make this user a site admin
          avatarUrl: ""
        }
      ];
      
      // Create each default user if they don't exist
      let createdUsers = false;
      for (const userData of defaultUsers) {
        const existingUser = await storage.getUserByUsername(userData.username);
        if (!existingUser) {
          // Use the updated user schema fields
          await storage.createUser({
            username: userData.username,
            password: userData.password,
            fullName: userData.fullName,
            email: userData.email,
            role: userData.role,
            roles: userData.roles,
            isEditor: userData.isEditor,
            isSiteAdmin: userData.isSiteAdmin || false,
            avatarUrl: userData.avatarUrl
          });
          createdUsers = true;
        }
      }
      
      // Initialize sample project with workflow steps if users were created
      if (createdUsers) {
        // Check if Project 1 exists and has workflow steps
        const project = await storage.getProject(1);
        if (project) {
          const steps = await storage.getWorkflowStepsByProject(1);
          
          if (!steps || steps.length === 0) {
            // Initialize workflow steps for the project
            await storage.initializeProjectWorkflow(1);
            
            // Get the initialized steps
            const initializedSteps = await storage.getWorkflowStepsByProject(1);
            
            // Get all users to assign to workflow steps
            const allUsers = [];
            for (let i = 1; i <= 5; i++) {
              const user = await storage.getUser(i);
              if (user) allUsers.push(user);
            }
            
            // Assign users to workflow steps based on their roles
            for (const step of initializedSteps) {
              let assignedUser = null;
              
              // Match workflow step type to user role
              if (step.stepType === 'plot' || step.stepType === 'script') {
                // Assign writer to plot and script
                assignedUser = allUsers.find(u => u.role === 'writer');
              } else if (step.stepType === 'pencils' || step.stepType === 'inks') {
                // Assign artist to pencils and inks
                assignedUser = allUsers.find(u => u.role === 'artist');
              } else if (step.stepType === 'colors') {
                // Assign colorist to colors
                assignedUser = allUsers.find(u => u.role === 'colorist');
              } else if (step.stepType === 'letters') {
                // Assign letterer to letters
                assignedUser = allUsers.find(u => u.role === 'letterer');
              } else {
                // Assign editor to other steps
                assignedUser = allUsers.find(u => u.role === 'editor');
              }
              
              // Update the step with the assigned user
              if (assignedUser) {
                await storage.updateWorkflowStep(step.id, {
                  assignedTo: assignedUser.id,
                  status: 'in_progress'
                });
              }
            }
          }
        }
      }
      
      // Then try to get all users by checking IDs 1-20 (more scalable solution would use a getUsers method)
      const userPromises = Array.from({ length: 20 }, (_, i) => i + 1).map(async (id) => {
        return await storage.getUser(id);
      });
      
      const usersResult = await Promise.all(userPromises);
      
      // Filter out undefined users (IDs that don't exist)
      const validUsers = usersResult.filter(Boolean);
      res.json(validUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  // Get a specific user
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create a safe user object without password
      const safeUser = { ...user } as any;
      if (safeUser.password) delete safeUser.password;
      
      // Check if this is a request from the client for the logged-in user's profile
      // Get cookie token to identify the actual logged-in user
      const token = req.cookies?.auth_token;
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const JWT_SECRET = process.env.JWT_SECRET || 'comic_editor_jwt_secret_key';
          
          // Verify the token to get the authenticated user ID
          const decoded = jwt.verify(token, JWT_SECRET) as { id: number | string };
          const authUserId = parseInt(decoded.id.toString());
          
          console.log(`User ${authUserId} is requesting user ${userId} data`);
          
          // If the authenticated user is requesting their own data,
          // or if this is an admin user (id=1), return the safe user data
          if (authUserId === userId || authUserId === 1) {
            return res.json(safeUser);
          }
        } catch (tokenError) {
          console.warn("Token verification error:", tokenError);
          // Continue with regular authorization below
        }
      }
      
      // By default, just return the safe user
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Update an existing user
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { 
        username, 
        fullName, 
        email, 
        phone, 
        socialMedia, 
        isEditor, 
        role, 
        roles, 
        avatarUrl 
      } = req.body;
      
      // For updates, email and fullName are still required
      if ((email !== undefined && !email) || (fullName !== undefined && !fullName)) {
        return res.status(400).json({ 
          message: "Full name and email address cannot be empty",
          errors: { 
            fullName: (fullName !== undefined && !fullName) ? { _errors: ["Full name is required"] } : undefined,
            email: (email !== undefined && !email) ? { _errors: ["Email address is required"] } : undefined
          }
        });
      }
      
      // Check if username being changed and already exists
      if (username && username !== user.username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({ 
            message: "Username already exists", 
            errors: { username: { _errors: ["Username already exists"] } } 
          });
        }
      }
      
      // Update the user
      const updatedUser = await storage.updateUser(userId, {
        username: username,
        fullName: fullName,
        email: email,
        phone: phone,
        socialMedia: socialMedia,
        isEditor: isEditor,
        role: role,
        roles: roles,
        avatarUrl: avatarUrl
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  // Change user password
  app.post("/api/users/:id/change-password", async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          message: "Current password and new password are required",
          errors: {
            currentPassword: !currentPassword ? { _errors: ["Current password is required"] } : undefined,
            newPassword: !newPassword ? { _errors: ["New password is required"] } : undefined
          }
        });
      }
      
      // Get the user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // For the demo, we're using plain text passwords
      // In a real application, we would use proper password hashing
      if (user.password !== currentPassword) {
        return res.status(400).json({ 
          message: "Current password is incorrect",
          errors: { currentPassword: { _errors: ["Current password is incorrect"] } }
        });
      }
      
      // In a real application, we would hash the new password
      // For demo purposes, we'll use plain text passwords
      
      // Update the user's password
      const updatedUser = await storage.updateUser(userId, {
        password: newPassword
      });
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });
  
  // Delete a user (talent or editor)
  app.delete("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Get the user
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prevent deletion of site admin
      if (user.isSiteAdmin) {
        return res.status(403).json({ message: "Cannot delete site administrator" });
      }
      
      // Check if this user has any workflow steps assigned
      const steps = await storage.getWorkflowStepsAssignedToUser(userId);
      if (steps && steps.length > 0) {
        // Unassign user from workflow steps
        for (const step of steps) {
          await storage.updateWorkflowStep(step.id, {
            assignedTo: null,
            status: 'not_started'
          });
        }
      }
      
      const success = await storage.deleteUser(userId);
      
      if (success) {
        const userType = user.isEditor ? "Editor" : "Talent";
        res.json({ message: `${userType} deleted successfully` });
      } else {
        res.status(500).json({ message: "Failed to delete user" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Server error deleting user" });
    }
  });
  
  // Create a new user (team member)
  app.post("/api/users", async (req, res) => {
    try {
      const { 
        username, 
        password, 
        fullName, 
        email, 
        phone, 
        socialMedia, 
        isEditor, 
        isSiteAdmin,
        hasEditAccess,
        role, 
        roles, 
        avatarUrl 
      } = req.body;
      
      // Validation based on user type
      if (isEditor) {
        // Editors need username and password
        if (!username || !password) {
          return res.status(400).json({ 
            message: "Username and password are required for editors",
            errors: { 
              username: !username ? { _errors: ["Username is required"] } : undefined,
              password: !password ? { _errors: ["Password is required"] } : undefined
            }
          });
        }
      } 
      
      // All users need fullName and email
      if (!fullName || !email) {
        return res.status(400).json({ 
          message: "Full name and email address are required",
          errors: { 
            fullName: !fullName ? { _errors: ["Full name is required"] } : undefined,
            email: !email ? { _errors: ["Email address is required"] } : undefined
          }
        });
      }
      
      // Check if username already exists (if provided)
      if (username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({ 
            message: "Username already exists", 
            errors: { username: { _errors: ["Username already exists"] } } 
          });
        }
      }
      
      // Generate username for talent if not provided
      const finalUsername = username || `talent_${Date.now()}`;
      
      // Create the user with updated fields
      const newUser = await storage.createUser({
        username: finalUsername,
        password: password || "", // Empty password for non-editors
        fullName,
        email,
        phone: phone || undefined,
        socialMedia: socialMedia || undefined,
        isEditor: isEditor || false,
        isSiteAdmin: isSiteAdmin || false,
        hasEditAccess: hasEditAccess !== false, // Default to true if not specified
        role: role || (roles && roles.length > 0 ? roles[0] : undefined),
        roles: roles || [],
        avatarUrl: avatarUrl || undefined
      });
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Project routes
  app.get("/api/projects", async (req: any, res) => {
    try {
      // Get the authenticated user from the request
      const userId = req.user?.id || 1; // Default to admin if no user
      const dbUser = await storage.getUser(userId);
      
      if (!dbUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let projects = [];
      
      // If user is an editor, they can see all projects they have access to
      if (dbUser.isEditor) {
        // If they're a site admin, show all projects
        if (dbUser.isSiteAdmin) {
          projects = await storage.getProjects();
        } else {
          // Get all projects this editor has access to
          const editorProjects = await storage.getEditableProjects(dbUser.id);
          projects = editorProjects;
        }
      }
      // Talent or non-editors can only see their assigned projects
      else {
        // Get projects directly assigned to the user
        projects = await storage.getProjectsByUser(dbUser.id);
        
        // If the user is an editor, also get projects they have editor permissions for
        if (dbUser.isEditor) {
          const editorProjects = await storage.getProjectsByEditor(dbUser.id);
          // Combine and remove duplicates
          const allProjects = [...projects, ...editorProjects];
          const projectMap = new Map();
          
          // Deduplicate projects
          allProjects.forEach(project => {
            projectMap.set(project.id, project);
          });
          
          projects = Array.from(projectMap.values());
        }
      }
      
      res.json(projects);
    } catch (error) {
      console.error("Failed to get projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Get the authenticated user from the request
      const userId = req.user?.id || 1; // Default to admin if no user
      const dbUser = await storage.getUser(userId);
      
      if (!dbUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Site admins and project creators can see all projects
      if (dbUser.isSiteAdmin || project.createdBy === dbUser.id) {
        return res.json(project);
      }
      
      // Check if user is a collaborator on this project
      const userProjects = await storage.getProjectsByUser(dbUser.id);
      const isCollaborator = userProjects.some(p => p.id === id);
      
      // Check if user is an editor of this project
      const canEdit = await storage.canEditProject(dbUser.id, id);
      
      if (!isCollaborator && !canEdit) {
        return res.status(403).json({ message: "You don't have access to this project" });
      }
      
      res.json(project);
    } catch (error) {
      console.error("Failed to fetch project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", isAuthenticated, hasEditAccess, async (req: any, res) => {
    try {
      console.log("PROJECT CREATE: Request received with body:", JSON.stringify(req.body, null, 2));
      
      // Pre-process the date field to handle string date from client
      const requestData = { ...req.body };
      
      // Log the processed request data
      console.log("PROJECT CREATE: Processed request data:", JSON.stringify(requestData, null, 2));
      
      // Use authenticated user from session
      const dbUser = req.user;
      
      if (!dbUser) {
        console.error("PROJECT CREATE: Authenticated user not found in request");
        return res.status(401).json({ message: "Unauthorized. User not authenticated" });
      }
      
      console.log("PROJECT CREATE: Using authenticated user:", JSON.stringify(dbUser, null, 2));
      
      // Verify the user is authorized to create projects
      if (!dbUser.isEditor && !dbUser.isSiteAdmin) {
        console.error("PROJECT CREATE: User is not an editor or site admin", dbUser);
        return res.status(403).json({ message: "Only editors can create projects" });
      }
      
      // If the user doesn't have edit access, they can't create projects
      if (dbUser.hasEditAccess === false && !dbUser.isSiteAdmin) {
        console.error("PROJECT CREATE: User has view-only access", dbUser);
        return res.status(403).json({ message: "View-only users cannot create projects" });
      }
      
      // Store the creator's user ID
      requestData.createdBy = dbUser.id;
      
      // Ensure a studioId is provided (projects must belong to a studio)
      if (!requestData.studioId) {
        return res.status(400).json({ 
          message: "Studio ID is required", 
          errors: { studioId: { _errors: ["Studio ID is required"] } } 
        });
      }
      
      // Accept hardcoded studios (998, 999)
      if (requestData.studioId === 998 || requestData.studioId === 999) {
        console.log(`Using hardcoded studio ${requestData.studioId} for project creation`);
      } else {
        // Check if studio exists for non-hardcoded studios
        const studio = await storage.getStudio(requestData.studioId);
        if (!studio) {
          return res.status(404).json({ 
            message: "Studio not found", 
            errors: { studioId: { _errors: ["Studio not found"] } } 
          });
        }
      }
      
      // Create a simplified project with only required fields
      console.log("PROJECT CREATE: Attempting to create project with data:", {
        title: requestData.title || "Untitled Project",
        studioId: requestData.studioId,
        createdBy: dbUser.id,
        status: requestData.status || "in_progress",
        progress: requestData.progress || 0,
      });
      
      // Handle date fields
      let dueDate = null;
      if (requestData.dueDate) {
        try {
          dueDate = new Date(requestData.dueDate);
          console.log("PROJECT CREATE: Parsed due date:", dueDate);
        } catch (e) {
          console.error("PROJECT CREATE: Invalid due date format:", requestData.dueDate);
        }
      }
      
      // Create the project with all metrics
      const newProject = await storage.createProject({
        title: requestData.title || "Untitled Project",
        studioId: requestData.studioId, 
        createdBy: dbUser.id,
        status: requestData.status || "in_progress",
        progress: requestData.progress || 0,
        description: requestData.description || null,
        issue: requestData.issue || null,
        coverImage: null,
        dueDate: dueDate,
        // Add all the page count and metrics fields
        interiorPageCount: requestData.interiorPageCount || 22,
        coverCount: requestData.coverCount || 1,
        fillerPageCount: requestData.fillerPageCount || 0,
        pencilerPagesPerWeek: requestData.pencilerPagesPerWeek || 5,
        inkerPagesPerWeek: requestData.inkerPagesPerWeek || 7,
        coloristPagesPerWeek: requestData.coloristPagesPerWeek || 10,
        lettererPagesPerWeek: requestData.lettererPagesPerWeek || 15,
        pencilBatchSize: requestData.pencilBatchSize || 5,
        inkBatchSize: requestData.inkBatchSize || 5,
        letterBatchSize: requestData.letterBatchSize || 5,
        approvalDays: requestData.approvalDays || 2,
        plotDeadline: requestData.plotDeadline || null,
        coverDeadline: requestData.coverDeadline || null
      });
      
      console.log(`PROJECT CREATE: Successfully created project "${newProject.title}" (ID: ${newProject.id}) for studio ${newProject.studioId}`);
      
      // Return early if project creation fails
      if (!newProject || !newProject.id) {
        console.error("PROJECT CREATE: Failed to create project - no valid project returned");
        return res.status(500).json({ 
          message: "Failed to create project", 
          details: "Project creation did not return a valid project object"
        });
      }
      
      // Automatically assign the creator as an editor of the project
      await storage.assignEditorToProject({
        userId: dbUser.id,
        projectId: newProject.id,
        assignedBy: dbUser.id,
        assignmentRole: "editor"
      });
      
      res.status(201).json(newProject);
    } catch (error) {
      console.error("PROJECT CREATE ERROR:", error);
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
        
      // Check if page counts or other metrics that affect workflow have changed
      const interiorPagesChanged = 'interiorPageCount' in parsedData.data && 
        parsedData.data.interiorPageCount !== undefined && 
        parsedData.data.interiorPageCount !== project.interiorPageCount;
        
      const fillerPagesChanged = 'fillerPageCount' in parsedData.data && 
        parsedData.data.fillerPageCount !== undefined && 
        parsedData.data.fillerPageCount !== project.fillerPageCount;
        
      const coverCountChanged = 'coverCount' in parsedData.data && 
        parsedData.data.coverCount !== undefined && 
        parsedData.data.coverCount !== project.coverCount;

      const updatedProject = await storage.updateProject(id, parsedData.data);
      
      // If important metrics changed and there are workflow steps, reinitialize them
      if (dueDateChanged || interiorPagesChanged || fillerPagesChanged || coverCountChanged) {
        console.log("Project metrics changed. Checking if workflow needs to be reinitialized.");
        console.log("Interior pages changed:", interiorPagesChanged, 
                    "New value:", parsedData.data.interiorPageCount, 
                    "Old value:", project.interiorPageCount);
                    
        // Check if there are already workflow steps for this project
        const existingSteps = await storage.getWorkflowStepsByProject(id);
        if (existingSteps.length > 0) {
          // Store progress information to preserve it
          const progressMap = new Map();
          const statusMap = new Map();
          
          for (const step of existingSteps) {
            progressMap.set(step.stepType, step.progress);
            statusMap.set(step.stepType, step.status);
          }
          
          // Reinitialize workflow with updated metrics
          const newSteps = await storage.initializeProjectWorkflow(id);
          
          // Restore progress to new steps
          for (const newStep of newSteps) {
            // Restore progress if it existed
            if (progressMap.has(newStep.stepType)) {
              await storage.updateWorkflowStep(newStep.id, {
                progress: progressMap.get(newStep.stepType),
                status: statusMap.get(newStep.stepType)
              });
            }
          }
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

      // Get current user (in a real auth system, this would come from session)
      const currentUserId = req.query.userId ? parseInt(req.query.userId as string) : 1;
      
      // Get the user to check their role
      const user = await storage.getUser(currentUserId);
      if (!user) {
        return res.status(403).json({ message: "User not found" });
      }
      
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user has permission to delete this project
      if (!user.isEditor) {
        return res.status(403).json({ message: "Only editors can delete projects" });
      }
      
      // Permission rules:
      // 1. Editor-in-Chief can delete any project
      // 2. Senior Editor can delete projects they created or created by regular editors
      // 3. Regular Editor can only delete projects they created
      
      const hasDeletePermission = await checkDeletePermission(user, project);
      if (!hasDeletePermission) {
        return res.status(403).json({ 
          message: "You don't have permission to delete this project" 
        });
      }

      await storage.deleteProject(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });
  
  // Project Editors routes
  app.get("/api/projects/:id/editors", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      // Check if project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const editors = await storage.getProjectEditors(projectId);
      
      // Get full user details for each editor
      const editorUsers = await Promise.all(
        editors.map(async (editor) => {
          const user = await storage.getUser(editor.userId);
          return {
            ...editor,
            user
          };
        })
      );
      
      res.json(editorUsers);
    } catch (error) {
      console.error("Error fetching project editors:", error);
      res.status(500).json({ message: "Failed to fetch project editors" });
    }
  });
  
  app.post("/api/projects/:id/editors", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      // Get current user (in a real auth system, this would come from session)
      const currentUserId = req.body.assignedBy || req.query.userId ? parseInt(req.query.userId as string) : 1;
      
      // Check if the current user is allowed to assign editors
      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser || !currentUser.isEditor) {
        return res.status(403).json({ message: "Only editors can assign editors to projects" });
      }
      
      // Check if project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if current user has permission to modify this project
      // Project creator or site admin can assign editors
      const canAssignEditors = 
        project.createdBy === currentUserId || 
        currentUser.isSiteAdmin === true;
        
      if (!canAssignEditors) {
        return res.status(403).json({ 
          message: "You don't have permission to assign editors to this project" 
        });
      }
      
      // Get the user to be assigned
      const userId = parseInt(req.body.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const userToAssign = await storage.getUser(userId);
      if (!userToAssign) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if the user is already an editor for this project
      const existingEditors = await storage.getProjectEditors(projectId);
      const alreadyAssigned = existingEditors.some(editor => editor.userId === userId);
      
      if (alreadyAssigned) {
        return res.status(400).json({ message: "User is already an editor for this project" });
      }
      
      // Prepare editor assignment data
      const editorData = {
        userId,
        projectId,
        assignedBy: currentUserId,
        assignmentRole: 'editor' // Simplified to just 'editor' role
      };
      
      // Create the assignment
      const parsedData = insertProjectEditorSchema.safeParse(editorData);
      if (!parsedData.success) {
        return res.status(400).json({ 
          message: "Invalid editor assignment data", 
          errors: parsedData.error.format() 
        });
      }
      
      const newAssignment = await storage.assignEditorToProject(parsedData.data);
      res.status(201).json(newAssignment);
    } catch (error) {
      console.error("Error assigning editor to project:", error);
      res.status(500).json({ message: "Failed to assign editor to project" });
    }
  });
  
  app.delete("/api/projects/:projectId/editors/:userId", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = parseInt(req.params.userId);
      
      if (isNaN(projectId) || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid project ID or user ID" });
      }
      
      // Get current user (in a real auth system, this would come from session)
      const currentUserId = req.query.userId ? parseInt(req.query.userId as string) : 1;
      
      // Check if current user has permission to remove editors
      const currentUser = await storage.getUser(currentUserId);
      if (!currentUser || !currentUser.isEditor) {
        return res.status(403).json({ message: "Only editors can remove editors from projects" });
      }
      
      // Get the project
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if the editor assignment exists
      const editors = await storage.getProjectEditors(projectId);
      const assignmentExists = editors.some(editor => editor.userId === userId);
      
      if (!assignmentExists) {
        return res.status(404).json({ message: "Editor assignment not found" });
      }
      
      // Check if current user has permission to modify this project
      // Project creator, site admin, or self-removal can remove editors
      const canRemoveEditors = 
        project.createdBy === currentUserId || 
        currentUser.isSiteAdmin ||
        (currentUserId === userId); // User can remove themselves
        
      if (!canRemoveEditors) {
        return res.status(403).json({ 
          message: "You don't have permission to remove editors from this project" 
        });
      }
      
      // Remove the editor assignment
      await storage.removeEditorFromProject(userId, projectId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing editor from project:", error);
      res.status(500).json({ message: "Failed to remove editor from project" });
    }
  });
  
  // Get projects where user is assigned as an editor
  app.get("/api/users/:id/edited-projects", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Get the user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get all projects where the user is an editor
      const projects = await storage.getProjectsByEditor(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching user's edited projects:", error);
      res.status(500).json({ message: "Failed to fetch user's edited projects" });
    }
  });
  
  // Get all projects a user can edit (created by them or assigned as editor)
  app.get("/api/users/:id/editable-projects", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Get the user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get all projects the user can edit
      const projects = await storage.getEditableProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching user's editable projects:", error);
      res.status(500).json({ message: "Failed to fetch user's editable projects" });
    }
  });
  
  // Helper function to check if a user has permission to delete a project
  async function checkDeletePermission(user: any, project: any): Promise<boolean> {
    // Editor-in-Chief can delete any project
    if (user.editorRole === 'editor_in_chief') {
      return true;
    }
    
    // Senior Editor can delete their own projects or projects created by regular editors
    if (user.editorRole === 'senior_editor') {
      // If Senior Editor created the project, they can delete it
      if (project.createdBy === user.id) {
        return true;
      }
      
      // If the project was created by a regular editor, Site Admin can delete it
      if (project.createdBy) {
        const creatorUser = await storage.getUser(project.createdBy);
        if (creatorUser && creatorUser.isEditor && !creatorUser.isSiteAdmin) {
          return true;
        }
      }
      
      return false;
    }
    
    // Regular Editor can only delete projects they created
    if (user.isEditor && !user.isSiteAdmin) {
      return project.createdBy === user.id;
    }
    
    return false;
  }

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

  app.post("/api/feedback", isAuthenticated, hasEditAccess, async (req, res) => {
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

  app.post("/api/assets", isAuthenticated, hasEditAccess, async (req, res) => {
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

  app.post("/api/comments", isAuthenticated, hasEditAccess, async (req, res) => {
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
  
  app.delete("/api/comments/:id", isAuthenticated, hasEditAccess, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      if (isNaN(commentId)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }
      
      const success = await storage.deleteComment(commentId);
      if (!success) {
        return res.status(404).json({ message: "Comment not found or could not be deleted" });
      }
      
      res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Workflow steps routes
  app.get("/api/workflow-steps", async (_req, res) => {
    try {
      // Get all workflow steps across all projects
      const projects = await storage.getProjects();
      const allSteps = await Promise.all(
        projects.map(async (project) => {
          return await storage.getWorkflowStepsByProject(project.id);
        })
      );
      
      // Flatten the array of arrays
      const steps = allSteps.flat();
      res.json(steps);
    } catch (error) {
      console.error("Error fetching all workflow steps:", error);
      res.status(500).json({ message: "Failed to fetch all workflow steps" });
    }
  });
  
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

  app.post("/api/workflow-steps", isAuthenticated, hasEditAccess, async (req, res) => {
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
      
      // If progress is being updated, automatically update status based on progress value
      if (requestData.progress !== undefined) {
        // Only modify status if it's not explicitly set in the request or if it's currently "not_started"
        if (!requestData.status || workflowStep.status === 'not_started') {
          // Automatically set appropriate status based on progress
          if (requestData.progress > 0 && requestData.progress < 100) {
            requestData.status = 'in_progress';
          } else if (requestData.progress >= 100) {
            requestData.status = 'completed';
          }
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

  // Studio routes
  app.get("/api/studios", async (req, res) => {
    try {
      // TEMPORARY DEVELOPMENT CODE: Hard-coded studios for development
      // This bypasses all authentication and storage issues
      console.log("STUDIOS GET: Returning hard-coded studios for development");
      
      // No hardcoded studios - users must create their own bullpens
      const hardcodedStudios: Studio[] = [];
      
      // Let's also include any studios that were actually created
      const dbStudios = await storage.getStudios();
      console.log("STUDIOS GET: Found", dbStudios.length, "studios in database");
      
      // Combine, but avoid duplicates based on ID
      const combined = [...hardcodedStudios];
      for (const studio of dbStudios) {
        if (!combined.some(s => s.id === studio.id)) {
          combined.push(studio);
        }
      }
      
      console.log("STUDIOS GET: Returning", combined.length, "studios");
      res.json(combined);
    } catch (error) {
      console.error("Error fetching studios:", error);
      res.status(500).json({ message: "Failed to fetch studios" });
    }
  });
  
  // Debug endpoints
  app.get("/api/debug/studios", async (_req, res) => {
    try {
      const allStudios = await storage.getStudios();
      const userCount = Object.keys(await storage.debugGetAllUsers()).length;
      
      res.json({
        studioCount: allStudios.length,
        studios: allStudios,
        userCount: userCount
      });
    } catch (error) {
      console.error("Debug error:", error);
      res.status(500).json({ message: "Debug error" });
    }
  });
  
  app.get("/api/debug/users", async (_req, res) => {
    try {
      const allUsers = await storage.debugGetAllUsers();
      
      res.json({
        userCount: Object.keys(allUsers).length,
        users: allUsers
      });
    } catch (error) {
      console.error("Debug users error:", error);
      res.status(500).json({ message: "Debug users error" });
    }
  });
  
  app.get("/api/studios/:id", async (req, res) => {
    try {
      const studioId = parseInt(req.params.id);
      if (isNaN(studioId)) {
        return res.status(400).json({ message: "Invalid studio ID" });
      }
      
      const studio = await storage.getStudio(studioId);
      if (!studio) {
        return res.status(404).json({ message: "Studio not found" });
      }
      
      res.json(studio);
    } catch (error) {
      console.error("Error fetching studio:", error);
      res.status(500).json({ message: "Failed to fetch studio" });
    }
  });
  
  // Delete a studio (DEVELOPMENT MODE: allow anyone to delete studios)
  app.delete("/api/studios/:id", async (req: any, res) => {
    try {
      const studioId = parseInt(req.params.id);
      if (isNaN(studioId)) {
        return res.status(400).json({ message: "Invalid studio ID" });
      }
      
      // DEVELOPMENT MODE: Skip all auth checks and allow deletion for everyone
      console.log(`DEVELOPMENT MODE: Allowing deletion of studio ${studioId}`);
      
      // Check if studio exists
      const studio = await storage.getStudio(studioId);
      if (!studio) {
        return res.status(404).json({ message: "Studio not found" });
      }
      
      console.log(`Deleting studio: ${studio.name} (ID: ${studioId})`);
      
      // Delete the studio and all its projects
      const result = await storage.deleteStudio(studioId);
      
      if (result) {
        res.json({ message: `Successfully deleted studio '${studio.name}' and all its projects` });
      } else {
        res.status(500).json({ message: "Failed to delete studio" });
      }
    } catch (error) {
      console.error("Error deleting studio:", error);
      res.status(500).json({ message: "Failed to delete studio" });
    }
  });
  
  // Get projects for a specific studio
  app.get("/api/studios/:studioId/projects", async (req, res) => {
    try {
      const studioId = parseInt(req.params.studioId);
      if (isNaN(studioId)) {
        return res.status(400).json({ message: "Invalid studio ID" });
      }
      
      // Get the studio to make sure it exists
      const studio = await storage.getStudio(studioId);
      if (!studio) {
        return res.status(404).json({ message: "Studio not found" });
      }
      
      // Get projects for this studio
      const projects = await storage.getProjectsByStudio(studioId);
      console.log(`Found ${projects.length} projects for studio ${studioId}`);
      
      res.json(projects);
    } catch (error) {
      console.error("Error fetching studio projects:", error);
      res.status(500).json({ message: "Failed to fetch studio" });
    }
  });
  
  app.get("/api/studios/:id/editors", async (req, res) => {
    try {
      const studioId = parseInt(req.params.id);
      if (isNaN(studioId)) {
        return res.status(400).json({ message: "Invalid studio ID" });
      }
      
      const editors = await storage.getStudioEditors(studioId);
      res.json(editors);
    } catch (error) {
      console.error("Error fetching studio editors:", error);
      res.status(500).json({ message: "Failed to fetch studio editors" });
    }
  });
  
  app.get("/api/studios/:id/projects", async (req, res) => {
    try {
      const studioId = parseInt(req.params.id);
      if (isNaN(studioId)) {
        return res.status(400).json({ message: "Invalid studio ID" });
      }
      
      const projects = await storage.getProjectsByStudio(studioId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching studio projects:", error);
      res.status(500).json({ message: "Failed to fetch studio projects" });
    }
  });
  
  // DELETE endpoint for studios (site admin only)
  app.delete("/api/studios/:id", async (req, res) => {
    try {
      // Check if the user is a site admin
      // For development, we'll use the default admin user (ID 1)
      const userId = 1; // Use admin ID for development
      const user = await storage.getUser(userId);
      
      if (!user || !user.isSiteAdmin) {
        return res.status(403).json({ 
          message: "Unauthorized. Only site administrators can delete studios." 
        });
      }
      
      const studioId = parseInt(req.params.id);
      if (isNaN(studioId)) {
        return res.status(400).json({ message: "Invalid studio ID" });
      }
      
      // Check if the studio with the given ID exists
      const studio = await storage.getStudio(studioId);
      if (!studio) {
        return res.status(404).json({ message: "Studio not found" });
      }
      
      // Delete the studio
      const success = await storage.deleteStudio(studioId);
      
      if (success) {
        return res.status(200).json({ 
          message: `Studio ${studio.name} successfully deleted` 
        });
      } else {
        return res.status(500).json({ 
          message: "Failed to delete studio" 
        });
      }
    } catch (error) {
      console.error("Error deleting studio:", error);
      res.status(500).json({ message: "Failed to delete studio" });
    }
  });
  
  // Email routes for project export
  // API endpoint for requesting email service configuration
  app.post("/api/request-email-secrets", isAuthenticated, async (req, res) => {
    try {
      const user = (req as any).user;
      const userId = user?.id;
      
      // Check if user has admin privileges to make this request
      const isAdmin = await storage.isUserAdmin(userId);
      
      if (!isAdmin) {
        return res.status(403).json({ 
          success: false,
          message: "Only administrators can request email service configuration"
        });
      }
      
      // Check if the API keys are already configured
      const hasKeys = process.env.SENDGRID_API_KEY && process.env.FROM_EMAIL;
      
      if (hasKeys) {
        return res.json({
          success: true,
          configured: true,
          message: "Email service is already configured"
        });
      }
      
      // Log the configuration request
      console.log(`Admin user ${userId} requested email service configuration`);
      
      // Here we would typically request the secrets
      // Since we can't do that directly from the server, we'll return instructions
      
      res.json({ 
        success: true,
        configured: false,
        message: "Email service configuration request received. Please set the SENDGRID_API_KEY and FROM_EMAIL environment variables in your project."
      });
    } catch (error: any) {
      console.error('Request secrets error:', error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Failed to process configuration request" 
      });
    }
  });

  app.post("/api/email/send", isAuthenticated, async (req, res) => {
    try {
      // First we need to validate if the user has access to the project
      const projectId = req.body.projectId;
      const userId = (req as any).user?.id || 1; // Use admin ID if no authenticated user
      
      if (projectId) {
        const canView = await storage.canViewProject(userId, projectId);
        if (!canView) {
          return res.status(403).json({
            success: false,
            message: "You don't have permission to share this project"
          });
        }
      }
      
      // Check if SendGrid API key is set
      const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
      if (!SENDGRID_API_KEY) {
        console.warn("SendGrid API key not found. Email cannot be sent.");
        return res.status(503).json({
          success: false,
          message: "Email service is not configured. Please contact an administrator."
        });
      }
      
      // Set up SendGrid
      sgMail.setApiKey(SENDGRID_API_KEY);
      
      // Get user information
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      
      // Prepare email
      const msg = {
        to: req.body.to,
        from: process.env.FROM_EMAIL || "noreply@comiceditor.com", // Use configured sender or default
        subject: req.body.subject,
        text: req.body.text || "Comic Editor Project Schedule",
        html: req.body.html || "<p>Comic Editor Project Schedule</p>",
        replyTo: user.email, // Set reply-to as the current user's email
      };
      
      // Send email
      await sgMail.send(msg);
      
      // Return success
      res.status(200).json({
        success: true,
        message: "Email sent successfully"
      });
    } catch (error) {
      console.error("Email sending error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send email",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
