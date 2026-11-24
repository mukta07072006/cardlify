import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eyebrow, Wordmark } from '@/components/studio';
import { toast } from 'sonner';
import { generateProjectSlug } from '@/lib/urlUtils';
import { useUserRole } from '@/hooks/useUserRole';
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
  FileText,
  ClipboardList,
  Lock,
  Mail,
  Sparkles
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Project {
  id: string;
  project_name: string;
  template_image_url: string | null;
  status: string;
  created_at: string;
  project_mode: string | null;
  form_title: string | null;
  form_description: string | null;
  email_notifications_enabled: boolean | null;
  email_sender_name: string | null;
}

// Columns that only exist for the legacy card flow — never useful in an export.
const LEGACY_EXPORT_COLUMNS = ['id', 'project_id', 'field_values', 'participant_id', 'department', 'role'];

// Every column a submission can contribute: its own scalar columns plus each key
// held inside field_values (form answers are stored there, keyed by question label).
const collectExportColumns = (subs: any[]) => {
  const columns: string[] = [];
  const push = (key: string) => {
    if (LEGACY_EXPORT_COLUMNS.includes(key) || columns.includes(key)) return;
    columns.push(key);
  };
  subs.forEach((sub) => {
    Object.keys(sub).forEach(push);
    if (sub.field_values && typeof sub.field_values === 'object') {
      Object.keys(sub.field_values).forEach(push);
    }
  });
  return columns;
};

const exportColumnLabel = (key: string) =>
  key === 'created_at' ? 'Submitted at' : key.replace(/_/g, ' ');

interface SubmissionSummary {
  id: string;
  participant_name: string;
  generated_card_url: string | null;
  created_at: string;
}

export default function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { isElite } = useUserRole();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLink, setFormLink] = useState('');
  const [friendlyLink, setFriendlyLink] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [exportColumns, setExportColumns] = useState<string[]>([]);
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>([]);
  const [loadingExportColumns, setLoadingExportColumns] = useState(false);

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

  const openExportDialog = async () => {
    if (!project) return;
    setExportOpen(true);
    setLoadingExportColumns(true);
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.warning('No submissions to export');
        setExportOpen(false);
        return;
      }

      const cols = collectExportColumns(data);
      setExportColumns(cols);
      setSelectedExportColumns(cols);
    } catch (error) {
      toast.error('Could not load export columns');
      setExportOpen(false);
    } finally {
      setLoadingExportColumns(false);
    }
  };

  const toggleExportColumn = (column: string) => {
    setSelectedExportColumns(prev =>
      prev.includes(column) ? prev.filter(c => c !== column) : [...prev, column]
    );
  };

  const exportToCSV = async (columns?: string[]) => {
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

      const allHeaders = columns?.length ? columns : collectExportColumns(fullSubmissions);

      const csvRows = [];
      csvRows.push(allHeaders.join(','));
      fullSubmissions.forEach(sub => {
        const row = allHeaders.map(header => {
          const value = header === 'field_values' ? null : sub[header] ?? sub.field_values?.[header];
          if (value === undefined || value === null) return '""';
          return `"${String(value).replace(/"/g, '""')}"`;
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

  const exportToPDF = async (columns?: string[]) => {
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
      
      const allHeaders = columns?.length ? columns : collectExportColumns(fullSubmissions);

      const headerRow = document.createElement('tr');
      allHeaders.forEach(h => {
        const th = document.createElement('th');
        th.textContent = exportColumnLabel(h);
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
          const value = h === 'field_values' ? null : sub[h] ?? sub.field_values?.[h];
          td.textContent = value === undefined || value === null ? '' : String(value);
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-foreground/40" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between gap-4 px-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Back to dashboard"
              onClick={() => navigate('/dashboard')}
              className="shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Link to="/" className="hidden shrink-0 sm:block">
              <Wordmark className="text-[1.1rem]" />
            </Link>
            <span className="hidden h-5 w-px bg-foreground/15 sm:block" />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-medium tracking-tight">{project?.project_name}</h1>
              <p className="mono-label mt-0.5 flex items-center gap-2 text-[9px] text-foreground/35">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    project?.status === 'active' ? 'bg-lime' : 'bg-foreground/25'
                  }`}
                />
                {project?.status}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleStatus} className="hidden sm:inline-flex">
              {project?.status === 'active' ? (
                <ToggleRight className="mr-1.5 h-4 w-4" />
              ) : (
                <ToggleLeft className="mr-1.5 h-4 w-4" />
              )}
              {project?.status === 'active' ? 'Disable' : 'Enable'}
            </Button>
            {project?.project_mode === 'both' && (
              <Button variant="outline" size="sm" onClick={() => navigate(`/project/${projectId}/forms`)}>
                <ClipboardList className="mr-1.5 h-4 w-4" />
                Open form
              </Button>
            )}
            {project?.project_mode === 'form' ? (
              <Button size="sm" onClick={() => navigate(`/project/${projectId}/forms`)}>
                <ClipboardList className="mr-1.5 h-4 w-4" />
                Edit form
              </Button>
            ) : (
              <Button size="sm" onClick={() => navigate(`/project/${projectId}/editor`)}>
                <Edit className="mr-1.5 h-4 w-4" />
                Open editor
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-6 px-5 pt-10 sm:px-6 lg:pt-14">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Eyebrow>Project overview</Eyebrow>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h2 className="display-lg max-w-2xl">{project?.project_name}</h2>
              <span className="mono-label rounded-full border border-foreground/15 bg-white/60 px-3 py-1.5 text-[9px] text-foreground/50">
                {project?.project_mode === 'form'
                  ? 'Form only'
                  : project?.project_mode === 'both'
                    ? 'Card + form'
                    : 'Card only'}
              </span>
            </div>
            <p className="mt-3 text-sm text-foreground/50">
              Created{' '}
              {project?.created_at &&
                new Date(project.created_at).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="accent" size="sm" onClick={openExportDialog}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export
            </Button>
          </div>
        </div>

        <Dialog open={exportOpen} onOpenChange={setExportOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display text-xl tracking-tight">
                Choose columns to export
              </DialogTitle>
              <DialogDescription className="text-sm text-foreground/50">
                Pick what goes into your file. {selectedExportColumns.length} of {exportColumns.length}{' '}
                columns selected.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-between gap-4">
              <span className="mono-label text-[9px] text-foreground/40">Columns</span>
              <div className="flex gap-3 text-xs text-foreground/60">
                <button
                  type="button"
                  className="underline-offset-4 hover:text-foreground hover:underline"
                  onClick={() => setSelectedExportColumns(exportColumns)}
                >
                  Select all
                </button>
                <button
                  type="button"
                  className="underline-offset-4 hover:text-foreground hover:underline"
                  onClick={() => setSelectedExportColumns([])}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="max-h-[320px] space-y-0.5 overflow-y-auto rounded-xl border border-foreground/10 bg-white/60 p-2">
              {loadingExportColumns ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-foreground/40" />
                </div>
              ) : exportColumns.length === 0 ? (
                <p className="py-6 text-center text-sm text-foreground/45">
                  No columns to show for this project yet.
                </p>
              ) : (
                exportColumns.map(column => (
                  <label
                    key={column}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm transition hover:bg-secondary/60"
                  >
                    <Checkbox
                      checked={selectedExportColumns.includes(column)}
                      onCheckedChange={() => toggleExportColumn(column)}
                    />
                    <span className="min-w-0 flex-1 truncate">{exportColumnLabel(column)}</span>
                  </label>
                ))
              )}
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <Button variant="ghost" size="sm" onClick={() => setExportOpen(false)}>
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedExportColumns.length === 0}
                  onClick={() => {
                    setExportOpen(false);
                    exportToCSV(selectedExportColumns);
                  }}
                >
                  <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> CSV
                </Button>
                <Button
                  size="sm"
                  disabled={selectedExportColumns.length === 0}
                  onClick={() => {
                    setExportOpen(false);
                    exportToPDF(selectedExportColumns);
                  }}
                >
                  <FileText className="mr-1.5 h-3.5 w-3.5" /> PDF
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Share link */}
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-[1.75rem] bg-foreground p-6 text-paper sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="mono-label text-[10px] text-lime">Share link</p>
                <h3 className="mt-3 font-display text-xl tracking-tight">Send this to your group</h3>
              </div>
              <Link2 className="h-5 w-5 text-paper/35" />
            </div>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-paper/50">
              {project?.project_mode === 'form'
                ? 'Anyone with this link can answer your questions. No account needed.'
                : 'Anyone with this link can add their details and generate a card. No account needed.'}
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Input
                value={formLink}
                readOnly
                className="h-11 rounded-xl border-paper/15 bg-paper/5 font-mono text-xs text-paper/80 focus-visible:ring-lime"
              />
              <div className="flex gap-2">
                <Button
                  variant="accent"
                  className="flex-1 sm:flex-none"
                  onClick={() => {
                    navigator.clipboard.writeText(formLink);
                    toast.success('Link copied');
                  }}
                >
                  Copy link
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(formLink, '_blank')}
                  className="border-paper/20 text-paper hover:border-paper/50 hover:bg-paper/10"
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">Preview form</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="surface flex flex-col justify-between p-6 sm:p-8">
            <div>
              <p className="mono-label text-[10px] text-foreground/40">Submissions</p>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="font-display text-5xl tracking-tight">{submissions.length}</span>
                <span className="text-sm text-foreground/45">
                  {project?.project_mode === 'form' ? 'responses collected' : 'cards generated'}
                </span>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-foreground/10 pt-5">
              <span className="flex items-center gap-2 text-xs text-foreground/45">
                <Users className="h-3.5 w-3.5" />
                Private to your account
              </span>
              <span className="mono-label text-[9px] text-foreground/30">v1.0.4</span>
            </div>
          </div>
        </div>

        {(project?.project_mode === 'form' || project?.project_mode === 'both') && (
          <div className="flex flex-col justify-between gap-4 rounded-[1.75rem] border border-foreground/10 bg-white/60 px-6 py-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary">
                <Mail className="h-4 w-4 text-foreground/50" />
              </span>
              <div>
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  Confirmation email
                  <span
                    className={`mono-label inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] ${
                      isElite ? 'bg-lime/60 text-foreground/60' : 'bg-foreground/10 text-foreground/45'
                    }`}
                  >
                    {isElite ? <Sparkles className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
                    {isElite ? (project?.email_notifications_enabled ? 'On' : 'Off') : 'Elite only'}
                  </span>
                </p>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-foreground/45">
                  {isElite
                    ? project?.email_notifications_enabled
                      ? `Submitters receive a branded email from “${
                          project?.email_sender_name || project?.project_name
                        }” with their serial code.`
                      : 'Turn it on in the form settings to email every submitter their serial code.'
                    : 'Submitters can receive a branded email with their serial code. This is an Elite feature.'}
                </p>
              </div>
            </div>
            {isElite ? (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 rounded-full"
                onClick={() => navigate(`/project/${projectId}/forms`)}
              >
                Email settings
              </Button>
            ) : (
              <Button
                size="sm"
                className="shrink-0 rounded-full"
                onClick={() => navigate('/pricing')}
              >
                <Lock className="mr-1.5 h-3.5 w-3.5" /> Unlock with Elite
              </Button>
            )}
          </div>
        )}

        {/* Submissions */}
        <div className="overflow-hidden rounded-[1.75rem] border border-foreground/10 bg-white/60">
          <div className="flex items-center justify-between gap-4 border-b border-foreground/10 px-6 py-5">
            <div className="flex items-center gap-3">
              <h3 className="font-display text-lg tracking-tight">Submission log</h3>
              <span className="mono-label rounded-full border border-foreground/15 px-2.5 py-1 text-[9px] text-foreground/45">
                {submissions.length}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchData}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-foreground/10 hover:bg-transparent">
                  <TableHead className="mono-label text-[9px] text-foreground/35">Participant</TableHead>
                  <TableHead className="mono-label text-[9px] text-foreground/35">Submitted</TableHead>
                  <TableHead className="mono-label text-[9px] text-foreground/35">Card</TableHead>
                  <TableHead className="mono-label text-right text-[9px] text-foreground/35">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-64 text-center">
                      <div className="flex flex-col items-center">
                        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary">
                          <Users className="h-6 w-6 text-foreground/25" />
                        </div>
                        <p className="mt-4 text-sm font-medium">No submissions yet</p>
                        <p className="mt-1 max-w-xs text-xs leading-relaxed text-foreground/45">
                          Share the link above. Cards will appear here as people submit.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((sub) => (
                    <TableRow
                      key={sub.id}
                      className="border-b border-foreground/[0.07] transition-colors hover:bg-white/70"
                    >
                      <TableCell className="font-medium">{sub.participant_name}</TableCell>
                      <TableCell className="text-xs text-foreground/45">
                        {new Date(sub.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {sub.generated_card_url ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadCard(sub.generated_card_url!, sub.participant_name)}
                          >
                            <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                          </Button>
                        ) : (
                          <span className="mono-label text-[9px] text-foreground/40">Form response</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Delete submission"
                              className="text-foreground/35 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-3xl border-foreground/10">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="display-md">Delete submission?</AlertDialogTitle>
                              <AlertDialogDescription className="text-sm leading-relaxed text-foreground/55">
                                The card and details for {sub.participant_name} will be removed
                                permanently.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteSubmission(sub.id)}
                                className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
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
