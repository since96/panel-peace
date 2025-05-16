import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BuildingIcon, Users, PencilRuler, UsersRound, Trash2 } from 'lucide-react';
import { CreateStudioDialog } from '@/components/studio/create-studio-dialog';
import axios from 'axios';
import { useDirectAuth } from '@/hooks/useDirectAuth';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Base layout components (you should adjust these to match your actual layout)
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface Bullpen {
  id: number;
  name: string;
  description: string;
  logoUrl: string | null;
  createdAt: string;
  createdBy: number;
  active: boolean;
}

export default function StudiosPage() {
  // Fetch studios
  const { data: studios = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/studios'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/studios');
        console.log('Fetched studios:', response.data);
        
        if (!response.data || !Array.isArray(response.data)) {
          console.error('Invalid studios data:', response.data);
          return [];
        }
        
        // Add placeholder if empty (shouldn't happen with hardcoded studios)
        if (response.data.length === 0) {
          console.warn('No studios found, using placeholder data');
          return [
            {
              id: 999,
              name: "Placeholder Bullpen",
              description: "This bullpen is a placeholder for development",
              active: true,
              createdAt: new Date().toISOString(),
              createdBy: 1
            }
          ];
        }
        
        return response.data;
      } catch (error) {
        console.error('Error fetching studios:', error);
        return [];
      }
    },
    // Aggressive refetching for development
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 3000, // Refetch every 3 seconds during development
    retry: 3
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bullpens</h1>
          <Breadcrumb className="mt-2">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/studios">Bullpens</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <CreateStudioDialog />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading bullpens...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>Error loading bullpens. Please try again.</p>
        </div>
      ) : studios.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-10 text-center">
          <BuildingIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No studios found</h3>
          <p className="mt-2 text-gray-500">Get started by creating a new studio.</p>
          <div className="mt-6">
            <CreateStudioDialog />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studios.map((studio: Bullpen) => (
            <BullpenCard key={studio.id} studio={studio} />
          ))}
        </div>
      )}
    </div>
  );
}

function BullpenCard({ studio }: { studio: Bullpen }) {
  const { user } = useDirectAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  
  // Determine if current user is a site admin
  const isSiteAdmin = user?.isSiteAdmin === true;
  
  // Fetch studio editors (using React Query's defaults if data doesn't exist yet)
  const { data: editors = [] } = useQuery({
    queryKey: ['/api/studios', studio.id, 'editors'],
    queryFn: async () => {
      const response = await axios.get(`/api/studios/${studio.id}/editors`);
      return response.data;
    },
  });

  // Fetch studio projects
  const { data: projects = [] } = useQuery({
    queryKey: ['/api/studios', studio.id, 'projects'],
    queryFn: async () => {
      const response = await axios.get(`/api/studios/${studio.id}/projects`);
      return response.data;
    },
  });
  
  // Delete studio mutation
  const deleteStudioMutation = useMutation({
    mutationFn: async () => {
      return await axios.delete(`/api/studios/${studio.id}`);
    },
    onSuccess: () => {
      setIsDeleteOpen(false);
      // Invalidate the studios query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/studios'] });
      toast({
        title: "Studio deleted",
        description: `${studio.name} has been permanently deleted.`,
      });
    },
    onError: (error) => {
      console.error('Error deleting studio:', error);
      toast({
        title: "Error deleting studio",
        description: "There was a problem deleting the studio. Please try again later.",
        variant: "destructive"
      });
    }
  });

  return (
    <Card className="overflow-hidden">
      <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/10 relative">
        {studio.logoUrl && (
          <img
            src={studio.logoUrl}
            alt={`${studio.name} logo`}
            className="absolute bottom-0 right-4 translate-y-1/2 h-20 w-20 object-cover rounded-lg border-4 border-background"
          />
        )}
        {!studio.logoUrl && (
          <div className="absolute bottom-0 right-4 translate-y-1/2 h-20 w-20 flex items-center justify-center rounded-lg border-4 border-background bg-primary/10">
            <BuildingIcon className="h-8 w-8 text-primary" />
          </div>
        )}
      </div>
      
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{studio.name}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {studio.description || 'No description provided'}
            </CardDescription>
          </div>
          
          <div className="flex items-center">
            {!studio.active && (
              <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-700 border-yellow-300">
                Pending Approval
              </Badge>
            )}
            
            {/* Delete Studio button - only visible to site admins */}
            {isSiteAdmin && (
              <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-2 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete Studio</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Studio</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete <strong>{studio.name}</strong>? This action will permanently delete
                      the studio, all its projects, and remove all users associated with it.
                      <br /><br />
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={(e) => {
                        e.preventDefault();
                        deleteStudioMutation.mutate();
                      }}
                      disabled={deleteStudioMutation.isPending}
                    >
                      {deleteStudioMutation.isPending ? 'Deleting...' : 'Delete Studio'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <UsersRound className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{editors.length} Editors</span>
            </div>
            <div className="flex items-center space-x-2">
              <PencilRuler className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{projects.length} Projects</span>
            </div>
          </div>
          
          {editors.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Editor in Chief</h4>
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={editors[0]?.profileImageUrl} />
                  <AvatarFallback>{editors[0]?.fullName?.substring(0, 2) || 'EIC'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{editors[0]?.fullName || 'Unnamed'}</p>
                  <p className="text-xs text-muted-foreground">{editors[0]?.email || 'No email'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-4">
        <div className="flex w-full space-x-2">
          <Button variant="outline" className="flex-1" asChild>
            <Link to={`/projects?studioId=${studio.id}`}>View Projects</Link>
          </Button>
          
          <Button 
            className="flex-1"
            asChild
          >
            <Link to={`/projects/new?studioId=${studio.id}`}>
              New Project
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}