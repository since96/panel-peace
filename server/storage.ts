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
    // Get the project to access its metrics
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    
    // First, delete any existing workflow steps for this project
    const existingSteps = await this.getWorkflowStepsByProject(projectId);
    for (const step of existingSteps) {
      await this.deleteWorkflowStep(step.id);
    }
    
    // Calculate due dates for each stage based on project metrics and user-defined deadlines
    const today = new Date();
    
    // Get metrics with defaults if null
    const coverCount = project.coverCount || 1;
    const interiorPageCount = project.interiorPageCount;
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
    const daysForLetterBatch = Math.ceil((project.letterBatchSize || 5) / (lettererPagesPerWeek / 7));
    
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
    
    // Add final editorial date (one week after colors)
    const finalEditorialDate = addDays(colorEndDate, 7);
    
    // Production starts after everything else is done
    const productionStartDate = new Date(Math.max(
      colorEndDate.getTime(),
      letterEndDate.getTime(),
      editorialEndDate.getTime(),
      finalEditorialDate.getTime()
    ));
    const productionEndDate = addDays(productionStartDate, productionDuration);
    
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
        dueDate: editorialEndDate,
      },
      {
        projectId,
        stepType: "final_editorial",
        title: "Final Editorial Pages",
        description: "Final editorial review and approval of all pages",
        status: "not_started",
        progress: 0,
        sortOrder: 85,
        dueDate: addDays(colorEndDate, 7), // Due one week after proofs/colors
      },
      {
        projectId,
        stepType: "production",
        title: "Final Production",
        description: "Final assembly, file preparation and prepress",
        status: "not_started",
        progress: 0,
        sortOrder: 90,
        dueDate: productionEndDate,
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
    
    return this.getWorkflowStepsByProject(projectId);
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
}

export const storage = new MemStorage();
