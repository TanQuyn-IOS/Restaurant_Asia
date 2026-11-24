import clsx, { type ClassValue } from 'clsx';

/** Join conditional class names. (No tailwind-merge on purpose: variants never overlap.) */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
