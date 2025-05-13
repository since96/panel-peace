import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Project, User } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserPlus, Mail, MessageSquare, Clock } from "lucide-react";
import { Helmet } from "react-helmet-async";

// Sample collaborator data (in a real app, this would come from the API)
const sampleCollaborators = [
  { id: 1, name: "Alex Rodriguez", role: "Senior Editor", avatarUrl: "", projectCount: 8 },
  { id: 2, name: "Sarah Lee", role: "Writer", avatarUrl: "", projectCount: 5 },
  { id: 3, name: "James King", role: "Artist", avatarUrl: "", projectCount: 4 },
  { id: 4, name: "Mina Tan", role: "Character Designer", avatarUrl: "", projectCount: 3 },
  { id: 5, name: "David Chen", role: "Colorist", avatarUrl: "", projectCount: 6 },
  { id: 6, name: "Julia Smith", role: "Letterer", avatarUrl: "", projectCount: 7 }
];

export default function Collaborators() {
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("artist");
  
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  // Filter collaborators based on search query
  const filteredCollaborators = sampleCollaborators.filter(
    collaborator => 
      collaborator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collaborator.role.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleInvite = () => {
    if (!inviteEmail) return;
    // In a real app, you would send an invitation to this email
    alert(`Invitation sent to ${inviteEmail} for role: ${selectedRole}`);
    setInviteEmail("");
  };
  
  return (
    <>
      <Helmet>
        <title>Collaborators - Comic Editor Pro</title>
        <meta name="description" content="Manage your team of collaborators. Invite artists, writers, and other team members to work on your comic book projects." />
      </Helmet>
      
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Collaborators</h1>
            <p className="text-slate-500 mt-1">Manage your team and project assignments</p>
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
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="team">My Team</TabsTrigger>
                <TabsTrigger value="artists">Available Artists</TabsTrigger>
                <TabsTrigger value="requests">Requests</TabsTrigger>
              </TabsList>
              
              <TabsContent value="team" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCollaborators.map((collaborator) => (
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
                              Working on {collaborator.projectCount} project{collaborator.projectCount !== 1 ? 's' : ''}
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
                  
                  {filteredCollaborators.length === 0 && (
                    <div className="col-span-2 py-12 flex flex-col items-center justify-center text-center bg-white rounded-xl shadow-sm">
                      <div className="text-4xl text-slate-300 mb-3">
                        <i className="ri-team-line"></i>
                      </div>
                      <h3 className="text-lg font-medium text-slate-600 mb-1">No collaborators found</h3>
                      <p className="text-sm text-slate-500 mb-4">
                        Try adjusting your search or invite new team members
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="artists" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Available Artists</CardTitle>
                    <CardDescription>Find artists to collaborate with on your projects</CardDescription>
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
                    <CardTitle>Collaboration Requests</CardTitle>
                    <CardDescription>People who want to join your projects</CardDescription>
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
                      <span className="text-sm font-bold">{sampleCollaborators.length}</span>
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
