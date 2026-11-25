/**
 * Shared helpers for a form's opening window: a closing date and/or a cap on
 * the number of responses. The database is the source of truth; these helpers
 * only shape what the UI shows.
 */

export type FormClosedReason = 'inactive' | 'date' | 'full';

export interface ProjectAvailability {
  status: string | null;
  auto_close_at: string | null;
  max_submissions: number | null;
  submission_count: number;
  closed: boolean;
}

const asNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const parseAvailability = (value: unknown): ProjectAvailability | null => {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  return {
    status: typeof raw.status === 'string' ? raw.status : null,
    auto_close_at: typeof raw.auto_close_at === 'string' ? raw.auto_close_at : null,
    max_submissions: asNumber(raw.max_submissions),
    submission_count: asNumber(raw.submission_count) ?? 0,
    closed: Boolean(raw.closed),
  };
};

export const closedReasonOf = (
  availability: ProjectAvailability | null,
): FormClosedReason | null => {
  if (!availability || !availability.closed) return null;
  if (availability.status && availability.status !== 'active') return 'inactive';
  if (
    availability.max_submissions !== null &&
    availability.submission_count >= availability.max_submissions
  ) {
    return 'full';
  }
  return 'date';
};

export const closedReasonMessage = (reason: FormClosedReason): string => {
  if (reason === 'full') return 'This form reached its response limit.';
  if (reason === 'date') return 'This form closed on its deadline.';
  return 'The organiser paused this form.';
};

export const spotsLeft = (availability: ProjectAvailability | null): number | null => {
  if (!availability || availability.max_submissions === null) return null;
  return Math.max(0, availability.max_submissions - availability.submission_count);
};

const pad = (value: number) => String(value).padStart(2, '0');

/** ISO timestamp -> value for an <input type="datetime-local">. */
export const toDateTimeLocal = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

/** <input type="datetime-local"> value -> ISO timestamp (or null when empty). */
export const fromDateTimeLocal = (value: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const formatCloseMoment = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
