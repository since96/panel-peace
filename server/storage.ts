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
  getStudioEditors(studioId: number): Promise<User[]>; // Get all editors in a studio
  getStudiosByAdmin(userId: number): Promise<Studio[]>; // Get studios where user is an EIC
  
  // User operations
  getUser(id: number | string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  upsertUser(userData: Partial<InsertUser> & { id: string | number }): Promise<User>;
  getUsersByStudio(studioId: number): Promise<User[]>; // Get all users in a studio
  getUsersByRole(role: string, studioId?: number): Promise<User[]>; // Get users by role, optionally filtered by studio
  
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
      fullName: "Admin",
      email: "admin@comicsmanagement.com",
      isEditor: true,
      editorRole: "editor_in_chief",
      role: "Editor",
      avatarUrl: ""
    });
  }
  
  private initializeSampleData() {
    // No sample data needed - users will create their own projects and content
    // This keeps the system clean without any fake talent entries
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
      editorRole: newUserData.editorRole || null,
      assignedProjects: newUserData.assignedProjects || null,
      role: newUserData.role || null,
      roles: newUserData.roles || null,
      avatarUrl: newUserData.avatarUrl || null,
    };
    
    this.users.set(id, newUser);
    return newUser;
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { id, ...user };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = await this.getUser(id);
    if (!existingUser) {
      return undefined;
    }
    
    const updatedUser: User = {
      ...existingUser,
      ...userData,
      id: existingUser.id // Keep the original ID
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
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
  
  // Collaborator operations
  async getCollaboratorsByProject(projectId: number): Promise<Collaborator[]> {
    return Array.from(this.collaborators.values()).filter(
      (collab) => collab.projectId === projectId
    );
  }
  
  async addCollaborator(collaborator: InsertCollaborator): Promise<Collaborator> {
    const id = this.collaboratorIdCounter++;
    const newCollaborator: Collaborator = { id, ...collaborator };
    this.collaborators.set(id, newCollaborator);
    return newCollaborator;
  }
  
  async removeCollaborator(userId: number, projectId: number): Promise<boolean> {
    const collaborator = Array.from(this.collaborators.values()).find(
      (collab) => collab.userId === userId && collab.projectId === projectId
    );
    
    if (!collaborator) return false;
    return this.collaborators.delete(collaborator.id);
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
    return newAssignment;
  }
  
  async removeEditorFromProject(userId: number, projectId: number): Promise<boolean> {
    const editor = Array.from(this.projectEditors.values()).find(
      (pe) => pe.userId === userId && pe.projectId === projectId
    );
    
    if (!editor) return false;
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
  
  // Debug methods - temporary
  async debugGetAllUsers(): Promise<Record<number, User>> {
    const result: Record<number, User> = {};
    this.users.forEach((user, id) => {
      result[id] = user;
    });
    return result;
  }
  
  async getProjectsByStudio(studioId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      project => project.studioId === studioId
    );
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
    
    // Get metrics with defaults if null
    const coverCount = project.coverCount || 1;
    const interiorPageCount = project.interiorPageCount || 22; // Default to 22 pages (standard comic)
    const fillerPageCount = project.fillerPageCount || 0;
    const pencilerPagesPerWeek = project.pencilerPagesPerWeek || 5;
    const inkerPagesPerWeek = project.inkerPagesPerWeek || 7;
    const coloristPagesPerWeek = project.coloristPagesPerWeek || 10;
    const lettererPagesPerWeek = project.lettererPagesPerWeek || 15;
    const pencilBatchSize = project.pencilBatchSize || 5;
    const inkBatchSize = project.inkBatchSize || 5;
    const approvalDays = project.approvalDays || 2;
    
    // Create a helper function to add days to a date
    const addDays = (date: Date, days: number): Date => {
      return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
    };
    
    // Calculate realistic durations in days
    const plotDuration = 7; // Plot development typically takes a week
    const coverDuration = Math.max(7, Math.ceil(coverCount / 1) * 7); // At least a week, more if multiple covers
    const scriptDuration = 14; // Script typically takes 2 weeks after plot
    
    // Use manual deadlines if set, otherwise calculate them
    const plotEndDate = project.plotDeadline || addDays(today, plotDuration);
    const coverEndDate = project.coverDeadline || addDays(today, coverDuration);
    
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
    
    // Comparison with project due date
    const projectDueDate = project.dueDate ? new Date(project.dueDate) : null;
    console.log(`Project due date: ${projectDueDate?.toISOString()}`);
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
        dueDate: pencilEndDate,
      },
      {
        projectId,
        stepType: "inks",
        title: "Inks/Finishes",
        description: `Final line work over the pencils (${inkerPagesPerWeek} pages/week)`,
        status: "not_started",
        progress: 0,
        sortOrder: 50,
        dueDate: inkEndDate,
      },
      {
        projectId,
        stepType: "colors",
        title: "Colors",
        description: `Coloring the interior pages (${coloristPagesPerWeek} pages/week)`,
        status: "not_started",
        progress: 0,
        sortOrder: 60,
        dueDate: colorEndDate,
      },
      {
        projectId,
        stepType: "letters",
        title: "Letters",
        description: `Adding text, speech bubbles, and sound effects (${lettererPagesPerWeek} pages/week)`,
        status: "not_started",
        progress: 0,
        sortOrder: 70,
        dueDate: letterEndDate,
      },
      {
        projectId,
        stepType: "proofs",
        title: "Final Assembled Reader Proof",
        description: "Editorial review of colored pages before final approval",
        status: "not_started",
        progress: 0,
        sortOrder: 75,
        dueDate: addDays(letterEndDate, 7), // Due one week after letters
      },
      {
        projectId,
        stepType: "editorial",
        title: "Editorial Pages",
        description: `Create ${fillerPageCount} supplementary editorial pages`,
        status: "not_started",
        progress: 0,
        sortOrder: 80,
        dueDate: colorEndDate, // Due same day as colors
      },
      {
        projectId,
        stepType: "final_editorial",
        title: "Final Editorial Pages",
        description: "Final editorial review and approval of all pages",
        status: "not_started",
        progress: 0,
        sortOrder: 85,
        dueDate: addDays(colorEndDate, 7), // Due one week after colors
      },
      {
        projectId,
        stepType: "production",
        title: "Final Production",
        description: "Final assembly, file preparation and prepress",
        status: "not_started",
        progress: 0,
        sortOrder: 90,
        dueDate: addDays(colorEndDate, 14), // Due two weeks after colors (one week after final editorial)
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
