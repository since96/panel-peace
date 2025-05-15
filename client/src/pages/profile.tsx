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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

// Form schema for user profile
const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
});

// Form schema for password change
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function ProfilePage() {
  const { user, logout } = useDirectAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Profile update form
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      // Dynamically update values when user data changes
      fullName: user?.fullName || localStorage.getItem('fullName') || 'Your Name',
      email: user?.email || localStorage.getItem('email') || 'your.email@example.com',
    },
  });
  
  // Password change form
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
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

  // Handle profile form submission
  const onProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
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
  
  // Handle password change form submission
  const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    if (!user) return;
    
    try {
      setIsChangingPassword(true);
      console.log('Changing password for user ID:', user.id);
      
      // Call API to change password
      const response = await axios.post(`/api/users/${user.id}/change-password`, {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      
      if (response.data) {
        // Reset the form
        passwordForm.reset({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        
        toast({
          title: 'Password Changed',
          description: 'Your password has been updated successfully.',
        });
      }
    } catch (error: any) {
      console.error('Failed to change password:', error);
      
      const errorMessage = error.response?.data?.message || 'There was a problem changing your password.';
      const fieldErrors = error.response?.data?.errors;
      
      // Set field errors if they exist
      if (fieldErrors?.currentPassword) {
        passwordForm.setError('currentPassword', { 
          message: fieldErrors.currentPassword._errors[0] 
        });
      }
      
      toast({
        title: 'Password Change Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
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
              <AvatarImage alt={user?.fullName || profileForm.getValues('fullName')} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {getInitials(profileForm.getValues('fullName'))}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{profileForm.getValues('fullName')}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{user?.role || 'Editor'}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profile" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="mt-6">
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <FormField
                    control={profileForm.control}
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
                    control={profileForm.control}
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
                  
                  <div className="flex justify-end items-center pt-4">
                    <Button 
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="password" className="mt-6">
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter current password" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter new password" type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          Password must be at least 6 characters long
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input placeholder="Confirm new password" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end items-center pt-4">
                    <Button 
                      type="submit"
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
          
          <Separator className="my-6" />
          
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => logout()}
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}