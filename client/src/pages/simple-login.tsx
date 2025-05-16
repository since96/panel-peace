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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Comic Editor Login</CardTitle>
          <CardDescription className="text-center">
            Log in to manage comic book projects
          </CardDescription>
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
            
            <div className="text-sm text-gray-500">
              Default admin login:<br />
              Username: admin<br />
              Password: admin123
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