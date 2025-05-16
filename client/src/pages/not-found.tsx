import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Building, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

export default function NotFound() {
  const [isFromProjectCreation, setIsFromProjectCreation] = useState(false);
  
  useEffect(() => {
    // Try to determine if we came from the project creation flow
    const referrer = document.referrer;
    const path = window.location.pathname;
    
    if (
      path.includes("/projects/new") || 
      referrer.includes("/projects/new") || 
      sessionStorage.getItem("attempted_project_creation") === "true"
    ) {
      setIsFromProjectCreation(true);
      sessionStorage.removeItem("attempted_project_creation");
    }
  }, []);
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          {isFromProjectCreation ? (
            <>
              <div className="flex mb-4 gap-2">
                <Building className="h-8 w-8 text-amber-500" />
                <h1 className="text-2xl font-bold text-gray-900">Bullpen Required</h1>
              </div>

              <p className="mt-4 text-sm text-gray-600">
                You need to create a bullpen before you can create comics. Every comic must be assigned to a bullpen.
              </p>
              
              <div className="mt-6">
                <Button 
                  onClick={() => window.location.href = "/studios"}
                  className="w-full"
                >
                  Create a Bullpen First
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = "/projects"} 
                  className="w-full mt-2"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Comics
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex mb-4 gap-2">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
              </div>

              <p className="mt-4 text-sm text-gray-600">
                The page you're looking for doesn't exist or you might not have access to it.
              </p>
              
              <div className="mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = "/"} 
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
