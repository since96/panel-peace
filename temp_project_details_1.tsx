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
  type TalentProgressStatus
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
  useState(() => {
    if (project && !editing) {
      setProjectProgress(project.progress);
    }
  });

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
            
            {/* Quick Actions section removed per user request */}
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
              </CardContent>
            </Card>

            <div className="mt-6">
              <Tabs defaultValue="workflow">
                <TabsList className="w-full max-w-md">
                  <TabsTrigger value="workflow">Workflow</TabsTrigger>
                  <TabsTrigger value="feedback">Feedback</TabsTrigger>
                  <TabsTrigger value="assets">Assets</TabsTrigger>
                  <TabsTrigger value="team">Team</TabsTrigger>
                </TabsList>
                
                <TabsContent value="workflow" className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Comic Production Workflow</h2>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline"
                            onClick={() => initializeWorkflowMutation.mutate()}
                            disabled={initializeWorkflowMutation.isPending}
                          >
                            <ArrowRight className="h-4 w-4 mr-2" />
                            {initializeWorkflowMutation.isPending 
                              ? "Initializing..." 
                              : "Initialize Workflow"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Create workflow steps based on the project's configuration</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  {/* Timeline feasibility warning */}
                  {project && project.dueDate && workflowSteps && workflowSteps.length > 0 && (() => {
                    const productionStep = workflowSteps.find(step => step.stepType === 'production');
                    if (!productionStep || !productionStep.dueDate) return null;
                    
                    const projectDueDate = new Date(project.dueDate);
                    const calculatedEndDate = new Date(productionStep.dueDate);
                    
                    if (calculatedEndDate > projectDueDate) {
                      const daysLate = Math.ceil((calculatedEndDate.getTime() - projectDueDate.getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
                          <div className="flex">
                            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                            <div>
                              <h3 className="font-medium">Timeline Warning</h3>
                              <p className="text-sm mt-1">
                                Based on the current page count and production speeds, this project is scheduled to complete 
                                <strong> {daysLate} day{daysLate !== 1 ? 's' : ''} after </strong> 
                                the due date ({formatDate(projectDueDate)}).
                              </p>
                              <div className="flex mt-3 space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs bg-white"
                                  onClick={() => {
                                    setEditing(true);
                                    document.getElementById('project-due-date')?.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                >
                                  <CalendarIcon className="h-3 w-3 mr-1" />
                                  Adjust Deadline
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs bg-white"
                                  onClick={() => {
                                    if (workflowSteps && workflowSteps.length > 0) {
                                      if (confirm("Re-initializing will replace all existing workflow steps. Continue?")) {
                                        initializeWorkflowMutation.mutate();
                                      }
                                    } else {
                                      initializeWorkflowMutation.mutate();
                                    }
                                  }}
                                >
                                  <ArrowRight className="h-3 w-3 mr-1" />
                                  Re-initialize Workflow
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {isWorkflowLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="border border-slate-200 rounded-lg p-6 animate-pulse">
                          <div className="flex items-start">
                            <div className="mr-4">
                              <div className="h-8 w-8 rounded-full bg-slate-200"></div>
                            </div>
                            <div className="flex-1">
                              <div className="h-5 bg-slate-200 rounded w-1/3 mb-4"></div>
                              <div className="h-4 bg-slate-200 rounded w-2/3 mb-2"></div>
                              <div className="h-3 bg-slate-200 rounded w-full"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : workflowSteps && workflowSteps.length === 0 ? (
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-6 mb-6 text-center">
                      <div className="flex flex-col items-center">
                        <ArrowRight className="h-12 w-12 text-blue-500 mb-4" />
                        <h3 className="text-xl font-medium mb-2">Let's Get Started!</h3>
                        <p className="text-base mb-6">
                          Click "Initialize Workflow" to generate your comic's editorial schedule based on your project settings.
                        </p>
                        <Button 
                          size="lg"
                          onClick={() => initializeWorkflowMutation.mutate()}
                          disabled={initializeWorkflowMutation.isPending}
                        >
                          {initializeWorkflowMutation.isPending 
                            ? "Creating Schedule..." 
                            : "Initialize Workflow"}
                        </Button>
                      </div>
                    </div>
                  ) : workflowSteps && workflowSteps.length > 0 ? (
                    <div className="space-y-8">
                      {workflowSteps
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((step, index) => {
                          // Calculate dates and status
                          const daysUntil = step.dueDate ? calculateDaysUntil(step.dueDate) : null;
                          let progressStatus: TalentProgressStatus = 'on_time';
                          
                          if (step.stepType === 'pencils' && project.pencilerPagesPerWeek) {
                            progressStatus = getTalentProgressStatus({
                              totalPages: project.interiorPageCount,
                              completedPages: Math.floor((project.interiorPageCount * step.progress) / 100),
                              pagesPerWeek: project.pencilerPagesPerWeek,
                              startDate: step.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                              dueDate: step.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            });
                          } else if (step.stepType === 'inks' && project.inkerPagesPerWeek) {
                            progressStatus = getTalentProgressStatus({
                              totalPages: project.interiorPageCount,
                              completedPages: Math.floor((project.interiorPageCount * step.progress) / 100),
                              pagesPerWeek: project.inkerPagesPerWeek,
                              startDate: step.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                              dueDate: step.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            });
                          } else if (step.stepType === 'colors' && project.coloristPagesPerWeek) {
                            progressStatus = getTalentProgressStatus({
                              totalPages: project.interiorPageCount,
                              completedPages: Math.floor((project.interiorPageCount * step.progress) / 100),
                              pagesPerWeek: project.coloristPagesPerWeek,
                              startDate: step.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                              dueDate: step.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            });
                          } else if (step.stepType === 'letters' && project.lettererPagesPerWeek) {
                            progressStatus = getTalentProgressStatus({
                              totalPages: project.interiorPageCount,
                              completedPages: Math.floor((project.interiorPageCount * step.progress) / 100),
                              pagesPerWeek: project.lettererPagesPerWeek,
                              startDate: step.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                              dueDate: step.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            });
                          }
                          
                          const progressStatusColors = getTalentProgressStatusColor(progressStatus);
                          const statusColors = getStatusColor(step.status);
                          
                          return (
                            <Card key={step.id} className="relative overflow-hidden">
                              {/* Colored indicator strip on left edge */}
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${progressStatusColors.bg}`}></div>
                              
                              <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                  <div className="flex items-start gap-4">
                                    <div className={`mt-1 flex-shrink-0 rounded-full h-10 w-10 flex items-center justify-center ${progressStatusColors.bgLight}`}>
                                      {progressStatus === 'on_time' ? (
                                        <CheckCircle2 className={`h-5 w-5 ${progressStatusColors.text}`} />
                                      ) : (
                                        <AlertCircle className={`h-5 w-5 ${progressStatusColors.text}`} />
                                      )}
                                    </div>
                                    
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-medium">{step.title}</h3>
                                        <Badge className={`${statusColors.bgLight} ${statusColors.text}`}>
                                          {formatStatusLabel(step.status)}
                                        </Badge>
                                      </div>
                                      
                                      <p className="text-sm text-slate-500 mt-1">{step.description}</p>
                                      
                                      <div className="flex items-center gap-4 mt-4">
                                        <div className="flex items-center">
                                          <Clock className="h-4 w-4 text-slate-400 mr-1" />
                                          <span className="text-sm text-slate-600">
                                            {step.dueDate ? (
                                              <>Due {formatDate(step.dueDate)} ({daysUntil !== null ? `${daysUntil} days` : ''})</>
                                            ) : (
                                              'No due date set'
                                            )}
                                          </span>
                                        </div>
                                        
                                        <div className="flex items-center">
                                          <span className="text-sm text-slate-600">Progress: {step.progress}%</span>
                                        </div>
                                      </div>
                                      
                                      {/* Display assigned user information */}
                                      <div className="mt-3 flex items-center">
                                        <Users className="h-4 w-4 text-slate-400 mr-1" />
                                        <span className="text-sm text-slate-600">
                                          {step.assignedTo ? (
                                            <>
                                              Assigned to: {
                                                users?.find(user => user.id === step.assignedTo)?.username || 
                                                `User #${step.assignedTo}`
                                              }
                                            </>
                                          ) : (
                                            'Unassigned'
                                          )}
                                        </span>
                                      </div>
                                      
                                      {/* Display attached files */}
                                      {fileUploads && fileUploads.filter(file => file.workflowStepId === step.id).length > 0 && (
                                        <div className="mt-4 border-t pt-3">
                                          <h4 className="text-sm font-medium mb-2 flex items-center">
                                            <FileText className="h-4 w-4 mr-1 text-slate-400" />
                                            Attached Files
                                          </h4>
                                          <div className="grid grid-cols-1 gap-2">
                                            {fileUploads
                                              .filter(file => file.workflowStepId === step.id)
                                              .map(file => (
                                                <div key={file.id} className="bg-slate-50 p-2 rounded text-sm flex items-center justify-between">
                                                  <div className="flex items-center overflow-hidden flex-1">
                                                    <a 
                                                      href={file.filePath} 
                                                      target="_blank" 
                                                      rel="noopener noreferrer"
                                                      className="font-medium truncate mr-2 text-primary hover:text-primary/80 hover:underline flex items-center flex-1"
                                                    >
                                                      <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                                                      <span className="truncate">{file.fileName}</span>
                                                    </a>
                                                    <Badge variant="outline" className="ml-1 flex-shrink-0">
                                                      {file.fileType || 'File'}
                                                    </Badge>
                                                  </div>
                                                </div>
                                              ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex-none">
                                    <div className="flex flex-col items-end gap-2">
                                      <div className="grid grid-cols-3 gap-2 w-full">
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => {
                                            setEditingStep(step);
                                            setShowUpdateStatusDialog(true);
                                          }}
                                          className="flex items-center justify-center w-full"
                                        >
                                          <CheckCircle2 className="h-4 w-4 mr-2" />
                                          Update Status
                                        </Button>
                                        

                                        
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => {
                                            setEditingStep(step);
                                            setShowDeadlineDialog(true);
                                          }}
                                          className="flex items-center justify-center w-full"
                                        >
                                          <CalendarIcon className="h-4 w-4 mr-2" />
                                          Adjust Deadline
                                        </Button>
                                        
                                        <Button 
                                          size="sm"
                                          onClick={() => {
                                            setSelectedStep(step);
                                            setShowUploadDialog(true);
                                          }}
                                          className="flex items-center justify-center w-full"
                                        >
                                          <Plus className="h-4 w-4 mr-2" />
                                          Upload Files
                                        </Button>
                                        
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
                                      />
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-6 flex flex-col items-center justify-center text-center">
                        <div className="text-3xl text-slate-300 mb-2">
                          <i className="ri-flow-chart"></i>
                        </div>
                        <h3 className="text-lg font-medium text-slate-600 mb-1">No workflow steps defined</h3>
                        <p className="text-sm text-slate-500 mb-4">Initialize the workflow to create steps based on your project configuration</p>
                        <Button
                          onClick={() => initializeWorkflowMutation.mutate()}
                          disabled={initializeWorkflowMutation.isPending}
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          {initializeWorkflowMutation.isPending 
                            ? "Initializing..." 
                            : "Initialize Workflow"}
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="feedback" className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Feedback Items</h2>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Feedback
                    </Button>
                  </div>

                  {isFeedbackLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="border border-slate-200 rounded-lg p-4 animate-pulse">
                          <div className="flex items-start">
                            <div className="w-16 h-16 bg-slate-200 rounded-md mr-3"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                              <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                              <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : feedbackItems && feedbackItems.length > 0 ? (
                    <div className="space-y-4">
                      {feedbackItems.map((feedback) => (
                        <FeedbackItemCard
                          key={feedback.id}
                          feedback={feedback}
                          requester={getRequesterForFeedback(feedback.requestedBy)}
                        />
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-6 flex flex-col items-center justify-center text-center">
                        <div className="text-3xl text-slate-300 mb-2">
                          <i className="ri-chat-check-line"></i>
                        </div>
                        <h3 className="text-lg font-medium text-slate-600 mb-1">No feedback items yet</h3>
                        <p className="text-sm text-slate-500 mb-4">Create your first feedback item to start collaborating</p>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Feedback Item
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="assets" className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Project Assets</h2>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Upload Asset
                    </Button>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Upload New Asset</CardTitle>
                      <CardDescription>Add artwork, scripts, or other files to your project</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FileUpload 
                        allowedTypes={['image/*', 'application/pdf', 'text/*']}
                        multiple={true}
                        maxSize={20}
                      />
                    </CardContent>
                  </Card>

                  {isAssetsLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-lg shadow-sm animate-pulse">
                          <div className="h-40 bg-slate-200"></div>
                          <div className="p-3 space-y-2">
                            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : assets && assets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                      {assets.map((asset) => (
                        <Card key={asset.id} className="overflow-hidden">
                          <div className="h-40 bg-slate-100 flex items-center justify-center border-b">
                            {asset.type.startsWith('image/') ? (
                              <div className="text-5xl text-slate-300">
                                <i className="ri-image-line"></i>
                              </div>
                            ) : asset.type === 'application/pdf' || asset.type.startsWith('text/') ? (
                              <div className="text-5xl text-slate-300">
                                <i className="ri-file-text-line"></i>
                              </div>
                            ) : (
                              <div className="text-5xl text-slate-300">
                                <i className="ri-file-line"></i>
                              </div>
                            )}
                          </div>
                          <CardContent className="p-3">
                            <h3 className="font-medium text-sm truncate">{asset.name}</h3>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatDate(asset.updatedAt)}
                            </p>
                            <div className="flex mt-2 justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-6 py-12 flex flex-col items-center justify-center text-center bg-white rounded-xl shadow-sm">
                      <div className="text-4xl text-slate-300 mb-3">
                        <i className="ri-file-upload-line"></i>
                      </div>
                      <h3 className="text-lg font-medium text-slate-600 mb-1">No assets uploaded yet</h3>
                      <p className="text-sm text-slate-500 mb-4">
                        Upload artwork, scripts, and other files to your project
                      </p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="team" className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Project Team</h2>
                    <Button>
                      <Users className="h-4 w-4 mr-2" />
                      Manage Team
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sampleCollaborators.map((collaborator) => (
                      <Card key={collaborator.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start">
                            <Avatar className="h-12 w-12 mr-4">
                              <AvatarImage src={collaborator.avatarUrl} alt={collaborator.name} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {collaborator.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium text-slate-900">{collaborator.name}</h3>
                                <Badge variant="outline">{collaborator.role}</Badge>
                              </div>
                              <p className="text-sm text-slate-500 mt-1">
                                {collaborator.role === "Editor" ? "Project owner and coordinator" : 
                                 collaborator.role === "Writer" ? "Responsible for script and story" : 
                                 "Creating artwork and panel layouts"}
                              </p>
                              <div className="flex mt-3 gap-2">
                                <Button size="sm" variant="outline" className="h-8">
                                  <MessageCircle className="h-3.5 w-3.5 mr-1" />
                                  Message
                                </Button>
                                <Button size="sm" variant="outline" className="h-8">
                                  <FileText className="h-3.5 w-3.5 mr-1" />
                                  View Work
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <Card className="border-dashed border-2 border-slate-200">
                      <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                        <Users className="h-8 w-8 text-slate-400 mb-2" />
                        <h3 className="font-medium text-slate-700 mb-1">Add Team Member</h3>
                        <p className="text-sm text-slate-500 mb-3">
                          Invite writers, artists, or other collaborators
                        </p>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Collaborator
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Upcoming Deadlines card removed per user request */}
            
            <Card>
              <CardHeader>
                <CardTitle>Project Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative pl-6 pb-4 border-l border-slate-200">
                    <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-primary"></div>
                    <p className="text-sm font-medium">Script updated</p>
                    <p className="text-xs text-slate-500">Sarah L. • 2 hours ago</p>
                  </div>
                  
                  <div className="relative pl-6 pb-4 border-l border-slate-200">
                    <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-accent"></div>
                    <p className="text-sm font-medium">New artwork uploaded</p>
                    <p className="text-xs text-slate-500">James K. • 5 hours ago</p>
                  </div>
                  
                  <div className="relative pl-6 pb-4 border-l border-slate-200">
                    <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-secondary"></div>
                    <p className="text-sm font-medium">Feedback provided</p>
                    <p className="text-xs text-slate-500">Alex R. • Yesterday</p>
                  </div>
                  
                  <div className="relative pl-6">
                    <div className="absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full bg-warning"></div>
                    <p className="text-sm font-medium">Deadline added</p>
                    <p className="text-xs text-slate-500">Alex R. • Yesterday</p>
                  </div>
                </div>
                
                <Button variant="ghost" className="w-full mt-4 text-sm text-primary">
                  View All Activity
                </Button>
              </CardContent>
            </Card>
            

          </div>
        </div>
      </div>

