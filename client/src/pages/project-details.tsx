import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Project, FeedbackItem, Deadline, Collaborator, Asset } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Clock, Users, FileText, Book, Plus, Calendar, MessageCircle } from 'lucide-react';
import { FeedbackItemCard } from '@/components/ui/custom/feedback-item';
import { DeadlineItem } from '@/components/ui/custom/deadline-item';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { formatDate, formatStatusLabel, getStatusColor, DEFAULT_USER_ID } from '@/lib/utils';
import { FileUpload } from '@/components/ui/custom/file-upload';
import { Helmet } from 'react-helmet-async';

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [projectProgress, setProjectProgress] = useState<number>(0);
  const [editing, setEditing] = useState(false);

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

  const updateProjectMutation = useMutation({
    mutationFn: async (progress: number) => {
      const res = await apiRequest("PATCH", `/api/projects/${id}`, { progress });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Progress updated",
        description: "Project progress has been updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${id}`] });
      setEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to update progress",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleProgressUpdate = () => {
    if (projectProgress !== project?.progress) {
      updateProjectMutation.mutateAsync(projectProgress);
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
            
            <div className="flex gap-2">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Script
              </Button>
              <Button variant="outline">
                <Book className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
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
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                  <div className="mb-2 md:mb-0">
                    <h3 className="text-sm font-medium text-slate-700">Project Progress</h3>
                    <div className="text-sm text-slate-500">
                      Overall completion status
                    </div>
                  </div>
                  
                  <div className="flex gap-4 items-center">
                    {editing ? (
                      <>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={projectProgress}
                          onChange={(e) => setProjectProgress(parseInt(e.target.value) || 0)}
                          className="w-20"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleProgressUpdate} disabled={updateProjectMutation.isPending}>
                            {updateProjectMutation.isPending ? "Saving..." : "Save"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            setProjectProgress(project.progress);
                            setEditing(false);
                          }}>
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="font-medium">{project.progress}% complete</span>
                        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                <Progress value={project.progress} className="h-2 mb-8" />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Script</p>
                        <p className="font-medium">{assets?.filter(a => a.type === 'script').length || 0} files</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                        <Pencil className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Artwork</p>
                        <p className="font-medium">{assets?.filter(a => a.type.startsWith('image')).length || 0} files</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                        <MessageCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Feedback</p>
                        <p className="font-medium">{feedbackItems?.length || 0} items</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Due Date</p>
                        <p className="font-medium">{project.dueDate ? formatDate(project.dueDate) : 'Not set'}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6">
              <Tabs defaultValue="feedback">
                <TabsList className="w-full max-w-md">
                  <TabsTrigger value="feedback">Feedback</TabsTrigger>
                  <TabsTrigger value="assets">Assets</TabsTrigger>
                  <TabsTrigger value="team">Team</TabsTrigger>
                </TabsList>
                
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Upcoming Deadlines</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isDeadlinesLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="border-l-4 border-slate-200 pl-3 py-2 animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2 mb-1"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                    </div>
                  ))
                ) : deadlines && deadlines.length > 0 ? (
                  <>
                    {deadlines.slice(0, 4).map((deadline) => (
                      <DeadlineItem key={deadline.id} deadline={deadline} />
                    ))}
                    
                    {deadlines.length > 4 && (
                      <Button variant="ghost" className="w-full text-primary" asChild>
                        <div className="flex items-center justify-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>View All ({deadlines.length})</span>
                        </div>
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="py-6 flex flex-col items-center justify-center text-center">
                    <Calendar className="h-10 w-10 text-slate-300 mb-2" />
                    <h3 className="text-base font-medium text-slate-600 mb-1">No deadlines yet</h3>
                    <p className="text-sm text-slate-500 mb-4">Add deadlines to track project milestones</p>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Deadline
                    </Button>
                  </div>
                )}
                
                {deadlines && deadlines.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Deadline
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
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
            
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={`/script-editor?project=${id}`}>
                    <FileText className="h-4 w-4 mr-2" />
                    Edit Script
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={`/panel-editor?project=${id}`}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Panel Editor
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={`/publication?project=${id}`}>
                    <Book className="h-4 w-4 mr-2" />
                    Preview Publication
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
