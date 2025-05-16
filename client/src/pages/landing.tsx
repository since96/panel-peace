import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";

export default function Landing() {
  const [_, navigate] = useLocation();
  const [animationComplete, setAnimationComplete] = useState(false);

  return (
    <>
      <Helmet>
        <title>Panel Peace - No Chaos. Just Comics.</title>
        <meta 
          name="description" 
          content="Streamline your comic book editing process with Panel Peace. Manage talent, track progress, and deliver your comics faster." 
        />
      </Helmet>
      
      {/* Simple navigation */}
      <div className="bg-white border-b border-gray-200 py-3 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <span className="text-xl font-bold text-primary">
              Panel Peace
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Button 
              size="sm" 
              onClick={() => navigate('/simple-login')}
            >
              Login
            </Button>
          </div>
        </div>
      </div>
      
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-slate-50">
        {/* Hero section with animation */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center py-24">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-primary mb-3">
            Panel Peace
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-6">
            No Chaos. Just Comics.
          </p>
          
          <div className="h-48 w-full flex flex-col items-center justify-center my-8">
            <motion.div
              className="text-2xl md:text-4xl font-medium mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Fueled by
            </motion.div>
            
            <motion.div
              className="mb-4 flex flex-col items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {!animationComplete ? (
                <div className="text-2xl md:text-4xl font-medium text-center">
                  Comic Editor
                </div>
              ) : (
                <motion.div 
                  className="text-center flex items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1 }}
                >
                  <span className="text-2xl md:text-4xl font-medium">Comic Editor</span>
                  <span className="text-2xl md:text-4xl font-bold text-accent ml-4">HAPPY</span>
                </motion.div>
              )}
            </motion.div>
            
            <motion.div
              className="text-2xl md:text-4xl font-medium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Tears
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 1, delay: 3 }}
              onAnimationComplete={() => {
                setTimeout(() => setAnimationComplete(true), 1000);
              }}
            />
          </div>
          
          <p className="text-lg md:text-xl max-w-xl mx-auto mt-12 mb-8 text-slate-700">
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
          
          <div className="mt-6">
            <Button 
              variant="secondary"
              className="bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
              onClick={() => navigate('/simple-login')}
            >
              Take Me for a Test Drive
            </Button>
          </div>
        </div>
        
        {/* Feature section */}
        <div className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Streamline Your Comic Production</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="flex flex-col items-center text-center p-6 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <div className="text-primary font-bold text-xl">✏️</div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Talent Management</h3>
                <p className="text-slate-600">Track your creative talent and efficiently assign talent to projects.</p>
              </div>
              
              <div className="flex flex-col items-center text-center p-6 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <div className="text-primary font-bold text-xl">⏱️</div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Deadline Tracking</h3>
                <p className="text-slate-600">Calculate realistic timelines and monitor progress to ensure on-time delivery.</p>
              </div>
              
              <div className="flex flex-col items-center text-center p-6 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <div className="text-primary font-bold text-xl">📚</div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Asset Management</h3>
                <p className="text-slate-600">Organize assets throughout the entire comic creation workflow.</p>
              </div>
              
              <div className="flex flex-col items-center text-center p-6 rounded-lg">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <div className="text-primary font-bold text-xl">👥</div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Bullpen Organization</h3>
                <p className="text-slate-600">Manage editorial teams and control project access with flexible permissions.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Call to action */}
        <div className="py-16 bg-gradient-to-br from-primary/10 to-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to transform your comic editing process?</h2>
            <p className="text-lg max-w-xl mx-auto mb-8">Join Comic Editor Pro today and experience a more efficient way to manage your comic book production.</p>
            <Button 
              size="lg" 
              onClick={() => navigate('/simple-login')} 
            >
              Get Started
            </Button>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="py-8 bg-slate-900 text-white">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4">Panel Peace</h3>
              <p className="text-slate-300 mb-4">The premier tool for comic book editors</p>
              <p className="text-sm text-slate-400">
                © {new Date().getFullYear()} Purveyor Creative. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}