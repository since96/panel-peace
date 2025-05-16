import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useMobileSidebar } from "@/hooks/use-mobile-sidebar";
import { AppLayout } from "@/components/layouts/app-layout";
import { SimpleProtected } from "@/components/auth/simple-protected";
import { SimpleNav } from "@/components/auth/simple-nav";
import { DirectAuthProvider } from "@/hooks/useDirectAuth";
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
import { SimpleLogin } from "./pages/simple-login";
import Signup from "./pages/signup";
import ProfilePage from "./pages/profile";
import StudiosPage from "./pages/studios";
import DeadlineHelper from "./pages/deadline-helper";
import RouteTest from "./pages/route-test";
import { HelmetProvider } from "react-helmet-async";

function Router() {
  const { isMobileSidebarOpen, toggleMobileSidebar, closeMobileSidebar } = useMobileSidebar();

  return (
    <Switch>
      {/* Login pages - not protected, not using app layout */}
      <Route path="/login">
        <SimpleLogin />
      </Route>
      <Route path="/simple-login">
        <SimpleLogin />
      </Route>
      <Route path="/signup">
        <Signup />
      </Route>
      
      {/* All other routes use the app layout and are protected */}
      <Route>
        <AppLayout 
          isOpen={isMobileSidebarOpen} 
          toggleSidebar={toggleMobileSidebar} 
          closeSidebar={closeMobileSidebar}
        >
          <Switch>
            <Route path="/">
              <SimpleProtected>
                <Dashboard />
              </SimpleProtected>
            </Route>
            <Route path="/projects">
              <SimpleProtected>
                <Projects />
              </SimpleProtected>
            </Route>
            <Route path="/projects/new">
              <SimpleProtected>
                <ProjectCreate />
              </SimpleProtected>
            </Route>
            <Route path="/projects/:id">
              <SimpleProtected>
                <ProjectDetails />
              </SimpleProtected>
            </Route>
            <Route path="/script-editor">
              <SimpleProtected>
                <ScriptEditor />
              </SimpleProtected>
            </Route>
            <Route path="/panel-editor">
              <SimpleProtected>
                <PanelEditor />
              </SimpleProtected>
            </Route>
            <Route path="/feedback/:id">
              <SimpleProtected>
                <FeedbackDetails />
              </SimpleProtected>
            </Route>
            <Route path="/collaborators">
              <SimpleProtected>
                <Collaborators />
              </SimpleProtected>
            </Route>
            <Route path="/asset-library">
              <SimpleProtected>
                <AssetLibrary />
              </SimpleProtected>
            </Route>
            <Route path="/publication">
              <SimpleProtected>
                <Publication />
              </SimpleProtected>
            </Route>
            <Route path="/profile">
              <SimpleProtected>
                <ProfilePage />
              </SimpleProtected>
            </Route>
            <Route path="/studios">
              <SimpleProtected>
                <StudiosPage />
              </SimpleProtected>
            </Route>
            <Route path="/deadline-helper">
              <SimpleProtected>
                <DeadlineHelper />
              </SimpleProtected>
            </Route>
            <Route path="/route-test">
              <SimpleProtected>
                <RouteTest />
              </SimpleProtected>
            </Route>
            <Route>
              <NotFound />
            </Route>
          </Switch>
        </AppLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <DirectAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </DirectAuthProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
