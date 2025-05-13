import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistance } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, "MMM d, yyyy");
}

export function formatDateRelative(date: Date | string): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true });
}

export function getStatusColor(status: string): {
  bg: string;
  text: string;
  bgLight: string;
} {
  switch (status) {
    case 'in_progress':
      return {
        bg: 'bg-success',
        text: 'text-success',
        bgLight: 'bg-success/10'
      };
    case 'needs_review':
      return {
        bg: 'bg-warning',
        text: 'text-warning',
        bgLight: 'bg-warning/10'
      };
    case 'delayed':
    case 'overdue':
      return {
        bg: 'bg-danger',
        text: 'text-danger',
        bgLight: 'bg-danger/10'
      };
    case 'completed':
      return {
        bg: 'bg-primary',
        text: 'text-primary',
        bgLight: 'bg-primary/10'
      };
    default:
      return {
        bg: 'bg-slate-500',
        text: 'text-slate-500',
        bgLight: 'bg-slate-100'
      };
  }
}

export function getPriorityColor(priority: string): {
  bg: string;
  text: string;
  bgLight: string;
} {
  switch (priority) {
    case 'high':
      return {
        bg: 'bg-danger',
        text: 'text-danger',
        bgLight: 'bg-danger/10'
      };
    case 'medium':
      return {
        bg: 'bg-warning',
        text: 'text-warning',
        bgLight: 'bg-warning/10'
      };
    case 'low':
      return {
        bg: 'bg-success',
        text: 'text-success',
        bgLight: 'bg-success/10'
      };
    default:
      return {
        bg: 'bg-slate-500',
        text: 'text-slate-500',
        bgLight: 'bg-slate-100'
      };
  }
}

export function formatStatusLabel(status: string): string {
  if (!status) return '';
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const DEFAULT_USER_ID = 1;

export function calculateDaysUntil(date: Date | string): number {
  if (!date) return 0;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  // Reset time portion for accurate day calculation
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateObj);
  targetDate.setHours(0, 0, 0, 0);
  
  const differenceMs = targetDate.getTime() - today.getTime();
  return Math.ceil(differenceMs / (1000 * 60 * 60 * 24));
}

export function getDueDateInfo(dueDate: Date | string): {
  text: string;
  color: string;
  icon: string;
} {
  if (!dueDate) {
    return {
      text: 'No date set',
      color: 'text-slate-400',
      icon: 'ri-time-line'
    };
  }

  const days = calculateDaysUntil(dueDate);
  
  if (days < 0) {
    return {
      text: `Overdue by ${Math.abs(days)} days`,
      color: 'text-danger',
      icon: 'ri-error-warning-line'
    };
  } else if (days === 0) {
    return {
      text: 'Due today',
      color: 'text-danger',
      icon: 'ri-time-line'
    };
  } else if (days === 1) {
    return {
      text: 'Tomorrow',
      color: 'text-danger',
      icon: 'ri-time-line'
    };
  } else if (days <= 3) {
    return {
      text: `In ${days} days`,
      color: 'text-warning',
      icon: 'ri-time-line'
    };
  } else {
    return {
      text: `In ${days} days`,
      color: 'text-slate-400',
      icon: 'ri-time-line'
    };
  }
}
