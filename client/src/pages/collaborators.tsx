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
import { Search, UserPlus, Mail, MessageSquare, Clock, Users, AlertCircle } from "lucide-react";
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
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("artist");
  
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
      if (step.assignedTo) {
        if (!assignments.has(step.assignedTo)) {
          assignments.set(step.assignedTo, []);
        }
        assignments.get(step.assignedTo).push(step);
      }
    });
    
    return assignments;
  }, [allWorkflowSteps, users]);
  
  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter(user => 
      (user.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.role || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);
  
  // Get toast function
  const { toast } = useToast();
  
  // Form state for creating a new team member
  const [newTeamMember, setNewTeamMember] = useState({
    username: "",
    password: "",
    fullName: "",
    role: selectedRole,
    avatarUrl: ""
  });
  
  const [isAddingTeamMember, setIsAddingTeamMember] = useState(false);
  const [addTeamMemberError, setAddTeamMemberError] = useState("");
  
  // Handle adding a new team member
  const handleAddTeamMember = async () => {
    if (!newTeamMember.username || !newTeamMember.password) {
      setAddTeamMemberError("Username and password are required");
      return;
    }
    
    setIsAddingTeamMember(true);
    setAddTeamMemberError("");
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newTeamMember,
          role: selectedRole // Use the selected role from the dropdown
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add team member");
      }
      
      // Clear the form
      setNewTeamMember({
        username: "",
        password: "",
        fullName: "",
        role: selectedRole,
        avatarUrl: ""
      });
      
      // Refetch the users list
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      
      // Success message
      toast({
        title: "Team member added",
        description: "The new team member has been added successfully",
        variant: "default"
      });
    } catch (err) {
      console.error("Error adding team member:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to add team member";
      setAddTeamMemberError(errorMessage);
    } finally {
      setIsAddingTeamMember(false);
    }
  };
  
  // Legacy invite function (keeping for compatibility)
  const handleInvite = () => {
    if (!inviteEmail) return;
    // In a real app, you would send an invitation to this email
    toast({
      title: "Invitation sent",
      description: `Invitation sent to ${inviteEmail} for role: ${selectedRole}`,
      variant: "default"
    });
    setInviteEmail("");
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
          <div className="mt-4 md:mt-0">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search collaborators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full md:w-64"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="team" className="mb-6">
              <TabsList className="grid w-full max-w-md grid-cols-4">
                <TabsTrigger value="team">My Team</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="available">Available Talent</TabsTrigger>
                <TabsTrigger value="requests">Applications</TabsTrigger>
              </TabsList>
              
              <TabsContent value="team" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isUsersLoading ? (
                    <div className="col-span-2 py-12 flex flex-col items-center justify-center text-center">
                      <div className="animate-spin text-primary mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-slate-600 mb-1">Loading team members...</h3>
                    </div>
                  ) : (
                    <>
                      {filteredUsers.map((user) => (
                        <Card key={user.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start">
                              <Avatar className="h-12 w-12 mr-4">
                                <AvatarImage src={user.avatarUrl || ''} alt={user.fullName || user.username} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {user.fullName 
                                    ? user.fullName.split(' ').map(n => n[0]).join('') 
                                    : user.username?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-medium text-slate-900">{user.fullName || user.username}</h3>
                                  <Badge variant="outline">{user.role || 'Team Member'}</Badge>
                                </div>
                                <p className="text-sm text-slate-500 mt-1">
                                  {userAssignments.has(user.id) ? (
                                    `Working on ${userAssignments.get(user.id).length} project${userAssignments.get(user.id).length !== 1 ? 's' : ''}`
                                  ) : (
                                    'No current assignments'
                                  )}
                                </p>
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
                          <h3 className="text-lg font-medium text-slate-600 mb-1">No team members found</h3>
                          <p className="text-sm text-slate-500 mb-4">
                            Try adjusting your search or invite new team members
                          </p>
                          <Button variant="outline" className="mt-2">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add New Team Member
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
                    <CardTitle>Current Assignments</CardTitle>
                    <CardDescription>Track deliverables and deadlines for your team</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isStepsLoading || isUsersLoading ? (
                      <div className="py-12 flex flex-col items-center justify-center text-center">
                        <div className="animate-spin text-primary mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-slate-600 mb-1">Loading assignments...</h3>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {allWorkflowSteps && allWorkflowSteps.length > 0 ? (
                          allWorkflowSteps
                            .filter(step => step.assignedTo && step.status !== 'completed')
                            .sort((a, b) => {
                              // Sort by due date (closest due date first)
                              if (a.dueDate && b.dueDate) {
                                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                              }
                              if (a.dueDate) return -1;
                              if (b.dueDate) return 1;
                              return 0;
                            })
                            .map(step => {
                              const assignedUser = users?.find(u => u.id === step.assignedTo);
                              const project = projects?.find(p => p.id === step.projectId);
                              
                              // Calculate status badge properties
                              let badgeClass = "bg-gray-100 text-gray-800 hover:bg-gray-100";
                              if (step.status === 'in_progress') {
                                badgeClass = "bg-amber-100 text-amber-800 hover:bg-amber-100";
                              } else if (step.status === 'needs_review') {
                                badgeClass = "bg-blue-100 text-blue-800 hover:bg-blue-100"; 
                              } else if (step.status === 'not_started') {
                                badgeClass = "bg-slate-100 text-slate-800 hover:bg-slate-100";
                              } else if (step.status === 'blocked') {
                                badgeClass = "bg-red-100 text-red-800 hover:bg-red-100";
                              }
                              
                              // Format the status label
                              const statusLabel = step.status
                                .replace(/_/g, ' ')
                                .split(' ')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ');
                              
                              // Calculate due date text
                              let dueText = 'No deadline set';
                              if (step.dueDate) {
                                const now = new Date();
                                const dueDate = new Date(step.dueDate);
                                const diffTime = dueDate.getTime() - now.getTime();
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                
                                if (diffDays < 0) {
                                  dueText = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
                                } else if (diffDays === 0) {
                                  dueText = 'Due today';
                                } else {
                                  dueText = `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
                                }
                              }
                              
                              return (
                                <div key={step.id} className="rounded-lg border overflow-hidden">
                                  <div className="bg-muted px-4 py-3 font-medium flex items-center">
                                    <span className="flex-1">
                                      {project?.title} {project?.issue ? `Issue #${project.issue}` : ''} - {step.title}
                                    </span>
                                    <Badge className={badgeClass}>{statusLabel}</Badge>
                                  </div>
                                  <div className="p-4">
                                    <div className="flex items-center mb-3">
                                      <Avatar className="h-8 w-8 mr-2">
                                        <AvatarImage src={assignedUser?.avatarUrl || ''} />
                                        <AvatarFallback>
                                          {assignedUser?.fullName 
                                            ? assignedUser.fullName.split(' ').map(n => n[0]).join('') 
                                            : assignedUser?.username?.substring(0, 2).toUpperCase() || '??'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="text-sm font-medium">{assignedUser?.fullName || assignedUser?.username || 'Unknown'}</p>
                                        <p className="text-xs text-muted-foreground">{assignedUser?.role || 'Team Member'}</p>
                                      </div>
                                      <div className="ml-auto text-sm text-muted-foreground flex items-center">
                                        <Clock className="h-3.5 w-3.5 mr-1" />
                                        {dueText}
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                      <div className="flex items-center">
                                        <span className="text-slate-500 mr-2">Progress:</span>
                                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-primary rounded-full" 
                                            style={{ width: `${step.progress}%` }}
                                          ></div>
                                        </div>
                                        <span className="ml-2 text-slate-700">{step.progress}%</span>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button size="sm" variant="outline">View Details</Button>
                                        <Button size="sm">Send Reminder</Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                        ) : (
                          <div className="py-12 flex flex-col items-center justify-center text-center">
                            <div className="text-4xl text-slate-300 mb-3">
                              <AlertCircle className="mx-auto h-12 w-12" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-600 mb-1">No active assignments</h3>
                            <p className="text-sm text-slate-500 mb-4">
                              There are no active workflow steps assigned to team members
                            </p>
                            <Button variant="outline" className="mt-2">
                              Assign Team Members
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="available" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Available Creative Talent</CardTitle>
                    <CardDescription>Find writers, artists, colorists and other professionals for your projects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 border border-slate-200 rounded-lg">
                        <Avatar className="h-16 w-16">
                          <AvatarImage alt="Artist profile" />
                          <AvatarFallback className="text-lg">JD</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900">Jane Doe</h3>
                          <p className="text-sm text-slate-500">Comic Artist • Specializes in action scenes</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge variant="secondary" className="text-xs">Penciling</Badge>
                            <Badge variant="secondary" className="text-xs">Inking</Badge>
                            <Badge variant="secondary" className="text-xs">Character Design</Badge>
                          </div>
                        </div>
                        <Button>Invite</Button>
                      </div>
                      
                      <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 border border-slate-200 rounded-lg">
                        <Avatar className="h-16 w-16">
                          <AvatarImage alt="Artist profile" />
                          <AvatarFallback className="text-lg">MB</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900">Michael Brown</h3>
                          <p className="text-sm text-slate-500">Comic Artist • Specializes in sci-fi environments</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge variant="secondary" className="text-xs">Backgrounds</Badge>
                            <Badge variant="secondary" className="text-xs">Coloring</Badge>
                            <Badge variant="secondary" className="text-xs">Digital Art</Badge>
                          </div>
                        </div>
                        <Button>Invite</Button>
                      </div>
                      
                      <div className="flex justify-center mt-4">
                        <Button variant="outline">View More Artists</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="requests" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Talent Applications</CardTitle>
                    <CardDescription>Creative professionals who want to join your projects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-4 p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage alt="Artist profile" />
                          <AvatarFallback>RS</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-slate-900">Robert Smith</h4>
                            <div className="flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1 text-slate-400" />
                              <span className="text-xs text-slate-400">2 days ago</span>
                            </div>
                          </div>
                          <p className="text-sm text-slate-500">
                            Letterer • Interested in "Stellar Adventures #12"
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-sm border-t border-b py-2 border-slate-100">
                        I've been following your work and would love to collaborate on your latest project. I have 5 years of experience in lettering for action comics.
                      </p>
                      
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline">Decline</Button>
                        <Button>Accept Request</Button>
                      </div>
                    </div>
                    
                    <div className="text-center py-4 mt-4">
                      <p className="text-sm text-slate-500">No more pending requests</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invite Collaborators</CardTitle>
                <CardDescription>Add team members to your projects</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Email Address</label>
                  <Input 
                    type="email" 
                    placeholder="collaborator@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Role</label>
                  <Select
                    value={selectedRole}
                    onValueChange={setSelectedRole}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="writer">Writer</SelectItem>
                      <SelectItem value="artist">Artist</SelectItem>
                      <SelectItem value="colorist">Colorist</SelectItem>
                      <SelectItem value="letterer">Letterer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Project</label>
                  <Select defaultValue="">
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Projects</SelectItem>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()}>
                          {project.title} {project.issue}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={handleInvite}
                  disabled={!inviteEmail}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Send Invitation
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Team Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Artists</span>
                      <span className="text-sm font-medium">3</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: '50%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Writers</span>
                      <span className="text-sm font-medium">2</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-secondary rounded-full" style={{ width: '33%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Colorists</span>
                      <span className="text-sm font-medium">1</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: '17%' }}></div>
                    </div>
                  </div>
                  
                  <div className="pt-4 mt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Team Members</span>
                      <span className="text-sm font-bold">{users?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
