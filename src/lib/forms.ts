/**
 * Shared definitions for form-style projects.
 * Answers are stored in submissions.field_values keyed by field label.
 */

export type ProjectMode = "card" | "form" | "both";

export type FormFieldType =
  | "short_text"
  | "long_text"
  | "email"
  | "number"
  | "date"
  | "dropdown"
  | "radio"
  | "checkbox";

export interface FormField {
  id: string;
  project_id?: string;
  label: string;
  field_type: FormFieldType;
  placeholder: string | null;
  help_text: string | null;
  required: boolean;
  options: string[];
  position: number;
  /** false for fields that only exist in local state */
  persisted?: boolean;
}

export interface FormFieldDefinition {
  value: FormFieldType;
  label: string;
  hint: string;
}

export const FORM_FIELD_TYPES: FormFieldDefinition[] = [
  { value: "short_text", label: "Short answer", hint: "One line of text" },
  { value: "long_text", label: "Paragraph", hint: "A longer written answer" },
  { value: "email", label: "Email", hint: "Validated email address" },
  { value: "number", label: "Number", hint: "Digits only" },
  { value: "date", label: "Date", hint: "Pick a day" },
  { value: "dropdown", label: "Dropdown", hint: "Pick one from a list" },
  { value: "radio", label: "Multiple choice", hint: "Pick one option" },
  { value: "checkbox", label: "Checkboxes", hint: "Pick any number of options" },
];

export const FIELD_TYPE_LABEL: Record<FormFieldType, string> = FORM_FIELD_TYPES.reduce(
  (acc, type) => ({ ...acc, [type.value]: type.label }),
  {} as Record<FormFieldType, string>,
);

export const hasOptions = (type: FormFieldType) =>
  type === "dropdown" || type === "radio" || type === "checkbox";

export const isProjectMode = (value: unknown): value is ProjectMode =>
  value === "card" || value === "form" || value === "both";

export const MODE_LABEL: Record<ProjectMode, string> = {
  card: "Card only",
  form: "Form only",
  both: "Card + form",
};

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `tmp-${Math.random().toString(36).slice(2)}-${Date.now()}`;

export const createEmptyField = (position: number): FormField => ({
  id: newId(),
  label: "",
  field_type: "short_text",
  placeholder: null,
  help_text: null,
  required: false,
  options: [],
  position,
  persisted: false,
});

export const normalizeFormField = (row: Partial<FormField> & { id: string }): FormField => ({
  id: row.id,
  project_id: row.project_id,
  label: row.label ?? "",
  field_type: (row.field_type as FormFieldType) ?? "short_text",
  placeholder: row.placeholder ?? null,
  help_text: row.help_text ?? null,
  required: Boolean(row.required),
  options: Array.isArray(row.options) ? (row.options as unknown[]).map(String) : [],
  position: Number.isFinite(row.position) ? Number(row.position) : 0,
  persisted: true,
});

/** Value shape used while someone fills a form. */
export type FormAnswers = Record<string, string | string[]>;

export function emptyAnswer(field: FormField): string | string[] {
  return field.field_type === "checkbox" ? [] : "";
}

export function isAnswerEmpty(answer: string | string[] | undefined): boolean {
  if (Array.isArray(answer)) return answer.length === 0;
  return !answer || !answer.trim();
}
