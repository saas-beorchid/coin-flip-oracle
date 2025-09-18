import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Get time ago string (e.g. "2 mins ago")
export function getTimeAgo(timestamp: string | number | Date) {
  const now = new Date();
  const date = new Date(timestamp);
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (secondsAgo < 60) return 'just now';
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)} min${Math.floor(secondsAgo / 60) > 1 ? 's' : ''} ago`;
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)} hr${Math.floor(secondsAgo / 3600) > 1 ? 's' : ''} ago`;
  return `${Math.floor(secondsAgo / 86400)} day${Math.floor(secondsAgo / 86400) > 1 ? 's' : ''} ago`;
}

// Get a random ID
export function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

// Validate if the string is empty
export function isEmpty(str: string | null | undefined) {
  return !str || str.trim() === '';
}
