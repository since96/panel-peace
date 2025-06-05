import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";

export default function Home() {
  const [_, navigate] = useLocation();
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    if (isAuthenticated) {
      // If authenticated, redirect to dashboard
      navigate('/projects');
    }
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>Panel Peace - No Chaos. Just Comics.</title>
        <meta 
          name="description" 
          content="Streamline your comic book editing process with Panel Peace. Manage talent, track progress, and deliver your comics faster." 
        />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted">
        {/* Animated tagline */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-primary mb-4">
            Comic Editor Pro
          </h1>
          
          <div className="relative h-24 w-full max-w-2xl overflow-hidden my-6">
            <AnimatePresence>
              {/* First phase: "Fueled by Editor Tears" */}
              <motion.h2 
                className="text-2xl md:text-4xl font-medium tracking-wide absolute left-0 right-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                exit={{ opacity: 0 }}
                key="initial-text"
              >
                Fueled by
                <motion.span 
                  className="mx-1"
                  initial={{ margin: "0 0.25rem" }}
                  animate={{ margin: "0 2.5rem" }}
                  transition={{ 
                    delay: 3,
                    duration: 2, 
                    ease: "easeInOut",
                  }}
                >
                  Editor
                </motion.span>
                Tears
              </motion.h2>

              {/* Second phase: Add "HAPPY" */}
              <motion.span
                className="text-2xl md:text-4xl font-bold text-accent absolute left-[50%] transform -translate-x-[50%]"
                initial={{ opacity: 0, y: 0 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                }}
                transition={{ 
                  delay: 6, 
                  duration: 0.8,
                  onComplete: () => setAnimationComplete(true)
                }}
                key="happy-text"
              >
                HAPPY
              </motion.span>
            </AnimatePresence>
          </div>
          
          <p className="text-lg md:text-xl max-w-xl mx-auto mt-10 mb-8">
            The comprehensive solution for comic book editors to manage talent, 
            track project progress, and deliver amazing comics on schedule.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Button 
              size="lg" 
              onClick={() => navigate('/simple-login')} 
              className="min-w-[150px]"
            >
              Sign In
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => navigate('/signup')} 
              className="min-w-[150px]"
            >
              Sign Up
            </Button>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Purveyor Creative. All rights reserved.
        </footer>
      </div>
    </>
  );
}