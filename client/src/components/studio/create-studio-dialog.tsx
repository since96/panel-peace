import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// UI Components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Building2 } from 'lucide-react';

// Schema for studio creation
const studioSchema = z.object({
  name: z.string().min(2, "Studio name must be at least 2 characters").max(50, "Studio name must be less than 50 characters"),
  description: z.string().optional(),
  logoUrl: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
});

// Schema for EIC creation
const eicSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  socialMedia: z.string().optional(),
});

// Combined schema for studio with EIC
const studioWithEicSchema = z.object({
  studio: studioSchema,
  eic: eicSchema,
});

// Schema for creating studio with default EIC
const studioWithDefaultEicSchema = studioSchema.extend({
  createDefaultEic: z.boolean().default(true),
});

export function CreateStudioDialog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'with-eic' | 'default-eic'>('with-eic');

  // Form for creating studio with EIC
  const withEicForm = useForm<z.infer<typeof studioWithEicSchema>>({
    resolver: zodResolver(studioWithEicSchema),
    defaultValues: {
      studio: {
        name: '',
        description: '',
        logoUrl: '',
      },
      eic: {
        username: '',
        password: '',
        fullName: '',
        email: '',
        phone: '',
        socialMedia: '',
      },
    },
  });

  // Form for creating studio with default EIC
  const defaultEicForm = useForm<z.infer<typeof studioWithDefaultEicSchema>>({
    resolver: zodResolver(studioWithDefaultEicSchema),
    defaultValues: {
      name: '',
      description: '',
      logoUrl: '',
      createDefaultEic: true,
    },
  });

  // Handle submit for studio with EIC
  const onSubmitWithEic = async (data: z.infer<typeof studioWithEicSchema>) => {
    try {
      // Create studio with EIC
      const response = await axios.post('/api/studio/signup', {
        studioData: data.studio,
        userData: {
          ...data.eic,
          isEditor: true,
          editorRole: 'editor_in_chief'
        }
      });

      if (response.status === 201) {
        // Success
        toast({
          title: "Studio created!",
          description: `Studio "${data.studio.name}" has been created with ${data.eic.fullName} as Editor-in-Chief.`,
        });
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/studios'] });
        
        // Close the dialog
        setOpen(false);
        // Reset form
        withEicForm.reset();
      }
    } catch (error: any) {
      console.error("Error creating studio with EIC:", error);
      toast({
        title: "Error creating studio",
        description: error.response?.data?.message || "An error occurred while creating the studio.",
        variant: "destructive",
      });
    }
  };

  // Handle submit for studio with default EIC
  const onSubmitDefaultEic = async (data: z.infer<typeof studioWithDefaultEicSchema>) => {
    try {
      // Create studio with default EIC
      const defaultEicData = {
        username: `eic_${Date.now()}`,
        password: `password_${Math.random().toString(36).slice(2, 10)}`,
        fullName: `${data.name} Editor-in-Chief`,
        email: `eic_${Date.now()}@placeholder.com`,
        isEditor: true,
        editorRole: 'editor_in_chief'
      };

      const response = await axios.post('/api/studio/signup', {
        studioData: {
          name: data.name,
          description: data.description,
          logoUrl: data.logoUrl
        },
        userData: defaultEicData
      });

      if (response.status === 201) {
        // Success
        toast({
          title: "Studio created!",
          description: `Studio "${data.name}" has been created with a default Editor-in-Chief. Please provide them with these credentials:\nUsername: ${defaultEicData.username}\nPassword: ${defaultEicData.password}`,
          duration: 10000, // Show longer so they can copy credentials
        });
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/studios'] });
        
        // Close the dialog
        setOpen(false);
        // Reset form
        defaultEicForm.reset();
      }
    } catch (error: any) {
      console.error("Error creating studio with default EIC:", error);
      toast({
        title: "Error creating studio",
        description: error.response?.data?.message || "An error occurred while creating the studio.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Studio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create a New Studio</DialogTitle>
          <DialogDescription>
            Create a new studio and assign an Editor-in-Chief who will manage it.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="with-eic" className="w-full" onValueChange={(value) => setMode(value as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="with-eic">Editor-in-Chief Info</TabsTrigger>
            <TabsTrigger value="default-eic">Default EIC Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="with-eic">
            <Form {...withEicForm}>
              <form onSubmit={withEicForm.handleSubmit(onSubmitWithEic)} className="space-y-4 py-4">
                <div className="space-y-4 border p-4 rounded-md">
                  <h3 className="font-medium flex items-center">
                    <Building2 className="mr-2 h-4 w-4" />
                    Studio Information
                  </h3>
                  
                  <FormField
                    control={withEicForm.control}
                    name="studio.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Studio Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Marvel Comics" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={withEicForm.control}
                    name="studio.description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of the studio..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={withEicForm.control}
                    name="studio.logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/logo.png" {...field} />
                        </FormControl>
                        <FormDescription>
                          URL to the studio's logo image
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-4 border p-4 rounded-md">
                  <h3 className="font-medium">Editor-in-Chief Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={withEicForm.control}
                      name="eic.username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username*</FormLabel>
                          <FormControl>
                            <Input placeholder="john_editor" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={withEicForm.control}
                      name="eic.password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password*</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={withEicForm.control}
                    name="eic.fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="John Editor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={withEicForm.control}
                    name="eic.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email*</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={withEicForm.control}
                      name="eic.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={withEicForm.control}
                      name="eic.socialMedia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Social Media</FormLabel>
                          <FormControl>
                            <Input placeholder="@johneditor" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit">Create Studio with EIC</Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="default-eic">
            <Form {...defaultEicForm}>
              <form onSubmit={defaultEicForm.handleSubmit(onSubmitDefaultEic)} className="space-y-4 py-4">
                <div className="space-y-4 border p-4 rounded-md">
                  <h3 className="font-medium flex items-center">
                    <Building2 className="mr-2 h-4 w-4" />
                    Studio Information
                  </h3>
                  
                  <FormField
                    control={defaultEicForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Studio Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Marvel Comics" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={defaultEicForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of the studio..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={defaultEicForm.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logo URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/logo.png" {...field} />
                        </FormControl>
                        <FormDescription>
                          URL to the studio's logo image
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-2 border p-4 rounded-md">
                  <FormField
                    control={defaultEicForm.control}
                    name="createDefaultEic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Create Default Editor-in-Chief</FormLabel>
                          <FormDescription>
                            We'll create a default EIC account with random credentials that the EIC can change later
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="submit">Create Studio with Default EIC</Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}