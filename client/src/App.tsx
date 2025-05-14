import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMobileSidebar } from "@/hooks/use-mobile-sidebar";
import { AppLayout } from "@/components/layouts/app-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import ProjectCreate from "@/pages/project-create";
import ProjectDetails from "@/pages/project-details";
import ScriptEditor from "@/pages/script-editor";
import PanelEditor from "@/pages/panel-editor";
import Collaborators from "@/pages/collaborators-new";
import AssetLibrary from "@/pages/asset-library";
import Publication from "@/pages/publication";
import FeedbackDetails from "@/pages/feedback-details";
import { HelmetProvider } from "react-helmet-async";

function Router() {
  const { isMobileSidebarOpen, toggleMobileSidebar, closeMobileSidebar } = useMobileSidebar();

  return (
    <AppLayout 
      isOpen={isMobileSidebarOpen} 
      toggleSidebar={toggleMobileSidebar} 
      closeSidebar={closeMobileSidebar}
    >
      <Switch>
        <Route path="/">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/projects">
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        </Route>
        <Route path="/projects/new">
          <ProtectedRoute>
            <ProjectCreate />
          </ProtectedRoute>
        </Route>
        <Route path="/projects/:id">
          <ProtectedRoute>
            <ProjectDetails />
          </ProtectedRoute>
        </Route>
        <Route path="/script-editor">
          <ProtectedRoute>
            <ScriptEditor />
          </ProtectedRoute>
        </Route>
        <Route path="/panel-editor">
          <ProtectedRoute>
            <PanelEditor />
          </ProtectedRoute>
        </Route>
        <Route path="/feedback/:id">
          <ProtectedRoute>
            <FeedbackDetails />
          </ProtectedRoute>
        </Route>
        <Route path="/collaborators">
          <ProtectedRoute>
            <Collaborators />
          </ProtectedRoute>
        </Route>
        <Route path="/asset-library">
          <ProtectedRoute>
            <AssetLibrary />
          </ProtectedRoute>
        </Route>
        <Route path="/publication">
          <ProtectedRoute>
            <Publication />
          </ProtectedRoute>
        </Route>
        <Route>
          <NotFound />
        </Route>
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
