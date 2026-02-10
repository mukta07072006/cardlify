import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import NewProject from "./pages/NewProject";
import TemplateEditor from "./pages/TemplateEditor";
import ProjectDetails from "./pages/ProjectDetails";
import SubmissionForm from "./pages/SubmissionForm";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import EliteAdmin from "./pages/EliteAdmin";
import Templates from "./pages/Templates";
import LovelyPeoples from "./pages/lovelyPeople";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <div className="pixel-grid-bg">
          <BrowserRouter>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/elite" element={<EliteAdmin />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/project/new" element={<NewProject />} />
            <Route path="/project/:projectId" element={<ProjectDetails />} />
            <Route path="/project/:projectId/editor" element={<TemplateEditor />} />
            <Route path="/submit/:projectId" element={<SubmissionForm />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/lovelypeoples" element={<LovelyPeoples/>}/>
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </div>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
