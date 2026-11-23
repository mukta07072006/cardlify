import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Eyebrow, Wordmark } from '@/components/studio';
import { toast } from 'sonner';
import {
  createEmptyField,
  FORM_FIELD_TYPES,
  hasOptions,
  normalizeFormField,
  type FormField,
  type FormFieldType,
} from '@/lib/forms';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Eye,
  ImagePlus,
  LayoutTemplate,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';

interface FormProject {
  id: string;
  project_name: string;
  project_mode: string | null;
  form_title: string | null;
  form_description: string | null;
  form_header_image_url: string | null;
  email_notifications_enabled: boolean | null;
  email_sender_name: string | null;
  photo_required: boolean | null;
}

const fieldClass = 'h-12 rounded-xl border-foreground/15 bg-white/70 text-sm';

const DRAFT_STORAGE_PREFIX = 'cardlify:form-draft:';
const draftKey = (projectId: string) => `${DRAFT_STORAGE_PREFIX}${projectId}`;

interface FormDraft {
  formTitle: string;
  formDescription: string;
  formHeaderImageUrl: string | null;
  emailNotifications: boolean;
  emailSenderName: string;
  photoRequired: boolean;
  fields: FormField[];
  savedAt: number;
}

/** Stable description of the current editor state, used to detect unsaved edits. */
const buildSignature = (
  title: string,
  description: string,
  headerImageUrl: string | null,
  emailNotifications: boolean,
  emailSenderName: string,
  photoRequired: boolean,
  fields: FormField[],
) =>
  JSON.stringify({
    title: title.trim(),
    description: description.trim(),
    headerImageUrl: headerImageUrl ?? '',
    emailNotifications,
    emailSenderName: emailSenderName.trim(),
    photoRequired,
    fields: fields.map((field) => [
      field.id,
      field.label.trim(),
      field.field_type,
      field.placeholder ?? '',
      field.help_text ?? '',
      field.required,
      field.options,
      field.position,
    ]),
  });

export default function FormBuilder() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<FormProject | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formHeaderImageUrl, setFormHeaderImageUrl] = useState<string | null>(null);
  const [headerUploading, setHeaderUploading] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [emailSenderName, setEmailSenderName] = useState('');
  const [photoRequired, setPhotoRequired] = useState(true);
  const [fields, setFields] = useState<FormField[]>([]);
  const [originalIds, setOriginalIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSignature, setSavedSignature] = useState('');

  const signature = useMemo(
    () => buildSignature(
      formTitle,
      formDescription,
      formHeaderImageUrl,
      emailNotifications,
      emailSenderName,
      photoRequired,
      fields,
    ),
    [
      formTitle,
      formDescription,
      formHeaderImageUrl,
      emailNotifications,
      emailSenderName,
      photoRequired,
      fields,
    ],
  );
  const dirty = Boolean(project) && signature !== savedSignature;

  // Keep unsaved edits in localStorage so leaving the page never wipes a draft.
  useEffect(() => {
    if (!projectId || loading || !project) return;
    if (!dirty) {
      window.localStorage.removeItem(draftKey(projectId));
      return;
    }
    const draft: FormDraft = {
      formTitle,
      formDescription,
      formHeaderImageUrl,
      emailNotifications,
      emailSenderName,
      photoRequired,
      fields: fields.map((field, index) => ({ ...field, position: index })),
      savedAt: Date.now(),
    };
    try {
      window.localStorage.setItem(draftKey(projectId), JSON.stringify(draft));
    } catch (error) {
      console.warn('Could not keep the form draft:', error);
    }
  }, [
    dirty,
    emailNotifications,
    emailSenderName,
    photoRequired,
    fields,
    formDescription,
    formHeaderImageUrl,
    formTitle,
    loading,
    project,
    projectId,
  ]);

  // Plain refreshes and tab closes still deserve a warning while edits are unsaved.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    if (projectId) loadProject();
  }, [authLoading, user, projectId, navigate]);

  const loadProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(
          'id, project_name, project_mode, form_title, form_description, form_header_image_url, email_notifications_enabled, email_sender_name, photo_required',
        )
        .eq('id', projectId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Project not found');

      setProject(data);

      const { data: rows, error: fieldsError } = await supabase
        .from('form_fields')
        .select('*')
        .eq('project_id', projectId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });

      if (fieldsError) throw fieldsError;

      const savedFields = (rows || []).map((row) => normalizeFormField(row as never));
      const savedTitle = data.form_title || data.project_name;
      const savedDescription = data.form_description || '';
      const savedHeaderImageUrl = data.form_header_image_url ?? null;
      const savedEmailNotifications = Boolean(data.email_notifications_enabled);
      const savedEmailSenderName = data.email_sender_name ?? '';
      const savedPhotoRequired = data.photo_required !== false;
      const savedIds = new Set(savedFields.map((field) => field.id));
      const savedSignatureValue = buildSignature(
        savedTitle,
        savedDescription,
        savedHeaderImageUrl,
        savedEmailNotifications,
        savedEmailSenderName,
        savedPhotoRequired,
        savedFields,
      );

      let nextTitle = savedTitle;
      let nextDescription = savedDescription;
      let nextHeaderImageUrl = savedHeaderImageUrl;
      let nextEmailNotifications = savedEmailNotifications;
      let nextEmailSenderName = savedEmailSenderName;
      let nextPhotoRequired = savedPhotoRequired;
      let nextFields = savedFields;
      let restoredDraft = false;

      const rawDraft = projectId ? window.localStorage.getItem(draftKey(projectId)) : null;
      if (rawDraft) {
        try {
          const draft = JSON.parse(rawDraft) as Partial<FormDraft>;
          if (draft && Array.isArray(draft.fields)) {
            const draftFields = draft.fields.map((field, index) => ({
              ...normalizeFormField(field as never),
              position: index,
              persisted: savedIds.has(field.id),
            }));
            const draftTitle = draft.formTitle ?? savedTitle;
            const draftDescription = draft.formDescription ?? '';
            const draftHeaderImageUrl =
              draft.formHeaderImageUrl === undefined
                ? savedHeaderImageUrl
                : draft.formHeaderImageUrl;
            const draftEmailNotifications =
              draft.emailNotifications === undefined
                ? savedEmailNotifications
                : Boolean(draft.emailNotifications);
            const draftEmailSenderName =
              draft.emailSenderName === undefined ? savedEmailSenderName : draft.emailSenderName;
            const draftPhotoRequired =
              draft.photoRequired === undefined ? savedPhotoRequired : Boolean(draft.photoRequired);

            if (
              buildSignature(
                draftTitle,
                draftDescription,
                draftHeaderImageUrl,
                draftEmailNotifications,
                draftEmailSenderName,
                draftPhotoRequired,
                draftFields,
              ) !== savedSignatureValue
            ) {
              nextTitle = draftTitle;
              nextDescription = draftDescription;
              nextHeaderImageUrl = draftHeaderImageUrl;
              nextEmailNotifications = draftEmailNotifications;
              nextEmailSenderName = draftEmailSenderName;
              nextPhotoRequired = draftPhotoRequired;
              nextFields = draftFields;
              restoredDraft = true;
            }
          }
        } catch {
          window.localStorage.removeItem(draftKey(projectId));
        }
      }

      setFormTitle(nextTitle);
      setFormDescription(nextDescription);
      setFormHeaderImageUrl(nextHeaderImageUrl);
      setEmailNotifications(nextEmailNotifications);
      setEmailSenderName(nextEmailSenderName);
      setPhotoRequired(nextPhotoRequired);
      setFields(nextFields);
      setOriginalIds(savedFields.map((field) => field.id));
      setSavedSignature(savedSignatureValue);

      if (restoredDraft) {
        toast.success('Restored your unsaved draft');
      }
    } catch (error) {
      console.error('Error loading form:', error);
      toast.error('Could not load this form');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (id: string, patch: Partial<FormField>) => {
    setFields((current) => current.map((field) => (field.id === id ? { ...field, ...patch } : field)));
  };

  const addField = () => {
    setFields((current) => [...current, createEmptyField(current.length)]);
  };

  const removeField = (id: string) => {
    setFields((current) => current.filter((field) => field.id !== id));
  };

  const moveField = (index: number, direction: -1 | 1) => {
    setFields((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleTypeChange = (field: FormField, type: FormFieldType) => {
    updateField(field.id, {
      field_type: type,
      options: hasOptions(type) ? (field.options.length ? field.options : ['Option 1']) : [],
    });
  };

  const handleHeaderImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Choose an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5MB or smaller');
      return;
    }

    setHeaderUploading(true);
    try {
      const extension = file.name.split('.').pop() || 'png';
      const path = `${user.id}/form-header-${Date.now()}.${extension}`;
      const { error } = await supabase.storage.from('templates').upload(path, file, {
        cacheControl: '3600',
      });
      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from('templates').getPublicUrl(path);

      setFormHeaderImageUrl(publicUrl);
      toast.success('Header image added — save to publish it');
    } catch (error) {
      console.error('Error uploading header image:', error);
      toast.error('Could not upload that image');
    } finally {
      setHeaderUploading(false);
    }
  };

  const handleSave = async () => {
    if (!project) return;

    const labelled = fields.map((field) => ({ ...field, label: field.label.trim() }));
    if (labelled.some((field) => !field.label)) {
      toast.error('Every question needs a label');
      return;
    }

    const seen = new Set<string>();
    for (const field of labelled) {
      const key = field.label.toLowerCase();
      if (seen.has(key)) {
        toast.error(`Two questions are both called “${field.label}”`);
        return;
      }
      seen.add(key);
      if (hasOptions(field.field_type) && field.options.filter(Boolean).length === 0) {
        toast.error(`Add at least one option to “${field.label}”`);
        return;
      }
    }

    setSaving(true);
    try {
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          form_title: formTitle.trim() || project.project_name,
          form_description: formDescription.trim() || null,
          form_header_image_url: formHeaderImageUrl,
          email_notifications_enabled: emailNotifications,
          email_sender_name: emailSenderName.trim() || project.project_name,
          photo_required: photoRequired,
        })
        .eq('id', project.id);

      if (projectError) throw projectError;

      const keptIds = labelled.filter((field) => field.persisted).map((field) => field.id);
      const removedIds = originalIds.filter((id) => !keptIds.includes(id));
      if (removedIds.length) {
        const { error } = await supabase.from('form_fields').delete().in('id', removedIds);
        if (error) throw error;
      }

      for (let index = 0; index < labelled.length; index += 1) {
        const field = labelled[index];
        const payload = {
          project_id: project.id,
          label: field.label,
          field_type: field.field_type,
          placeholder: field.placeholder?.trim() || null,
          help_text: field.help_text?.trim() || null,
          required: field.required,
          options: hasOptions(field.field_type) ? field.options.map((o) => o.trim()).filter(Boolean) : [],
          position: index,
        };

        if (field.persisted) {
          const { error } = await supabase.from('form_fields').update(payload).eq('id', field.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('form_fields').insert({ id: field.id, ...payload });
          if (error) throw error;
        }
      }

      setOriginalIds(labelled.map((field) => field.id));
      setFields(labelled.map((field) => ({ ...field, persisted: true })));
      setSavedSignature(
        buildSignature(
          formTitle,
          formDescription,
          formHeaderImageUrl,
          emailNotifications,
          emailSenderName,
          photoRequired,
          labelled,
        ),
      );
      if (projectId) window.localStorage.removeItem(draftKey(projectId));
      toast.success('Form saved');
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error('Could not save the form. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-foreground/40" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 border-b border-foreground/10 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1100px] items-center justify-between gap-4 px-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Back to project"
              onClick={() => navigate(`/project/${project.id}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Link to="/" className="hidden sm:block">
              <Wordmark className="text-[1.1rem]" />
            </Link>
            <span className="hidden h-5 w-px bg-foreground/15 sm:block" />
            <h1 className="truncate text-sm font-medium">{project.project_name}</h1>
          </div>

          <div className="flex items-center gap-2">
            {dirty && (
              <span className="mono-label hidden rounded-full border border-foreground/15 px-2.5 py-1 text-[9px] text-foreground/45 sm:block">
                Draft kept
              </span>
            )}
            {project.project_mode !== 'form' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/project/${project.id}/editor`)}
              >
                <LayoutTemplate className="mr-1.5 h-4 w-4" /> Card editor
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate(`/submit/${project.id}`)}>
              <Eye className="mr-1.5 h-4 w-4" /> Preview
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1.5 h-4 w-4" />
              )}
              Save form
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[820px] px-5 pt-12 sm:px-6">
        <Eyebrow>Form builder</Eyebrow>
        <h2 className="display-lg mt-4">
          Ask the right
          <br />
          <span className="serif text-[1.05em]">questions.</span>
        </h2>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-foreground/55">
          Add questions, reorder them, and mark the ones that must be answered. Answers land in the
          project's submission log and export to CSV.
        </p>
        <p className="mt-2 max-w-lg text-xs leading-relaxed text-foreground/40">
          Questions are kept as a draft on this device as you type, so you can leave and come back
          before saving.
        </p>

        <div className="surface mt-9 p-6 sm:p-8">
          <div className="space-y-2">
            <Label htmlFor="formTitle" className="mono-label text-foreground/45">
              Form title
            </Label>
            <Input
              id="formTitle"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder={project.project_name}
              className={fieldClass}
            />
          </div>
          <div className="mt-6 space-y-2">
            <Label htmlFor="formDescription" className="mono-label text-foreground/45">
              Intro text
            </Label>
            <textarea
              id="formDescription"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={3}
              placeholder="Tell people why you are collecting this."
              className="w-full rounded-xl border border-foreground/15 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-foreground/35"
            />
          </div>
          <div className="mt-6 space-y-2">
            <Label className="mono-label text-foreground/45">Header image</Label>
            {formHeaderImageUrl ? (
              <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-background/40">
                <img
                  src={formHeaderImageUrl}
                  alt="Form header"
                  className="h-36 w-full object-cover sm:h-44"
                />
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <p className="truncate text-xs text-foreground/45">Shown above your form title</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-foreground/50 hover:text-destructive"
                    onClick={() => setFormHeaderImageUrl(null)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
                  </Button>
                </div>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-foreground/20 bg-background/40 px-6 py-8 text-center transition hover:border-foreground/35 hover:bg-white/60">
                {headerUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-foreground/40" />
                ) : (
                  <ImagePlus className="h-5 w-5 text-foreground/40" />
                )}
                <span className="text-xs text-foreground/50">
                  {headerUploading ? 'Uploading…' : 'Upload a banner (JPG or PNG, max 5MB)'}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleHeaderImageUpload}
                  className="hidden"
                  disabled={headerUploading}
                />
              </label>
            )}
          </div>

          {project.project_mode === 'both' && (
            <div className="mt-7 border-t border-foreground/10 pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Label htmlFor="photoRequired" className="mono-label text-foreground/45">
                    Photo on the card
                  </Label>
                  <p className="mt-2 max-w-sm text-xs leading-relaxed text-foreground/50">
                    {photoRequired
                      ? 'Required — nobody can submit without a photo.'
                      : 'Optional — people can submit without a photo, and their card is generated without one.'}
                  </p>
                </div>
                <Switch
                  id="photoRequired"
                  checked={photoRequired}
                  onCheckedChange={setPhotoRequired}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <div className="mt-7 border-t border-foreground/10 pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor="emailNotifications" className="mono-label text-foreground/45">
                  Confirmation email
                </Label>
                <p className="mt-2 max-w-sm text-xs leading-relaxed text-foreground/50">
                  Everyone who submits gets a branded email with their serial code, based on the
                  form title.
                </p>
              </div>
              <Switch
                id="emailNotifications"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
                className="mt-1"
              />
            </div>

            {emailNotifications && (
              <div className="mt-5 space-y-2 rounded-2xl border border-foreground/10 bg-background/40 p-4">
                <Label htmlFor="emailSenderName" className="mono-label text-foreground/45">
                  Sender name
                </Label>
                <Input
                  id="emailSenderName"
                  value={emailSenderName}
                  onChange={(e) => setEmailSenderName(e.target.value)}
                  placeholder={project.project_name}
                  maxLength={60}
                  className={fieldClass}
                />
                <p className="text-[11px] leading-relaxed text-foreground/40">
                  Sends from admin@cardlify.site as “{emailSenderName.trim() || project.project_name}”.
                  Replies go to your account email.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {fields.length === 0 && (
            <div className="rounded-[1.75rem] border border-dashed border-foreground/20 bg-white/40 px-6 py-16 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-lilac/70">
                <Plus className="h-6 w-6 text-foreground/55" />
              </div>
              <p className="mt-5 text-sm font-medium">No questions yet</p>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-foreground/45">
                Start with a name, then add whatever else you need to collect.
              </p>
            </div>
          )}

          {fields.map((field, index) => (
            <div key={field.id} className="rounded-[1.75rem] border border-foreground/10 bg-white/60 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="mono-label rounded-full border border-foreground/15 px-2.5 py-1 text-[9px] text-foreground/40">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Move question up"
                    disabled={index === 0}
                    onClick={() => moveField(index, -1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Move question down"
                    disabled={index === fields.length - 1}
                    onClick={() => moveField(index, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete question"
                    className="text-foreground/35 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeField(field.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-[1.6fr_1fr]">
                <div className="space-y-2">
                  <Label className="mono-label text-foreground/45">Question</Label>
                  <Input
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    placeholder="Full name"
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="mono-label text-foreground/45">Type</Label>
                  <select
                    value={field.field_type}
                    onChange={(e) => handleTypeChange(field, e.target.value as FormFieldType)}
                    className="h-12 w-full rounded-xl border border-foreground/15 bg-white/70 px-3 text-sm outline-none transition focus:border-foreground/35"
                  >
                    {FORM_FIELD_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {hasOptions(field.field_type) && (
                <div className="mt-4 space-y-2">
                  <Label className="mono-label text-foreground/45">Options (comma separated)</Label>
                  <Input
                    value={field.options.join(', ')}
                    onChange={(e) =>
                      updateField(field.id, {
                        options: e.target.value.split(',').map((option) => option.trimStart()),
                      })
                    }
                    placeholder="Design, Engineering, Marketing"
                    className={fieldClass}
                  />
                </div>
              )}

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="mono-label text-foreground/45">Placeholder</Label>
                  <Input
                    value={field.placeholder ?? ''}
                    onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                    placeholder="Optional hint inside the input"
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="mono-label text-foreground/45">Help text</Label>
                  <Input
                    value={field.help_text ?? ''}
                    onChange={(e) => updateField(field.id, { help_text: e.target.value })}
                    placeholder="Optional note under the question"
                    className={fieldClass}
                  />
                </div>
              </div>

              <label className="mt-4 flex w-fit cursor-pointer items-center gap-2 text-xs text-foreground/55">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(field.id, { required: e.target.checked })}
                  className="h-4 w-4 rounded border-foreground/25 accent-foreground"
                />
                Required
              </label>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={addField}>
            <Plus className="h-4 w-4" /> Add question
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save form
          </Button>
        </div>
      </main>
    </div>
  );
}
