import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupDirectAuth, isAuthenticated } from "./direct-auth";
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
  insertProjectEditorSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupDirectAuth(app);
  
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
  
  // Authentication status route
  app.get("/api/auth/user", async (req: any, res) => {
    try {
      console.log("Fetching authenticated user - bypassed auth");
      
      // TEMP: No authentication - use admin user
      const userId = 1;
      
      console.log("Using admin user ID:", userId);
      const user = await storage.getUser(userId);
      
      if (!user) {
        console.error("User not found in database");
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create a safe user object without password
      const safeUser = { ...user };
      delete safeUser.password;
      
      console.log("User found:", user.username);
      res.json(safeUser);
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
      
      // Create default users if they don't exist
      const defaultUsers = [
        {
          username: "admin",
          password: "admin123",
          fullName: "Alex Rodriguez",
          email: "admin@comiceditorpro.com",
          role: "editor",
          roles: ["editor"],
          isEditor: true,
          avatarUrl: ""
        },
        {
          username: "artist1",
          password: "password",
          fullName: "James Wilson",
          email: "james@example.com",
          role: "artist",
          roles: ["artist", "cover_artist"],
          isEditor: false,
          avatarUrl: ""
        },
        {
          username: "writer1",
          password: "password",
          fullName: "Sarah Miller",
          email: "sarah@example.com",
          role: "writer",
          roles: ["writer"],
          isEditor: false,
          avatarUrl: ""
        },
        {
          username: "colorist1",
          password: "password",
          fullName: "David Chen", 
          email: "david@example.com",
          role: "colorist",
          roles: ["colorist"],
          isEditor: false,
          avatarUrl: ""
        },
        {
          username: "letterer1",
          password: "password",
          fullName: "Julia Rodriguez",
          email: "julia@example.com",
          role: "letterer",
          roles: ["letterer"],
          isEditor: false,
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
      
      res.json(user);
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
        password, 
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
        // Only update password if provided (keep existing otherwise)
        password: password !== undefined ? password : undefined,
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
      // TEMP: No authentication - use admin user
      const dbUser = await storage.getUser(1);
      
      if (!dbUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let projects = [];
      
      // If user is an editor with editor-in-chief role, they can see all projects
      if (dbUser.isEditor && dbUser.editorRole === "editor_in_chief") {
        projects = await storage.getProjects();
      } 
      // If user is a senior editor, they can see their own projects and editor projects
      else if (dbUser.isEditor && dbUser.editorRole === "senior_editor") {
        // Get all projects this editor has access to
        const editorProjects = await storage.getEditableProjects(dbUser.id);
        projects = editorProjects;
      }
      // Regular editors or talent can only see their assigned projects
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
      
      // TEMP: No authentication - use admin user
      const dbUser = await storage.getUser(1);
      
      if (!dbUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Editor-in-Chief can see all projects
      if (dbUser.isEditor && dbUser.editorRole === "editor_in_chief") {
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

  app.post("/api/projects", async (req: any, res) => {
    try {
      // Pre-process the date field to handle string date from client
      const requestData = { ...req.body };
      
      // Get the authenticated user
      const userId = req.user?.id || req.session?.userId;
                    
      const dbUser = await storage.getUser(userId);
      
      if (!dbUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only editors can create projects
      if (!dbUser.isEditor) {
        return res.status(403).json({ message: "Only editors can create projects" });
      }
      
      // Store the creator's user ID
      requestData.createdBy = dbUser.id;
      
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

      const newProject = await storage.createProject({
        ...parsedData.data,
        createdBy: dbUser.id // Ensure createdBy is the authenticated user
      });
      
      // Automatically assign the creator as an editor of the project
      await storage.assignEditorToProject({
        userId: dbUser.id,
        projectId: newProject.id,
        assignedBy: dbUser.id,
        assignmentRole: dbUser.editorRole || "editor"
      });
      
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
      // Project creator or higher-ranking editor can assign editors
      const canAssignEditors = 
        project.createdBy === currentUserId || 
        (currentUser.editorRole === 'senior_editor' || currentUser.editorRole === 'editor_in_chief');
        
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
        assignmentRole: req.body.editorRole || userToAssign.editorRole || 'editor'
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
      // Project creator, higher-ranking editor, or self-removal can remove editors
      const canRemoveEditors = 
        project.createdBy === currentUserId || 
        (currentUser.editorRole === 'senior_editor' || currentUser.editorRole === 'editor_in_chief') ||
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
      
      // If the project was created by a regular editor, Senior Editor can delete it
      if (project.createdBy) {
        const creatorUser = await storage.getUser(project.createdBy);
        if (creatorUser && creatorUser.isEditor && creatorUser.editorRole === 'editor') {
          return true;
        }
      }
      
      return false;
    }
    
    // Regular Editor can only delete projects they created
    if (user.editorRole === 'editor') {
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
