// Create a basic fixed version that we can improve later
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Project, FeedbackItem, Deadline, Collaborator, Asset, WorkflowStep, User, Comment } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Trash2, Clock, Users, FileText, Book, Plus, Calendar as CalendarIcon, MessageCircle, MessageSquare, CheckCircle2, AlertCircle, ArrowRight, AlertTriangle, X, ExternalLink } from 'lucide-react';
import { FeedbackItemCard } from '@/components/ui/custom/feedback-item';
import { DeadlineItem } from '@/components/ui/custom/deadline-item';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { 
  formatDate, 
  formatDateRelative, 
  formatStatusLabel, 
  getStatusColor, 
  DEFAULT_USER_ID,
  calculateDaysUntil,
  getTalentProgressStatus,
  getTalentProgressStatusColor,
  type TalentProgressStatus, cn
} from '@/lib/utils';
import { FileUpload, FileData } from '@/components/ui/custom/file-upload';
import { Helmet } from 'react-helmet-async';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [projectProgress, setProjectProgress] = useState<number>(0);
  const [editing, setEditing] = useState(false);
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [showUpdateStatusDialog, setShowUpdateStatusDialog] = useState(false);
  const [showDeadlineDialog, setShowDeadlineDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  // The comments we'll fetch from the API
  const [comments, setComments] = useState<Comment[]>([]);


  const { data: project, isLoading: isProjectLoading } = useQuery<Project>({
    queryKey: [`/api/projects/${id}`],
  });

  const { data: feedbackItems, isLoading: isFeedbackLoading } = useQuery<FeedbackItem[]>({
    queryKey: [`/api/projects/${id}/feedback`],
    enabled: !!id,
  });

  const { data: deadlines, isLoading: isDeadlinesLoading } = useQuery<Deadline[]>({
    queryKey: [`/api/projects/${id}/deadlines`],
    enabled: !!id,
  });

  const { data: assets, isLoading: isAssetsLoading } = useQuery<Asset[]>({
    queryKey: [`/api/projects/${id}/assets`],
    enabled: !!id,
  });
  
  const { data: workflowSteps, isLoading: isWorkflowLoading } = useQuery<WorkflowStep[]>({
    queryKey: [`/api/projects/${id}/workflow-steps`],
    enabled: !!id,
  });
  

  
  const { data: fileUploads, isLoading: isFileUploadsLoading } = useQuery<any[]>({
    queryKey: [`/api/projects/${id}/file-uploads`],
    enabled: !!id,
  });
  
  

  // Handle adding a comment
  const handleAddComment = () => {
    if (!selectedStep || !commentText.trim()) return;
    
    // Create and post the comment
    addCommentMutation.mutate({
      content: commentText,
      feedbackId: selectedStep.id, // Using step ID since we're attaching to a workflow step
      userId: DEFAULT_USER_ID
    });
  };

  // Get all users to display in talent assignment dropdown
  const { data: users, isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: !!id,
  });
  
  // Fetch comments when a step is selected for comments
  const fetchComments = useCallback(async (feedbackId: number) => {
    if (feedbackId) {
      try {
        const res = await fetch(`/api/feedback/${feedbackId}/comments`);
        const data = await res.json();
        setComments(data);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
        toast({
          title: "Failed to load comments",
          description: "Could not retrieve comments for this step",
          variant: "destructive"
        });
      }
    }
  }, [toast]);
  
  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (data: { content: string; feedbackId: number; userId: number }) => {
      const res = await apiRequest("POST", `/api/comments`, data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully"
      });
      setCommentText('');
      // Add the new comment to the list
      setComments(prev => [data, ...prev]);
    },
    onError: (error) => {
      toast({
        title: "Failed to add comment",
        description: error.message || "An error occurred while posting your comment",
        variant: "destructive"
      });
    }
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (updateData: { id: number; dueDate?: Date; progress?: number }) => {
      const res = await apiRequest("PATCH", `/api/projects/${updateData.id}`, updateData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Project updated",
        description: "Project has been updated successfully"
      });
      // Invalidate both project and workflow steps queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}/workflow-steps`] });
      setEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to update project",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const initializeWorkflowMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/projects/${id}/initialize-workflow`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Workflow initialized",
        description: "Comic production workflow has been set up successfully"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}/workflow-steps`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to initialize workflow",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/projects/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Project deleted",
        description: "The project has been deleted successfully"
      });
      navigate('/projects');
    },
    onError: (error) => {
      toast({
        title: "Failed to delete project",
        description: error.message || "An error occurred while deleting the project",
        variant: "destructive"
      });
    }
  });
  
  const updateWorkflowStepMutation = useMutation({
    mutationFn: async (data: {
      stepId: number;
      progress?: number;
      status?: string;
      dueDate?: Date | null;
      description?: string | null;
      assignedTo?: number | null;
    }) => {
      const { stepId, ...updateData } = data;
      console.log("Sending update:", updateData);
      const res = await apiRequest("PATCH", `/api/workflow-steps/${stepId}`, updateData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Step updated",
        description: "Workflow step has been updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}/workflow-steps`] });
      setShowDeadlineDialog(false);
      setEditingStep(null);
    },
    onError: (error) => {
      console.error("Error updating workflow step:", error);
      toast({
        title: "Failed to update step",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleProgressUpdate = () => {
    if (projectProgress !== project?.progress) {
      updateProjectMutation.mutateAsync({
        id: parseInt(id as string),
        progress: projectProgress
      });
    } else {
      setEditing(false);
    }
  };

  // Sample collaborators (in a real app, fetch from API)
  const sampleCollaborators = [
    { id: 1, name: "Alex Rodriguez", role: "Editor", avatarUrl: "" },
    { id: 2, name: "Sarah Lee", role: "Writer", avatarUrl: "" },
    { id: 3, name: "James King", role: "Artist", avatarUrl: "" },
  ];

  // Sample requesters for feedback items
  const requesters = {
    1: { name: 'Sarah Lee', avatarUrl: '' },
    2: { name: 'James King', avatarUrl: '' },
    3: { name: 'Mina Tan', avatarUrl: '' },
  };
  
  const getRequesterForFeedback = (requestedBy: number) => {
    return requesters[requestedBy as keyof typeof requesters] || { name: 'Unknown', avatarUrl: '' };
  };

  // Initialize projectProgress when project data is loaded
  useEffect(() => {
    if (project && !editing) {
      setProjectProgress(project.progress);
    }
  }, [project, editing]);

  if (isProjectLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow animate-pulse">
          <div className="h-7 bg-slate-200 rounded w-3/4 mb-6"></div>
          <div className="h-4 bg-slate-200 rounded w-full mb-6"></div>
          <div className="h-24 bg-slate-200 rounded w-full mb-6"></div>
          <div className="h-10 bg-slate-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-6xl text-slate-300 mb-4">
          <i className="ri-error-warning-line"></i>
        </div>
        <h2 className="text-2xl font-bold text-slate-700 mb-2">Project Not Found</h2>
        <p className="text-slate-500 mb-6">The project you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate('/projects')}>Return to Projects</Button>
      </div>
    );
  }

  // Get status colors
  const statusColors = getStatusColor(project.status);

  return (
    <>
      <Helmet>
        <title>{`${project.title} ${project.issue} - Comic Editor Pro`}</title>
        <meta name="description" content={`Manage and collaborate on ${project.title} ${project.issue}. View progress, feedback, and assets for this comic book project.`} />
      </Helmet>
      
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" className="p-0 h-auto" onClick={() => navigate('/projects')}>
              <span className="text-primary text-sm">Projects</span>
            </Button>
            <span className="text-slate-400">/</span>
            <span className="text-sm">{project.title} {project.issue}</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{project.title} {project.issue}</h1>
                <Badge className={`${statusColors.bgLight} ${statusColors.text}`}>
                  {formatStatusLabel(project.status)}
                </Badge>
              </div>
              <p className="text-slate-500 mt-1">{project.description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Project Overview</CardTitle>
                <CardDescription>
                  Track progress and manage comic book assets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-500">Due Date</p>
                        <div className="flex items-center">
                          {editing ? (
                            <div className="w-full">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    id="project-due-date"
                                    variant="outline"
                                    className="w-full justify-start text-left font-medium h-9"
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {project.dueDate ? format(new Date(project.dueDate), 'MMMM d, yyyy') : <span>Pick a date</span>}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={project.dueDate ? new Date(project.dueDate) : undefined}
                                    onSelect={(date) => {
                                      if (date) {
                                        updateProjectMutation.mutate({
                                          id: parseInt(id as string),
                                          dueDate: date
                                        });
                                        setEditing(false);
                                      }
                                    }}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          ) : (
                            <>
                              <p className="font-medium">
                                {project.dueDate ? formatDate(project.dueDate) : 'Not set'}
                              </p>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 ml-2" 
                                onClick={() => setEditing(true)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Workflow section */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Comic Workflow</h3>
                    
                    {workflowSteps && workflowSteps.length === 0 && (
                      <Button 
                        size="sm"
                        onClick={() => initializeWorkflowMutation.mutate()}
                        disabled={initializeWorkflowMutation.isPending}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {initializeWorkflowMutation.isPending ? 'Initializing...' : 'Initialize Workflow'}
                      </Button>
                    )}
                  </div>
                  
                  {isWorkflowLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-slate-100 h-24 rounded-lg animate-pulse"></div>
                      ))}
                    </div>
                  ) : workflowSteps && workflowSteps.length > 0 ? (
                    <div className="space-y-3">
                      {workflowSteps.map((step) => {
                        let progressStatus: TalentProgressStatus = 'on_time';
                        
                        if (step.dueDate) {
                          const daysUntil = calculateDaysUntil(step.dueDate);
                          progressStatus = getTalentProgressStatus(daysUntil, step.progress);
                        }
                        
                        const progressStatusColors = getTalentProgressStatusColor(progressStatus);
                        
                        return (
                          <Card key={step.id} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex-1">
                                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium text-slate-900">{step.title}</h4>
                                      <Badge variant="outline" className="ml-2">{formatStatusLabel(step.status)}</Badge>
                                    </div>
                                    
                                    {step.dueDate && (
                                      <div className="flex items-center text-sm">
                                        <CalendarIcon className="h-3.5 w-3.5 mr-1 text-slate-400" />
                                        <span className={progressStatusColors.text}>
                                          Due {formatDateRelative(step.dueDate)}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {step.assignedTo && users && (
                                      <div className="flex items-center text-sm">
                                        <Users className="h-3.5 w-3.5 mr-1 text-slate-400" />
                                        <span>
                                          {users.find(u => u.id === step.assignedTo)?.username || 'Unknown'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {step.description && (
                                    <p className="text-sm text-slate-500 mt-1">
                                      {step.description}
                                    </p>
                                  )}
                                  
                                  <div className="flex-none">
                                    <div className="flex flex-col items-end gap-2">
                                      <div className="grid grid-cols-3 gap-2 w-full">
                                        <Button 
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setSelectedStep(step);
                                            setCommentText('');
                                            fetchComments(step.id);
                                            setShowCommentDialog(true);
                                          }}
                                        >
                                          <MessageSquare className="h-4 w-4 mr-2" />
                                          Comments
                                        </Button>
                                        
                                        <Button 
                                          size="sm"
                                          variant="outline"
                                          className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                                          onClick={() => {
                                            setEditingStep(step);
                                            setShowDeadlineDialog(true);
                                          }}
                                        >
                                          <CalendarIcon className="h-4 w-4 mr-2" />
                                          Adjust Deadline
                                        </Button>
                                        

                                      </div>
                                      
                                      <Progress 
                                        value={step.progress} 
                                        className={`h-2 w-32 mt-2`} 
                                        indicatorColor={progressStatusColors.indicator}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
                      <div className="flex justify-center mb-4 text-slate-400">
                        <FileText className="h-12 w-12" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No Workflow Steps</h3>
                      <p className="text-slate-500 mb-4">
                        Initialize the comic workflow to track the production process.
                      </p>
                      <Button 
                        onClick={() => initializeWorkflowMutation.mutate()}
                        disabled={initializeWorkflowMutation.isPending}
                      >
                        {initializeWorkflowMutation.isPending ? 'Initializing...' : 'Initialize Workflow'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            

          </div>
        </div>
      </div>

      {/* Deadline Adjustment Dialog */}
      <Dialog open={showDeadlineDialog} onOpenChange={setShowDeadlineDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adjust Deadline</DialogTitle>
            <DialogDescription>
              Update the deadline for this workflow step.
            </DialogDescription>
          </DialogHeader>
          
          {editingStep && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="step-title-deadline" className="text-right">
                  Step
                </Label>
                <Input
                  id="step-title-deadline"
                  value={editingStep.title}
                  className="col-span-3"
                  disabled
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="current-deadline" className="text-right">
                  Current Deadline
                </Label>
                <div className="col-span-3">
                  <span className="text-sm">
                    {editingStep.dueDate 
                      ? formatDate(editingStep.dueDate)
                      : 'No deadline set'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-deadline" className="text-right">
                  New Deadline
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="new-deadline"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editingStep.dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editingStep.dueDate ? format(new Date(editingStep.dueDate), "PPP")
                          : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editingStep.dueDate ? new Date(editingStep.dueDate) : undefined}
                        onSelect={(date) => setEditingStep({...editingStep, dueDate: date || null})}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeadlineDialog(false);
                setEditingStep(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (editingStep) {
                  const updateData = {
                    stepId: editingStep.id,
                    dueDate: editingStep.dueDate,
                  };
                  updateWorkflowStepMutation.mutate(updateData);
                  setShowDeadlineDialog(false);
                }
              }}
              disabled={updateWorkflowStepMutation.isPending}
            >
              {updateWorkflowStepMutation.isPending ? "Updating..." : "Update Deadline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={showUpdateStatusDialog} onOpenChange={setShowUpdateStatusDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
            <DialogDescription>
              Change the status of this workflow step.
            </DialogDescription>
          </DialogHeader>
          
          {editingStep && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="step-title-status" className="text-right">
                  Step
                </Label>
                <div className="col-span-3 font-medium">
                  {editingStep.title}
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select 
                  defaultValue={editingStep.status}
                  onValueChange={(value) => setEditingStep({...editingStep, status: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">In Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="progress" className="text-right">
                  Progress
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Slider 
                    id="progress"
                    defaultValue={[editingStep.progress]} 
                    max={100} 
                    step={5}
                    className="w-full"
                    onValueChange={(values) => setEditingStep({...editingStep, progress: values[0]})}
                  />
                  <span className="w-12 text-sm">{editingStep.progress}%</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowUpdateStatusDialog(false);
                setEditingStep(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (editingStep) {
                  const updateData = {
                    stepId: editingStep.id,
                    progress: editingStep.progress,
                    status: editingStep.status,
                  };
                  updateWorkflowStepMutation.mutate(updateData);
                  setShowUpdateStatusDialog(false);
                }
              }}
              disabled={updateWorkflowStepMutation.isPending}
            >
              {updateWorkflowStepMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>
              Add files related to "{selectedStep?.title || 'this step'}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <FileUpload 
              allowMultiple={true}
              onFilesSelected={(files: FileData[]) => {
                // Here you'd handle file upload to your server
                console.log("Selected files:", files);
                
                // Mock API request - in a real app, you'd upload these files
                setTimeout(() => {
                  toast({
                    title: "Files uploaded",
                    description: `${files.length} file(s) uploaded successfully`
                  });
                }, 1500);
              }}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedStep?.title} - Comments
            </DialogTitle>
            <DialogDescription>
              View and add comments for this step
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto mb-4 mt-2">
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <Textarea 
                  placeholder="Add a comment..." 
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  className="resize-none mb-2"
                />
                <div className="flex justify-between items-center">
                  <div className="text-xs text-slate-500">
                    {comments.length} comment{comments.length !== 1 ? 's' : ''}
                  </div>
                  <div>
                    {users && (
                      <Select defaultValue={users[0]?.id.toString()}>
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue placeholder="Posting as..." />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <Button 
                    size="sm" 
                    onClick={() => setShowCommentDialog(false)}
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleAddComment}
                    disabled={!selectedStep || !commentText.trim() || addCommentMutation.isPending}
                  >
                    {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </div>
              
              {comments.map(comment => (
                <div key={comment.id} className="p-3 bg-white border border-slate-200 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{comment.userId}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">
                        User {comment.userId}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDateRelative(comment.createdAt)}
                    </div>
                  </div>
                  <p className="text-sm">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
