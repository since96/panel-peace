// Create a basic fixed version that we can improve later
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Project, FeedbackItem, Deadline, Collaborator, Asset, WorkflowStep, User, Comment } from '@shared/schema';
import { useHasEditAccess } from '@/hooks/useHasEditAccess';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Pencil, Pencil as PencilIcon, Trash2, Clock, Users, FileText, Book, Plus, Calendar as CalendarIcon, MessageCircle, MessageSquare, CheckCircle2, AlertCircle, ArrowRight, AlertTriangle, X, ExternalLink, Upload, Link as LinkIcon, CheckCircle, UserPlus, Check, Info } from 'lucide-react';
import { FeedbackItemCard } from '@/components/ui/custom/feedback-item';
import { DeadlineItem } from '@/components/ui/custom/deadline-item';
import { CompletionTracker } from '@/components/ui/custom/completion-tracker';
import ProjectEditors from '@/components/project/project-editors';
import { ExportButtons } from '@/components/project/export-buttons';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
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

import { Helmet } from 'react-helmet-async';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [projectProgress, setProjectProgress] = useState<number>(0);
  const [editing, setEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingMetrics, setEditingMetrics] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const hasEditAccess = useHasEditAccess();
  // Adding assignees array to the editingStep
  const [editingStep, setEditingStep] = useState<(WorkflowStep & { assignees?: string[] }) | null>(null);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [showUpdateStatusDialog, setShowUpdateStatusDialog] = useState(false);
  const [showDeadlineDialog, setShowDeadlineDialog] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showTrackerDialog, setShowTrackerDialog] = useState(false);
  const [showFileLinkDialog, setShowFileLinkDialog] = useState(false);
  const [selectedStepForTalent, setSelectedStepForTalent] = useState<WorkflowStep | null>(null);
  const [selectedStepForTracker, setSelectedStepForTracker] = useState<WorkflowStep | null>(null);
  const [commentText, setCommentText] = useState('');
  const [newFileLink, setNewFileLink] = useState('');
  const [selectedWorkflowStepForLink, setSelectedWorkflowStepForLink] = useState<number | null>(null);
  
  // The comments we'll fetch from the API
  const [comments, setComments] = useState<Comment[]>([]);
  
  // File links state
  const [fileLinks, setFileLinks] = useState<any[]>([]);
  
  // Map to store file links by workflow step ID
  const [fileLinksMap, setFileLinksMap] = useState<Record<number, any[]>>({});


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
    enabled: !!id
  });
  
  // Fetch file links for workflow steps
  useEffect(() => {
    async function fetchFileLinks() {
      if (!workflowSteps || workflowSteps.length === 0) return;
      
      const linksMap: Record<number, any[]> = {};
      
      // Fetch links for each workflow step
      for (const step of workflowSteps) {
        try {
          const response = await fetch(`/api/workflow-steps/${step.id}/file-links`);
          if (response.ok) {
            const links = await response.json();
            linksMap[step.id] = links;
          }
        } catch (error) {
          console.error(`Error fetching links for step ${step.id}:`, error);
        }
      }
      
      setFileLinksMap(linksMap);
    }
    
    fetchFileLinks();
  }, [workflowSteps]);

  // Use an effect to check schedule feasibility whenever workflow steps or project changes
  useEffect(() => {
    if (workflowSteps && workflowSteps.length > 0 && project?.dueDate) {
      // Check if the last step (production) is scheduled after the project due date
      const lastStep = workflowSteps[workflowSteps.length - 1];
      if (lastStep?.dueDate) {
        const productionEndDate = new Date(lastStep.dueDate);
        const projectDueDate = new Date(project.dueDate);
        
        if (productionEndDate > projectDueDate) {
          setScheduleFeasible(false);
        } else {
          setScheduleFeasible(true);
        }
      }
    }
  }, [workflowSteps, project]);
  

  

  
  // Query file links for a selected step when dialog opens
  const { 
    data: stepFileLinks, 
    isLoading: isFileLinksLoading,
    refetch: refetchFileLinks 
  } = useQuery<any[]>({
    queryKey: ['/api/workflow-steps', selectedStepForTracker?.id, 'file-links'],
    queryFn: async () => {
      if (!selectedStepForTracker?.id) return [];
      const res = await apiRequest('GET', `/api/workflow-steps/${selectedStepForTracker.id}/file-links`);
      return res.json();
    },
    enabled: !!selectedStepForTracker?.id,
  });
  
  

  // Handle adding a comment
  const handleAddComment = () => {
    if (!selectedStep || !commentText.trim()) return;
    
    // Get current user from local storage
    const currentUser = localStorage.getItem('user') 
      ? JSON.parse(localStorage.getItem('user') || '{}')
      : null;
    
    if (!currentUser) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to add comments",
        variant: "destructive"
      });
      return;
    }
    
    // Create and post the comment
    addCommentMutation.mutate({
      content: commentText,
      feedbackId: selectedStep.id, // Using step ID since we're attaching to a workflow step
      userId: currentUser.id
    });
  };

  // Get all users to display in talent assignment dropdown
  const { data: users, isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: !!id,
  });
  
  // Get project editors for export functionality
  const { data: projectEditors, isLoading: isProjectEditorsLoading } = useQuery<any[]>({
    queryKey: [`/api/projects/${id}/editors`],
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
      if (!hasEditAccess) {
        throw new Error("You don't have permission to add comments");
      }
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
  
  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      if (!hasEditAccess) {
        throw new Error("You don't have permission to delete comments");
      }
      const res = await apiRequest("DELETE", `/api/comments/${commentId}`);
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Comment deleted",
        description: "The comment has been removed successfully"
      });
      // Comments will be refetched in onSettled
    },
    onError: (error) => {
      toast({
        title: "Failed to delete comment",
        description: error.message || "An error occurred while deleting the comment",
        variant: "destructive"
      });
    },
    onSettled: () => {
      // Refetch comments after deletion attempt (success or failure)
      if (selectedStep) {
        fetchComments(selectedStep.id);
      }
    }
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (updateData: { 
      id: number; 
      dueDate?: Date; 
      progress?: number; 
      status?: string; 
      title?: string;
      interiorPageCount?: number;
      coverCount?: number;
      fillerPageCount?: number;
      issue?: string;
    }) => {
      if (!hasEditAccess) {
        throw new Error("You don't have permission to edit projects");
      }
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
  
  const [scheduleFeasible, setScheduleFeasible] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Mutation for updating workflow step progress
  const updateStepProgressMutation = useMutation({
    mutationFn: async ({ stepId, progress }: { stepId: number, progress: number }) => {
      if (!hasEditAccess) {
        throw new Error("You don't have permission to update workflow steps");
      }
      const res = await apiRequest("PATCH", `/api/workflow-steps/${stepId}`, {
        progress
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Progress updated",
        description: "Workflow step progress has been updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}/workflow-steps`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update progress",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Mutation for deleting the project
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      if (!hasEditAccess) {
        throw new Error("You don't have permission to delete projects");
      }
      // Get the current user ID (in a real app, this would come from auth context)
      // Using admin (1) as the default
      const currentUserId = 1; 
      await apiRequest("DELETE", `/api/projects/${projectId}?userId=${currentUserId}`);
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Project deleted",
        description: "Project has been deleted successfully"
      });
      navigate('/projects');
    },
    onError: (error) => {
      toast({
        title: "Failed to delete project",
        description: error.message || "You don't have permission to delete this project",
        variant: "destructive"
      });
    }
  });
  
  // Mutation for adding file links
  const addFileLinkMutation = useMutation({
    mutationFn: async ({ 
      stepId, 
      url, 
      description 
    }: { 
      stepId: number, 
      url: string, 
      description?: string 
    }) => {
      if (!hasEditAccess) {
        throw new Error("You don't have permission to add file links");
      }
      const res = await apiRequest("POST", `/api/workflow-steps/${stepId}/file-links`, {
        url,
        description,
        addedBy: 1 // Current user (admin)
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Link added",
        description: "File link has been added successfully"
      });
      refetchFileLinks();
    },
    onError: (error) => {
      toast({
        title: "Failed to add link",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const initializeWorkflowMutation = useMutation({
    mutationFn: async () => {
      if (!hasEditAccess) {
        throw new Error("You don't have permission to initialize workflow");
      }
      const res = await apiRequest("POST", `/api/projects/${id}/initialize-workflow`, {});
      const data = await res.json();
      
      // Check feasibility after getting new data
      return data;
    },
    onSuccess: (data) => {
      // We need to get fresh data after initialization
      if (data && data.length > 0 && project?.dueDate) {
        const lastWorkflowStep = data[data.length - 1];
        const productionEndDate = lastWorkflowStep?.dueDate ? new Date(lastWorkflowStep.dueDate) : null;
        const projectDueDate = new Date(project.dueDate);
        
        const isFeasible = !productionEndDate || productionEndDate <= projectDueDate;
        setScheduleFeasible(isFeasible);
        
        if (!isFeasible) {
          toast({
            title: "Warning: Unrealistic Schedule",
            description: "The calculated completion date is later than your project due date. Consider adjusting the schedule or due date.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Workflow initialized",
            description: "Comic production workflow has been set up successfully"
          });
        }
      } else {
        toast({
          title: "Workflow initialized",
          description: "Comic production workflow has been set up successfully"
        });
        setScheduleFeasible(true);
      }
      
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
  
  // Mutation already defined above
  
  const updateWorkflowStepMutation = useMutation({
    mutationFn: async (data: {
      stepId: number;
      progress?: number;
      status?: string;
      dueDate?: Date | null;
      description?: string | null;
      assignedTo?: number | null;
      assignees?: string[];
    }) => {
      if (!hasEditAccess) {
        throw new Error("You don't have permission to update workflow steps");
      }
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

  // Updates overall project progress
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
  
  // Updates individual step progress from the tracker dialog
  const handleStepProgressUpdate = (progress: number) => {
    if (selectedStepForTracker) {
      updateStepProgressMutation.mutate({
        stepId: selectedStepForTracker.id,
        progress
      });
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
        <title>{`${editingTitle ? editedTitle : project.title} ${project.issue} - Panel Peace`}</title>
        <meta name="description" content={`Manage and collaborate on ${editingTitle ? editedTitle : project.title} ${project.issue}. View progress, feedback, and assets for this comic book project.`} />
      </Helmet>
      
      {!hasEditAccess && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 max-w-7xl mx-auto">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">View-only access:</span> You can see all details but cannot make changes to this project.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" className="p-0 h-auto" onClick={() => navigate('/projects')}>
              <span className="text-primary text-sm">Projects</span>
            </Button>
            <span className="text-slate-400">/</span>
            <span className="text-sm">{editingTitle ? editedTitle : project.title} {project.issue}</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                {!editingTitle ? (
                  <h1 
                    className={`text-2xl font-bold text-slate-900 ${hasEditAccess ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (hasEditAccess) {
                        setEditingTitle(true);
                        setEditedTitle(project.title);
                      }
                    }}
                    title={hasEditAccess ? "Click to edit title" : "View-only access"}
                  >
                    {project.title} {project.issue}
                  </h1>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="text-xl font-bold h-10 w-[300px]"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updateProjectMutation.mutate({
                            id: project.id,
                            title: editedTitle
                          });
                          setEditingTitle(false);
                        } else if (e.key === 'Escape') {
                          setEditingTitle(false);
                          setEditedTitle(project.title);
                        }
                      }}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => {
                        updateProjectMutation.mutate({
                          id: project.id,
                          title: editedTitle
                        });
                        setEditingTitle(false);
                      }}
                    >
                      Save
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setEditingTitle(false);
                        setEditedTitle(project.title);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                {!editing ? (
                  <Badge 
                    className={`${statusColors.bgLight} ${statusColors.text} ${hasEditAccess ? 'cursor-pointer' : ''}`}
                    onClick={() => hasEditAccess && setEditing(true)}
                    title={!hasEditAccess ? "View-only access" : "Click to change status"}
                  >
                    {formatStatusLabel(project.status)}
                  </Badge>
                ) : (
                  <Select
                    defaultValue={project.status}
                    onValueChange={(value) => {
                      updateProjectMutation.mutate({
                        id: project.id,
                        status: value
                      });
                    }}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="needs_review">Needs Review</SelectItem>
                      <SelectItem value="delayed">Delayed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <p className="text-slate-500 mt-1">{project.description}</p>
            </div>
            <div className="flex gap-2">
              {hasEditAccess && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setEditing(!editing)}
                >
                  {editing ? 'Cancel Edit' : 'Edit Project'}
                </Button>
              )}
              {project && !isProjectEditorsLoading && workflowSteps && (
                <ExportButtons 
                  project={{
                    ...project, 
                    workflowSteps: workflowSteps.map(step => ({
                      ...step,
                      // Include both primary assignee and collaborators in the team info
                      team: [
                        ...(step.assignedTo ? [users?.find(u => u.id === step.assignedTo)] : []),
                        ...(step.assignees?.map(id => users?.find(u => u.id.toString() === id)) || [])
                      ].filter(Boolean)
                    }))
                  }} 
                  collaborators={projectEditors || []} 
                />
              )}
              {hasEditAccess && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Project
              </Button>
              )}
            </div>
          </div>
        </div>

        {!hasEditAccess && (
          <div className="bg-amber-100 text-amber-700 p-3 rounded-md mt-4 mb-2 text-sm flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
            <p>You have view-only access to this project. You can see all information but cannot make changes.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div>
                    <CardTitle>Project Overview</CardTitle>
                    <CardDescription>
                      Track progress and manage comic book assets
                    </CardDescription>
                  </div>
                  {project.studioName && (
                    <Badge variant="outline" className="mt-2 sm:mt-0 text-sm px-3 py-1">
                      Bullpen: {project.studioName}
                    </Badge>
                  )}
                </div>
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

                {/* Project File Links section */}
                <div className="mt-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-medium">File References</CardTitle>
                          <CardDescription>
                            Add links to external files for reference
                          </CardDescription>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="gap-1"
                          onClick={() => {
                            // Show dialog to add new file link for project-wide reference
                            setShowFileLinkDialog(true);
                          }}
                          disabled={!hasEditAccess}
                          title={!hasEditAccess ? "View-only access" : "Add a file link"}
                        >
                          <LinkIcon className="h-4 w-4" />
                          Add Link
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {Object.values(fileLinksMap).flat().length > 0 ? (
                        <div className="space-y-2">
                          {Object.entries(fileLinksMap).map(([stepId, links]) => 
                            links.map(link => (
                              <div key={link.id} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-md">
                                <div className="flex items-center gap-2">
                                  <LinkIcon className="h-4 w-4 text-blue-500" />
                                  <div>
                                    <a 
                                      href={link.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-500 hover:underline text-sm font-medium"
                                    >
                                      Click for attached file
                                    </a>
                                    <div className="text-xs text-slate-500">
                                      {/* Find the workflow step name for this link */}
                                      {workflowSteps?.find(step => step.id === parseInt(stepId))?.title || 'Project File'}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 text-slate-500 hover:text-blue-600 rounded-md hover:bg-slate-100"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-1 h-auto text-slate-500 hover:text-red-600 rounded-md hover:bg-slate-100"
                                    disabled={!hasEditAccess}
                                    title={!hasEditAccess ? "View-only access" : "Delete link"}
                                    onClick={() => {
                                      // Delete file link
                                      fetch(`/api/file-links/${link.id}`, {
                                        method: 'DELETE'
                                      }).then(response => {
                                        if (response.ok) {
                                          // Remove from UI
                                          const updatedMap = {...fileLinksMap};
                                          updatedMap[parseInt(stepId)] = updatedMap[parseInt(stepId)].filter(l => l.id !== link.id);
                                          setFileLinksMap(updatedMap);
                                          toast({
                                            title: "Link removed",
                                            description: "File link has been removed successfully"
                                          });
                                        }
                                      }).catch(error => {
                                        toast({
                                          title: "Failed to remove link",
                                          description: error.message,
                                          variant: "destructive"
                                        });
                                      });
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500">
                          <div className="flex justify-center mb-3">
                            <LinkIcon className="h-10 w-10 text-slate-300" />
                          </div>
                          <p className="mb-2">No file links added yet</p>
                          <p className="text-sm">
                            Add links to external files such as Dropbox, Google Drive, or other cloud storage
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Workflow section */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Comic Workflow</h3>
                    
                    {workflowSteps && workflowSteps.length === 0 && hasEditAccess && (
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
                  
                  {!scheduleFeasible && workflowSteps && workflowSteps.length > 0 && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-red-800 mb-1">Schedule Warning</h4>
                        <p className="text-sm text-red-700">
                          The calculated completion date is <strong>after</strong> your project due date. 
                          This schedule is not realistic with your current parameters.
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="bg-white border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setEditing(true);
                            }}
                            disabled={!hasEditAccess}
                            title={!hasEditAccess ? "View-only access" : "Adjust the project due date"}
                          >
                            Adjust Project Due Date
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="bg-white border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() => {
                              initializeWorkflowMutation.mutate();
                            }}
                            disabled={!hasEditAccess}
                            title={!hasEditAccess ? "View-only access" : "Recalculate the project schedule"}
                          >
                            Recalculate Schedule
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
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
                          // Determine progress status based on due date and progress
                          const daysUntil = calculateDaysUntil(step.dueDate);
                          if (daysUntil < 0) {
                            // Past due date
                            progressStatus = 'behind_schedule';
                          } else if (daysUntil === 0 || daysUntil === 1) {
                            // Due today or tomorrow
                            progressStatus = step.progress >= 90 ? 'on_time' : 'one_day_late'; 
                          } else {
                            // Not yet due
                            const expectedProgress = Math.max(0, 100 - (daysUntil * 5));
                            if (step.progress < expectedProgress - 20) {
                              progressStatus = 'behind_schedule';
                            } else if (step.progress < expectedProgress - 10) {
                              progressStatus = 'one_day_late';
                            }
                          }
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
                                      <Badge 
                                        variant="outline" 
                                        className={`ml-2 ${
                                          step.status === 'completed' ? 'bg-green-50 border-green-200 text-green-700' :
                                          step.status === 'in_progress' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                          step.status === 'delayed' ? 'bg-red-50 border-red-200 text-red-700' :
                                          step.status === 'needs_review' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                          'bg-slate-50 border-slate-200 text-slate-700'
                                        }`}
                                      >
                                        {step.status === 'not_started' && step.progress > 0 
                                          ? `${step.progress}% Complete` 
                                          : step.status === 'not_started' 
                                            ? '0% Complete' 
                                            : formatStatusLabel(step.status)}
                                      </Badge>
                                    </div>
                                    
                                    {step.dueDate && (
                                      <div className="flex items-center text-sm">
                                        <CalendarIcon className={`h-3.5 w-3.5 mr-1 ${progressStatusColors.text}`} />
                                        <span className={progressStatusColors.text}>
                                          <strong>{formatDate(step.dueDate)}</strong> ({formatDateRelative(step.dueDate)})
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* Show assigned users */}
                                    {(step.assignedTo || (step.assignees && step.assignees.length > 0)) && users && (
                                      <div className="flex items-center text-sm">
                                        <Users className="h-3.5 w-3.5 mr-1 text-slate-400" />
                                        {step.assignedTo && (
                                          <span className="mr-1">
                                            {users.find(u => u.id === step.assignedTo)?.fullName || 
                                             users.find(u => u.id === step.assignedTo)?.username || 'Unknown'}
                                            {step.assignees && step.assignees.length > 0 && ", "}
                                          </span>
                                        )}
                                        
                                        {step.assignees && step.assignees.length > 0 && (
                                          <span className="text-sm">
                                            {step.assignees.length === 1 && !step.assignedTo ? (
                                              // Show single collaborator
                                              users.find(u => u.id.toString() === step.assignees?.[0])?.fullName || 
                                              users.find(u => u.id.toString() === step.assignees?.[0])?.username || 'Unknown'
                                            ) : step.assignees.length > 0 ? (
                                              // Show "and X more" if there are multiple assignees
                                              `${step.assignees.length > 1 && step.assignedTo ? `+${step.assignees.length}` : 
                                                !step.assignedTo ? 
                                                  users.find(u => u.id.toString() === step.assignees?.[0])?.fullName || 
                                                  users.find(u => u.id.toString() === step.assignees?.[0])?.username : ''} 
                                               ${step.assignees.length > 1 ? 'collaborators' : 'collaborator'}`
                                            ) : ''}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {step.description && (
                                    <p className="text-sm text-slate-500 mt-1">
                                      {step.description}
                                    </p>
                                  )}
                                  
                                  {/* Display file links */}
                                  {fileLinksMap[step.id] && fileLinksMap[step.id].length > 0 && (
                                    <div className="mt-2">
                                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                        <LinkIcon className="h-3.5 w-3.5" />
                                        <span>Attached Files ({fileLinksMap[step.id].length})</span>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {fileLinksMap[step.id].map((link) => (
                                          <a 
                                            key={link.id}
                                            href={link.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100 hover:bg-blue-100"
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                            <span className="truncate max-w-[120px]">
                                              Click for attached file
                                            </span>
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="flex-none">
                                    <div className="flex flex-col items-end gap-2">
                                      <div className="grid grid-cols-2 gap-2 w-full mb-2">
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button 
                                                size="sm"
                                                variant="outline"
                                                className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
                                                onClick={() => {
                                                  // Always ensure assignees is an array, not null
                                                  setEditingStep({
                                                    ...step,
                                                    assignees: step.assignees || []
                                                  });
                                                  setShowAssignDialog(true);
                                                }}
                                              >
                                                <Users className="h-4 w-4 mr-2" />
                                                Assign Talent
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Assign team member to this step</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                        
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button 
                                                size="sm"
                                                variant="outline"
                                                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                                                onClick={() => {
                                                  // Always ensure assignees is an array, not null
                                                  setEditingStep({
                                                    ...step,
                                                    assignees: step.assignees || []
                                                  });
                                                  setShowDeadlineDialog(true);
                                                }}
                                              >
                                                <CalendarIcon className="h-4 w-4 mr-2" />
                                                Adjust Deadline
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Adjust deadline for this step</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button 
                                                size="sm"
                                                variant="outline"
                                                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800"
                                                onClick={() => {
                                                  // Always ensure assignees is an array, not null
                                                  setSelectedStepForTracker({
                                                    ...step,
                                                    assignees: step.assignees || []
                                                  });
                                                  setShowTrackerDialog(true);
                                                }}
                                                disabled={!hasEditAccess}
                                                title={!hasEditAccess ? "View-only access" : "Track progress for this step"}
                                              >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Track Progress
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Update completion percentage and add file links</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-2 w-full">
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button 
                                                size="sm"
                                                variant="outline"
                                                className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
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
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>View and add comments</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                        

                                      </div>
                                      
                                      <div className="w-full flex items-center justify-between my-2">
                                        <div className="flex items-center gap-2">
                                          <span className={`font-medium text-sm ${progressStatusColors.text}`}>
                                            {
                                              step.stepType === 'plot_development' || step.stepType === 'script'
                                                ? step.progress >= 100 ? 'Completed' : 'In Progress'
                                                : `${step.progress}% Complete`
                                            }
                                          </span>
                                          {step.progress < 100 && (
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    className={`h-6 px-2 py-1 ${progressStatusColors.bgLight} ${progressStatusColors.text} border-none ml-2`}
                                                    onClick={() => {
                                                      setSelectedStepForTracker(step);
                                                      setShowTrackerDialog(true);
                                                    }}
                                                  >
                                                    <Check className="h-3 w-3 mr-1" />
                                                    Update
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p>Update progress</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          )}
                                        </div>
                                        <div className="flex items-center w-full max-w-[150px]">
                                          <Progress 
                                            value={step.progress} 
                                            className="h-3 w-full rounded-full" 
                                            indicatorClassName={progressStatusColors.bg}
                                          />
                                        </div>
                                      </div>
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
                      {hasEditAccess ? (
                        <Button 
                          onClick={() => initializeWorkflowMutation.mutate()}
                          disabled={initializeWorkflowMutation.isPending}
                        >
                          {initializeWorkflowMutation.isPending ? 'Initializing...' : 'Initialize Workflow'}
                        </Button>
                      ) : (
                        <div className="px-4 py-3 rounded-md bg-slate-100 text-slate-600 text-sm max-w-md mx-auto">
                          <Info className="h-4 w-4 inline mr-2" />
                          You have view-only access to this project. Contact an editor with edit privileges to initialize the workflow.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
          </div>
          
          {/* Right sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Comic Book Details */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium">Comic Details</CardTitle>
                  {hasEditAccess && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-8 w-8 p-0 text-slate-500"
                      onClick={() => setEditingMetrics(!editingMetrics)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingMetrics ? (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const data = {
                      id: parseInt(id as string),
                      interiorPageCount: parseInt(formData.get('interiorPageCount') as string),
                      coverCount: parseInt(formData.get('coverCount') as string),
                      fillerPageCount: parseInt(formData.get('fillerPageCount') as string),
                      issue: formData.get('issue') as string,
                    };
                    
                    // Update project and trigger workflow reinitialization
                    updateProjectMutation.mutate(data, {
                      onSuccess: () => {
                        // Ask if they want to reinitialize workflow steps
                        if (workflowSteps && workflowSteps.length > 0) {
                          const reinitialize = confirm(
                            "Would you like to reinitialize the workflow steps to reflect the new page counts? " +
                            "This will update step descriptions but preserve progress, comments, and assignments."
                          );
                          if (reinitialize) {
                            initializeWorkflowMutation.mutate();
                          }
                        }
                        setEditingMetrics(false);
                      }
                    });
                  }}>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="interiorPageCount">Interior Pages</Label>
                        <Input
                          id="interiorPageCount"
                          name="interiorPageCount"
                          type="number"
                          defaultValue={project?.interiorPageCount || 0}
                          min={0}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="coverCount">Cover Count</Label>
                        <Input
                          id="coverCount"
                          name="coverCount"
                          type="number"
                          defaultValue={project?.coverCount || 0}
                          min={0}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="fillerPageCount">Filler Pages</Label>
                        <Input
                          id="fillerPageCount"
                          name="fillerPageCount"
                          type="number"
                          defaultValue={project?.fillerPageCount || 0}
                          min={0}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="issue">Issue Number</Label>
                        <Input
                          id="issue"
                          name="issue"
                          defaultValue={project?.issue || ""}
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingMetrics(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" size="sm">Save</Button>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <div className="text-muted-foreground">Interior Pages:</div>
                      <div className="font-medium">{project?.interiorPageCount || 0}</div>
                      
                      <div className="text-muted-foreground">Cover Count:</div>
                      <div className="font-medium">{project?.coverCount || 0}</div>
                      
                      <div className="text-muted-foreground">Filler Pages:</div>
                      <div className="font-medium">{project?.fillerPageCount || 0}</div>
                      
                      <div className="text-muted-foreground">Total Pages:</div>
                      <div className="font-medium">
                        {(project?.interiorPageCount || 0) + (project?.fillerPageCount || 0)}
                      </div>
                      
                      {project?.issue && (
                        <>
                          <div className="text-muted-foreground">Issue Number:</div>
                          <div className="font-medium">{project?.issue}</div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <ProjectEditors 
              projectId={Number(id)} 
              currentUserId={DEFAULT_USER_ID}
              userRole={project?.createdBy === DEFAULT_USER_ID ? 'editor_in_chief' : 'editor'} 
            />
          </div>
        </div>
      </div>
      
      {/* Progress Tracker Dialog */}
      <Dialog open={showTrackerDialog} onOpenChange={setShowTrackerDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
            <DialogDescription>
              {selectedStepForTracker && `Track completion for ${selectedStepForTracker.title}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedStepForTracker && (
            <div>
              {hasEditAccess ? (
                <CompletionTracker 
                  key={`tracker-${selectedStepForTracker.id}-${project?.interiorPageCount || 0}`}
                  stepId={selectedStepForTracker.id}
                  stepType={selectedStepForTracker.stepType}
                  currentProgress={selectedStepForTracker.progress}
                  totalCount={selectedStepForTracker.stepType.includes('pencil') || 
                              selectedStepForTracker.stepType.includes('ink') || 
                              selectedStepForTracker.stepType.includes('color') ||
                              selectedStepForTracker.stepType.includes('letter') ? 
                              (project?.interiorPageCount || 22) : 1}
                  onProgressUpdate={handleStepProgressUpdate}
                />
              ) : (
                <div className="p-4 mb-4 bg-slate-100 rounded-md">
                  <div className="flex items-center mb-2">
                    <Info className="h-4 w-4 text-slate-600 mr-2" />
                    <p className="text-sm text-slate-600 font-medium">View-only access</p>
                  </div>
                  <p className="text-sm text-slate-600">
                    You can only view the current progress. Contact an editor with edit privileges to make changes.
                  </p>
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-1">Current progress: {selectedStepForTracker.progress}%</p>
                    <Progress value={selectedStepForTracker.progress} className="h-3 w-full rounded-full" />
                  </div>
                </div>
              )}
              <div className="flex justify-end space-x-2 mt-4">
                <Button onClick={() => setShowTrackerDialog(false)} variant="outline">Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="needs_review">Needs Review</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
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
                    onValueChange={(values) => {
                      const newProgress = values[0];
                      let newStatus = editingStep.status;
                      
                      // Automatically update status based on progress
                      if (newProgress > 0 && (editingStep.status === 'not_started' || !editingStep.status)) {
                        newStatus = 'in_progress';
                      } else if (newProgress >= 100) {
                        newStatus = 'completed';
                      }
                      
                      setEditingStep({
                        ...editingStep, 
                        progress: newProgress,
                        status: newStatus
                      });
                    }}
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
              disabled={updateWorkflowStepMutation.isPending || !hasEditAccess}
            >
              {!hasEditAccess ? "View-only Access" : 
                (updateWorkflowStepMutation.isPending ? "Updating..." : "Update Status")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* Assign User Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Team Member</DialogTitle>
            <DialogDescription>
              Select a team member to work on this step
            </DialogDescription>
          </DialogHeader>
          
          {editingStep && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="step-title-assign" className="text-right">
                  Step
                </Label>
                <Input
                  id="step-title-assign"
                  value={editingStep.title}
                  className="col-span-3"
                  disabled
                />
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="assign-user" className="text-right pt-2">
                  Assign To
                </Label>
                <div className="col-span-3 space-y-4">
                  {users && users.length > 0 ? (
                    <>
                      <p className="text-sm text-slate-500 mb-2">
                        Select one or more team members to work on this step
                      </p>
                      
                      {/* Primary assignee dropdown */}
                      <Select 
                        defaultValue={editingStep.assignedTo?.toString() || "unassigned"}
                        onValueChange={(value) => {
                          setEditingStep({
                            ...editingStep,
                            assignedTo: value && value !== "unassigned" ? parseInt(value) : null
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select primary assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {users
                            .filter(user => {
                              // Filter users based on workflow step type
                              const stepType = editingStep?.stepType?.toLowerCase() || '';
                              
                              // Editors can be assigned to any step
                              if (user.isEditor) return true;
                              
                              // For roles array support
                              const userRoles = user.roles || [user.role];
                              
                              // Match step type with appropriate roles
                              if (stepType === 'final_assembled_reader_proof' || stepType === 'final_editorial_pages' || stepType === 'final_production') {
                                // Only editors can be assigned to these steps
                                return user.isEditor;
                              } else if (stepType === 'editorial_pages' || stepType === 'final_editorial_pages') {
                                // Only production/design or editors can work on these steps
                                return userRoles.some(role => role === 'production' || role === 'design') || user.isEditor;
                              } else if (stepType === 'plot' || stepType === 'script') {
                                return userRoles.some(role => role === 'writer');
                              } else if (stepType === 'pencils' || stepType === 'inks' || stepType === 'roughs') {
                                return userRoles.some(role => role === 'artist' || role === 'cover_artist' || role === 'character_designer');
                              } else if (stepType === 'colors') {
                                return userRoles.some(role => role === 'colorist');
                              } else if (stepType === 'letters') {
                                return userRoles.some(role => role === 'letterer');
                              } else if (stepType === 'covers') {
                                return userRoles.some(role => role === 'cover_artist' || role === 'artist');
                              }
                              
                              // By default, show all users for other step types
                              return true;
                            })
                            .map(user => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {/* Format: Name (Role) */}
                                {user.fullName || user.username || `User ${user.id}`}
                                {' '}
                                {user.roles && user.roles.length > 0 ? (
                                  `(${user.roles.map(r => r.charAt(0).toUpperCase() + r.slice(1).replace(/_/g, ' ')).join(', ')})`
                                ) : user.role ? (
                                  `(${user.role.charAt(0).toUpperCase() + user.role.slice(1).replace(/_/g, ' ')})`
                                ) : ''}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                      
                      {/* Multiple assignees with checkboxes */}
                      <div className="border rounded-md p-4 mt-4">
                        <h4 className="text-sm font-medium mb-2">Additional Collaborators</h4>
                        <div className="text-xs text-slate-500 mb-3 bg-slate-50 p-2 rounded border">
                          <p>Select additional collaborators who will help with this task. The primary assignee cannot be a collaborator simultaneously.</p>
                          <p className="mt-1">All assignees will appear in project assignments and count toward their workload.</p>
                        </div>
                        <div className="space-y-3 max-h-[200px] overflow-y-auto">
                          {users
                            .filter(user => {
                              // Filter users based on workflow step type
                              const stepType = editingStep?.stepType?.toLowerCase();
                              
                              // Editors can be assigned to any step
                              if (user.isEditor) return true;
                              
                              // For roles array support
                              const userRoles = user.roles || [user.role];
                              
                              // Match step type with appropriate roles
                              if (stepType === 'final_assembled_reader_proof' || stepType === 'final_production') {
                                // Only editors can be assigned to these steps
                                return user.isEditor;
                              } else if (stepType === 'editorial_pages' || stepType === 'final_editorial_pages') {
                                // Only production/design or editors can work on these steps
                                return userRoles.some(role => role === 'production' || role === 'design') || user.isEditor;
                              } else if (stepType === 'plot' || stepType === 'script') {
                                return userRoles.some(role => role === 'writer');
                              } else if (stepType === 'pencils' || stepType === 'inks' || stepType === 'roughs') {
                                return userRoles.some(role => role === 'artist' || role === 'cover_artist' || role === 'character_designer');
                              } else if (stepType === 'colors') {
                                return userRoles.some(role => role === 'colorist');
                              } else if (stepType === 'letters') {
                                return userRoles.some(role => role === 'letterer');
                              } else if (stepType === 'covers') {
                                return userRoles.some(role => role === 'cover_artist' || role === 'artist');
                              }
                              
                              // By default, show all users for other step types
                              return true;
                            })
                            .map(user => {
                              // Check if user is the primary assignee
                              const isPrimaryAssignee = editingStep.assignedTo === user.id;
                              const isSelected = editingStep.assignees?.includes(user.id.toString()) || false;
                              
                              return (
                                <div key={user.id} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`user-${user.id}`} 
                                    checked={isSelected}
                                    disabled={isPrimaryAssignee}
                                    onCheckedChange={(checked) => {
                                      const currentAssignees = editingStep.assignees || [];
                                      let newAssignees: string[];
                                      
                                      if (checked) {
                                        // Add user to assignees
                                        newAssignees = [...currentAssignees, user.id.toString()];
                                      } else {
                                        // Remove user from assignees
                                        newAssignees = currentAssignees.filter(id => id !== user.id.toString());
                                      }
                                      
                                      setEditingStep({
                                        ...editingStep,
                                        assignees: newAssignees
                                      });
                                    }}
                                  />
                                  <Label 
                                    htmlFor={`user-${user.id}`}
                                    className="text-sm cursor-pointer flex-1"
                                  >
                                    <span className={`font-medium ${isPrimaryAssignee ? 'text-purple-700' : ''}`}>
                                      {user.fullName || user.username || `User ${user.id}`}
                                    </span>
                                    {isPrimaryAssignee && (
                                      <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                                        Primary Assignee
                                      </span>
                                    )}
                                    {user.roles && user.roles.length > 0 ? (
                                      <span className="ml-1 text-xs text-slate-400">
                                        ({user.roles.map(r => r.charAt(0).toUpperCase() + r.slice(1).replace(/_/g, ' ')).join(', ')})
                                      </span>
                                    ) : user.role ? (
                                      <span className="ml-1 text-xs text-slate-400">
                                        ({user.role.charAt(0).toUpperCase() + user.role.slice(1).replace(/_/g, ' ')})
                                      </span>
                                    ) : null}
                                  </Label>
                                </div>
                              );
                            })
                          }
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">No users available</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAssignDialog(false);
                setEditingStep(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (editingStep) {
                  // Make sure we have a valid assignees array (never null)
                  const assignees = editingStep.assignees || [];
                  // Clone the data to avoid reference issues
                  updateWorkflowStepMutation.mutate({
                    stepId: editingStep.id,
                    assignedTo: editingStep.assignedTo,
                    assignees: [...assignees]
                  });
                  
                  // Close dialog immediately without waiting for completion
                  setShowAssignDialog(false);
                  setEditingStep(null);
                }
              }}
              disabled={false} // Never disable to prevent UI freeze
            >
              {updateWorkflowStepMutation.isPending ? "Saving..." : "Save Assignments"}
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
                  <div className="text-xs text-slate-500">
                    Posting as: {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') || '{}').fullName || JSON.parse(localStorage.getItem('user') || '{}').username : 'You'}
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
              
              {comments.map(comment => {
                // Get current user from local storage to check if user can delete this comment
                const currentUser = localStorage.getItem('user') 
                  ? JSON.parse(localStorage.getItem('user') || '{}')
                  : null;
                
                // Check if comment belongs to current user or if user has edit access
                const canDeleteComment = hasEditAccess || (currentUser && currentUser.id === comment.userId);
                
                return (
                  <div key={comment.id} className="p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>{comment.userId}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">
                          {users?.find(u => u.id === comment.userId)?.username || `User ${comment.userId}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-slate-500">
                          {formatDateRelative(comment.createdAt)}
                        </div>
                        {canDeleteComment && (
                          <Button
                            variant="ghost" 
                            size="icon"
                            className="h-6 w-6 rounded-full hover:bg-red-50 hover:text-red-500"
                            onClick={() => deleteCommentMutation.mutate(comment.id)}
                            disabled={deleteCommentMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm">
                      {comment.content}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Link Dialog */}
      <Dialog open={showFileLinkDialog} onOpenChange={setShowFileLinkDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{hasEditAccess ? "Add File Reference" : "File References"}</DialogTitle>
            <DialogDescription>
              {hasEditAccess ? "Add a link to an external file for reference" : "View file reference links"}
            </DialogDescription>
          </DialogHeader>
          
          {hasEditAccess ? (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="file-link" className="text-right">
                  File URL
                </Label>
                <Input
                  id="file-link"
                  placeholder="https://dropbox.com/your-file or similar"
                  value={newFileLink}
                  onChange={(e) => setNewFileLink(e.target.value)}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="workflow-step" className="text-right">
                  Related Step
                </Label>
                <Select
                  value={selectedWorkflowStepForLink?.toString() || ""}
                  onValueChange={(value) => setSelectedWorkflowStepForLink(parseInt(value))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a workflow step (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {workflowSteps && workflowSteps.map((step) => (
                      <SelectItem key={step.id} value={step.id.toString()}>
                        {step.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="p-4 mb-4 bg-slate-100 rounded-md">
              <div className="flex items-center mb-2">
                <Info className="h-4 w-4 text-slate-600 mr-2" />
                <p className="text-sm text-slate-600 font-medium">View-only access</p>
              </div>
              <p className="text-sm text-slate-600">
                You can only view file links. Contact an editor with edit privileges to add new links.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowFileLinkDialog(false);
                setNewFileLink('');
                setSelectedWorkflowStepForLink(null);
              }}
            >
              Cancel
            </Button>
            {hasEditAccess && (
              <Button
                onClick={() => {
                  if (!newFileLink.trim()) {
                    toast({
                      title: "Error",
                      description: "Please enter a valid URL",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  // Check if workflow step is selected
                  if (!selectedWorkflowStepForLink) {
                    if (workflowSteps && workflowSteps.length > 0) {
                      // Auto-select first step if none selected
                      toast({
                        title: "Info",
                        description: "Auto-selecting first workflow step"
                      });
                      // Use the first step
                      const firstStepId = workflowSteps[0].id;
                      
                      // Call the existing mutation
                      addFileLinkMutation.mutate({
                        stepId: firstStepId,
                        url: newFileLink,
                        description: ""
                      });
                      
                      // Close the dialog
                      setShowFileLinkDialog(false);
                      setNewFileLink('');
                      setSelectedWorkflowStepForLink(null);
                    } else {
                      toast({
                        title: "Error",
                        description: "No workflow steps available. Please initialize workflow first.",
                        variant: "destructive"
                      });
                    }
                    return;
                  }
                  
                  // Use our mutation to add the link
                  addFileLinkMutation.mutate({
                    stepId: selectedWorkflowStepForLink,
                    url: newFileLink,
                    description: ""
                  });
                  
                  // Close dialog
                  setShowFileLinkDialog(false);
                  setNewFileLink('');
                  setSelectedWorkflowStepForLink(null);
                }}
                disabled={!newFileLink.trim()}
              >
                Add Link
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              and all its associated data including feedback, files, and workflow steps.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (project) {
                  deleteProjectMutation.mutate(project.id);
                }
                setShowDeleteConfirm(false);
              }}
              disabled={deleteProjectMutation.isPending}
            >
              {deleteProjectMutation.isPending ? "Deleting..." : "Delete Project"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
