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
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Loader2 } from 'lucide-react';

// Form validation schema - simplified for bullpen creation only
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Bullpen name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
});

export function CreateStudioDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  // Create form for bullpen creation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      logoUrl: '',
    },
  });
  
  // Mutation for creating bullpen
  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      try {
        // Format data to match the expected API structure
        const formattedData = {
          studioData: data,
          userData: null // Setting userData to null to indicate no EIC is being created
        };
        
        console.log('Sending bullpen creation data:', JSON.stringify(formattedData));
        const response = await axios.post('/api/studio/signup', formattedData);
        console.log('Bullpen creation response:', response.data);
        return response.data;
      } catch (error: any) {
        console.error('API error creating bullpen:', error.response?.data || error.message);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Bullpen created successfully:', data);
      
      // Reset form and close dialog
      form.reset();
      setOpen(false);
      
      // Show success toast
      toast({
        title: "Bullpen created",
        description: "The bullpen has been created successfully.",
      });
      
      // Force invalidate studios query to refresh the list
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/studios'] });
      }, 500);
    },
    onError: (error: any) => {
      console.error('Error creating bullpen:', error);
      
      // Show detailed error toast
      toast({
        variant: "destructive",
        title: "Failed to create bullpen",
        description: error.response?.data?.message || error.message || "Please try again later.",
      });
    },
  });
  
  // Handle form submission
  function onSubmit(data: z.infer<typeof formSchema>) {
    mutation.mutate(data);
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Bullpen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create a new bullpen</DialogTitle>
          <DialogDescription>
            Create a new bullpen for your comic book projects.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
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
                name="description"
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
                      A brief description of the bullpen and its focus.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/logo.png" {...field} />
                    </FormControl>
                    <FormDescription>
                      A URL to your bullpen's logo image (will appear on PDF exports).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="pt-4 flex justify-end">
                <Button 
                  type="submit"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Bullpen
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}