import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Eyebrow, Wordmark } from '@/components/studio';
import { toast } from 'sonner';
import { AlertCircle, ArrowLeft, Download, Loader2, Lock, RefreshCw, Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ViewerProject {
  id: string;
  project_name: string;
  form_title: string | null;
  user_id: string;
  status: string;
  auto_close_at: string | null;
  max_submissions: number | null;
}

interface GuestSubmission {
  id: string;
  participant_name: string;
  created_at: string;
  field_values: Record<string, unknown> | null;
  serial_code: string | null;
}

type Access = 'checking' | 'denied' | 'granted';

const BASE_COLUMNS = ['participant_name', 'created_at'];

const columnLabel = (key: string) => {
  if (key === 'participant_name') return 'Participant';
  if (key === 'created_at') return 'Submitted at';
  if (key === 'serial_code') return 'Serial code';
  return key;
};

const cellValue = (row: GuestSubmission, key: string) => {
  if (key === 'participant_name') return row.participant_name ?? '';
  if (key === 'created_at') return row.created_at ? new Date(row.created_at).toLocaleString() : '';
  if (key === 'serial_code') return row.serial_code ?? '';
  const raw = row.field_values?.[key];
  if (raw === null || raw === undefined) return '';
  return Array.isArray(raw) ? raw.join(', ') : String(raw);
};

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

export default function ProjectViewer() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, loading: authLoading } = useAuth();

  const [project, setProject] = useState<ViewerProject | null>(null);
  const [rows, setRows] = useState<GuestSubmission[]>([]);
  const [access, setAccess] = useState<Access>('checking');
  const [loading, setLoading] = useState(true);

  const isOwner = Boolean(user && project && project.user_id === user.id);

  const load = useCallback(async () => {
    if (!projectId || !user) return;
    setLoading(true);
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, project_name, form_title, user_id, status, auto_close_at, max_submissions')
        .eq('id', projectId)
        .maybeSingle();

      if (projectError) throw projectError;
      if (!projectData) {
        setAccess('denied');
        return;
      }

      setProject(projectData);

      const email = (user.email ?? '').toLowerCase();
      const { data: invites, error: inviteError } = await supabase
        .from('project_viewers')
        .select('id, email')
        .eq('project_id', projectId);

      if (inviteError) throw inviteError;

      const invited = (invites ?? []).some(
        (invite) => String(invite.email).toLowerCase() === email,
      );
      if (projectData.user_id !== user.id && !invited) {
        setAccess('denied');
        return;
      }

      const { data: submissions, error: submissionError } = await supabase
        .from('submissions')
        .select('id, participant_name, created_at, field_values, serial_code')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (submissionError) throw submissionError;

      setRows(
        (submissions ?? []).map((row) => ({
          id: row.id,
          participant_name: row.participant_name,
          created_at: row.created_at,
          field_values: (row.field_values ?? null) as Record<string, unknown> | null,
          serial_code: row.serial_code,
        })),
      );
      setAccess('granted');
    } catch (error) {
      console.error('Could not load the registrations:', error);
      toast.error('Could not load the registrations');
      setAccess('denied');
    } finally {
      setLoading(false);
    }
  }, [projectId, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    load();
  }, [authLoading, user, load]);

  const columns = useMemo(() => {
    const keys: string[] = [];
    rows.forEach((row) => {
      Object.keys(row.field_values ?? {}).forEach((key) => {
        if (!keys.includes(key)) keys.push(key);
      });
    });
    const extras = rows.some((row) => row.serial_code) ? ['serial_code'] : [];
    return [...BASE_COLUMNS, ...keys, ...extras];
  }, [rows]);

  const exportCsv = () => {
    if (!project) return;
    if (rows.length === 0) {
      toast.warning('No registrations to export');
      return;
    }

    const lines = [columns.map((column) => csvCell(columnLabel(column))).join(',')];
    rows.forEach((row) => {
      lines.push(columns.map((column) => csvCell(cellValue(row, column))).join(','));
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.body.appendChild(document.createElement('a'));
    link.href = url;
    link.download = `${project.project_name}_registrations.csv`;
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Exported to CSV');
  };

  if (authLoading || (user && loading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-foreground/40" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="surface w-full max-w-md p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary">
            <Lock className="h-6 w-6 text-foreground/40" />
          </div>
          <h2 className="display-md mt-5">Sign in to view</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/50">
            This registration list is private. Sign in with the email address the organiser invited
            — if you do not have an account yet, create one with that same address.
          </p>
          <Button asChild className="mt-6 w-full rounded-full">
            <Link to={`/auth?next=/project/${projectId}/viewer`}>Sign in</Link>
          </Button>
          <Link
            to="/"
            className="mono-label mt-4 inline-flex text-[9px] text-foreground/40 underline-offset-4 hover:text-foreground hover:underline"
          >
            Cardlify studio
          </Link>
        </div>
      </div>
    );
  }

  if (access === 'denied' || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="surface w-full max-w-md p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary">
            <AlertCircle className="h-6 w-6 text-foreground/40" />
          </div>
          <h2 className="display-md mt-5">No access to this list</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/50">
            You are signed in as {user.email}. Ask the organiser to invite this exact address, then
            open the link from their email again.
          </p>
          <Button asChild variant="outline" className="mt-6 w-full rounded-full">
            <Link to="/dashboard">Go to my dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between gap-4 px-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Link to="/" className="shrink-0">
              <Wordmark className="text-[1.1rem]" />
            </Link>
            <span className="hidden h-5 w-px bg-foreground/15 sm:block" />
            <h1 className="truncate text-sm font-medium">{project.project_name}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden sm:inline-flex"
              >
                <Link to={`/project/${project.id}`}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Project
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
            </Button>
            <Button variant="accent" size="sm" onClick={exportCsv}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-6 px-5 pt-10 sm:px-6 lg:pt-14">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Eyebrow>Registrations</Eyebrow>
            <h2 className="display-lg mt-4">{project.form_title || project.project_name}</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/50">
              Read-only access. You can see every response and export them — editing and deleting
              stay with the organiser.
            </p>
          </div>
          <span className="mono-label inline-flex w-fit items-center gap-1.5 rounded-full border border-foreground/15 bg-white/60 px-3 py-1.5 text-[9px] text-foreground/50">
            <Lock className="h-2.5 w-2.5" /> View + export only
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-[1.75rem] border border-foreground/10 bg-white/60 px-6 py-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary">
            <Users className="h-4 w-4 text-foreground/50" />
          </span>
          <div>
            <p className="font-display text-2xl tracking-tight">{rows.length}</p>
            <p className="mono-label text-[9px] text-foreground/40">
              {rows.length === 1 ? 'registration' : 'registrations'}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-foreground/10 bg-white/60">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-foreground/10 hover:bg-transparent">
                  {columns.map((column) => (
                    <TableHead
                      key={column}
                      className="mono-label whitespace-nowrap text-[9px] text-foreground/35"
                    >
                      {columnLabel(column)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-64 text-center">
                      <div className="flex flex-col items-center">
                        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary">
                          <Users className="h-6 w-6 text-foreground/25" />
                        </div>
                        <p className="mt-4 text-sm font-medium">No registrations yet</p>
                        <p className="mt-1 max-w-xs text-xs leading-relaxed text-foreground/45">
                          Responses appear here as people submit.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-b border-foreground/[0.07] transition-colors hover:bg-white/70"
                    >
                      {columns.map((column) => (
                        <TableCell
                          key={column}
                          className="whitespace-nowrap text-sm text-foreground/70"
                        >
                          {cellValue(row, column)}
                        </TableCell>
                      ))}
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
