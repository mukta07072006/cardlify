import { Fragment } from 'react';

const BOLD_PATTERN = /(\*\*[^*\n]+\*\*)/g;

interface RichTextProps {
  text: string;
  className?: string;
}

/**
 * Renders plain text with **double asterisk** spans turned into bold runs.
 * Line breaks stay as typed — the parent keeps `whitespace-pre-line`.
 */
export function RichText({ text, className }: RichTextProps) {
  return (
    <span className={className}>
      {text.split(BOLD_PATTERN).map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          return (
            <strong key={index} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </span>
  );
}
