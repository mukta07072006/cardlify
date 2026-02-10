import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

type CommitNumberInputProps = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  onCommit: (nextValue: number) => void;
};

/**
 * Number input that allows temporary empty/invalid text while typing,
 * and only commits a clamped numeric value on blur / Enter.
 */
export function CommitNumberInput({
  value,
  min,
  max,
  step,
  className,
  onCommit,
}: CommitNumberInputProps) {
  const [draft, setDraft] = useState<string>(String(value));

  useEffect(() => {
    // Keep in sync with external updates (e.g. selecting another field)
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed === "") {
      setDraft(String(value));
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }

    let next = parsed;
    if (typeof min === "number") next = Math.max(min, next);
    if (typeof max === "number") next = Math.min(max, next);

    // For editor UX we want integers.
    next = Math.round(next);

    onCommit(next);
    setDraft(String(next));
  };

  return (
    <Input
      type="number"
      inputMode="numeric"
      value={draft}
      step={step}
      min={min}
      max={max}
      className={className}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          (e.currentTarget as HTMLInputElement).blur();
        }
        if (e.key === "Escape") {
          setDraft(String(value));
          (e.currentTarget as HTMLInputElement).blur();
        }
      }}
    />
  );
}