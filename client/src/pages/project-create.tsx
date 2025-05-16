import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema, Studio } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Save, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatDate } from "@/lib/utils";
import { Helmet } from "react-helmet-async";

const createProjectSchema = insertProjectSchema.extend({
  title: z.string().min(1, "Title is required"),
  dueDate: z.date().optional(),
  plotDeadline: z.date().optional(),
  coverDeadline: z.date().optional(),
  // Comic book metrics
  coverCount: z.number().min(1, "Must have at least 1 cover").default(1),
  interiorPageCount: z.number().min(1, "Must have at least 1 interior page").default(22),
  fillerPageCount: z.number().min(0, "Can't have negative pages").default(0),
  
  // Talent speed metrics
  pencilerPagesPerWeek: z.number().min(1, "Must complete at least 1 page per week").default(5),
  inkerPagesPerWeek: z.number().min(1, "Must complete at least 1 page per week").default(7),
  coloristPagesPerWeek: z.number().min(1, "Must complete at least 1 page per week").default(10),
  lettererPagesPerWeek: z.number().min(1, "Must complete at least 1 page per week").default(15),
  
  // Batch processing metrics
  pencilBatchSize: z.number().min(1, "Batch size must be at least 1 page").default(5),
  inkBatchSize: z.number().min(1, "Batch size must be at least 1 page").default(5),
  letterBatchSize: z.number().min(1, "Batch size must be at least 1 page").default(5),
  
  // Approval metrics
  approvalDays: z.number().min(1, "Must allow at least 1 day for approvals").default(2),
});

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

export default function ProjectCreate() {
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    // If studios are loaded and there are none, set session flag and redirect to create a bullpen first
    if (!isLoadingStudios && studios && studios.length === 0) {
      // Set a session storage flag to help the 404 page determine we came from project creation
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
        variant: "destructive"
      });
      navigate("/projects");
      return;
    }
    
    // If studioId is provided, validate it exists
    if (!isLoadingStudios && studios && studioId) {
      const selectedStudio = studios.find(studio => studio.id === studioId);
      if (!selectedStudio) {
        toast({
          title: "Invalid Bullpen",
          description: "The selected bullpen does not exist. Please choose a valid bullpen.",
          variant: "destructive"
        });
        navigate("/projects");
        return;
      }
      
      toast({
        title: "Bullpen Selected",
        description: `Creating comic for bullpen: ${selectedStudio.name}`,
      });
    }
  }, [studioId, studios, isLoadingStudios, toast, navigate]);
  
  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: "",
      issue: "",
      description: "",
      status: "in_progress",
      progress: 0,
      createdBy: 1, // Default user ID
      studioId: studioId, // Use the studio ID from URL or default value
      
      // Comic book metrics
      coverCount: 1,
      interiorPageCount: 22,
      fillerPageCount: 0,
      
      // Talent speed metrics
      pencilerPagesPerWeek: 5,
      inkerPagesPerWeek: 7,
      coloristPagesPerWeek: 10,
      lettererPagesPerWeek: 15,
      
      // Batch processing metrics
      pencilBatchSize: 5,
      inkBatchSize: 5,
      letterBatchSize: 5,
      
      // Approval metrics
      approvalDays: 2,
    }
  });
  
  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        // Add mandatory studioId if not present (this is a fallback for safety)
        if (!data.studioId) {
          data.studioId = 998; // Default to Marvel Comics
        }
        
        console.log("Making POST request to /api/projects with data:", data);
        
        // Use our API utility to handle authentication and errors
        const result = await import('../lib/api').then(module => {
          return module.apiPost('/api/projects', data);
        });
        console.log("Project created successfully:", result);
        return result;
      } catch (error) {
        console.error("Project creation error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Project created successfully:", data);
      toast({
        title: "Project created",
        description: "Your project has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      
      // Use proper navigation
      navigate(`/projects/${data.id}`);
    },
    onError: (error: any) => {
      console.error('Project creation error:', error);
      
      // Extract error message if available
      let errorMessage = "Failed to create project. Please try again.";
      
      // Better error handling for different error types
      if (error.message) {
        errorMessage = error.message;
      }
      
      // Handle both error formats from the server
      if (error.response) {
        // Format 1: error.response.message
        if (error.response.message) {
          errorMessage = error.response.message;
        }
        
        // Format 2: error.response.errors (validation errors)
        if (error.response.errors) {
          console.error('Validation errors:', JSON.stringify(error.response.errors));
          
          // Create a more user-friendly message detailing the validation errors
          const errorFields = Object.keys(error.response.errors)
            .filter(field => field !== '_errors')
            .map(field => field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1'));
          
          if (errorFields.length > 0) {
            errorMessage = `Please check these fields: ${errorFields.join(', ')}`;
          }
        }
      }
      
      // Special handling for studio ID issues (this is a common error)
      if (errorMessage.includes("Studio") || errorMessage.toLowerCase().includes("studio id")) {
        errorMessage = "Studio ID is required. Please try again or contact your administrator.";
      }
      
      toast({
        title: "Error creating project",
        description: errorMessage,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  });
  
  const onSubmit = (data: CreateProjectFormValues) => {
    setIsSubmitting(true);
    
    // Create a copy of the data for the mutation that we can safely modify
    const submissionData = { ...data };
    
    // Ensure we have the studio ID (should be 998 if not provided)
    console.log(`Final submission with studio ID: ${studioId}`);
    
    // Convert date fields to string format for API submission
    // The server expects strings that it can parse into database timestamps
    const apiData = {
      ...submissionData,
      // Always ensure the studioId is set as a number
      studioId: Number(studioId),
      // Convert date fields to ISO strings for the API
      dueDate: submissionData.dueDate ? submissionData.dueDate.toISOString() : undefined,
      plotDeadline: submissionData.plotDeadline ? submissionData.plotDeadline.toISOString() : undefined,
      coverDeadline: submissionData.coverDeadline ? submissionData.coverDeadline.toISOString() : undefined
    };
    
    // Debug the API data
    console.log("API data being sent:", JSON.stringify(apiData, null, 2));
    
    console.log("Creating comic with data:", apiData);
    createProjectMutation.mutateAsync(apiData);
  };
  
  const handleCancel = () => {
    navigate("/projects");
  };
  
  return (
    <>
      <Helmet>
        <title>Create New Comic - Comic Editor Pro</title>
        <meta name="description" content="Create a new comic book. Set up comic details, timeline, and initial parameters." />
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comic Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Stellar Adventures" {...field} />
                        </FormControl>
                        <FormDescription>
                          The main title of your comic book
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="issue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Issue Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. #1 or Vol. 2, #5" 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormDescription>
                          The issue number or identifier
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the comic story and concept"
                          className="min-h-[120px]"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        A short synopsis of your comic's plot or theme
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Comic Book Metrics Section */}
                <div className="pt-6 pb-2 border-t">
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Comic Book Metrics</h3>
                  <p className="text-sm text-slate-500 mb-4">Enter the basic specifications for this comic book</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="coverCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cover Count</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormDescription>
                            Number of covers for this issue
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="interiorPageCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interior Pages</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 22)}
                            />
                          </FormControl>
                          <FormDescription>
                            Number of interior comic pages
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="fillerPageCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Editorial Filler Pages</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0} 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            Additional editorial content pages
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Talent Speed Metrics Section */}
                <div className="pt-6 pb-2 border-t">
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Talent Speed Metrics</h3>
                  <p className="text-sm text-slate-500 mb-4">Define how many pages per week each role can complete</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <FormField
                      control={form.control}
                      name="pencilerPagesPerWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Penciler Speed</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                            />
                          </FormControl>
                          <FormDescription>
                            Pages per week
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="inkerPagesPerWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inker Speed</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 7)}
                            />
                          </FormControl>
                          <FormDescription>
                            Pages per week
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="coloristPagesPerWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Colorist Speed</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                            />
                          </FormControl>
                          <FormDescription>
                            Pages per week
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lettererPagesPerWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Letterer Speed</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 15)}
                            />
                          </FormControl>
                          <FormDescription>
                            Pages per week
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Batch Processing Section */}
                <div className="pt-6 pb-2 border-t">
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Batch Processing</h3>
                  <p className="text-sm text-slate-500 mb-4">Configure how many pages are needed before moving to the next stage</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="pencilBatchSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pencil Batch Size</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                            />
                          </FormControl>
                          <FormDescription>
                            Pages needed before inking
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="inkBatchSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ink Batch Size</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                            />
                          </FormControl>
                          <FormDescription>
                            Pages needed before coloring
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="letterBatchSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Letter Batch Size</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                            />
                          </FormControl>
                          <FormDescription>
                            Pages needed before final approval
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Approval Section */}
                <div className="pt-6 pb-2 border-t">
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Approval Process</h3>
                  <p className="text-sm text-slate-500 mb-4">Configure the approval timeline between stages</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="approvalDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Approval Days</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 2)}
                            />
                          </FormControl>
                          <FormDescription>
                            Days needed for approval between stages
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Deadline Section */}
                <div className="pt-6 pb-2 border-t">
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Project Deadlines</h3>
                  <p className="text-sm text-slate-500 mb-4">Set deadlines for key production stages</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="plotDeadline"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Plot Deadline</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    formatDate(field.value)
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Deadline for plot completion
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="coverDeadline"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Cover Artwork Deadline</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    formatDate(field.value)
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Deadline for cover artwork
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Final Due Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    formatDate(field.value)
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Final deadline for the entire project
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Status Section */}
                <div className="pt-6 pb-2 border-t">
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Project Status</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="needs_review">Needs Review</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="delayed">Delayed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Current status of the project
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
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
                    {isSubmitting ? "Creating..." : "Create Project"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
