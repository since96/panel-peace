import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoaderCircle } from "lucide-react";
import axios from "axios";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      // Direct axios call instead of using hook to avoid any potential loops
      const response = await axios.post("/api/simple-login", { 
        username, 
        password 
      });
      
      if (response.data.success) {
        toast({
          title: "Login successful",
          description: `Welcome back, ${response.data.user.fullName || username}!`,
        });
        
        // Force page reload to ensure clean state
        window.location.href = "/";
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4">
      <div className="bg-amber-100 border-l-4 border-amber-500 p-4 mb-6 w-full max-w-md text-center">
        <p className="font-bold text-amber-900">THE PANEL PEACE EDITORIAL SOFTWARE IS IN BETA. SAFARI BROWSER PREFERRED. CHROME & FIREFOX BROWSERS EXPERIENCING TEMPORARY GLITCHES</p>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the Comic Book Publisher CMS
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="admin"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="admin123"
              />
            </div>
          </CardContent>
          
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}