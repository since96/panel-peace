import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Studio } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function SimpleProjectCreate() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [issue, setIssue] = useState("");
  const [description, setDescription] = useState("");
  const [coverCount, setCoverCount] = useState("1");
  const [interiorPageCount, setInteriorPageCount] = useState("22");
  
  // Query for available bullpens
  const { data: studios, isLoading: isLoadingStudios } = useQuery<Studio[]>({
    queryKey: ['/api/studios'],
  });
  
  // Parse URL parameters for studioId
  const searchParams = new URLSearchParams(window.location.search);
  const studioIdParam = searchParams.get('studioId');
  // Check if we have a valid studioId and if not, redirect to studios page
  const studioId = studioIdParam ? parseInt(studioIdParam) : null;
  
  useEffect(() => {
    // If studios are loaded and there are none, redirect to create a bullpen first
    if (!isLoadingStudios && studios && studios.length === 0) {
      sessionStorage.setItem("attempted_project_creation", "true");
      
      toast({
        title: "No Bullpens Available",
        description: "You need to create a bullpen before you can create comics.",
        variant: "destructive"
      });
      navigate("/studios/new");
      return;
    }
    
    // If studios are loaded but no studioId is provided in URL, redirect to projects page
    if (!isLoadingStudios && studios && studios.length > 0 && !studioId) {
      toast({
        title: "Bullpen Required",
        description: "Please select a bullpen for your new comic.",
      });
      navigate("/projects");
      return;
    }
  }, [isLoadingStudios, studios, studioId, navigate, toast]);
  
  // Ultra-simple form submission with no complex objects
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      toast({
        title: "Title required",
        description: "Please enter a title for the comic",
        variant: "destructive",
      });
      return;
    }
    
    if (!studioId) {
      toast({
        title: "Bullpen required",
        description: "Please select a bullpen",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create minimal project data
      const projectData = {
        title,
        issue,
        description,
        studioId: Number(studioId),
        status: "in_progress",
        progress: 0,
        createdBy: 1,
        // Default values for all other fields
        coverCount: Number(coverCount),
        interiorPageCount: Number(interiorPageCount),
        fillerPageCount: 0,
        pencilerPagesPerWeek: 5,
        inkerPagesPerWeek: 7,
        coloristPagesPerWeek: 10,
        lettererPagesPerWeek: 15,
        pencilBatchSize: 5,
        inkBatchSize: 5,
        letterBatchSize: 5,
        approvalDays: 2
      };
      
      console.log("Creating project with data:", projectData);
      
      // Direct fetch to avoid any library issues
      const response = fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
        credentials: 'include'
      })
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => {
            throw new Error(text || `Error ${response.status}: Failed to create comic`);
          });
        }
        return response.json();
      })
      .then(result => {
        console.log("Project created successfully:", result);
        toast({
          title: "Comic Created",
          description: "Your comic has been created successfully",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
        navigate(`/projects/${result.id}`);
      })
      .catch(error => {
        console.error("Error creating project:", error);
        toast({
          title: "Error creating comic",
          description: error.message || "Failed to create comic. Please try again.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
    } catch (error) {
      console.error("Unexpected error in form submit:", error);
      toast({
        title: "Error creating comic",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    navigate("/projects");
  };
  
  return (
    <>
      <Helmet>
        <title>Create New Comic - Panel Peace</title>
        <meta name="description" content="Create a new comic book. Set up comic details and initial parameters." />
      </Helmet>
      
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create New Comic</h1>
            <p className="text-slate-500 mt-1">Set up your new comic book series</p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Comic Details</CardTitle>
            <CardDescription>
              Enter the basic information for your new comic book
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Comic Title
                  </label>
                  <Input 
                    id="title"
                    placeholder="e.g. Stellar Adventures" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <p className="text-xs text-slate-500">
                    The main title of your comic book
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="issue" className="text-sm font-medium">
                    Issue Number
                  </label>
                  <Input 
                    id="issue"
                    placeholder="e.g. #1" 
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                  />
                  <p className="text-xs text-slate-500">
                    Optional issue number or identifier
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea 
                  id="description"
                  placeholder="Brief description of the comic book" 
                  className="h-24"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  A brief summary of the comic's plot or contents
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="coverCount" className="text-sm font-medium">
                    Cover Count
                  </label>
                  <Input 
                    id="coverCount"
                    type="number"
                    min="1"
                    value={coverCount}
                    onChange={(e) => setCoverCount(e.target.value)}
                  />
                  <p className="text-xs text-slate-500">
                    Number of variant covers
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="interiorPageCount" className="text-sm font-medium">
                    Interior Page Count
                  </label>
                  <Input 
                    id="interiorPageCount"
                    type="number"
                    min="1"
                    value={interiorPageCount}
                    onChange={(e) => setInteriorPageCount(e.target.value)}
                  />
                  <p className="text-xs text-slate-500">
                    Number of story pages
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Creating..." : "Create Comic"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}