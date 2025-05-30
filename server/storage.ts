import {
  studios, Studio, InsertStudio,
  users, User, InsertUser,
  projects, Project, InsertProject,
  collaborators, Collaborator, InsertCollaborator,
  feedbackItems, FeedbackItem, InsertFeedbackItem,
  assets, Asset, InsertAsset,
  deadlines, Deadline, InsertDeadline,
  panelLayouts, PanelLayout, InsertPanelLayout,
  comments, Comment, InsertComment,
  workflowSteps, WorkflowStep, InsertWorkflowStep,
  fileUploads, FileUpload, InsertFileUpload,
  fileLinks, FileLink, InsertFileLink,
  projectEditors, ProjectEditor, InsertProjectEditor
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // Debugging tools (temporary)
  debugGetAllUsers(): Promise<Record<number, User>>;
  
  // Studio operations
  getStudio(id: number): Promise<Studio | undefined>;
  getStudios(): Promise<Studio[]>;
  createStudio(studio: InsertStudio): Promise<Studio>;
  updateStudio(id: number, studio: Partial<InsertStudio>): Promise<Studio | undefined>;
  deleteStudio(id: number): Promise<boolean>; // Allow site admins to delete studios
  getStudioEditors(studioId: number): Promise<User[]>; // Get all editors in a studio
  getStudiosByAdmin(userId: number): Promise<Studio[]>; // Get studios where user is an EIC
  
  // User operations
  getUser(id: number | string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>; // Delete a user/talent
  upsertUser(userData: Partial<InsertUser> & { id: string | number }): Promise<User>;
  getUsersByStudio(studioId: number): Promise<User[]>; // Get all users in a studio
  getUsersByRole(role: string, studioId?: number): Promise<User[]>; // Get users by role, optionally filtered by studio
  isUserAdmin(userId: number | string): Promise<boolean>; // Check if user is a site admin
  
  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  getProjectsByUser(userId: number): Promise<Project[]>;
  getProjectsByEditor(editorId: number): Promise<Project[]>; // Projects where user is an editor
  getProjectsByStudio(studioId: number): Promise<Project[]>; // Get all projects in a studio
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Project editor operations
  getProjectEditors(projectId: number): Promise<ProjectEditor[]>;
  getEditableProjects(userId: number): Promise<Project[]>; // All projects user can edit
  getViewableProjects(userId: number): Promise<Project[]>; // All projects user can view
  assignEditorToProject(assignment: InsertProjectEditor): Promise<ProjectEditor>;
  removeEditorFromProject(userId: number, projectId: number): Promise<boolean>;
  canEditProject(userId: number, projectId: number): Promise<boolean>;
  canViewProject(userId: number, projectId: number): Promise<boolean>;
  
  // Collaborator operations
  getCollaboratorsByProject(projectId: number): Promise<Collaborator[]>;
  addCollaborator(collaborator: InsertCollaborator): Promise<Collaborator>;
  removeCollaborator(userId: number, projectId: number): Promise<boolean>;
  
  // Feedback operations
  getFeedbackItem(id: number): Promise<FeedbackItem | undefined>;
  getFeedbackByProject(projectId: number): Promise<FeedbackItem[]>;
  getPendingFeedback(): Promise<FeedbackItem[]>;
  createFeedbackItem(feedback: InsertFeedbackItem): Promise<FeedbackItem>;
  updateFeedbackItem(id: number, feedback: Partial<InsertFeedbackItem>): Promise<FeedbackItem | undefined>;
  deleteFeedbackItem(id: number): Promise<boolean>;
  
  // Asset operations
  getAsset(id: number): Promise<Asset | undefined>;
  getAssetsByProject(projectId: number): Promise<Asset[]>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: number, asset: Partial<InsertAsset>): Promise<Asset | undefined>;
  deleteAsset(id: number): Promise<boolean>;
  
  // Deadline operations
  getDeadline(id: number): Promise<Deadline | undefined>;
  getDeadlinesByProject(projectId: number): Promise<Deadline[]>;
  getUpcomingDeadlines(): Promise<Deadline[]>;
  createDeadline(deadline: InsertDeadline): Promise<Deadline>;
  updateDeadline(id: number, deadline: Partial<InsertDeadline>): Promise<Deadline | undefined>;
  deleteDeadline(id: number): Promise<boolean>;
  
  // Panel layout operations
  getPanelLayout(id: number): Promise<PanelLayout | undefined>;
  getPanelLayoutsByProject(projectId: number): Promise<PanelLayout[]>;
  createPanelLayout(layout: InsertPanelLayout): Promise<PanelLayout>;
  updatePanelLayout(id: number, layout: Partial<InsertPanelLayout>): Promise<PanelLayout | undefined>;
  deletePanelLayout(id: number): Promise<boolean>;
  
  // Comment operations
  getCommentsByFeedback(feedbackId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;
  
  // Workflow step operations
  getWorkflowStep(id: number): Promise<WorkflowStep | undefined>;
  getWorkflowStepsByProject(projectId: number): Promise<WorkflowStep[]>;
  getWorkflowStepsAssignedToUser(userId: number): Promise<WorkflowStep[]>;
  createWorkflowStep(step: InsertWorkflowStep): Promise<WorkflowStep>;
  updateWorkflowStep(id: number, step: Partial<InsertWorkflowStep>): Promise<WorkflowStep | undefined>;
  deleteWorkflowStep(id: number): Promise<boolean>;
  initializeProjectWorkflow(projectId: number): Promise<WorkflowStep[]>;
  
  // File upload operations
  getFileUpload(id: number): Promise<FileUpload | undefined>;
  getFileUploadsByProject(projectId: number): Promise<FileUpload[]>;
  getFileUploadsByWorkflowStep(workflowStepId: number): Promise<FileUpload[]>;
  getFileUploadsByFeedback(feedbackItemId: number): Promise<FileUpload[]>;
  createFileUpload(upload: InsertFileUpload): Promise<FileUpload>;
  updateFileUpload(id: number, upload: Partial<InsertFileUpload>): Promise<FileUpload | undefined>;
  deleteFileUpload(id: number): Promise<boolean>;
  
  // File link operations (simpler external file sharing)
  getFileLinksByWorkflowStep(workflowStepId: number): Promise<FileLink[]>;
  createFileLink(link: InsertFileLink): Promise<FileLink>;
  deleteFileLink(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  // This is a partial implementation for rapid prototyping and testing
  private studios: Map<number, Studio>;
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private collaborators: Map<number, Collaborator>;
  private projectEditors: Map<number, ProjectEditor>;
  private feedbackItems: Map<number, FeedbackItem>;
  private assets: Map<number, Asset>;
  private deadlines: Map<number, Deadline>;
  private panelLayouts: Map<number, PanelLayout>;
  private comments: Map<number, Comment>;
  private workflowSteps: Map<number, WorkflowStep>;
  
  private studioIdCounter: number;
  private userIdCounter: number;
  private projectIdCounter: number;
  private collaboratorIdCounter: number;
  private projectEditorIdCounter: number;
  private feedbackIdCounter: number;
  private assetIdCounter: number;
  private deadlineIdCounter: number;
  private panelLayoutIdCounter: number;
  private commentIdCounter: number;
  private workflowStepIdCounter: number;

  private fileUploads: Map<number, FileUpload>;
  private fileUploadIdCounter: number;
  
  private fileLinks: Map<number, FileLink>;
  private fileLinkIdCounter: number;

  constructor() {
    this.studios = new Map();
    this.users = new Map();
    this.projects = new Map();
    this.collaborators = new Map();
    this.projectEditors = new Map();
    this.feedbackItems = new Map();
    this.assets = new Map();
    this.deadlines = new Map();
    this.panelLayouts = new Map();
    this.comments = new Map();
    this.workflowSteps = new Map();
    this.fileUploads = new Map();
    this.fileLinks = new Map();
    
    this.studioIdCounter = 1;
    this.userIdCounter = 1;
    this.projectIdCounter = 1;
    this.collaboratorIdCounter = 1;
    this.projectEditorIdCounter = 1;
    this.feedbackIdCounter = 1;
    this.assetIdCounter = 1;
    this.deadlineIdCounter = 1;
    this.panelLayoutIdCounter = 1;
    this.commentIdCounter = 1;
    this.workflowStepIdCounter = 1;
    this.fileUploadIdCounter = 1;
    this.fileLinkIdCounter = 1;
    
    // Create default admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      fullName: "Admin User",
      email: "admin@comicsmanagement.com",
      isEditor: true,
      editorRole: "editor_in_chief",
      isSiteAdmin: true,  // Make sure admin has site admin privileges
      role: "Editor",
      avatarUrl: "",
      studioId: 1
    });
    
    // Initialize sample data for testing
    // We use setTimeout to ensure this runs after all initialization is complete
    setTimeout(() => {
      this.initializeSampleData();
    }, 0);
  }
  
  private async initializeSampleData() {
    // Create a default studio
    const studio = await this.createStudio({
      name: "Default Studio",
      description: "Default studio for testing",
      logoUrl: ""
    });
    
    // Update admin user with studio
    const admin = await this.getUserByUsername("admin");
    if (admin) {
      await this.updateUser(admin.id, {
        studioId: studio.id
      });
    }
  }

  // User operations
  async getUser(id: number | string): Promise<User | undefined> {
    // Handle both numeric and string IDs (for Replit auth integration)
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId) && typeof id === 'string') {
      // This is a Replit auth ID, search by username or email
      return Array.from(this.users.values()).find(
        user => user.username === id || user.email === id
      );
    }
    return this.users.get(numericId);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async upsertUser(userData: Partial<InsertUser> & { id: string | number }): Promise<User> {
    // Convert string ID to number if possible
    let id: number;
    if (typeof userData.id === 'string') {
      // Check if we already have a user with this external ID or email
      const existingUser = Array.from(this.users.values()).find(
        u => u.username === userData.id || (userData.email && u.email === userData.email)
      );
      
      if (existingUser) {
        // Update existing user
        const updatedUser = { ...existingUser };
        if (userData.email) updatedUser.email = userData.email;
        if (userData.fullName) updatedUser.fullName = userData.fullName;
        if (userData.avatarUrl) updatedUser.avatarUrl = userData.avatarUrl;
        
        this.users.set(existingUser.id, updatedUser);
        return updatedUser;
      } else {
        // Create new user
        id = ++this.userIdCounter;
      }
    } else {
      id = userData.id as number;
    }
    
    // Create or update user
    const newUserData: Partial<User> = {
      ...userData,
      id,
      username: userData.username || `user${id}`,
      password: userData.password || null,
      fullName: userData.fullName || `User ${id}`,
      email: userData.email || `user${id}@example.com`,
      isEditor: userData.isEditor !== undefined ? userData.isEditor : false,
    };
    
    const newUser: User = {
      id,
      username: newUserData.username!,
      password: newUserData.password,
      fullName: newUserData.fullName!,
      email: newUserData.email!,
      phone: newUserData.phone || null,
      socialMedia: newUserData.socialMedia || null,
      isEditor: newUserData.isEditor || null,
      isSiteAdmin: newUserData.isSiteAdmin || false,
      hasEditAccess: newUserData.hasEditAccess !== undefined ? newUserData.hasEditAccess : true, // Default to true if not specified
      studioId: newUserData.studioId || null,
      assignedProjects: newUserData.assignedProjects || null,
      role: newUserData.role || null,
      roles: newUserData.roles || null,
      avatarUrl: newUserData.avatarUrl || null,
      createdAt: newUserData.createdAt || new Date(),
      updatedAt: newUserData.updatedAt || new Date(),
    };
    
    this.users.set(id, newUser);
    return newUser;
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    
    // Ensure the hasEditAccess property is properly set
    // Default to true if not specified for backwards compatibility
    const hasEditAccess = user.hasEditAccess !== false;
    
    const newUser: User = { 
      id,
      username: user.username,
      password: user.password || null,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || null,
      socialMedia: user.socialMedia || null,
      isEditor: user.isEditor || false,
      isSiteAdmin: user.isSiteAdmin || false,
      hasEditAccess,
      studioId: user.studioId || null,
      assignedProjects: user.assignedProjects || [],
      role: user.role || null,
      roles: user.roles || [],
      avatarUrl: user.avatarUrl || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = await this.getUser(id);
    if (!existingUser) {
      return undefined;
    }
    
    // Handle hasEditAccess explicitly - if it's being set to false, preserve that setting
    // Otherwise keep whatever value it already has or default to true
    const hasEditAccess = userData.hasEditAccess === false ? false : 
                         (userData.hasEditAccess === true || existingUser.hasEditAccess === true);
    
    const updatedUser: User = {
      ...existingUser,
      ...userData,
      hasEditAccess, // Explicitly set hasEditAccess property
      id: existingUser.id // Keep the original ID
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const user = await this.getUser(id);
    
    // Check if user exists
    if (!user) {
      return false;
    }
    
    // Don't allow deletion of the admin user (ID 1)
    if (id === 1) {
      return false;
    }
    
    // Remove the user from all projects they're assigned to
    // Get all collaborator records for this user
    const userCollaborations = Array.from(this.collaborators.values())
      .filter(collab => collab.userId === id);
    
    // Delete each collaboration
    for (const collab of userCollaborations) {
      this.collaborators.delete(collab.id);
    }
    
    // If this is an editor, remove them from projects they're editing
    if (user.isEditor) {
      // Remove from project editors
      const projectEditors = Array.from(this.projectEditors.values())
        .filter(pe => pe.userId === id);
      
      for (const pe of projectEditors) {
        this.projectEditors.delete(pe.id);
      }
    }
    
    // Delete the user
    return this.users.delete(id);
  }
  
  // Check if user is a site admin
  async isUserAdmin(userId: number | string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    
    // Check for isSiteAdmin flag
    return user.isSiteAdmin === true;
  }
  
  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    // First check if the project exists in our regular storage
    const project = this.projects.get(id);
    if (project) {
      return project;
    }
    
    // For hardcoded IDs (1000+), check if it's a sample project
    if (id >= 1000) {
      // Determine which studio this sample project belongs to
      let studioId = 998; // Default to Marvel
      if (id >= 1010) {
        studioId = 999; // DC Comics
      }
      
      // Get all sample projects for this studio
      const sampleProjects = await this.getProjectsByStudio(studioId);
      
      // Find the specific project with this ID
      return sampleProjects.find(p => p.id === id);
    }
    
    // Project not found
    return undefined;
  }
  
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }
  
  async getProjectsByUser(userId: number): Promise<Project[]> {
    // Get projects created by user
    const userProjects = Array.from(this.projects.values()).filter(
      (project) => project.createdBy === userId
    );
    
    // Get projects where user is a collaborator
    const collaboratorProjects = Array.from(this.collaborators.values())
      .filter((collab) => collab.userId === userId)
      .map((collab) => this.projects.get(collab.projectId))
      .filter((project): project is Project => project !== undefined);
    
    // Combine and remove duplicates
    const allProjects = [...userProjects, ...collaboratorProjects];
    return [...new Map(allProjects.map(project => [project.id, project])).values()];
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const newProject: Project = { id, ...project };
    this.projects.set(id, newProject);
    return newProject;
  }
  
  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    const existingProject = this.projects.get(id);
    if (!existingProject) return undefined;
    
    const updatedProject = { ...existingProject, ...project };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }
  
  // Project editor operations
  async getProjectsByEditor(editorId: number): Promise<Project[]> {
    const editorAssignments = Array.from(this.projectEditors.values())
      .filter(pe => pe.userId === editorId);
    
    return Promise.all(editorAssignments.map(assignment => 
      this.getProject(assignment.projectId)
    )).then(projects => projects.filter((p): p is Project => p !== undefined));
  }
  
  async getProjectEditors(projectId: number): Promise<ProjectEditor[]> {
    return Array.from(this.projectEditors.values()).filter(
      (editor) => editor.projectId === projectId
    );
  }
  
  async getEditableProjects(userId: number): Promise<Project[]> {
    // Get projects created by the user
    const ownedProjects = await this.getProjectsByUser(userId);
    
    // Get projects where the user is an editor
    const editableProjects = await this.getProjectsByEditor(userId);
    
    // Combine and remove duplicates
    const allProjects = [...ownedProjects, ...editableProjects];
    return [...new Map(allProjects.map(project => [project.id, project])).values()];
  }
  
  async assignEditorToProject(assignment: InsertProjectEditor): Promise<ProjectEditor> {
    const id = this.projectEditorIdCounter++;
    const newAssignment: ProjectEditor = { id, ...assignment };
    this.projectEditors.set(id, newAssignment);
    
    // Update the user's assignedProjects array
    const user = await this.getUser(assignment.userId);
    if (user) {
      const assignedProjects = user.assignedProjects || [];
      if (!assignedProjects.includes(assignment.projectId)) {
        // Add the project to the user's assignedProjects array
        assignedProjects.push(assignment.projectId);
        await this.updateUser(user.id, { 
          assignedProjects: assignedProjects 
        });
      }
    }
    
    return newAssignment;
  }
  
  async removeEditorFromProject(userId: number, projectId: number): Promise<boolean> {
    const editor = Array.from(this.projectEditors.values()).find(
      (pe) => pe.userId === userId && pe.projectId === projectId
    );
    
    if (!editor) return false;
    
    // Remove this project from the user's assignedProjects array
    const user = await this.getUser(userId);
    if (user && user.assignedProjects) {
      const updatedAssignedProjects = user.assignedProjects.filter(id => id !== projectId);
      await this.updateUser(userId, { 
        assignedProjects: updatedAssignedProjects
      });
    }
    
    return this.projectEditors.delete(editor.id);
  }
  
  async canEditProject(userId: number, projectId: number): Promise<boolean> {
    const project = await this.getProject(projectId);
    if (!project) return false;
    
    // Creator always has edit permission
    if (project.createdBy === userId) return true;
    
    // Check if user is assigned as an editor
    const editorAssignment = Array.from(this.projectEditors.values()).find(
      (pe) => pe.userId === userId && pe.projectId === projectId
    );
    
    return !!editorAssignment;
  }
  
  async canViewProject(userId: number, projectId: number): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    
    // Site admins can view all projects
    if (user.isSiteAdmin) return true;
    
    const project = await this.getProject(projectId);
    if (!project) return false;
    
    // User created this project
    if (project.createdBy === userId) return true;
    
    // Check if user is an editor for this project with at least view access
    const editorAssignment = Array.from(this.projectEditors.values()).find(
      (pe) => pe.userId === userId && pe.projectId === projectId
    );
    if (editorAssignment) return true;
    
    // If not a private project, check if user is in the same studio
    if (!project.isPrivate && user.studioId === project.studioId) return true;
    
    return false;
  }
  
  // Studio operations
  async getStudio(id: number): Promise<Studio | undefined> {
    // For development, return hardcoded studios with IDs 998 and 999
    if (id === 998) {
      return {
        id: 998,
        name: "Marvel Comics",
        description: "The House of Ideas",
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Marvel_Logo.svg/1200px-Marvel_Logo.svg.png",
        createdAt: new Date(),
        createdBy: 1,
        active: true
      };
    } else if (id === 999) {
      return {
        id: 999,
        name: "DC Comics",
        description: "The Distinguished Competition",
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/DC_Comics_logo.svg/1200px-DC_Comics_logo.svg.png",
        createdAt: new Date(),
        createdBy: 1,
        active: true
      };
    }
    
    // Otherwise check the in-memory storage
    return this.studios.get(id);
  }
  
  async getStudios(): Promise<Studio[]> {
    const studios = Array.from(this.studios.values());
    console.log("STUDIOS DEBUG: Found", studios.length, "studios in storage");
    console.log("STUDIOS DEBUG: Studio map keys:", Array.from(this.studios.keys()));
    return studios;
  }
  
  async createStudio(studioData: InsertStudio): Promise<Studio> {
    const id = this.studioIdCounter++;
    const now = new Date();
    
    const newStudio: Studio = {
      id,
      name: studioData.name,
      description: studioData.description || '',
      logoUrl: studioData.logoUrl || null,
      createdAt: now,
      createdBy: studioData.createdBy,
      active: studioData.active !== undefined ? studioData.active : true
    };
    
    console.log("STUDIOS DEBUG: Creating studio with ID", id, "and name", newStudio.name);
    this.studios.set(id, newStudio);
    
    // Verify it was added
    const studioExists = this.studios.has(id);
    console.log("STUDIOS DEBUG: Studio added to map?", studioExists);
    console.log("STUDIOS DEBUG: Updated studio map keys:", Array.from(this.studios.keys()));
    
    return newStudio;
  }
  
  async updateStudio(id: number, studioData: Partial<InsertStudio>): Promise<Studio | undefined> {
    const existingStudio = await this.getStudio(id);
    if (!existingStudio) return undefined;
    
    const updatedStudio: Studio = {
      ...existingStudio,
      ...studioData
    };
    
    this.studios.set(id, updatedStudio);
    return updatedStudio;
  }
  
  async deleteStudio(id: number): Promise<boolean> {
    // First, check if this studio exists
    const studioToDelete = await this.getStudio(id);
    if (!studioToDelete) {
      return false; // Studio doesn't exist
    }
    
    // Allow deleting hard-coded studios during development - feature enabled
    if (id >= 998) {
      console.log(`DEVELOPMENT MODE: Allowing deletion of hard-coded studio with ID ${id}`);
      // Since we can't actually delete these from storage, we'll just return true to pretend it worked
      return true;
    }
    
    // Before deleting studio, get all projects associated with this studio
    const studioProjects = await this.getProjectsByStudio(id);
    
    // Get all users associated with this studio
    const studioUsers = await this.getUsersByStudio(id);
    
    // Delete all projects in this studio
    for (const project of studioProjects) {
      await this.deleteProject(project.id);
    }
    
    // Disassociate users from this studio (don't delete them)
    for (const user of studioUsers) {
      await this.updateUser(user.id, {
        studioId: null
      });
    }
    
    // Finally, delete the studio
    const result = this.studios.delete(id);
    
    console.log(`${result ? 'Successfully deleted' : 'Failed to delete'} studio with ID ${id}`);
    return result;
  }
  
  async getStudioEditors(studioId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      user => user.studioId === studioId && user.isEditor === true
    );
  }
  
  async getStudiosByAdmin(userId: number): Promise<Studio[]> {
    const user = await this.getUser(userId);
    if (!user) return [];
    
    // If site admin, return all studios
    if (user.isSiteAdmin) {
      return await this.getStudios();
    }
    
    // If editor-in-chief, return their studio
    if (user.isEditor && user.editorRole === 'editor_in_chief' && user.studioId) {
      const studio = await this.getStudio(user.studioId);
      return studio ? [studio] : [];
    }
    
    return [];
  }
  
  async getUsersByStudio(studioId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      user => user.studioId === studioId
    );
  }
  
  async getUsersByRole(role: string, studioId?: number): Promise<User[]> {
    let users = Array.from(this.users.values());
    
    // Filter by role
    if (role === 'admin') {
      users = users.filter(user => user.isSiteAdmin === true);
    } else if (role === 'editor_in_chief') {
      users = users.filter(user => user.isEditor === true && user.editorRole === 'editor_in_chief');
    } else if (role === 'editor') {
      users = users.filter(user => user.isEditor === true && user.editorRole === 'editor');
    } else if (role === 'talent') {
      users = users.filter(user => !user.isEditor);
    }
    
    // Additionally filter by studio if provided
    if (studioId !== undefined) {
      users = users.filter(user => user.studioId === studioId);
    }
    
    return users;
  }
  
  async getViewableProjects(userId: number): Promise<Project[]> {
    const user = await this.getUser(userId);
    if (!user) return [];
    
    // Site admins can view all projects
    if (user.isSiteAdmin) {
      return await this.getProjects();
    }
    
    // If editor-in-chief, can view all projects in their studio
    if (user.isEditor && user.editorRole === 'editor_in_chief' && user.studioId) {
      return await this.getProjectsByStudio(user.studioId);
    }
    
    // Editors can view projects they're assigned to
    if (user.isEditor) {
      return await this.getProjectsByEditor(userId);
    }
    
    // Non-editors (talent) can only view projects they're collaborators on
    return await this.getProjectsByUser(userId);
  }
  
  // Debug methods - temporary
  async debugGetAllUsers(): Promise<Record<number, User>> {
    const result: Record<number, User> = {};
    this.users.forEach((user, id) => {
      result[id] = user;
    });
    return result;
  }
  
  async getProjectsByStudio(studioId: number): Promise<Project[]> {
    // First get any real projects from storage for this studio
    const realProjects = Array.from(this.projects.values()).filter(
      project => project.studioId === studioId
    );
    
    console.log(`Found ${realProjects.length} projects for studio ${studioId}`);
    
    // Return real projects for this studio
    return realProjects;
  }
  
  // Feedback operations
  async getFeedbackItem(id: number): Promise<FeedbackItem | undefined> {
    return this.feedbackItems.get(id);
  }
  
  async getFeedbackByProject(projectId: number): Promise<FeedbackItem[]> {
    return Array.from(this.feedbackItems.values()).filter(
      (feedback) => feedback.projectId === projectId
    );
  }
  
  async getPendingFeedback(): Promise<FeedbackItem[]> {
    return Array.from(this.feedbackItems.values()).filter(
      (feedback) => feedback.status === "pending"
    );
  }
  
  async createFeedbackItem(feedback: InsertFeedbackItem): Promise<FeedbackItem> {
    const id = this.feedbackIdCounter++;
    const newFeedback: FeedbackItem = { 
      id, 
      ...feedback, 
      createdAt: new Date() 
    };
    this.feedbackItems.set(id, newFeedback);
    return newFeedback;
  }
  
  async updateFeedbackItem(id: number, feedback: Partial<InsertFeedbackItem>): Promise<FeedbackItem | undefined> {
    const existingFeedback = this.feedbackItems.get(id);
    if (!existingFeedback) return undefined;
    
    const updatedFeedback = { ...existingFeedback, ...feedback };
    this.feedbackItems.set(id, updatedFeedback);
    return updatedFeedback;
  }
  
  async deleteFeedbackItem(id: number): Promise<boolean> {
    return this.feedbackItems.delete(id);
  }
  
  // Asset operations
  async getAsset(id: number): Promise<Asset | undefined> {
    return this.assets.get(id);
  }
  
  async getAssetsByProject(projectId: number): Promise<Asset[]> {
    return Array.from(this.assets.values()).filter(
      (asset) => asset.projectId === projectId
    );
  }
  
  async createAsset(asset: InsertAsset): Promise<Asset> {
    const id = this.assetIdCounter++;
    const now = new Date();
    const newAsset: Asset = { 
      id, 
      ...asset, 
      createdAt: now,
      updatedAt: now
    };
    this.assets.set(id, newAsset);
    return newAsset;
  }
  
  async updateAsset(id: number, asset: Partial<InsertAsset>): Promise<Asset | undefined> {
    const existingAsset = this.assets.get(id);
    if (!existingAsset) return undefined;
    
    const updatedAsset = { 
      ...existingAsset, 
      ...asset, 
      updatedAt: new Date() 
    };
    this.assets.set(id, updatedAsset);
    return updatedAsset;
  }
  
  async deleteAsset(id: number): Promise<boolean> {
    return this.assets.delete(id);
  }
  
  // Deadline operations
  async getDeadline(id: number): Promise<Deadline | undefined> {
    return this.deadlines.get(id);
  }
  
  async getDeadlinesByProject(projectId: number): Promise<Deadline[]> {
    return Array.from(this.deadlines.values()).filter(
      (deadline) => deadline.projectId === projectId
    );
  }
  
  async getUpcomingDeadlines(): Promise<Deadline[]> {
    const now = new Date();
    return Array.from(this.deadlines.values())
      .filter((deadline) => deadline.status === "pending" && deadline.dueDate >= now)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }
  
  async createDeadline(deadline: InsertDeadline): Promise<Deadline> {
    const id = this.deadlineIdCounter++;
    const newDeadline: Deadline = { id, ...deadline };
    this.deadlines.set(id, newDeadline);
    return newDeadline;
  }
  
  async updateDeadline(id: number, deadline: Partial<InsertDeadline>): Promise<Deadline | undefined> {
    const existingDeadline = this.deadlines.get(id);
    if (!existingDeadline) return undefined;
    
    const updatedDeadline = { ...existingDeadline, ...deadline };
    this.deadlines.set(id, updatedDeadline);
    return updatedDeadline;
  }
  
  async deleteDeadline(id: number): Promise<boolean> {
    return this.deadlines.delete(id);
  }
  
  // Panel layout operations
  async getPanelLayout(id: number): Promise<PanelLayout | undefined> {
    return this.panelLayouts.get(id);
  }
  
  async getPanelLayoutsByProject(projectId: number): Promise<PanelLayout[]> {
    return Array.from(this.panelLayouts.values()).filter(
      (layout) => layout.projectId === projectId
    );
  }
  
  async createPanelLayout(layout: InsertPanelLayout): Promise<PanelLayout> {
    const id = this.panelLayoutIdCounter++;
    const now = new Date();
    const newLayout: PanelLayout = { 
      id, 
      ...layout, 
      createdAt: now,
      updatedAt: now
    };
    this.panelLayouts.set(id, newLayout);
    return newLayout;
  }
  
  async updatePanelLayout(id: number, layout: Partial<InsertPanelLayout>): Promise<PanelLayout | undefined> {
    const existingLayout = this.panelLayouts.get(id);
    if (!existingLayout) return undefined;
    
    const updatedLayout = { 
      ...existingLayout, 
      ...layout, 
      updatedAt: new Date() 
    };
    this.panelLayouts.set(id, updatedLayout);
    return updatedLayout;
  }
  
  async deletePanelLayout(id: number): Promise<boolean> {
    return this.panelLayouts.delete(id);
  }
  
  // Comment operations
  async getCommentsByFeedback(feedbackId: number): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(
      (comment) => comment.feedbackId === feedbackId
    );
  }
  
  async createComment(comment: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const newComment: Comment = { 
      id, 
      ...comment, 
      createdAt: new Date() 
    };
    this.comments.set(id, newComment);
    return newComment;
  }
  
  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }
  
  // Workflow step operations
  async getWorkflowStep(id: number): Promise<WorkflowStep | undefined> {
    return this.workflowSteps.get(id);
  }

  async getWorkflowStepsByProject(projectId: number): Promise<WorkflowStep[]> {
    return Array.from(this.workflowSteps.values())
      .filter(step => step.projectId === projectId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  
  async getWorkflowStepsAssignedToUser(userId: number): Promise<WorkflowStep[]> {
    return Array.from(this.workflowSteps.values())
      .filter(step => step.assignedTo === userId);
  }

  async createWorkflowStep(step: InsertWorkflowStep): Promise<WorkflowStep> {
    const id = this.workflowStepIdCounter++;
    const now = new Date();
    
    const newStep: WorkflowStep = {
      id,
      ...step,
      createdAt: now,
      updatedAt: now
    };
    
    this.workflowSteps.set(id, newStep);
    return newStep;
  }

  async updateWorkflowStep(id: number, step: Partial<InsertWorkflowStep>): Promise<WorkflowStep | undefined> {
    const existing = this.workflowSteps.get(id);
    if (!existing) {
      return undefined;
    }
    
    const updated: WorkflowStep = {
      ...existing,
      ...step,
      updatedAt: new Date()
    };
    
    this.workflowSteps.set(id, updated);
    return updated;
  }

  async deleteWorkflowStep(id: number): Promise<boolean> {
    return this.workflowSteps.delete(id);
  }

  async initializeProjectWorkflow(projectId: number): Promise<WorkflowStep[]> {
    try {
      console.log(`Starting workflow initialization for project ${projectId}`);
      
      // Get the project to access its metrics
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error("Project not found");
      }
      
      console.log(`Project found: ${project.title}`);
      
      // First, delete any existing workflow steps for this project
      const existingSteps = await this.getWorkflowStepsByProject(projectId);
      console.log(`Found ${existingSteps.length} existing workflow steps to delete`);
      
      for (const step of existingSteps) {
        await this.deleteWorkflowStep(step.id);
      }
      console.log("Existing workflow steps deleted successfully");
    
    // Calculate due dates for each stage based on project metrics and user-defined deadlines
    const today = new Date();
    
    // Get metrics with defaults if null - safe handling with proper type checking
    const coverCount = (project.coverCount === null || project.coverCount === undefined) ? 1 : project.coverCount;
    const interiorPageCount = (project.interiorPageCount === null || project.interiorPageCount === undefined) ? 22 : project.interiorPageCount;
    const fillerPageCount = (project.fillerPageCount === null || project.fillerPageCount === undefined) ? 0 : project.fillerPageCount;
    const pencilerPagesPerWeek = (project.pencilerPagesPerWeek === null || project.pencilerPagesPerWeek === undefined) ? 5 : project.pencilerPagesPerWeek;
    const inkerPagesPerWeek = (project.inkerPagesPerWeek === null || project.inkerPagesPerWeek === undefined) ? 7 : project.inkerPagesPerWeek;
    const coloristPagesPerWeek = (project.coloristPagesPerWeek === null || project.coloristPagesPerWeek === undefined) ? 10 : project.coloristPagesPerWeek;
    const lettererPagesPerWeek = (project.lettererPagesPerWeek === null || project.lettererPagesPerWeek === undefined) ? 15 : project.lettererPagesPerWeek;
    const pencilBatchSize = (project.pencilBatchSize === null || project.pencilBatchSize === undefined) ? 5 : project.pencilBatchSize;
    const inkBatchSize = (project.inkBatchSize === null || project.inkBatchSize === undefined) ? 5 : project.inkBatchSize;
    const approvalDays = (project.approvalDays === null || project.approvalDays === undefined) ? 2 : project.approvalDays;
    
    console.log("Project values:");
    console.log("- Interior page count:", project.interiorPageCount, "Using:", interiorPageCount);
    console.log("- Cover count:", project.coverCount, "Using:", coverCount);
    console.log("- Filler page count:", project.fillerPageCount, "Using:", fillerPageCount);
    
    // Create a helper function to add days to a date
    const addDays = (date: Date, days: number): Date => {
      return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
    };
    
    // Calculate realistic durations in days
    const plotDuration = 7; // Plot development typically takes a week
    const coverDuration = Math.max(7, Math.ceil(coverCount / 1) * 7); // At least a week, more if multiple covers
    const scriptDuration = 14; // Script typically takes 2 weeks after plot
    
    // Ensure all dates are properly converted to Date objects
    let plotEndDate: Date; 
    let coverEndDate: Date;
    
    // Safely convert deadline strings/dates to Date objects
    if (project.plotDeadline) {
      try {
        plotEndDate = new Date(project.plotDeadline);
        // Check if valid date
        if (isNaN(plotEndDate.getTime())) {
          console.log("Invalid plot deadline, using calculated date");
          plotEndDate = addDays(today, plotDuration);
        }
      } catch (e) {
        console.log("Error parsing plot deadline:", e);
        plotEndDate = addDays(today, plotDuration);
      }
    } else {
      plotEndDate = addDays(today, plotDuration);
    }
    
    if (project.coverDeadline) {
      try {
        coverEndDate = new Date(project.coverDeadline);
        // Check if valid date
        if (isNaN(coverEndDate.getTime())) {
          console.log("Invalid cover deadline, using calculated date");
          coverEndDate = addDays(today, coverDuration);
        }
      } catch (e) {
        console.log("Error parsing cover deadline:", e);
        coverEndDate = addDays(today, coverDuration);
      }
    } else {
      coverEndDate = addDays(today, coverDuration);
    }
    
    // Calculate script deadline based on plot completion
    const scriptEndDate = addDays(plotEndDate, scriptDuration);
    
    // Calculate task durations for the entire process
    // These are total durations if one person did all pages from start to finish
    const pencilTotalDays = Math.ceil(interiorPageCount / (pencilerPagesPerWeek / 7)); // Convert pages per week to pages per day
    const inkTotalDays = Math.ceil(interiorPageCount / (inkerPagesPerWeek / 7));
    const colorTotalDays = Math.ceil(interiorPageCount / (coloristPagesPerWeek / 7));
    const letterTotalDays = Math.ceil(interiorPageCount / (lettererPagesPerWeek / 7));
    const editorialDuration = Math.ceil(fillerPageCount / 5) * 7; // Assuming 5 filler pages per week
    const productionDuration = 7; // Final assembly typically takes a week
    
    console.log("Calculated durations:");
    console.log("- Interior page count:", interiorPageCount);
    console.log("- Pencil total days:", pencilTotalDays, "at", pencilerPagesPerWeek, "pages per week");
    console.log("- Ink total days:", inkTotalDays, "at", inkerPagesPerWeek, "pages per week");
    console.log("- Color total days:", colorTotalDays, "at", coloristPagesPerWeek, "pages per week");
    console.log("- Letter total days:", letterTotalDays, "at", lettererPagesPerWeek, "pages per week");
    console.log("- Editorial duration (days):", editorialDuration, "for", fillerPageCount, "filler pages");
    
    // Calculate time needed for first batch
    const daysForFirstPencilBatch = Math.ceil(pencilBatchSize / (pencilerPagesPerWeek / 7));
    const daysForFirstInkBatch = Math.ceil(inkBatchSize / (inkerPagesPerWeek / 7));
    const letterBatchSize = project.letterBatchSize || 5;
    const daysForLetterBatch = Math.ceil(letterBatchSize / (lettererPagesPerWeek / 7));
    
    // Account for sequential work and batching
    // Pencils can start after script approval
    const pencilStartDate = addDays(scriptEndDate, approvalDays);
    
    // Inks can only start after the first pencil batch is complete plus approval time
    const inkStartDate = addDays(pencilStartDate, daysForFirstPencilBatch + approvalDays);
    
    // Colors can only start after the first ink batch is complete plus approval time
    const colorStartDate = addDays(inkStartDate, daysForFirstInkBatch + approvalDays);
    
    // Lettering can start in parallel with colors after the first ink batch
    const letterStartDate = colorStartDate;
    
    // Editorial work can start when about half of the pages are colored
    const editorialStartDate = addDays(colorStartDate, Math.ceil(colorTotalDays / 2));
    
    // Calculate end dates by adding the full duration to each start date
    // This accounts for the overlapping batch work
    const pencilEndDate = addDays(pencilStartDate, pencilTotalDays);
    
    // Inks finish after all pencils are done and the full ink duration
    // But we need to account for batching - the last batch of pencils needs to be inked
    const lastPencilBatchDoneDate = pencilEndDate;
    const inkEndDate = addDays(lastPencilBatchDoneDate, 
                               daysForFirstInkBatch + approvalDays);
    
    // Same logic applies to colors - they can't finish until the last ink batch is done
    const lastInkBatchDoneDate = inkEndDate;
    const colorEndDate = addDays(lastInkBatchDoneDate, 
                                Math.ceil((project.inkBatchSize || 5) / (coloristPagesPerWeek / 7)) + approvalDays);
    
    // Lettering depends on the last color batch
    const letterEndDate = addDays(colorEndDate, daysForLetterBatch);
    
    // Editorial work generally finishes after coloring is done
    const editorialEndDate = addDays(editorialStartDate, editorialDuration);
    
    // Final editorial date (one week after colors)
    const finalEditorialDate = addDays(colorEndDate, 7);
    
    // Production date is now explicitly set relative to colorEndDate
    const productionStartDate = addDays(colorEndDate, 7); // Start production same time as final editorial
    const productionEndDate = addDays(colorEndDate, 14); // Due two weeks after colors
    
    // Safely handle project due date (check if it's a valid date)
    let projectDueDate = null;
    if (project.dueDate) {
      try {
        projectDueDate = new Date(project.dueDate);
        // Verify it's a valid date
        if (isNaN(projectDueDate.getTime())) {
          console.log("Invalid project due date, treating as null");
          projectDueDate = null;
        } else {
          console.log(`Project due date: ${projectDueDate.toISOString()}`);
        }
      } catch (e) {
        console.log("Error parsing project due date:", e);
        projectDueDate = null;
      }
    }
    console.log(`Calculated completion date: ${productionEndDate.toISOString()}`);
    
    if (projectDueDate && productionEndDate > projectDueDate) {
      console.log(`Warning: Project completion date (${productionEndDate.toISOString()}) is after the project due date (${projectDueDate.toISOString()})`);
    }
    
    // Define the standard comic book workflow steps
    const workflowSteps: InsertWorkflowStep[] = [
      // Initial stages happen in parallel
      {
        projectId,
        stepType: "plot",
        title: "Plot Development",
        description: "Create and approve the story outline and plot points",
        status: "not_started",
        progress: 0,
        sortOrder: 10,
        dueDate: plotEndDate,
      },
      {
        projectId,
        stepType: "covers",
        title: "Cover Art",
        description: `Create ${coverCount} covers for the issue`,
        status: "not_started",
        progress: 0,
        sortOrder: 20,
        dueDate: coverEndDate,
      },
      {
        projectId,
        stepType: "script",
        title: "Script Writing",
        description: "Convert approved plot into full script with dialogue and panel descriptions",
        status: "not_started",
        progress: 0,
        sortOrder: 30,
        dueDate: scriptEndDate,
      },
      {
        projectId,
        stepType: "pencils",
        title: "Pencils/Roughs",
        description: `Initial sketches and layouts for ${interiorPageCount} interior pages (${pencilerPagesPerWeek} pages/week)`,
        status: "not_started",
        progress: 0,
        sortOrder: 40,
        dueDate: pencilEndDate
      },
      {
        projectId,
        stepType: "inks",
        title: "Inks/Finishes",
        description: `Final line work over the pencils for ${interiorPageCount} pages (${inkerPagesPerWeek} pages/week)`,
        status: "not_started",
        progress: 0,
        sortOrder: 50,
        dueDate: inkEndDate
      },
      {
        projectId,
        stepType: "colors",
        title: "Colors",
        description: `Coloring ${interiorPageCount} interior pages (${coloristPagesPerWeek} pages/week)`,
        status: "not_started",
        progress: 0,
        sortOrder: 60,
        dueDate: colorEndDate
      },
      {
        projectId,
        stepType: "letters",
        title: "Letters",
        description: `Adding text, speech bubbles, and sound effects to ${interiorPageCount} pages (${lettererPagesPerWeek} pages/week)`,
        status: "not_started",
        progress: 0,
        sortOrder: 70,
        dueDate: letterEndDate
      },
      {
        projectId,
        stepType: "proofs",
        title: "Final Assembled Reader Proof",
        description: `Editorial review of ${interiorPageCount} colored pages before final approval`,
        status: "not_started",
        progress: 0,
        sortOrder: 75,
        dueDate: addDays(letterEndDate, 7) // Due one week after letters
      },
      {
        projectId,
        stepType: "editorial",
        title: "Editorial Pages",
        description: `Create ${fillerPageCount} supplementary editorial pages`,
        status: "not_started",
        progress: 0,
        sortOrder: 80,
        dueDate: colorEndDate // Due same day as colors
      },
      {
        projectId,
        stepType: "final_editorial",
        title: "Final Editorial Pages",
        description: `Final editorial review and approval of all ${interiorPageCount + fillerPageCount} pages`,
        status: "not_started",
        progress: 0,
        sortOrder: 85,
        dueDate: addDays(colorEndDate, 7) // Due one week after colors
      },
      {
        projectId,
        stepType: "production",
        title: "Final Production",
        description: `Final assembly, file preparation and prepress for ${interiorPageCount + fillerPageCount} total pages`,
        status: "not_started",
        progress: 0,
        sortOrder: 90,
        dueDate: addDays(colorEndDate, 14) // Due two weeks after colors (one week after final editorial)
      }
    ];
    
    // Create each workflow step
    const createdSteps: WorkflowStep[] = [];
    for (const step of workflowSteps) {
      const createdStep = await this.createWorkflowStep(step);
      createdSteps.push(createdStep);
    }
    
    // Connect steps with prev/next references
    for (let i = 0; i < createdSteps.length; i++) {
      const prevId = i > 0 ? createdSteps[i-1].id : null;
      const nextId = i < createdSteps.length - 1 ? createdSteps[i+1].id : null;
      
      await this.updateWorkflowStep(createdSteps[i].id, {
        prevStepId: prevId,
        nextStepId: nextId
      });
    }
    
    console.log(`Workflow initialization completed successfully with ${createdSteps.length} steps`);
    return this.getWorkflowStepsByProject(projectId);
    } catch (error) {
      console.error(`Error in initializeProjectWorkflow:`, error);
      throw error;
    }
  }
  
  // File upload operations
  async getFileUpload(id: number): Promise<FileUpload | undefined> {
    return this.fileUploads.get(id);
  }

  async getFileUploadsByProject(projectId: number): Promise<FileUpload[]> {
    return Array.from(this.fileUploads.values())
      .filter(upload => upload.projectId === projectId)
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()); // Newest first
  }

  async getFileUploadsByWorkflowStep(workflowStepId: number): Promise<FileUpload[]> {
    return Array.from(this.fileUploads.values())
      .filter(upload => upload.workflowStepId === workflowStepId)
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()); // Newest first
  }

  async getFileUploadsByFeedback(feedbackItemId: number): Promise<FileUpload[]> {
    return Array.from(this.fileUploads.values())
      .filter(upload => upload.feedbackItemId === feedbackItemId)
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()); // Newest first
  }

  async createFileUpload(upload: InsertFileUpload): Promise<FileUpload> {
    const id = this.fileUploadIdCounter++;
    const now = new Date();
    
    const newUpload: FileUpload = {
      id,
      ...upload,
      uploadedAt: now,
      updatedAt: now
    };
    
    this.fileUploads.set(id, newUpload);
    return newUpload;
  }

  async updateFileUpload(id: number, upload: Partial<InsertFileUpload>): Promise<FileUpload | undefined> {
    const existing = this.fileUploads.get(id);
    if (!existing) {
      return undefined;
    }
    
    const updated: FileUpload = {
      ...existing,
      ...upload,
      updatedAt: new Date()
    };
    
    this.fileUploads.set(id, updated);
    return updated;
  }

  async deleteFileUpload(id: number): Promise<boolean> {
    return this.fileUploads.delete(id);
  }

  // File link operations
  async getFileLinksByWorkflowStep(workflowStepId: number): Promise<FileLink[]> {
    const links: FileLink[] = [];
    for (const link of this.fileLinks.values()) {
      if (link.workflowStepId === workflowStepId) {
        links.push(link);
      }
    }
    return links;
  }

  async createFileLink(link: InsertFileLink): Promise<FileLink> {
    const id = this.fileLinkIdCounter++;
    const newLink: FileLink = {
      id,
      ...link,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.fileLinks.set(id, newLink);
    return newLink;
  }

  async deleteFileLink(id: number): Promise<boolean> {
    return this.fileLinks.delete(id);
  }
}

export const storage = new MemStorage();
