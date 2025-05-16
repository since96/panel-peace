import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Project, User, WorkflowStep } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserPlus, Mail, Calendar, Users, AlertCircle, Phone, Link, Edit, X, Trash2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Define talent roles for the dropdown
const talentRoles = [
  { id: "artist", label: "Artist" },
  { id: "writer", label: "Writer" },
  { id: "colorist", label: "Colorist" },
  { id: "letterer", label: "Letterer" },
  { id: "inker", label: "Inker" },
  { id: "cover_artist", label: "Cover Artist" }
];

// No more distinct editor roles needed
// Editors are now simply users with isEditor=true

export default function Collaborators() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string | null>(null);
  
  // Fetch users from the API
  const { data: users, isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Fetch projects
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  // Fetch all workflow steps to calculate assignments
  const { data: allWorkflowSteps, isLoading: isStepsLoading } = useQuery<WorkflowStep[]>({
    queryKey: ['/api/workflow-steps'],
  });
  
  // Calculate project assignments for each user
  const userAssignments = useMemo(() => {
    if (!allWorkflowSteps || !users) return new Map();
    
    const assignments = new Map();
    
    allWorkflowSteps.forEach(step => {
      // Handle primary assignee
      if (step.assignedTo) {
        if (!assignments.has(step.assignedTo)) {
          assignments.set(step.assignedTo, []);
        }
        assignments.get(step.assignedTo).push(step);
      }
      
      // Handle additional collaborators
      if (step.assignees && step.assignees.length > 0) {
        step.assignees.forEach(assigneeId => {
          const numericId = parseInt(assigneeId);
          if (!isNaN(numericId)) {
            if (!assignments.has(numericId)) {
              assignments.set(numericId, []);
            }
            // Only add if not already added as primary assignee
            if (numericId !== step.assignedTo) {
              assignments.get(numericId).push(step);
            }
          }
        });
      }
    });
    
    return assignments;
  }, [allWorkflowSteps, users]);
  
  // Filter users based on search query and selected role
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    // First filter editors vs talent
    const talentUsers = users.filter(user => !user.isEditor);
    
    return talentUsers.filter(user => {
      // Text search filter
      const matchesSearch = 
        (user.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.role || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      // Role filter
      const matchesRole = 
        !selectedRoleFilter || 
        (user.role === selectedRoleFilter) || 
        (user.roles && user.roles.includes(selectedRoleFilter));
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, selectedRoleFilter]);
  
  // Get editors separately 
  const editorUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => user.isEditor);
  }, [users]);
  
  // Get toast function
  const { toast } = useToast();
  
  // Setup talent deletion mutation
  const deleteTalentMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete talent");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Talent deleted",
        description: "The talent has been removed from the system",
        variant: "default"
      });
      
      // Refetch the users list
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      // Close the dialog
      setShowDeleteDialog(false);
      setUserToDelete(null);
    },
    onError: (error) => {
      console.error("Error deleting talent:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete talent",
        variant: "destructive"
      });
    }
  });
  
  // Form state for creating a new team member
  const [newTeamMember, setNewTeamMember] = useState({
    fullName: "",
    email: "",
    phone: "",
    socialMedia: "",
    isEditor: false, // Always false - editor role has been removed
    isSiteAdmin: false, // Whether user is a site administrator
    hasEditAccess: true, // Default to edit access for editors
    assignedProjects: [] as number[],
    role: "",
    roles: [] as string[],
    avatarUrl: "",
    username: "talent_" + Date.now(), // Auto-generated username
    password: ""  // Empty password for talent
  });
  
  const [isAddingTeamMember, setIsAddingTeamMember] = useState(false);
  const [isAddingEditor, setIsAddingEditor] = useState(false);
  const [addTeamMemberError, setAddTeamMemberError] = useState("");
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  // Role selection handling
  const toggleRole = (roleId: string) => {
    setNewTeamMember(prevState => {
      const currentRoles = [...prevState.roles];
      if (currentRoles.includes(roleId)) {
        return {
          ...prevState,
          roles: currentRoles.filter(r => r !== roleId)
        };
      } else {
        return {
          ...prevState,
          roles: [...currentRoles, roleId],
          role: currentRoles.length === 0 ? roleId : prevState.role // set primary role if not already set
        };
      }
    });
  };
  
  // Handle adding a new team member
  const handleAddTeamMember = async () => {
    if (!newTeamMember.fullName || !newTeamMember.email) {
      setAddTeamMemberError("Full name and email are required");
      return;
    }
    
    setIsAddingTeamMember(true);
    setAddTeamMemberError("");
    
    try {
      // Validation logic based on user type
      if (newTeamMember.isEditor) {
        // No validation needed for editor role as we simplified the system
        // We just need to ensure isEditor is true
        
        // Project assignment validation has been removed - editors will be assigned to projects later
        
        // For all editors, require username/password
        if (!newTeamMember.username) {
          setAddTeamMemberError("Username is required for editors");
          setIsAddingTeamMember(false);
          return;
        }
        
        if (!isEditingUser && !newTeamMember.password) {
          setAddTeamMemberError("Password is required for editors");
          setIsAddingTeamMember(false);
          return;
        }
      } else {
        // Talent validation
        if (newTeamMember.roles.length === 0) {
          setAddTeamMemberError("Please select at least one role for this talent");
          setIsAddingTeamMember(false);
          return;
        }
      }
      
      const method = isEditingUser ? 'PATCH' : 'POST';
      const url = isEditingUser ? `/api/users/${editUserId}` : '/api/users';
      
      // Prepare the payload based on user type
      const payload = {
        ...newTeamMember,
        // Always ensure isEditor is set correctly
        isEditor: !!newTeamMember.isEditor,
        // For talent, set the primary role
        ...(!newTeamMember.isEditor ? {
          role: newTeamMember.roles[0] || "", // Primary role
        } : {})
      };
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add team member");
      }
      
      // Clear the form
      setNewTeamMember({
        fullName: "",
        email: "",
        phone: "",
        socialMedia: "",
        isEditor: false,
        isSiteAdmin: false,
        hasEditAccess: true,
        assignedProjects: [],
        role: "",
        roles: [],
        avatarUrl: "",
        username: "talent_" + Date.now(),
        password: ""
      });
      
      // Reset form dialogs
      setIsAddingEditor(false);
      
      // Reset edit state
      setIsEditingUser(false);
      setEditUserId(null);
      
      // Refetch the users list
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      // Success message
      toast({
        title: isEditingUser ? "Team member updated" : "Team member added",
        description: isEditingUser 
          ? "The team member has been updated successfully" 
          : "The new team member has been added successfully",
        variant: "default"
      });
    } catch (err) {
      console.error("Error adding/updating team member:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to process team member";
      setAddTeamMemberError(errorMessage);
    } finally {
      setIsAddingTeamMember(false);
    }
  };
  
  // Confirm deleting a user
  const confirmDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  // Handle deleting a user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      toast({
        title: "User deleted",
        description: `${userToDelete.fullName || userToDelete.username} has been removed`,
        variant: "default"
      });
      
      // Close the dialog
      setShowDeleteDialog(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Failed to delete user",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  };
  
  // Handle editing an existing user
  const handleEditUser = (user: User) => {
    setNewTeamMember({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      socialMedia: user.socialMedia || "",
      isEditor: user.isEditor || false,
      isSiteAdmin: user.isSiteAdmin || false,
      hasEditAccess: user.hasEditAccess !== false, // Default to true if not specified
      assignedProjects: user.assignedProjects || [],
      role: user.role || "",
      roles: user.roles || [],
      avatarUrl: user.avatarUrl || "",
      username: user.username,
      password: ""
    });
    setIsEditingUser(true);
    setEditUserId(user.id);
    // If it's an editor, show the editor form
    if (user.isEditor) {
      setIsAddingEditor(true);
      setIsAddingTeamMember(false);
    } else {
      setIsAddingEditor(false);
      setIsAddingTeamMember(true);
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Talent Management - Panel Peace</title>
        <meta name="description" content="Manage your creative team of artists, writers, and other talent. Track assignments, deadlines, and communication for your comic book projects." />
      </Helmet>
      
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Talent Management</h1>
            <p className="text-slate-500 mt-1">Manage your creative team, track assignments and deliverables</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search talent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full md:w-64"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
            
            <Select
              value={selectedRoleFilter || "all_roles"}
              onValueChange={(value) => setSelectedRoleFilter(value === "all_roles" ? null : value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_roles">All Roles</SelectItem>
                {talentRoles.map(role => (
                  <SelectItem key={role.id} value={role.id}>{role.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="talent" className="mb-6">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="talent">Creator Pool</TabsTrigger>
                <TabsTrigger value="assignments">Project Assignments</TabsTrigger>
                <TabsTrigger value="editors">Editorial Team</TabsTrigger>
              </TabsList>
              
              <TabsContent value="talent" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isUsersLoading ? (
                    <div className="col-span-2 py-12 flex flex-col items-center justify-center text-center">
                      <div className="animate-spin text-primary mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-slate-600 mb-1">Loading talent...</h3>
                    </div>
                  ) : (
                    <>
                      {filteredUsers.map((user) => (
                        <Card key={user.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start">
                              <Avatar className="h-12 w-12 mr-4">
                                <AvatarImage src={user.avatarUrl || ''} alt={user.fullName || ''} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {user.fullName 
                                    ? user.fullName.split(' ').map(n => n[0]).join('') 
                                    : 'TA'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-medium text-slate-900 truncate">{user.fullName}</h3>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => handleEditUser(user)}
                                      className="text-slate-400 hover:text-primary transition-colors"
                                      title="Edit talent"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setUserToDelete(user);
                                        setShowDeleteDialog(true);
                                      }}
                                      className="text-slate-400 hover:text-destructive transition-colors"
                                      title="Delete talent"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {user.roles ? (
                                    user.roles.map(role => {
                                      const roleInfo = talentRoles.find(r => r.id === role);
                                      return (
                                        <Badge key={role} variant="outline" className="text-xs">
                                          {roleInfo ? roleInfo.label : role}
                                        </Badge>
                                      );
                                    })
                                  ) : (
                                    <Badge variant="outline" className="text-xs">
                                      {user.role || 'Talent'}
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="mt-2 text-sm text-slate-500 flex items-center">
                                  <Mail className="h-3.5 w-3.5 mr-1 inline" />
                                  <a 
                                    href={`mailto:${user.email}`} 
                                    className="truncate hover:text-primary transition-colors"
                                  >
                                    {user.email}
                                  </a>
                                </div>
                                
                                {user.phone && (
                                  <div className="mt-1 text-sm text-slate-500 flex items-center">
                                    <Phone className="h-3.5 w-3.5 mr-1 inline" />
                                    <a 
                                      href={`tel:${user.phone}`} 
                                      className="hover:text-primary transition-colors"
                                    >
                                      {user.phone}
                                    </a>
                                  </div>
                                )}
                                
                                <div className="mt-3 flex flex-col text-sm text-slate-500">
                                  {userAssignments.has(user.id) ? (
                                    <>
                                      <span className="font-medium">Current assignments:</span>
                                      <ul className="mt-1 list-disc pl-4">
                                        {(() => {
                                          // Extract unique project IDs
                                          const projectIds: number[] = [];
                                          userAssignments.get(user.id).forEach((step: WorkflowStep) => {
                                            if (!projectIds.includes(step.projectId)) {
                                              projectIds.push(step.projectId);
                                            }
                                          });
                                          
                                          // Return mapped elements
                                          return projectIds.map((projectId: number) => {
                                            const project = projects?.find(p => p.id === projectId);
                                            const steps = userAssignments.get(user.id)
                                              .filter((step: WorkflowStep) => step.projectId === projectId);
                                            
                                            return (
                                              <li key={projectId.toString()} className="mb-1">
                                                <span className="font-medium">{project?.title || 'Unknown project'}</span>
                                                <span className="italic ml-1">
                                                  ({steps.map((step: WorkflowStep) => step.title).join(', ')})
                                                </span>
                                              </li>
                                            );
                                          });
                                        })()}
                                      </ul>
                                    </>
                                  ) : (
                                    <span>No current assignments</span>
                                  )}
                                </div>
                                
                                <div className="flex mt-3 gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8"
                                    asChild
                                  >
                                    <a href={`mailto:${user.email}`}>
                                      <Mail className="h-3.5 w-3.5 mr-1" />
                                      Email
                                    </a>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {filteredUsers.length === 0 && (
                        <div className="col-span-2 py-12 flex flex-col items-center justify-center text-center bg-white rounded-xl shadow-sm">
                          <div className="text-4xl text-slate-300 mb-3">
                            <Users className="mx-auto h-12 w-12" />
                          </div>
                          <h3 className="text-lg font-medium text-slate-600 mb-1">No talent found</h3>
                          <p className="text-sm text-slate-500 mb-4">
                            {selectedRoleFilter 
                              ? `No talent with the ${talentRoles.find(r => r.id === selectedRoleFilter)?.label || selectedRoleFilter} role found.` 
                              : 'Try adjusting your search or add new talent'}
                          </p>
                          <Button variant="outline" className="mt-2" onClick={() => {
                            setSelectedRoleFilter(null);
                            setSearchQuery('');
                          }}>
                            Clear Filters
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="assignments" className="mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Project Assignments</CardTitle>
                        <CardDescription>Who's working on what right now</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isUsersLoading || isStepsLoading ? (
                      <div className="py-12 flex flex-col items-center justify-center text-center">
                        <div className="animate-spin text-primary mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-slate-600 mb-1">Loading assignments...</h3>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {allWorkflowSteps && allWorkflowSteps.length > 0 ? (
                            // Get unique project IDs by filtering and mapping
                            allWorkflowSteps.reduce<number[]>((acc, step) => {
                              if (!acc.includes(step.projectId)) {
                                acc.push(step.projectId);
                              }
                              return acc;
                            }, []).map(projectId => {
                                const project = projects?.find(p => p.id === projectId);
                                if (!project) return null;
                                
                                const projectSteps = allWorkflowSteps.filter(s => s.projectId === projectId && s.assignedTo);
                                if (projectSteps.length === 0) return null;
                                
                                return (
                                  <div key={projectId} className="border rounded-md p-4">
                                    <h3 className="font-medium text-lg mb-3">{project.title}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {projectSteps.map(step => {
                                        const assignedUser = users?.find(u => u.id === step.assignedTo);
                                        return (
                                          <div key={step.id} className="flex items-center p-2 bg-slate-50 rounded-md">
                                            <Avatar className="h-8 w-8 mr-3">
                                              <AvatarImage src={assignedUser?.avatarUrl || ''} alt={assignedUser?.fullName || ''} />
                                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                {assignedUser?.fullName 
                                                  ? assignedUser.fullName.split(' ').map(n => n[0]).join('') 
                                                  : '??'}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div>
                                              <p className="font-medium">{assignedUser?.fullName || 'Unassigned'}</p>
                                              <p className="text-xs text-slate-500">{step.title}</p>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })
                        ) : (
                          <div className="py-12 flex flex-col items-center justify-center text-center">
                            <div className="text-4xl text-slate-300 mb-3">
                              <AlertCircle className="mx-auto h-12 w-12" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-600 mb-1">No assignments found</h3>
                            <p className="text-sm text-slate-500 mb-4">
                              Create a project and assign tasks to team members to see them here
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="editors" className="mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Editorial Team</CardTitle>
                        <CardDescription>People who can access the admin interface</CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setNewTeamMember({
                            ...newTeamMember,
                            fullName: "",
                            email: "",
                            isEditor: true,
                            isSiteAdmin: false,
                            hasEditAccess: true,
                            assignedProjects: [],
                            username: "editor_" + Date.now(),
                            password: "" // Empty password that needs to be filled in
                          });
                          setIsAddingEditor(true);
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Editor
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isUsersLoading ? (
                      <div className="py-12 flex flex-col items-center justify-center text-center">
                        <div className="animate-spin text-primary mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-slate-600 mb-1">Loading editors...</h3>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {editorUsers.length > 0 ? (
                          editorUsers.map(editor => (
                            <Card key={editor.id} className="bg-primary/5 border-primary/20">
                              <CardContent className="p-4">
                                <div className="flex">
                                  <Avatar className="h-10 w-10 mr-3 border-2 border-primary">
                                    <AvatarImage src={editor.avatarUrl || ''} alt={editor.fullName || ''} />
                                    <AvatarFallback className="bg-primary text-white">
                                      {editor.fullName 
                                        ? editor.fullName.split(' ').map(n => n[0]).join('') 
                                        : 'ED'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                      <p className="font-medium">{editor.fullName || editor.username}</p>
                                      <div className="flex space-x-2">
                                        <button 
                                          onClick={() => handleEditUser(editor)}
                                          className="text-slate-400 hover:text-primary transition-colors"
                                          title="Edit editor"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </button>
                                        <button 
                                          onClick={() => confirmDeleteUser(editor)}
                                          className="text-slate-400 hover:text-red-500 transition-colors"
                                          title="Delete editor"
                                        >
                                          <X className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                      <a 
                                        href={`mailto:${editor.email}`} 
                                        className="hover:text-primary transition-colors"
                                      >
                                        {editor.email}
                                      </a>
                                    </p>
                                    <div className="flex gap-1 mt-1">
                                      <Badge variant="outline">
                                        {editor.isSiteAdmin ? 'Site Admin' : 'Editor'}
                                      </Badge>
                                      {editor.hasEditAccess === false && 
                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                          View Only
                                        </Badge>
                                      }
                                    </div>
                                    
                                    <div className="mt-3 text-xs text-slate-500">
                                      {userAssignments.has(editor.id) ? (
                                        <>
                                          <p className="font-medium">Managing projects:</p>
                                          <ul className="mt-1 list-disc pl-4">
                                            {(() => {
                                              // Extract unique project IDs
                                              const projectIds: number[] = [];
                                              userAssignments.get(editor.id).forEach((step: WorkflowStep) => {
                                                if (!projectIds.includes(step.projectId)) {
                                                  projectIds.push(step.projectId);
                                                }
                                              });
                                              
                                              // Return mapped elements
                                              return projectIds.map((projectId: number) => {
                                                const project = projects?.find(p => p.id === projectId);
                                                return (
                                                  <li key={projectId.toString()}>
                                                    {project?.title || 'Unknown project'}
                                                  </li>
                                                );
                                              });
                                            })()}
                                          </ul>
                                        </>
                                      ) : editor.assignedProjects && editor.assignedProjects.length > 0 ? (
                                        <>
                                          <p className="font-medium">Assigned projects:</p>
                                          <ul className="mt-1 list-disc pl-4">
                                            {(() => {
                                              if (!editor.assignedProjects) return null;
                                              
                                              return editor.assignedProjects.map((projectId) => {
                                                const project = projects?.find(p => p.id === projectId);
                                                return (
                                                  <li key={String(projectId)}>
                                                    {project?.title || 'Unknown project'}
                                                  </li>
                                                );
                                              });
                                            })()}
                                          </ul>
                                        </>
                                      ) : (
                                        <p>No assigned projects</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className="py-12 flex flex-col items-center justify-center text-center">
                            <div className="text-4xl text-slate-300 mb-3">
                              <Users className="mx-auto h-12 w-12" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-600 mb-1">No editors found</h3>
                            <p className="text-sm text-slate-500 mb-4">
                              Add your first editor to get started
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{isEditingUser ? "Edit Creator" : "Add a New Creator"}</CardTitle>
                <CardDescription>
                  {isEditingUser 
                    ? "Update creator information and roles" 
                    : "Add a new creator to your roster"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {addTeamMemberError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 text-sm">
                    {addTeamMemberError}
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Full Name *</label>
                  <Input 
                    type="text" 
                    placeholder="Full name"
                    value={newTeamMember.fullName}
                    onChange={(e) => setNewTeamMember({...newTeamMember, fullName: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Email Address *</label>
                  <Input 
                    type="email" 
                    placeholder="email@example.com"
                    value={newTeamMember.email}
                    onChange={(e) => setNewTeamMember({...newTeamMember, email: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Phone Number (Optional)</label>
                  <Input 
                    type="tel" 
                    placeholder="(555) 555-5555"
                    value={newTeamMember.phone}
                    onChange={(e) => setNewTeamMember({...newTeamMember, phone: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Social Media (Optional)</label>
                  <Input 
                    type="text" 
                    placeholder="Twitter, Instagram, or other links"
                    value={newTeamMember.socialMedia}
                    onChange={(e) => setNewTeamMember({...newTeamMember, socialMedia: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Talent Roles (select all that apply) *</label>
                  <div className="grid grid-cols-2 gap-2 mt-2 border rounded-md p-3">
                    {talentRoles.map(role => (
                      <div key={role.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`role-${role.id}`}
                          checked={newTeamMember.roles.includes(role.id)}
                          onChange={() => toggleRole(role.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor={`role-${role.id}`} className="text-sm text-gray-700">
                          {role.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Each talent can perform multiple roles</p>
                </div>
                
                {/* Editor checkbox removed as requested */}
                
                {false && (
                  <div className="p-3 bg-slate-50 rounded-md space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Username *</label>
                      <Input 
                        type="text" 
                        placeholder="Username for login"
                        value={newTeamMember.username}
                        onChange={(e) => setNewTeamMember({...newTeamMember, username: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Password {isEditingUser ? '(leave blank to keep current)' : '*'}</label>
                      <Input 
                        type="password" 
                        placeholder="Strong password"
                        value={newTeamMember.password}
                        onChange={(e) => setNewTeamMember({...newTeamMember, password: e.target.value})}
                      />
                    </div>
                  </div>
                )}
                
                <Button 
                  className="w-full mt-2" 
                  onClick={handleAddTeamMember}
                  disabled={isAddingTeamMember}
                >
                  {isAddingTeamMember && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isEditingUser ? 'Update Team Member' : 'Add Team Member'}
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Talent Roles</CardTitle>
                <CardDescription>Role descriptions and responsibilities</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4">
                <div>
                  <h3 className="font-medium">Writer</h3>
                  <p className="text-slate-500">Creates the story, dialogue, and script</p>
                </div>
                <div>
                  <h3 className="font-medium">Artist</h3>
                  <p className="text-slate-500">Pencils and inks the interior comic pages</p>
                </div>
                <div>
                  <h3 className="font-medium">Colorist</h3>
                  <p className="text-slate-500">Adds colors to inked artwork</p>
                </div>
                <div>
                  <h3 className="font-medium">Letterer</h3>
                  <p className="text-slate-500">Adds word balloons, captions, and sound effects</p>
                </div>
                <div>
                  <h3 className="font-medium">Cover Artist</h3>
                  <p className="text-slate-500">Creates cover illustrations</p>
                </div>
                <div>
                  <h3 className="font-medium">Inker</h3>
                  <p className="text-slate-500">Provides finishes and inks over pencil art</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Editor Form Dialog */}
      <Dialog open={isAddingEditor} onOpenChange={(open) => !open && setIsAddingEditor(false)}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{isEditingUser ? "Edit Editor" : "Add New Editor"}</DialogTitle>
            <DialogDescription>
              {isEditingUser 
                ? "Update editor information and permissions" 
                : "Add a new editor to manage comic book projects"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editor-name">Full Name *</Label>
              <Input
                id="editor-name"
                placeholder="Editor's full name"
                value={newTeamMember.fullName}
                onChange={(e) => setNewTeamMember({...newTeamMember, fullName: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="editor-email">Email Address *</Label>
              <Input
                id="editor-email"
                type="email"
                placeholder="editor@example.com"
                value={newTeamMember.email}
                onChange={(e) => setNewTeamMember({...newTeamMember, email: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="editor-username">Username *</Label>
              <Input
                id="editor-username"
                placeholder="Username for login"
                value={newTeamMember.username}
                onChange={(e) => setNewTeamMember({...newTeamMember, username: e.target.value})}
              />
            </div>
            
            {!isEditingUser && (
              <div className="grid gap-2">
                <Label htmlFor="editor-password">Password *</Label>
                <Input
                  id="editor-password"
                  type="password"
                  placeholder="Secure password"
                  value={newTeamMember.password}
                  onChange={(e) => setNewTeamMember({...newTeamMember, password: e.target.value})}
                />
              </div>
            )}
            
            <div className="grid gap-2">
              <Label>Editor Access Level</Label>
              <div className="space-y-3">
                <div className="flex items-start space-x-2 p-2 rounded-md hover:bg-slate-50 border border-slate-200">
                  <input 
                    type="checkbox" 
                    id="is-site-admin"
                    checked={newTeamMember.isSiteAdmin}
                    onChange={(e) => setNewTeamMember({...newTeamMember, isSiteAdmin: e.target.checked})}
                    className="mt-1"
                  />
                  <div className="grid gap-1">
                    <Label htmlFor="is-site-admin" className="font-medium">
                      Site Administrator
                    </Label>
                    <p className="text-sm text-slate-500">
                      Full access to all bullpens and projects, can create new bullpens and manage all users
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2 p-2 rounded-md hover:bg-slate-50 border border-slate-200">
                  <input 
                    type="checkbox" 
                    id="has-edit-access"
                    checked={newTeamMember.hasEditAccess}
                    onChange={(e) => setNewTeamMember({...newTeamMember, hasEditAccess: e.target.checked})}
                    className="mt-1"
                  />
                  <div className="grid gap-1">
                    <Label htmlFor="has-edit-access" className="font-medium">
                      Allow Editing
                    </Label>
                    <p className="text-sm text-slate-500">
                      When checked, editor can make changes to projects. Otherwise, they will have view-only access.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Project assignment section removed - editors will be assigned to projects later */}
            <p className="text-xs text-slate-500 mt-2">
              Editors will need to be assigned to specific projects after creation
            </p>
            
            {addTeamMemberError && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 text-sm">{addTeamMemberError}</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddingEditor(false);
                // Reset form if not editing
                if (!isEditingUser) {
                  setNewTeamMember({
                    ...newTeamMember,
                    fullName: "",
                    email: "",
                    isEditor: false,
                    isSiteAdmin: false,
                    hasEditAccess: true,
                    assignedProjects: [],
                    username: "talent_" + Date.now(),
                    password: ""
                  });
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddTeamMember}
              disabled={isAddingTeamMember || !newTeamMember.fullName || !newTeamMember.email}
              className="min-w-[120px]"
            >
              {isAddingTeamMember && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isEditingUser ? 'Update Editor' : 'Add Editor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Talent Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Talent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {userToDelete?.fullName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-destructive font-medium mb-2">Warning:</p>
            <p className="text-sm text-muted-foreground">
              Deleting this talent will remove them from all assigned projects and workflow steps.
              Make sure to reassign their responsibilities before deleting.
            </p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setUserToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (userToDelete) {
                  deleteTalentMutation.mutate(userToDelete.id);
                }
              }}
              disabled={deleteTalentMutation.isPending}
            >
              {deleteTalentMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                "Delete Talent"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user{" "}
              <span className="font-semibold">{userToDelete?.fullName || userToDelete?.username}</span>
              {" "}and remove all their assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}