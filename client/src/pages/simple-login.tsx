import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderCircle } from "lucide-react";
import { useLocation } from "wouter";

export function SimpleLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [_, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log("Attempting login with:", username, password);
      
      console.log(`Attempting login with username: ${username}, password length: ${password.length}`);
      // Add more debugging to see what's happening
      try {
        const response = await fetch("/api/direct-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ username, password }),
          credentials: "include"
        });

        const data = await response.json();
        console.log("Login response:", data);

        if (data.success) {
          // Store user data in localStorage for authenticated state
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('fullName', data.user.fullName);
          localStorage.setItem('username', data.user.username);
          
          console.log("Successfully logged in, stored user data:", data.user);
          
          // Redirect to dashboard after successful login
          window.location.href = "/dashboard";
        } else {
          setError(data.message || "Login failed");
        }
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        setError("Connection error. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-amber-100 border-l-4 border-amber-500 p-4 mb-6 w-full max-w-md text-center">
        <p className="font-bold text-amber-900">THE PANEL PEACE EDITORIAL SOFTWARE IS IN BETA. SAFARI BROWSER PREFERRED. CHROME & FIREFOX BROWSERS EXPERIENCING TEMPORARY GLITCHES</p>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Panel Peace Login</CardTitle>
          <CardDescription className="text-center">
            Log in to manage comic book projects
          </CardDescription>
          <div className="mt-4 bg-amber-50 p-4 rounded-md border border-amber-100 text-amber-800">
            <p className="text-sm">
              <span className="uppercase font-semibold">Welcome to the Sneak Preview of Panel Peace!</span> Use the admin code provided to log in and poke around. And get ready to shed a few editorial happy tears.
            </p>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            
            <div className="my-4 p-4 border-2 border-amber-300 rounded-md bg-amber-50 text-center">
              <p className="text-base font-bold text-amber-800 mb-2">USE THIS LOGIN INFO FOR YOUR TEST DRIVE</p>
              <p className="text-lg font-medium text-gray-700">
                Default admin login:<br />
                Username: <span className="font-bold">admin</span><br />
                Password: <span className="font-bold">admin123</span>
              </p>
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
        <CardFooter className="flex flex-col items-center gap-4 pt-0">
          <p className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <a
              onClick={() => setLocation("/signup")}
              className="text-primary underline cursor-pointer"
            >
              Sign up
            </a>
          </p>
          
          <Button 
            variant="secondary"
            className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
            onClick={() => {
              // Auto-login as admin
              fetch('/api/auto-login-demo', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: 'admin', password: 'admin123' }),
              })
              .then(response => {
                if (response.ok) {
                  // Redirect to dashboard after successful login
                  window.location.href = "/dashboard";
                }
              });
            }}
          >
            Take Me for a Test Drive
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}