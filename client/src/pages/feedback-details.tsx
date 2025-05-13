import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { FeedbackItem, Project } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommentThread } from '@/components/ui/custom/comment-thread';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MessageCircle, CheckCircle, X, Save, FileText, Image, User } from 'lucide-react';
import { formatDate, formatDateRelative, getPriorityColor, DEFAULT_USER_ID } from '@/lib/utils';
import { Helmet } from 'react-helmet-async';

export default function FeedbackDetails() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');

  const { data: feedback, isLoading } = useQuery<FeedbackItem>({
    queryKey: [`/api/feedback/${id}`],
  });

  const { data: project } = useQuery<Project>({
    queryKey: [`/api/projects/${feedback?.projectId}`],
    enabled: !!feedback?.projectId,
  });

  const { data: comments = [] } = useQuery({
    queryKey: [`/api/feedback/${id}/comments`],
    enabled: !!id,
  });

  const updateFeedbackMutation = useMutation({
    mutationFn: async (data: { status?: string; priority?: string }) => {
      const res = await apiRequest("PATCH", `/api/feedback/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback updated",
        description: "Feedback status has been updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: [`/api/feedback/${id}`] });
    },
    onError: (error) => {
      toast({
        title: "Error updating feedback",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update local state when feedback data loads
  useState(() => {
    if (feedback) {
      setStatus(feedback.status);
      setPriority(feedback.priority);
    }
  });

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    updateFeedbackMutation.mutateAsync({ status: newStatus });
  };

  const handlePriorityChange = (newPriority: string) => {
    setPriority(newPriority);
    updateFeedbackMutation.mutateAsync({ priority: newPriority });
  };

  // Sample data for the user who requested feedback
  const getRequesterInfo = (userId: number) => {
    // In a real app, you'd fetch this from your API
    const requesters: Record<number, { name: string; avatarUrl?: string; role: string }> = {
      1: { name: 'Alex Rodriguez', avatarUrl: '', role: 'Senior Editor' },
      2: { name: 'Sarah Lee', avatarUrl: '', role: 'Writer' },
      3: { name: 'James King', avatarUrl: '', role: 'Artist' },
      4: { name: 'Mina Tan', avatarUrl: '', role: 'Character Designer' },
    };
    return requesters[userId] || { name: 'Unknown User', avatarUrl: '', role: 'Collaborator' };
  };

  const getAssetTypeIcon = (assetType: string) => {
    switch (assetType) {
      case 'artwork':
        return <Image className="h-5 w-5" />;
      case 'script':
        return <FileText className="h-5 w-5" />;
      case 'character':
        return <User className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-full max-w-3xl p-8 bg-white rounded-lg shadow animate-pulse">
          <div className="h-7 bg-slate-200 rounded w-3/4 mb-6"></div>
          <div className="h-4 bg-slate-200 rounded w-full mb-6"></div>
          <div className="h-64 bg-slate-200 rounded w-full mb-6"></div>
          <div className="h-10 bg-slate-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-6xl text-slate-300 mb-4">
          <i className="ri-error-warning-line"></i>
        </div>
        <h2 className="text-2xl font-bold text-slate-700 mb-2">Feedback Not Found</h2>
        <p className="text-slate-500 mb-6">The feedback item you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate('/feedback')}>Return to Feedback</Button>
      </div>
    );
  }

  const requester = getRequesterInfo(feedback.requestedBy);
  const priorityColors = getPriorityColor(feedback.priority);

  return (
    <>
      <Helmet>
        <title>{`${feedback.title} - Feedback - Comic Editor Pro`}</title>
        <meta name="description" content={`Review and respond to feedback for ${feedback.title}. Add comments and track feedback status.`} />
      </Helmet>
      
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" className="p-0 h-auto" onClick={() => navigate(`/projects/${feedback.projectId}`)}>
              <span className="text-primary text-sm">{project?.title} {project?.issue}</span>
            </Button>
            <span className="text-slate-400">/</span>
            <span className="text-sm">Feedback</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => navigate(`/projects/${feedback.projectId}`)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold text-slate-900">{feedback.title}</h1>
              </div>
              <p className="text-slate-500 mt-1">{feedback.description}</p>
            </div>
            
            <div className="flex gap-2">
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priority} onValueChange={handlePriorityChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Feedback Details</CardTitle>
                <CardDescription>
                  Review and provide feedback on {feedback.assetType}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="relative">
                    <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                      {feedback.thumbnailUrl ? (
                        <img 
                          src={feedback.thumbnailUrl} 
                          alt={feedback.title} 
                          className="max-h-full max-w-full object-contain rounded-lg"
                        />
                      ) : (
                        <div className="text-6xl text-slate-300">
                          {feedback.assetType === 'artwork' ? 
                            <i className="ri-image-line"></i> : 
                            feedback.assetType === 'script' ? 
                            <i className="ri-file-text-line"></i> : 
                            <i className="ri-file-line"></i>}
                        </div>
                      )}
                    </div>
                    
                    {/* This would be where annotation tools would appear in a real implementation */}
                  </div>
                </div>
                
                <Tabs defaultValue="discussion">
                  <TabsList className="w-full max-w-md">
                    <TabsTrigger value="discussion">Discussion</TabsTrigger>
                    <TabsTrigger value="annotations">Annotations</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="discussion" className="mt-4">
                    <CommentThread 
                      comments={comments} 
                      feedbackId={feedback.id}
                      currentUserId={DEFAULT_USER_ID}
                      currentUserName="Alex Rodriguez"
                    />
                  </TabsContent>
                  
                  <TabsContent value="annotations" className="mt-4">
                    <div className="py-12 text-center">
                      <MessageCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-slate-700 mb-1">Annotation Tool</h3>
                      <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
                        In a real implementation, this tab would contain tools to annotate the image or document directly
                      </p>
                      <Button variant="outline" disabled>
                        Annotation Tool Coming Soon
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="history" className="mt-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Feedback status changed to "In Progress"</p>
                          <p className="text-xs text-slate-500">
                            Alex Rodriguez • {formatDateRelative(new Date(new Date().setDate(new Date().getDate() - 1)))}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <MessageCircle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Comment added</p>
                          <p className="text-xs text-slate-500">
                            Sarah Lee • {formatDateRelative(new Date(new Date().setDate(new Date().getDate() - 2)))}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                          <i className="ri-add-line text-sm"></i>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Feedback created</p>
                          <p className="text-xs text-slate-500">
                            {requester.name} • {formatDateRelative(feedback.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <Button variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Resolved
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-1">Status</h3>
                  <Badge variant="outline" className={
                    status === 'resolved' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                    status === 'rejected' ? 'bg-red-100 text-red-800 hover:bg-red-100' :
                    status === 'in_progress' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                    'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                  }>
                    {status === 'in_progress' ? 'In Progress' :
                     status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-1">Priority</h3>
                  <Badge className={`${priorityColors.bgLight} ${priorityColors.text}`}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Badge>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-1">Asset Type</h3>
                  <div className="flex items-center gap-2">
                    {getAssetTypeIcon(feedback.assetType)}
                    <span className="text-sm">
                      {feedback.assetType.charAt(0).toUpperCase() + feedback.assetType.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-1">Created</h3>
                  <p className="text-sm">{formatDate(feedback.createdAt)}</p>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Requested By</h3>
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={requester.avatarUrl} alt={requester.name} />
                      <AvatarFallback>
                        {requester.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{requester.name}</p>
                      <p className="text-xs text-slate-500">{requester.role}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Related Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center text-accent">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Project Script</p>
                    <p className="text-xs text-slate-500">Last updated 2 days ago</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                    <i className="ri-layout-3-line text-sm"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Panel Layout</p>
                    <p className="text-xs text-slate-500">Page 8</p>
                  </div>
                </div>
                
                <Button variant="ghost" className="w-full text-primary text-sm">
                  View All Related Items
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Save className="h-4 w-4 mr-2" />
                  Download Asset
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <i className="ri-share-line mr-2 text-base"></i>
                  Share Feedback
                </Button>
                <Button variant="outline" className="w-full justify-start text-danger">
                  <i className="ri-delete-bin-line mr-2 text-base"></i>
                  Delete Feedback
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
