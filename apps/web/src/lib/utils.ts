import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatInTimeZone } from 'date-fns-tz';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(date: Date) {
    return formatInTimeZone(date, 'Argentina/Buenos_Aires', 'dd-MM-yyyy HH:mm:ss zzz');
}