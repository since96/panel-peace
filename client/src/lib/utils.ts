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
  
  // Custom labels for specific statuses
  switch(status) {
    case 'needs_review':
      return 'Needs Review';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'delayed':
      return 'Delayed';
    default:
      // Default formatting for other statuses
      return status
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
  }
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

export type TalentProgressStatus = 'on_time' | 'one_day_late' | 'behind_schedule';

// Talent progress status utility to check if a task is on schedule
export function getTalentProgressStatus(
  params: {
    totalPages: number;
    completedPages: number;
    pagesPerWeek: number;
    startDate: Date | string;
    dueDate: Date | string;
  }
): TalentProgressStatus {
  const { totalPages, completedPages, pagesPerWeek, startDate, dueDate } = params;
  
  if (!startDate || !dueDate) return 'on_time';
  
  const startDateObj = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const dueDateObj = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const today = new Date();
  
  // Calculate total working days available
  const totalDays = Math.ceil((dueDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
  const workingDays = Math.max(Math.round(totalDays * 5/7), 1); // Assuming 5-day work week
  
  // Calculate pages per day
  const pagesPerDay = pagesPerWeek / 5; // Convert weekly rate to daily
  
  // Calculate how many days have passed since start
  const daysPassed = Math.ceil((today.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
  const workingDaysPassed = Math.max(Math.round(daysPassed * 5/7), 0);
  
  // Expected completed pages by now
  const expectedCompletedPages = Math.min(totalPages, Math.floor(workingDaysPassed * pagesPerDay));
  
  // Calculate how far behind schedule (in pages)
  const pagesBehind = expectedCompletedPages - completedPages;
  
  // Convert pages behind to days behind
  const daysBehind = Math.ceil(pagesBehind / pagesPerDay);
  
  if (daysBehind <= 0) {
    return 'on_time'; // On time or ahead of schedule
  } else if (daysBehind === 1) {
    return 'one_day_late'; // One day late
  } else {
    return 'behind_schedule'; // More than one day late
  }
}

// Get color codes for talent progress status
export function getTalentProgressStatusColor(status: TalentProgressStatus): {
  bg: string;
  text: string;
  bgLight: string;
} {
  switch (status) {
    case 'on_time':
      return {
        bg: 'bg-success',
        text: 'text-success',
        bgLight: 'bg-success/10'
      };
    case 'one_day_late':
      return {
        bg: 'bg-warning',
        text: 'text-warning',
        bgLight: 'bg-warning/10'
      };
    case 'behind_schedule':
      return {
        bg: 'bg-danger',
        text: 'text-danger',
        bgLight: 'bg-danger/10'
      };
    default:
      return {
        bg: 'bg-slate-500',
        text: 'text-slate-500',
        bgLight: 'bg-slate-100'
      };
  }
}
