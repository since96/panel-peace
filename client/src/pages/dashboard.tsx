import { CurrentProjects } from '@/components/dashboard/current-projects';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet-async';

export default function Dashboard() {
  return (
    <>
      <Helmet>
        <title>Dashboard - Comic Editor Pro</title>
        <meta name="description" content="Manage your comic book projects, creative talent, and editorial workflow with Comic Editor Pro's comprehensive dashboard." />
      </Helmet>
      
      <div className="max-w-7xl mx-auto">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage your projects, talent, and editorial workflow</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <select className="appearance-none bg-white border border-slate-300 rounded-lg px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
              <option>All Projects</option>
              <option>In Progress</option>
              <option>Needs Review</option>
              <option>Completed</option>
              <option>Delayed</option>
            </select>
            <Button variant="default" size="sm" className="flex items-center space-x-1">
              <i className="ri-filter-3-line"></i>
              <span>Filters</span>
            </Button>
          </div>
        </div>
        
        {/* Current Projects - The only section we're keeping */}
        <CurrentProjects />
      </div>
    </>
  );
}
