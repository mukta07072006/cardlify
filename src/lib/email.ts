/**
 * Helpers for the confirmation email flow.
 * The actual message is sent by the `send-submission-email` Supabase function,
 * so the Resend API key never reaches the browser.
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Letters that are hard to confuse when read aloud or typed back. */
const SERIAL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Short form of a title: initials for multi-word titles, first letters for a
 * single word. "Annual Design Summit" -> "ADS", "Workshop" -> "WORKSH".
 */
const serialPrefix = (title: string) => {
  const words = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .filter((word) => !/^\d+$/.test(word));

  if (words.length === 0) return 'CARD';
  if (words.length === 1) return words[0].slice(0, 5).toUpperCase();
  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
};

export const createSerialCode = (title: string) => {
  const bytes = new Uint8Array(4);
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  const suffix = Array.from(bytes, (byte) => SERIAL_ALPHABET[byte % SERIAL_ALPHABET.length]).join('');
  return `${serialPrefix(title) || 'CARD'}-${suffix}`;
};
