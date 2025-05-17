import { useQuery } from '@tanstack/react-query';
import { Project } from '@shared/schema';
import { ProjectCard } from '@/components/ui/custom/project-card';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { SelectStudioDialog } from '@/components/studio/select-studio-dialog';

export default function Projects() {
  // Get the studioId from URL query parameters if it exists
  const searchParams = new URLSearchParams(window.location.search);
  const studioIdParam = searchParams.get('studioId');
  const studioId = studioIdParam ? parseInt(studioIdParam) : null;
  
  // If studioId is present, fetch projects for the specific studio
  const apiUrl = studioId ? `/api/studios/${studioId}/projects` : '/api/projects';
  
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: [apiUrl],
    queryFn: async () => {
      const response = await axios.get(apiUrl);
      return response.data;
    },
  });
  
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Filter projects by status
  const filteredProjects = projects?.filter((project) => {
    if (statusFilter === 'all') return true;
    return project.status === statusFilter;
  });
  
  // We'll fetch actual collaborators in a future enhancement
  // For now, we won't display random collaborators
  
  return (
    <>
      <Helmet>
        <title>Studio Comics - Comic Editor Pro</title>
        <meta name="description" content="View and manage all your comic books. Create new comics, track progress, and collaborate with your talent team." />
      </Helmet>
      
      <div className="max-w-7xl mx-auto">
        {/* Projects Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Studio Comics</h1>
            <p className="text-slate-500 mt-1">Manage your comic book titles and issues</p>
          </div>
          <div className="mt-4 md:mt-0">
            {studioId ? (
              <Button 
                className="flex items-center gap-2"
                asChild
              >
                <Link to={`/projects/new?studioId=${studioId}`}>
                  <Plus className="h-4 w-4" />
                  <span>New Comic</span>
                </Link>
              </Button>
            ) : (
              <SelectStudioDialog />
            )}
          </div>
        </div>
        
        {/* Project Filters */}
        <Tabs
          defaultValue="all"
          className="mb-6"
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <TabsList className="grid grid-cols-5 w-full max-w-xl">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="needs_review">Needs Review</TabsTrigger>
            <TabsTrigger value="delayed">Delayed</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm h-80 animate-pulse">
                <div className="h-48 bg-slate-200"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                  <div className="h-2 bg-slate-200 rounded w-full mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {filteredProjects && filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <div key={project.id}>
                    <ProjectCard project={project} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="text-5xl text-slate-300 mb-4">
                  <i className="ri-inbox-line"></i>
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">No projects found</h2>
                <p className="text-slate-500 mb-6">
                  {statusFilter === 'all' 
                    ? "You haven't created any projects yet. Create your first project to get started."
                    : `You don't have any projects with '${statusFilter.replace('_', ' ')}' status.`}
                </p>
                {studioId ? (
                  <Button 
                    className="flex items-center gap-2"
                    asChild
                  >
                    <Link to={`/projects/new?studioId=${studioId}`}>
                      <Plus className="h-4 w-4" />
                      <span>Create New Comic</span>
                    </Link>
                  </Button>
                ) : (
                  <SelectStudioDialog />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
