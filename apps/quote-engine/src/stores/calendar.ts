/**
 * Calendar Store
 * Manages calendar state, events, and scheduling
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useJobStore } from './jobs';
import type {
  CalendarView,
  CalendarEvent,
  CalendarDay,
  CalendarWeek,
  CalendarMonth,
  CalendarSettings,
  JobToEventParams,
} from '../types/calendar';

const DEFAULT_SETTINGS: CalendarSettings = {
  defaultView: 'month',
  firstDayOfWeek: 0, // Sunday
  workingHoursStart: 7,
  workingHoursEnd: 19,
  slotDuration: 30,
  showWeekNumbers: false,
};

const STORAGE_KEY = 'tictacstick_calendar';

export const useCalendarStore = defineStore('calendar', () => {
  // State
  const currentDate = ref(new Date());
  const view = ref<CalendarView>('month');
  const events = ref<CalendarEvent[]>([]);
  const settings = ref<CalendarSettings>({ ...DEFAULT_SETTINGS });
  const selectedEvent = ref<CalendarEvent | null>(null);
  const initialized = ref(false);

  // Initialize from localStorage
  function initialize() {
    if (initialized.value) return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.settings) {
          settings.value = { ...DEFAULT_SETTINGS, ...data.settings };
        }
        if (data.events) {
          events.value = data.events;
        }
        if (data.view) {
          view.value = data.view;
        }
      }
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    }
    
    initialized.value = true;
  }

  // Save to localStorage
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        settings: settings.value,
        events: events.value,
        view: view.value,
      }));
    } catch (error) {
      console.error('Failed to save calendar data:', error);
    }
  }

  // ==========================================
  // Date Navigation
  // ==========================================

  function goToToday() {
    currentDate.value = new Date();
  }

  function goToDate(date: Date) {
    currentDate.value = new Date(date);
  }

  function nextPeriod() {
    const date = new Date(currentDate.value);
    switch (view.value) {
      case 'month':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'week':
        date.setDate(date.getDate() + 7);
        break;
      case 'day':
        date.setDate(date.getDate() + 1);
        break;
    }
    currentDate.value = date;
  }

  function previousPeriod() {
    const date = new Date(currentDate.value);
    switch (view.value) {
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'day':
        date.setDate(date.getDate() - 1);
        break;
    }
    currentDate.value = date;
  }

  function setView(newView: CalendarView) {
    view.value = newView;
    save();
  }

  // ==========================================
  // Calendar Generation
  // ==========================================

  const currentMonth = computed((): CalendarMonth => {
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();
    const monthName = currentDate.value.toLocaleString('default', { month: 'long' });
    
    const weeks = generateMonthWeeks(year, month);
    
    return {
      year,
      month,
      name: monthName,
      weeks,
    };
  });

  function generateMonthWeeks(year: number, month: number): CalendarWeek[] {
    const weeks: CalendarWeek[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from the first day of the week containing the 1st
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay() + settings.value.firstDayOfWeek);
    if (startDate > firstDay) {
      startDate.setDate(startDate.getDate() - 7);
    }

    let weekNumber = 1;
    const current = new Date(startDate);

    while (current <= lastDay || weeks.length < 6) {
      const week: CalendarWeek = {
        weekNumber,
        days: [],
      };

      for (let i = 0; i < 7; i++) {
        const date = new Date(current);
        const dateStr = date.toISOString().split('T')[0];
        
        week.days.push({
          date,
          dayOfMonth: date.getDate(),
          isCurrentMonth: date.getMonth() === month,
          isToday: date.getTime() === today.getTime(),
          isWeekend: date.getDay() === 0 || date.getDay() === 6,
          events: getEventsForDate(dateStr),
        });

        current.setDate(current.getDate() + 1);
      }

      weeks.push(week);
      weekNumber++;

      // Stop if we've covered the month and have at least 4 weeks
      if (current.getMonth() !== month && weeks.length >= 4) {
        break;
      }
    }

    return weeks;
  }

  const currentWeek = computed((): CalendarWeek => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(currentDate.value);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + settings.value.firstDayOfWeek);
    
    const days: CalendarDay[] = [];
    const current = new Date(startOfWeek);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(current);
      const dateStr = date.toISOString().split('T')[0];
      
      days.push({
        date,
        dayOfMonth: date.getDate(),
        isCurrentMonth: date.getMonth() === currentDate.value.getMonth(),
        isToday: date.getTime() === today.getTime(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        events: getEventsForDate(dateStr),
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return { weekNumber: 1, days };
  });

  const currentDay = computed((): CalendarDay => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(currentDate.value);
    date.setHours(0, 0, 0, 0);
    const dateStr = date.toISOString().split('T')[0];
    
    return {
      date,
      dayOfMonth: date.getDate(),
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime(),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      events: getEventsForDate(dateStr),
    };
  });

  // ==========================================
  // Event Management
  // ==========================================

  function getEventsForDate(dateStr: string): CalendarEvent[] {
    // Get calendar events
    const calendarEvents = events.value.filter(e => e.date === dateStr);
    
    // Get jobs from job store
    const jobStore = useJobStore();
    const jobEvents = getJobEventsForDate(dateStr, jobStore);
    
    return [...calendarEvents, ...jobEvents];
  }

  function getJobEventsForDate(dateStr: string, jobStore: ReturnType<typeof useJobStore>): CalendarEvent[] {
    const allJobs = jobStore.jobs || [];
    return allJobs
      .filter(job => job.schedule.scheduledDate === dateStr)
      .map(job => jobToEvent({
        jobId: job.id,
        jobNumber: job.jobNumber,
        clientName: job.client.name,
        clientAddress: job.client.address,
        scheduledDate: job.schedule.scheduledDate,
        scheduledTime: job.schedule.scheduledTime,
        estimatedDuration: job.schedule.estimatedDuration,
        status: job.status,
      }));
  }

  function jobToEvent(params: JobToEventParams): CalendarEvent {
    const statusColors: Record<string, string> = {
      scheduled: 'blue',
      'in-progress': 'orange',
      paused: 'amber',
      completed: 'green',
      cancelled: 'red',
      invoiced: 'purple',
    };

    return {
      id: `job-${params.jobId}`,
      title: `${params.jobNumber}: ${params.clientName}`,
      date: params.scheduledDate,
      startTime: params.scheduledTime,
      duration: params.estimatedDuration,
      type: 'job',
      color: statusColors[params.status] || 'grey',
      jobId: params.jobId,
      clientName: params.clientName,
      clientAddress: params.clientAddress,
      status: params.status,
    };
  }

  function addEvent(event: Omit<CalendarEvent, 'id'>): CalendarEvent {
    const newEvent: CalendarEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    events.value.push(newEvent);
    save();
    return newEvent;
  }

  function updateEvent(id: string, updates: Partial<CalendarEvent>): boolean {
    const index = events.value.findIndex(e => e.id === id);
    if (index === -1) return false;
    
    events.value[index] = { ...events.value[index], ...updates };
    save();
    return true;
  }

  function removeEvent(id: string): boolean {
    const index = events.value.findIndex(e => e.id === id);
    if (index === -1) return false;
    
    events.value.splice(index, 1);
    save();
    return true;
  }

  function selectEvent(event: CalendarEvent | null) {
    selectedEvent.value = event;
  }

  // ==========================================
  // Conflict Detection
  // ==========================================

  function hasConflict(date: string, startTime: string, duration: number, excludeId?: string): boolean {
    const dayEvents = getEventsForDate(date).filter(e => e.id !== excludeId && e.startTime);
    
    if (dayEvents.length === 0) return false;
    
    const newStart = timeToMinutes(startTime);
    const newEnd = newStart + duration;
    
    return dayEvents.some(event => {
      if (!event.startTime) return false;
      const eventStart = timeToMinutes(event.startTime);
      const eventEnd = eventStart + (event.duration || 60);
      
      // Check overlap
      return (newStart < eventEnd && newEnd > eventStart);
    });
  }

  function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // ==========================================
  // Settings
  // ==========================================

  function updateSettings(updates: Partial<CalendarSettings>) {
    settings.value = { ...settings.value, ...updates };
    save();
  }

  // ==========================================
  // Export
  // ==========================================

  return {
    // State
    currentDate,
    view,
    events,
    settings,
    selectedEvent,
    initialized,
    
    // Computed
    currentMonth,
    currentWeek,
    currentDay,
    
    // Methods
    initialize,
    goToToday,
    goToDate,
    nextPeriod,
    previousPeriod,
    setView,
    getEventsForDate,
    addEvent,
    updateEvent,
    removeEvent,
    selectEvent,
    hasConflict,
    updateSettings,
  };
});
