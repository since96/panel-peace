import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useDirectAuth } from '@/hooks/useDirectAuth';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

// Form schema for user profile
const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
});

export default function ProfilePage() {
  const { user, logout } = useDirectAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
    },
  });

  // Generate initials for avatar fallback
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      // Only send password if it's provided
      const updateData = {
        fullName: values.fullName,
        email: values.email,
      };
      
      // Call API to update user
      const response = await axios.patch(`/api/users/${user.id}`, updateData);
      
      if (response.data) {
        // Update local storage with new user data
        const updatedUser = {
          ...user,
          fullName: values.fullName,
          email: values.email,
        };
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('isAuthenticated', 'true');
        
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        
        toast({
          title: 'Profile Updated',
          description: 'Your name and email have been updated successfully.',
        });
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: 'Update Failed',
        description: 'There was a problem updating your profile.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage alt={user.fullName || user.username} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {getInitials(user.fullName || user.username || '')}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user.fullName || user.username}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{user.role || 'Editor'}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Your email" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between items-center pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logout()}
                >
                  Sign Out
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}