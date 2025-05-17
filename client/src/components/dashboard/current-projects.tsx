import { ProjectCard } from '@/components/ui/custom/project-card';
import { useQuery } from '@tanstack/react-query';
import { Project } from '@shared/schema';
import { Link } from 'wouter';

export function CurrentProjects() {
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">Current Comics</h2>
        <Link href="/projects" className="text-primary text-sm font-medium flex items-center">
          <span>View all comics</span>
          <i className="ri-arrow-right-s-line ml-1"></i>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm h-40 animate-pulse">
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
            <div key={project.id}>
              <ProjectCard project={project} />
            </div>
          ))}
          
          {projects?.length === 0 && (
            <div className="col-span-3 py-12 flex flex-col items-center justify-center text-center">
              <div className="text-4xl text-slate-300 mb-3">
                <i className="ri-file-list-line"></i>
              </div>
              <h3 className="text-lg font-medium text-slate-600 mb-1">No comics yet</h3>
              <p className="text-sm text-slate-500 mb-4">Create your first comic book to get started</p>
              <Link href="/projects/new" className="inline-flex items-center text-sm font-medium text-primary">
                <i className="ri-add-line mr-1"></i>
                <span>Create a new comic</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
