import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { SimpleNav } from "@/components/auth/simple-nav";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Call signup API
      const response = await axios.post("/api/signup", {
        username,
        password,
        fullName,
        email,
        isEditor: true, // For testing, everyone gets editor access
        editorRole: "editor", // Default editor role
        role: "Editor"
      });

      if (response.data.success) {
        toast({
          title: "Account created!",
          description: "Your account has been created successfully. You can now log in.",
        });
        setLocation("/login");
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.response?.data?.message || "Failed to create account. Please try again.");
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: err.response?.data?.message || "An error occurred during signup.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <SimpleNav />
      <div className="container flex items-center justify-center min-h-screen py-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Create an Account</CardTitle>
            <CardDescription className="text-center">
              Sign up to manage comic book projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
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
                  placeholder="Create a password"
                  required
                />
              </div>
              
              {error && <p className="text-sm font-medium text-red-600">{error}</p>}
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Sign Up"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <a
                onClick={() => navigate("/login")}
                className="text-primary underline cursor-pointer"
              >
                Log in
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}