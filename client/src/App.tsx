import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMobileSidebar } from "@/hooks/use-mobile-sidebar";
import { AppLayout } from "@/components/layouts/app-layout";
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
        <Route path="/" component={Dashboard} />
        <Route path="/projects" component={Projects} />
        <Route path="/projects/new" component={ProjectCreate} />
        <Route path="/projects/:id" component={ProjectDetails} />
        <Route path="/script-editor" component={ScriptEditor} />
        <Route path="/panel-editor" component={PanelEditor} />
        <Route path="/feedback/:id" component={FeedbackDetails} />
        <Route path="/collaborators" component={Collaborators} />
        <Route path="/asset-library" component={AssetLibrary} />
        <Route path="/publication" component={Publication} />
        <Route component={NotFound} />
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
