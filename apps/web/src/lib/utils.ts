import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatInTimeZone } from 'date-fns-tz';
import {Resolution} from "@repo/db/prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(date: Date) {
    return formatInTimeZone(date, 'America/Argentina/Buenos_Aires', 'dd-MM-yyyy HH:mm:ss zzz');
}

export function formatResolutionId(resolution: Resolution){
    return `${resolution.initial}-${resolution.number}-${resolution.year}`;
}