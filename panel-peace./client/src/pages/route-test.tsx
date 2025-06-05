import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function RouteTest() {
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    console.log("Current location:", location);
  }, [location]);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Router Test Page</h1>
      
      <div className="space-y-6">
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Current Location:</h2>
          <code className="block p-3 bg-slate-100 rounded">{location}</code>
        </div>
        
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Test Links:</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button asChild variant="outline" className="w-full">
              <Link to="/projects/new?studioId=998">
                Link to /projects/new?studioId=998
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link to="/projects/new">
                Link to /projects/new
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <a href="/projects/new?studioId=998">
                Standard A tag to /projects/new?studioId=998
              </a>
            </Button>
            
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => window.location.href = "/projects/new?studioId=998"}
            >
              window.location.href
            </Button>
            
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => setLocation("/projects/new?studioId=998")}
            >
              setLocation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}