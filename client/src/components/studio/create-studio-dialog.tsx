import React, { useState } from 'react';
import axios from 'axios';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Loader2 } from 'lucide-react';

// Form validation schema
const studioFormSchema = z.object({
  name: z.string().min(2, {
    message: "Bullpen name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
});

// EIC validation schema
const eicFormSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Combined schema for full form
const formSchema = z.object({
  studioData: studioFormSchema,
  userData: eicFormSchema,
});

export function CreateStudioDialog() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('studio');
  const { toast } = useToast();
  
  // Create form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studioData: {
        name: '',
        description: '',
        logoUrl: '',
      },
      userData: {
        username: '',
        email: '',
        fullName: '',
        password: '',
        confirmPassword: '',
      }
    },
  });
  
  // Mutation for creating studio
  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      try {
        console.log('Sending studio creation data:', JSON.stringify(data));
        const response = await axios.post('/api/studio/signup', data);
        console.log('Studio creation response:', response.data);
        return response.data;
      } catch (error: any) {
        console.error('API error creating studio:', error.response?.data || error.message);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Studio created successfully:', data);
      
      // Reset form and close dialog
      form.reset();
      setOpen(false);
      setActiveTab('studio');
      
      // Show success toast
      toast({
        title: "Studio created",
        description: "The studio has been created successfully.",
      });
      
      // Force invalidate studios query to refresh the list
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/studios'] });
      }, 500);
    },
    onError: (error: any) => {
      console.error('Error creating studio:', error);
      
      // Show detailed error toast
      toast({
        variant: "destructive",
        title: "Failed to create studio",
        description: error.response?.data?.message || error.message || "Please try again later.",
      });
    },
  });
  
  // Handle form submission
  function onSubmit(data: z.infer<typeof formSchema>) {
    mutation.mutate(data);
  }
  
  // Handle tab change
  function handleTabChange(value: string) {
    setActiveTab(value);
    
    // Validate current tab before allowing to move to the next
    if (value === 'eic') {
      form.trigger('studioData');
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Studio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create a new bullpen</DialogTitle>
          <DialogDescription>
            Create a new bullpen for your comic book and set up the Editor-in-Chief account.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="studio">Bullpen Details</TabsTrigger>
                <TabsTrigger 
                  value="eic" 
                  disabled={!form.formState.dirtyFields.studioData || 
                   (form.formState.errors.studioData !== undefined)}>
                  Editor-in-Chief
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="studio" className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="studioData.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bullpen Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter the bullpen name" {...field} />
                      </FormControl>
                      <FormDescription>
                        The name of your publishing bullpen.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="studioData.description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter a description for the bullpen" 
                          className="resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        A brief description of the studio and its focus.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="studioData.logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/logo.png" {...field} />
                      </FormControl>
                      <FormDescription>
                        A URL to your studio's logo image.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-4 flex justify-end">
                  <Button 
                    type="button" 
                    onClick={() => handleTabChange('eic')}
                    disabled={!form.formState.dirtyFields.studioData || 
                      (form.formState.errors.studioData !== undefined)}
                  >
                    Next
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="eic" className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="userData.username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter a username" {...field} />
                      </FormControl>
                      <FormDescription>
                        Username for the Editor-in-Chief account.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="userData.fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} />
                      </FormControl>
                      <FormDescription>
                        Full name of the Editor-in-Chief.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="userData.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email*</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="editor@example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Email address for the Editor-in-Chief.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="userData.password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password*</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="userData.confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password*</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="pt-4 flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => handleTabChange('studio')}
                  >
                    Back
                  </Button>
                  
                  <Button 
                    type="submit"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Studio
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}