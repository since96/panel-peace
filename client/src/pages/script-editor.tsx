import { useQuery } from '@tanstack/react-query';
import { Project, Asset } from '@shared/schema';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { SaveIcon, Share2, MessageSquare, FileText, Plus } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Helmet } from 'react-helmet-async';

export default function ScriptEditor() {
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [scriptContent, setScriptContent] = useState<string>('');
  const [feedbackMode, setFeedbackMode] = useState<boolean>(false);
  const [comments, setComments] = useState<Array<{id: number, text: string, user: string}>>([]);
  
  // Sample script template
  const scriptTemplate = `PANEL 1:
[Description of the scene for the artist]

CHARACTER 1: "Dialogue goes here"

CHARACTER 2: "Response dialogue"

PANEL 2:
[Description of the next panel]

CAPTION: Narrator text if needed

CHARACTER 1: "More dialogue"

-----

SCENE 2: [Location Description]

PANEL 1:
[Scene description]`;
  
  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    // In a real app, we would fetch the script for this project
    setScriptContent(scriptTemplate);
  };
  
  const handleScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setScriptContent(e.target.value);
  };
  
  const handleAddComment = () => {
    setComments([
      ...comments,
      {
        id: Date.now(),
        text: 'The dialogue in panel 3 needs work. Can we make it punchier?',
        user: 'AR'
      }
    ]);
  };
  
  return (
    <>
      <Helmet>
        <title>Script Editor - Comic Editor Pro</title>
        <meta name="description" content="Write and edit comic book scripts with our powerful editor. Add feedback, collaborate with your team, and track script revisions." />
      </Helmet>
      
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Script Editor</h1>
            <p className="text-slate-500 mt-1">Write and review comic book scripts</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <Select value={selectedProjectId} onValueChange={handleProjectChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.title} {project.issue}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setFeedbackMode(!feedbackMode)}>
              <MessageSquare className="h-4 w-4 mr-1" />
              {feedbackMode ? 'Edit Mode' : 'Feedback Mode'}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {selectedProjectId ? 
                      (projects?.find(p => p.id.toString() === selectedProjectId)?.title || 'Script Editor') +
                      (projects?.find(p => p.id.toString() === selectedProjectId)?.issue || '')
                      : 'Script Editor'}
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                    <Button size="sm">
                      <SaveIcon className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {selectedProjectId ? 'Edit script content below' : 'Select a project to edit its script'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedProjectId ? (
                  <div className="relative">
                    <Textarea
                      value={scriptContent}
                      onChange={handleScriptChange}
                      className="min-h-[500px] font-mono text-sm"
                      placeholder="Start writing your script..."
                      disabled={feedbackMode}
                    />
                    
                    {feedbackMode && comments.length > 0 && (
                      <div className="absolute top-4 right-4 space-y-2">
                        {comments.map(comment => (
                          <div key={comment.id} className="bg-primary/10 p-2 rounded-lg max-w-xs">
                            <div className="flex items-center mb-1">
                              <Avatar className="h-5 w-5 mr-1">
                                <AvatarFallback className="text-[0.5rem] bg-primary/20 text-primary">
                                  {comment.user}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium">Editor</span>
                            </div>
                            <p className="text-xs">{comment.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    <FileText className="h-16 w-16 text-slate-300 mb-3" />
                    <h3 className="text-lg font-medium text-slate-700 mb-1">No script selected</h3>
                    <p className="text-sm text-slate-500 mb-4 max-w-md">
                      Select a project from the dropdown above to start editing its script, or create a new script
                    </p>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Create New Script
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Script Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Format</label>
                  <Select defaultValue="comic">
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comic">Comic Book Script</SelectItem>
                      <SelectItem value="screenplay">Screenplay</SelectItem>
                      <SelectItem value="marvel">Marvel Method</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Characters</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Button variant="outline" size="sm" className="text-xs h-7">Hero</Button>
                    <Button variant="outline" size="sm" className="text-xs h-7">Villain</Button>
                    <Button variant="outline" size="sm" className="text-xs h-7">Sidekick</Button>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Character
                  </Button>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Templates</label>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs">Panel Description</Button>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs">Scene Transition</Button>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs">Character Dialogue</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                {feedbackMode ? (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Add your feedback comments here..."
                      className="min-h-[100px]"
                    />
                    <Button onClick={handleAddComment} className="w-full">Add Comment</Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-500 mb-3">Enable feedback mode to review and comment on the script</p>
                    <Button variant="outline" onClick={() => setFeedbackMode(true)}>
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Enable Feedback Mode
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
