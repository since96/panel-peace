import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Project, User, WorkflowStep } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserPlus, Mail, MessageSquare, Calendar, Users, AlertCircle, Phone, Link, Edit } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// Define talent roles for the dropdown
const talentRoles = [
  { id: "artist", label: "Artist" },
  { id: "writer", label: "Writer" },
  { id: "colorist", label: "Colorist" },
  { id: "letterer", label: "Letterer" },
  { id: "editor", label: "Editor" },
  { id: "character_designer", label: "Character Designer" },
  { id: "cover_artist", label: "Cover Artist" }
];

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
  
  // Form state for creating a new team member
  const [newTeamMember, setNewTeamMember] = useState({
    fullName: "",
    email: "",
    phone: "",
    socialMedia: "",
    isEditor: false,
    role: "",
    roles: [] as string[],
    avatarUrl: "",
    username: "talent_" + Date.now(), // Auto-generated username
    password: ""  // Empty password for talent
  });
  
  const [isAddingTeamMember, setIsAddingTeamMember] = useState(false);
  const [addTeamMemberError, setAddTeamMemberError] = useState("");
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  
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
      // Ensure we have at least one role selected
      if (newTeamMember.roles.length === 0) {
        setAddTeamMemberError("Please select at least one role for this team member");
        return;
      }
      
      const method = isEditingUser ? 'PATCH' : 'POST';
      const url = isEditingUser ? `/api/users/${editUserId}` : '/api/users';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newTeamMember,
          role: newTeamMember.roles[0] // Use the first selected role as the primary role
        })
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
        role: "",
        roles: [],
        avatarUrl: "",
        username: "talent_" + Date.now(),
        password: ""
      });
      
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
  
  // Handle editing an existing user
  const handleEditUser = (user: User) => {
    setNewTeamMember({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      socialMedia: user.socialMedia || "",
      isEditor: user.isEditor || false,
      role: user.role || "",
      roles: user.roles || [],
      avatarUrl: user.avatarUrl || "",
      username: user.username,
      password: ""
    });
    setIsEditingUser(true);
    setEditUserId(user.id);
  };
  
  return (
    <>
      <Helmet>
        <title>Talent Management - Comic Editor Pro</title>
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
                <TabsTrigger value="talent">Talent Roster</TabsTrigger>
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
                                  <button 
                                    onClick={() => handleEditUser(user)}
                                    className="text-slate-400 hover:text-primary transition-colors"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
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
                                  <span className="truncate">{user.email}</span>
                                </div>
                                
                                {user.phone && (
                                  <div className="mt-1 text-sm text-slate-500 flex items-center">
                                    <Phone className="h-3.5 w-3.5 mr-1 inline" />
                                    <span>{user.phone}</span>
                                  </div>
                                )}
                                
                                <div className="mt-3 flex items-center text-sm text-slate-500">
                                  <span>
                                    {userAssignments.has(user.id) ? (
                                      `Working on ${userAssignments.get(user.id).length} project${userAssignments.get(user.id).length !== 1 ? 's' : ''}`
                                    ) : (
                                      'No current assignments'
                                    )}
                                  </span>
                                </div>
                                
                                <div className="flex mt-3 gap-2">
                                  <Button size="sm" variant="outline" className="h-8">
                                    <Mail className="h-3.5 w-3.5 mr-1" />
                                    Email
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-8">
                                    <MessageSquare className="h-3.5 w-3.5 mr-1" />
                                    Message
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
                      <Button variant="outline" size="sm">
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
                                <div className="flex items-center">
                                  <Avatar className="h-10 w-10 mr-3 border-2 border-primary">
                                    <AvatarImage src={editor.avatarUrl || ''} alt={editor.fullName || ''} />
                                    <AvatarFallback className="bg-primary text-white">
                                      {editor.fullName 
                                        ? editor.fullName.split(' ').map(n => n[0]).join('') 
                                        : 'ED'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{editor.fullName || editor.username}</p>
                                    <p className="text-xs text-slate-500">{editor.email}</p>
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
                <CardTitle>{isEditingUser ? "Edit Talent" : "Add New Talent"}</CardTitle>
                <CardDescription>
                  {isEditingUser 
                    ? "Update talent information and roles" 
                    : "Add a new talent to your roster"}
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
                
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id="is-editor"
                    checked={newTeamMember.isEditor}
                    onChange={(e) => setNewTeamMember({...newTeamMember, isEditor: e.target.checked})}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="is-editor" className="ml-2 text-sm text-gray-700">
                    This person is an editor (has admin access)
                  </label>
                </div>
                
                {newTeamMember.isEditor && (
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
                  <h3 className="font-medium">Character Designer</h3>
                  <p className="text-slate-500">Develops character designs and style guides</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}