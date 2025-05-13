import {
  users, User, InsertUser,
  projects, Project, InsertProject,
  collaborators, Collaborator, InsertCollaborator,
  feedbackItems, FeedbackItem, InsertFeedbackItem,
  assets, Asset, InsertAsset,
  deadlines, Deadline, InsertDeadline,
  panelLayouts, PanelLayout, InsertPanelLayout,
  comments, Comment, InsertComment,
  workflowSteps, WorkflowStep, InsertWorkflowStep,
  fileUploads, FileUpload, InsertFileUpload
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  getProjectsByUser(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private collaborators: Map<number, Collaborator>;
  private feedbackItems: Map<number, FeedbackItem>;
  private assets: Map<number, Asset>;
  private deadlines: Map<number, Deadline>;
  private panelLayouts: Map<number, PanelLayout>;
  private comments: Map<number, Comment>;
  private workflowSteps: Map<number, WorkflowStep>;
  
  private userIdCounter: number;
  private projectIdCounter: number;
  private collaboratorIdCounter: number;
  private feedbackIdCounter: number;
  private assetIdCounter: number;
  private deadlineIdCounter: number;
  private panelLayoutIdCounter: number;
  private commentIdCounter: number;
  private workflowStepIdCounter: number;

  private fileUploads: Map<number, FileUpload>;
  private fileUploadIdCounter: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.collaborators = new Map();
    this.feedbackItems = new Map();
    this.assets = new Map();
    this.deadlines = new Map();
    this.panelLayouts = new Map();
    this.comments = new Map();
    this.workflowSteps = new Map();
    this.fileUploads = new Map();
    
    this.userIdCounter = 1;
    this.projectIdCounter = 1;
    this.collaboratorIdCounter = 1;
    this.feedbackIdCounter = 1;
    this.assetIdCounter = 1;
    this.deadlineIdCounter = 1;
    this.panelLayoutIdCounter = 1;
    this.commentIdCounter = 1;
    this.workflowStepIdCounter = 1;
    this.fileUploadIdCounter = 1;
    
    // Create default admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      fullName: "Alex Rodriguez",
      role: "Senior Editor",
      avatarUrl: ""
    });
    
    // Initialize with sample data
    this.initializeSampleData();
  }
  
  private initializeSampleData() {
    // Create sample projects
    const project1 = this.createProject({
      title: "Stellar Adventures",
      issue: "#12",
      description: "The crew faces an ancient alien threat on Proxima B.",
      status: "in_progress",
      coverImage: "",
      progress: 68,
      dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
      createdBy: 1
    });
    
    const project2 = this.createProject({
      title: "Midnight Detective",
      issue: "#8",
      description: "A mysterious disappearance in the heart of the city.",
      status: "needs_review",
      coverImage: "",
      progress: 42,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      createdBy: 1
    });
    
    const project3 = this.createProject({
      title: "Cybernetic Dreams",
      issue: "#3",
      description: "The rebellion's last stand against the AI overlords.",
      status: "delayed",
      coverImage: "",
      progress: 23,
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago (overdue)
      createdBy: 1
    });
    
    // Create sample feedback items
    this.createFeedbackItem({
      projectId: 1,
      title: "Stellar Adventures #12 - Page 8",
      description: "Review battle scene composition and character poses",
      priority: "high",
      status: "pending",
      assetType: "artwork",
      assetId: 1,
      requestedBy: 1,
      thumbnailUrl: ""
    });
    
    this.createFeedbackItem({
      projectId: 2,
      title: "Midnight Detective #8 - Script",
      description: "Review dialogue flow and plot consistency in Act 2",
      priority: "medium",
      status: "pending",
      assetType: "script",
      assetId: 2,
      requestedBy: 1,
      thumbnailUrl: ""
    });
    
    this.createFeedbackItem({
      projectId: 3,
      title: "Cybernetic Dreams #3 - Character Design",
      description: "Review new antagonist design and cybernetic elements",
      priority: "medium",
      status: "pending",
      assetType: "character",
      assetId: 3,
      requestedBy: 1,
      thumbnailUrl: ""
    });
    
    // Create sample deadlines
    this.createDeadline({
      projectId: 1,
      title: "Final artwork submission",
      description: "Submit all finalized artwork for printing",
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      priority: "high",
      status: "pending"
    });
    
    this.createDeadline({
      projectId: 2,
      title: "Script revisions due",
      description: "Complete all requested script revisions",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // In 3 days
      priority: "medium",
      status: "pending"
    });
    
    this.createDeadline({
      projectId: 3,
      title: "Character design approval",
      description: "Final sign-off on character designs",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // In 7 days
      priority: "low",
      status: "pending"
    });
    
    this.createDeadline({
      projectId: 1,
      title: "Script outline due",
      description: "Complete outline for next issue",
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // In 10 days
      priority: "low",
      status: "pending"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { id, ...user };
    this.users.set(id, newUser);
    return newUser;
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
}

export const storage = new MemStorage();
