import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { generateProjectSlug } from '@/lib/urlUtils';
import { 
  ArrowLeft, 
  Edit, 
  Link2, 
  Download, 
  Trash2,
  Users,
  Loader2,
  Eye,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Project {
  id: string;
  project_name: string;
  template_image_url: string;
  status: string;
  created_at: string;
}

interface SubmissionSummary {
  id: string;
  participant_name: string;
  generated_card_url: string | null;
  created_at: string;
}

export default function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLink, setFormLink] = useState('');
  const [friendlyLink, setFriendlyLink] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [projectId, user]);

  const fetchData = async () => {
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);
      setFormLink(`${window.location.origin}/submit/${projectId}`);
      
      if (projectData.project_name) {
        const slug = generateProjectSlug(projectData.project_name);
        setFriendlyLink(`${window.location.origin}/submit/${projectId} (${slug})`);
      }

      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions_summary')
        .select('id, project_id, participant_name, created_at, generated_card_url')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .returns<SubmissionSummary[]>();

      if (submissionsError) throw submissionsError;
      setSubmissions(submissionsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load project');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async () => {
    if (!project) return;
    try {
      const newStatus = project.status === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);
      if (error) throw error;
      setProject({ ...project, status: newStatus });
      toast.success(`Project ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update project status');
    }
  };

  const deleteSubmission = async (submissionId: string) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', submissionId);
      if (error) throw error;
      setSubmissions(submissions.filter(s => s.id !== submissionId));
      toast.success('Submission deleted');
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast.error('Failed to delete submission');
    }
  };

  const downloadCard = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}-card.png`;
    link.target = '_blank';
    link.click();
  };

  const exportToCSV = async () => {
    if (!project) return;
    try {
      const { data: fullSubmissions, error: submissionsError } = await supabase
        .from('submissions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (submissionsError) throw submissionsError;
      if (!fullSubmissions || fullSubmissions.length === 0) {
        toast.warning('No submissions to export');
        return;
      }

      const headers = Object.keys(fullSubmissions[0]).filter(key => 
        !['id', 'project_id', 'field_values'].includes(key)
      );
      
      let allHeaders = [...headers];
      fullSubmissions.forEach(sub => {
        if (sub.field_values && typeof sub.field_values === 'object') {
          Object.keys(sub.field_values).forEach(fieldKey => {
            if (!allHeaders.includes(fieldKey)) allHeaders.push(fieldKey);
          });
        }
      });
      
      const csvRows = [];
      csvRows.push(allHeaders.join(','));
      fullSubmissions.forEach(sub => {
        const row = allHeaders.map(header => {
          if (header === 'field_values') {
            return JSON.stringify(sub[header] || {});
          } else if (header in sub) {
            const value = sub[header];
            return `"${String(value).replace(/"/g, '""')}"`;
          } else if (sub.field_values && typeof sub.field_values === 'object' && header in sub.field_values) {
            const value = sub.field_values[header];
            return `"${String(value).replace(/"/g, '""')}"`;
          }
          return '""';
        });
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.body.appendChild(document.createElement('a'));
      link.href = url;
      link.download = `${project.project_name}_submissions.csv`;
      link.click();
      document.body.removeChild(link);
      toast.success('Exported to CSV');
    } catch (error) {
      toast.error('CSV Export failed');
    }
  };

  const exportToPDF = async () => {
    if (!project) return;
    try {
      const jsPDFModule = await import('jspdf');
      const html2canvasModule = await import('html2canvas');
      const { jsPDF } = jsPDFModule;
      const html2canvas = html2canvasModule.default;

      const { data: fullSubmissions, error: submissionsError } = await supabase
        .from('submissions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (submissionsError) throw submissionsError;
      if (!fullSubmissions?.length) {
        toast.warning('No submissions to export');
        return;
      }

      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      
      const headers = Object.keys(fullSubmissions[0]).filter(key => !['id', 'project_id', 'field_values'].includes(key));
      let allHeaders = [...headers];
      fullSubmissions.forEach(sub => {
        if (sub.field_values) Object.keys(sub.field_values).forEach(k => { if(!allHeaders.includes(k)) allHeaders.push(k) });
      });

      const headerRow = document.createElement('tr');
      allHeaders.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        th.style.border = '1px solid black';
        th.style.padding = '8px';
        th.style.backgroundColor = '#f2f2f2';
        headerRow.appendChild(th);
      });
      table.appendChild(headerRow);

      fullSubmissions.forEach(sub => {
        const row = document.createElement('tr');
        allHeaders.forEach(h => {
          const td = document.createElement('td');
          td.textContent = sub[h] || (sub.field_values?.[h]) || '';
          td.style.border = '1px solid black';
          td.style.padding = '8px';
          row.appendChild(td);
        });
        table.appendChild(row);
      });

      const container = document.body.appendChild(document.createElement('div'));
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.appendChild(table);

      const canvas = await html2canvas(container);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 10, 10, 277, (canvas.height * 277) / canvas.width);
      pdf.save(`${project.project_name}_report.pdf`);
      document.body.removeChild(container);
      toast.success('Exported to PDF');
    } catch (error) {
      toast.error('PDF Export failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f0]">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f0] text-stone-900 font-mono uppercase selection:bg-rose-500 selection:text-white pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .font-pixel { font-family: 'Press Start 2P', monospace; }
        .pixel-card { border: 4px solid black; background: white; box-shadow: 6px 6px 0px 0px black; }
        .pixel-input { border: 2px solid black; border-radius: 0; }
      `}</style>

      {/* Header */}
      <header className="bg-white border-b-4 border-black sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="border-2 border-transparent hover:border-black rounded-none">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="hidden md:block">
              <h1 className="font-pixel text-xs truncate max-w-[200px]">{project?.project_name}</h1>
              <div className="flex gap-2 mt-1">
                <Badge className={`rounded-none font-pixel text-[8px] ${project?.status === 'active' ? 'bg-green-500' : 'bg-stone-400'}`}>
                  {project?.status}
                </Badge>
                <span className="text-[10px] text-stone-400 font-bold">VER: 1.0.4</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={toggleStatus} className="rounded-none border-2 border-black hover:bg-stone-100 hidden sm:flex">
              {project?.status === 'active' ? <ToggleRight className="mr-2" /> : <ToggleLeft className="mr-2" />}
              {project?.status === 'active' ? 'DISABLE' : 'ENABLE'}
            </Button>
            <Button onClick={() => navigate(`/project/${projectId}/editor`)} className="rounded-none bg-black text-white hover:bg-stone-800 font-pixel text-[10px] py-6 shadow-[4px_4px_0px_0px_#e11d48]">
              <Edit className="w-4 h-4 mr-2" />
              EDITOR
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-10 space-y-10">
        
        {/* Action Bar */}
        <div className="grid md:grid-cols-[1fr_auto] gap-6 items-end">
          <div className="pixel-card p-6">
            <h2 className="font-pixel text-[10px] mb-4 text-rose-500">SHARE_LINK_GENERATOR</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input value={formLink} readOnly className="pixel-input font-bold bg-stone-50" />
              <div className="flex gap-2">
                <Button onClick={() => { navigator.clipboard.writeText(formLink); toast.success('COPIED!'); }} className="rounded-none bg-blue-500 hover:bg-blue-600 border-2 border-black">
                  <Link2 className="w-4 h-4 mr-2" /> COPY
                </Button>
                <Button variant="outline" onClick={() => window.open(formLink, '_blank')} className="rounded-none border-2 border-black hover:bg-stone-100">
                  <Eye className="w-4 h-4 mr-2" /> PREVIEW
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
             <Button onClick={exportToCSV} variant="outline" className="rounded-none border-2 border-black bg-white hover:bg-green-50">
               <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" /> CSV
             </Button>
             <Button onClick={exportToPDF} variant="outline" className="rounded-none border-2 border-black bg-white hover:bg-rose-50">
               <FileText className="w-4 h-4 mr-2 text-rose-600" /> PDF
             </Button>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="pixel-card overflow-hidden">
          <div className="bg-black text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-rose-500" />
              <h3 className="font-pixel text-[10px]">SUBMISSION_LOG ({submissions.length})</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchData} className="text-white hover:bg-white/10 rounded-none h-8">
              <RefreshCw className="w-3 h-3 mr-2" /> REFRESH
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-stone-100">
                <TableRow className="border-b-2 border-black hover:bg-transparent">
                  <TableHead className="font-bold text-black border-r-2 border-black">PARTICIPANT_NAME</TableHead>
                  <TableHead className="font-bold text-black border-r-2 border-black">TIMESTAMP</TableHead>
                  <TableHead className="font-bold text-black border-r-2 border-black">GEN_OUTPUT</TableHead>
                  <TableHead className="font-bold text-black text-right">ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-64 text-center">
                      <div className="flex flex-col items-center opacity-30">
                        <Users className="w-12 h-12 mb-4" />
                        <span className="font-pixel text-[8px]">NO_DATA_AVAILABLE_IN_TABLE</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((sub) => (
                    <TableRow key={sub.id} className="border-b-2 border-stone-200 hover:bg-rose-50 transition-colors">
                      <TableCell className="font-bold border-r-2 border-stone-100">{sub.participant_name}</TableCell>
                      <TableCell className="text-stone-500 text-xs border-r-2 border-stone-100">
                        {new Date(sub.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="border-r-2 border-stone-100">
                        {sub.generated_card_url ? (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="rounded-none border-2 border-black h-8 bg-white hover:bg-rose-500 hover:text-white transition-all"
                            onClick={() => downloadCard(sub.generated_card_url!, sub.participant_name)}
                          >
                            <Download className="w-3 h-3 mr-2" /> DL_CARD
                          </Button>
                        ) : (
                          <span className="text-[10px] font-pixel text-amber-600 animate-pulse">PROCESSING...</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-rose-100 hover:text-rose-600 rounded-none">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-none border-4 border-black bg-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-pixel text-sm">ERASE_SUBMISSION?</AlertDialogTitle>
                              <AlertDialogDescription className="text-xs font-bold text-stone-500">
                                TARGET: {sub.participant_name}. THIS ACTION IS PERMANENT.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-none border-2 border-black">CANCEL</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteSubmission(sub.id)}
                                className="rounded-none bg-rose-600 hover:bg-rose-700 text-white font-pixel text-[10px]"
                              >
                                CONFIRM_ERASE
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}