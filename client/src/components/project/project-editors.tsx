import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, X, Mail, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Define type for editor with user details included
interface ProjectEditor {
  id: number;
  userId: number;
  projectId: number;
  assignedBy: number | null;
  assignmentRole: string | null;
  assignedAt: Date | null;
  user?: User;
}

interface ProjectEditorsProps {
  projectId: number;
  currentUserId: number;
  userRole: string;
}

export default function ProjectEditors({ projectId, currentUserId, userRole }: ProjectEditorsProps) {
  const [showAddEditorDialog, setShowAddEditorDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch editors for this project
  const { data: editors, isLoading: isEditorsLoading } = useQuery<ProjectEditor[]>({
    queryKey: [`/api/projects/${projectId}/editors`],
    enabled: !!projectId,
  });

  // Fetch all users who are editors (for assignment)
  const { data: allUsers, isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    select: (users) => users.filter(user => user.isEditor),
    enabled: !!projectId,
  });

  // Mutation to assign an editor to the project
  const assignEditorMutation = useMutation({
    mutationFn: async (userId: number) => {
      // Use the editor's existing role by default, determined on the server side
      return await apiRequest('POST', `/api/projects/${projectId}/editors?userId=${currentUserId}`, { 
        userId: userId,
        // No need to specify role, the server will use the user's existing role
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/editors`] });
      toast({
        title: "Editor assigned",
        description: "The editor has been assigned to this project",
      });
      setShowAddEditorDialog(false);
      setSelectedUserId("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to assign editor",
        description: error.message || "There was an error assigning the editor",
        variant: "destructive",
      });
    },
  });

  // Mutation to remove an editor from the project
  const removeEditorMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest('DELETE', `/api/projects/${projectId}/editors/${userId}?userId=${currentUserId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/editors`] });
      toast({
        title: "Editor removed",
        description: "The editor has been removed from this project",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove editor",
        description: error.message || "There was an error removing the editor",
        variant: "destructive",
      });
    },
  });

  // Determine if current user can add/remove editors
  const canManageEditors = 
    userRole === 'editor_in_chief' || 
    userRole === 'senior_editor';

  // Handle assigning editor
  const handleAssignEditor = () => {
    if (!selectedUserId) {
      toast({
        title: "No editor selected",
        description: "Please select an editor to assign",
        variant: "destructive",
      });
      return;
    }

    assignEditorMutation.mutate(Number(selectedUserId));
  };

  // Handle removing editor
  const handleRemoveEditor = (userId: number) => {
    removeEditorMutation.mutate(userId);
  };

  // Get available editors (those not already assigned to this project)
  const availableEditors = allUsers?.filter(user => 
    !editors?.some(editor => editor.userId === user.id)
  ) || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Project Editors</CardTitle>
        {canManageEditors && (
          <Dialog open={showAddEditorDialog} onOpenChange={setShowAddEditorDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <UserPlus className="h-4 w-4" />
                <span>Add Editor</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Editor to Project</DialogTitle>
                <DialogDescription>
                  Select an editor to assign to this project. They will have access to manage the project.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Editor</label>
                  <Select
                    value={selectedUserId.toString()}
                    onValueChange={(value) => setSelectedUserId(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an editor" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEditors.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.fullName || user.username}
                          {user.isSiteAdmin && ` (Site Admin)`}
                          {user.hasEditAccess === false && ` (View Only)`}
                        </SelectItem>
                      ))}
                      {availableEditors.length === 0 && (
                        <SelectItem value="none" disabled>
                          No available editors
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-1">
                    Editors will be assigned with their existing role
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddEditorDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAssignEditor}
                  disabled={!selectedUserId || assignEditorMutation.isPending}
                >
                  {assignEditorMutation.isPending ? "Assigning..." : "Assign Editor"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      
      <CardContent>
        {isEditorsLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="animate-spin text-primary mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-600 mb-1">Loading editors...</h3>
          </div>
        ) : (
          <div className="space-y-3">
            {editors && editors.length > 0 ? (
              editors.map((editor) => (
                <div key={editor.id} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={editor.user?.avatarUrl || ''} alt={editor.user?.fullName || 'Editor'} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {editor.user?.fullName 
                          ? editor.user.fullName.split(' ').map(n => n[0]).join('') 
                          : editor.user?.username?.substring(0, 2).toUpperCase() || 'ED'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{editor.user?.fullName || editor.user?.username || 'Unknown'}</p>
                        <div className="flex gap-1">
                          <Badge variant="outline">
                            {editor.user?.isSiteAdmin ? 'Site Admin' : 'Editor'}
                          </Badge>
                          {editor.user?.hasEditAccess === false && 
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              View Only
                            </Badge>
                          }
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">{editor.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        // Create a mailto link
                        if (editor.user?.email) {
                          window.location.href = `mailto:${editor.user.email}?subject=Comic Project: ${projectId}`;
                        }
                      }}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    
                    {canManageEditors && editor.userId !== currentUserId && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleRemoveEditor(editor.userId)}
                        disabled={removeEditorMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="text-4xl text-slate-300 mb-3">
                  <Users className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-slate-600 mb-1">No editors assigned</h3>
                <p className="text-sm text-slate-500 mb-4">
                  {canManageEditors ? "Add editors to collaborate on this project" : "This project doesn't have additional editors"}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}