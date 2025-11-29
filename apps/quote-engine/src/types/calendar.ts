/**
 * Calendar Types
 * Type definitions for the calendar scheduling system
 */

export type CalendarView = 'month' | 'week' | 'day';

export interface TimeSlot {
  hour: number;
  minute: number;
  label: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date string
  startTime?: string; // HH:mm format
  endTime?: string; // HH:mm format
  duration?: number; // minutes
  type: 'job' | 'appointment' | 'reminder' | 'blocked';
  color?: string;
  jobId?: string;
  clientName?: string;
  clientAddress?: string;
  status?: string;
  notes?: string;
}

export interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  events: CalendarEvent[];
}

export interface CalendarWeek {
  weekNumber: number;
  days: CalendarDay[];
}

export interface CalendarMonth {
  year: number;
  month: number; // 0-indexed
  name: string;
  weeks: CalendarWeek[];
}

export interface CalendarSettings {
  defaultView: CalendarView;
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  workingHoursStart: number; // 0-23
  workingHoursEnd: number; // 0-23
  slotDuration: number; // minutes (15, 30, 60)
  showWeekNumbers: boolean;
}

export interface CalendarState {
  currentDate: Date;
  view: CalendarView;
  events: CalendarEvent[];
  settings: CalendarSettings;
  selectedEvent: CalendarEvent | null;
}

// Helper to convert Job to CalendarEvent
export interface JobToEventParams {
  jobId: string;
  jobNumber: string;
  clientName: string;
  clientAddress: string;
  scheduledDate: string;
  scheduledTime?: string;
  estimatedDuration?: number;
  status: string;
}
