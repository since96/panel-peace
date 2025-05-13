import { ProjectCard } from '@/components/ui/custom/project-card';
import { useQuery } from '@tanstack/react-query';
import { Project, User } from '@shared/schema';
import { Link } from 'wouter';

export function CurrentProjects() {
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  // For a production app, we would fetch actual collaborators
  // Here we're mocking some sample collaborators
  const sampleCollaborators = [
    { id: 1, name: 'Alex Rodriguez', avatarUrl: '' },
    { id: 2, name: 'Sarah Lee', avatarUrl: '' },
    { id: 3, name: 'James King', avatarUrl: '' },
    { id: 4, name: 'Mina Tan', avatarUrl: '' },
    { id: 5, name: 'David Chen', avatarUrl: '' },
  ];
  
  // Assign random collaborators to each project
  const getCollaboratorsForProject = (projectId: number) => {
    // In a real app, we would fetch this data from the API
    const count = Math.floor(Math.random() * 5) + 1; // 1-5 collaborators
    return sampleCollaborators.slice(0, count);
  };
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">Current Projects</h2>
        <Link href="/projects">
          <a className="text-primary text-sm font-medium flex items-center">
            <span>View all projects</span>
            <i className="ri-arrow-right-s-line ml-1"></i>
          </a>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <a>
                <ProjectCard
                  project={project}
                  collaborators={getCollaboratorsForProject(project.id)}
                />
              </a>
            </Link>
          ))}
          
          {projects?.length === 0 && (
            <div className="col-span-3 py-12 flex flex-col items-center justify-center text-center">
              <div className="text-4xl text-slate-300 mb-3">
                <i className="ri-file-list-line"></i>
              </div>
              <h3 className="text-lg font-medium text-slate-600 mb-1">No projects yet</h3>
              <p className="text-sm text-slate-500 mb-4">Create your first comic book project to get started</p>
              <Link href="/projects/new">
                <a className="inline-flex items-center text-sm font-medium text-primary">
                  <i className="ri-add-line mr-1"></i>
                  <span>Create a new project</span>
                </a>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
