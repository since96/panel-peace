import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save, X } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function SimpleProjectCreate() {
  const [title, setTitle] = useState("");
  const [issue, setIssue] = useState("");
  const [description, setDescription] = useState("");
  const [studioId, setStudioId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [navigate, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Fetch studios for dropdown
  const { data: studios = [], isLoading: isLoadingStudios } = useQuery({
    queryKey: ["/api/studios"],
  });

  const handleSubmit = async (e: React.FormEvent) => {
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
        coverCount: 1,
        interiorPageCount: 22,
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
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error("Failed to create comic");
      }
      
      const result = await response.json();
      
      toast({
        title: "Comic created successfully",
        description: "Navigating to your new comic",
      });
      
      // Refresh projects list and navigate
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      navigate(`/projects/${result.id}`);
      
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error creating comic",
        description: "Failed to create comic. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    navigate("/projects");
  };

  return (
    <>
      <Helmet>
        <title>Create New Comic (Simple) | Panel Peace</title>
      </Helmet>
      
      <div className="container max-w-3xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create New Comic (Simple Form)</CardTitle>
            <p className="text-sm text-muted-foreground">
              This is a simplified form for Chrome users. It creates a comic with default settings.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Comic Title (Required)</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter comic title"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="studio">Bullpen (Required)</Label>
                  <Select 
                    value={studioId} 
                    onValueChange={setStudioId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a bullpen" />
                    </SelectTrigger>
                    <SelectContent>
                      {studios.map((studio: any) => (
                        <SelectItem key={studio.id} value={String(studio.id)}>
                          {studio.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="issue">Issue</Label>
                  <Input
                    id="issue"
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    placeholder="Issue number or subtitle (optional)"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the comic (optional)"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
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