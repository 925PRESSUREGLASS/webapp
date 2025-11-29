<template>
  <q-page class="q-pa-md">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-h5">Calendar</div>
        <div class="text-grey-7">{{ currentDateLabel }}</div>
      </div>
      <div class="col-auto">
        <q-btn-group flat>
          <q-btn
            flat
            icon="chevron_left"
            @click="calendarStore.previousPeriod()"
          />
          <q-btn
            flat
            label="Today"
            @click="calendarStore.goToToday()"
          />
          <q-btn
            flat
            icon="chevron_right"
            @click="calendarStore.nextPeriod()"
          />
        </q-btn-group>
      </div>
      <div class="col-auto q-ml-md">
        <q-btn-toggle
          v-model="viewMode"
          flat
          toggle-color="primary"
          :options="[
            { label: 'Month', value: 'month' },
            { label: 'Week', value: 'week' },
            { label: 'Day', value: 'day' },
          ]"
        />
      </div>
    </div>

    <!-- Month View -->
    <div v-if="viewMode === 'month'" class="calendar-month">
      <!-- Weekday Headers -->
      <div class="calendar-header">
        <div
          v-for="day in weekDays"
          :key="day"
          class="calendar-header-cell"
        >
          {{ day }}
        </div>
      </div>

      <!-- Calendar Grid -->
      <div class="calendar-grid">
        <div
          v-for="week in calendarStore.currentMonth.weeks"
          :key="week.weekNumber"
          class="calendar-week"
        >
          <div
            v-for="day in week.days"
            :key="day.date.toISOString()"
            class="calendar-day"
            :class="{
              'other-month': !day.isCurrentMonth,
              'today': day.isToday,
              'weekend': day.isWeekend,
            }"
            @click="handleDayClick(day)"
          >
            <div class="day-number">{{ day.dayOfMonth }}</div>
            <div class="day-events">
              <div
                v-for="event in day.events.slice(0, 3)"
                :key="event.id"
                class="event-chip"
                :class="`bg-${event.color || 'primary'}`"
                @click.stop="handleEventClick(event)"
              >
                <span class="event-time" v-if="event.startTime">
                  {{ event.startTime }}
                </span>
                {{ event.title }}
              </div>
              <div
                v-if="day.events.length > 3"
                class="more-events text-grey-7"
              >
                +{{ day.events.length - 3 }} more
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Week View -->
    <div v-if="viewMode === 'week'" class="calendar-week-view">
      <!-- Time Column + Day Columns -->
      <div class="week-grid">
        <!-- Time labels column -->
        <div class="time-column">
          <div class="time-header"></div>
          <div
            v-for="hour in workingHours"
            :key="hour"
            class="time-slot-label"
          >
            {{ formatHour(hour) }}
          </div>
        </div>

        <!-- Day columns -->
        <div
          v-for="day in calendarStore.currentWeek.days"
          :key="day.date.toISOString()"
          class="day-column"
          :class="{ 'today': day.isToday }"
        >
          <div class="day-header">
            <div class="day-name">{{ getDayName(day.date) }}</div>
            <div class="day-number">{{ day.dayOfMonth }}</div>
          </div>
          <div class="time-slots">
            <div
              v-for="hour in workingHours"
              :key="hour"
              class="time-slot"
              @click="handleTimeSlotClick(day, hour)"
            >
              <!-- Events in this hour -->
              <div
                v-for="event in getEventsForHour(day.events, hour)"
                :key="event.id"
                class="week-event"
                :class="`bg-${event.color || 'primary'}`"
                :style="getEventStyle(event, hour)"
                @click.stop="handleEventClick(event)"
              >
                <div class="event-title">{{ event.title }}</div>
                <div class="event-time" v-if="event.startTime">
                  {{ event.startTime }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Day View -->
    <div v-if="viewMode === 'day'" class="calendar-day-view">
      <div class="day-view-header">
        <div class="text-h6">{{ formatFullDate(calendarStore.currentDay.date) }}</div>
      </div>
      
      <div class="day-view-grid">
        <div
          v-for="hour in workingHours"
          :key="hour"
          class="day-view-row"
        >
          <div class="hour-label">{{ formatHour(hour) }}</div>
          <div
            class="hour-slot"
            @click="handleTimeSlotClick(calendarStore.currentDay, hour)"
          >
            <div
              v-for="event in getEventsForHour(calendarStore.currentDay.events, hour)"
              :key="event.id"
              class="day-event"
              :class="`bg-${event.color || 'primary'}`"
              @click.stop="handleEventClick(event)"
            >
              <div class="text-weight-bold">{{ event.title }}</div>
              <div v-if="event.startTime" class="text-caption">
                {{ event.startTime }} - {{ event.clientAddress }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Event list for the day -->
      <q-card v-if="calendarStore.currentDay.events.length > 0" class="q-mt-md">
        <q-card-section>
          <div class="text-subtitle1">Events Today</div>
        </q-card-section>
        <q-list separator>
          <q-item
            v-for="event in calendarStore.currentDay.events"
            :key="event.id"
            clickable
            @click="handleEventClick(event)"
          >
            <q-item-section avatar>
              <q-avatar :color="event.color || 'primary'" text-color="white" size="40px">
                <q-icon :name="event.type === 'job' ? 'construction' : 'event'" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ event.title }}</q-item-label>
              <q-item-label caption v-if="event.startTime">
                {{ event.startTime }} - {{ event.clientAddress }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge :color="event.color || 'primary'">
                {{ event.status || event.type }}
              </q-badge>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </div>

    <!-- Event Details Dialog -->
    <q-dialog v-model="showEventDialog">
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ selectedEvent?.title }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="selectedEvent">
          <div class="q-mb-sm">
            <q-icon name="event" class="q-mr-sm" />
            {{ selectedEvent.date }}
            <span v-if="selectedEvent.startTime">
              at {{ selectedEvent.startTime }}
            </span>
          </div>
          <div v-if="selectedEvent.clientAddress" class="q-mb-sm">
            <q-icon name="location_on" class="q-mr-sm" />
            {{ selectedEvent.clientAddress }}
          </div>
          <div v-if="selectedEvent.status" class="q-mb-sm">
            <q-badge :color="selectedEvent.color || 'primary'">
              {{ selectedEvent.status }}
            </q-badge>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            v-if="selectedEvent?.jobId"
            flat
            color="primary"
            label="View Job"
            @click="navigateToJob(selectedEvent.jobId)"
          />
          <q-btn flat label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCalendarStore } from '../stores/calendar';
import { useJobStore } from '../stores/jobs';
import type { CalendarEvent, CalendarDay, CalendarView } from '../types/calendar';

const router = useRouter();
const calendarStore = useCalendarStore();
const jobStore = useJobStore();

// State
const showEventDialog = ref(false);
const selectedEvent = ref<CalendarEvent | null>(null);

// Computed
const viewMode = computed({
  get: () => calendarStore.view,
  set: (value: CalendarView) => calendarStore.setView(value),
});

const currentDateLabel = computed(() => {
  const date = calendarStore.currentDate;
  if (viewMode.value === 'month') {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  } else if (viewMode.value === 'week') {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
  } else {
    return date.toLocaleDateString('default', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
});

const weekDays = computed(() => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (calendarStore.settings.firstDayOfWeek === 1) {
    return [...days.slice(1), days[0]];
  }
  return days;
});

const workingHours = computed(() => {
  const hours: number[] = [];
  for (let h = calendarStore.settings.workingHoursStart; h <= calendarStore.settings.workingHoursEnd; h++) {
    hours.push(h);
  }
  return hours;
});

// Initialize
onMounted(() => {
  calendarStore.initialize();
  jobStore.initialize();
});

// Methods
function handleDayClick(day: CalendarDay) {
  calendarStore.goToDate(day.date);
  if (viewMode.value === 'month') {
    viewMode.value = 'day';
  }
}

function handleEventClick(event: CalendarEvent) {
  selectedEvent.value = event;
  showEventDialog.value = true;
}

function handleTimeSlotClick(day: CalendarDay, hour: number) {
  // Could open a "new event" dialog here
  console.log('Time slot clicked:', day.date, hour);
}

function navigateToJob(jobId: string) {
  showEventDialog.value = false;
  router.push(`/jobs/${jobId}`);
}

function getDayName(date: Date): string {
  return date.toLocaleString('default', { weekday: 'short' });
}

function formatHour(hour: number): string {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${h} ${ampm}`;
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString('default', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getEventsForHour(events: CalendarEvent[], hour: number): CalendarEvent[] {
  return events.filter(event => {
    if (!event.startTime) return false;
    const eventHour = parseInt(event.startTime.split(':')[0], 10);
    return eventHour === hour;
  });
}

function getEventStyle(event: CalendarEvent, _hour: number): Record<string, string> {
  const duration = event.duration || 60;
  const heightPercent = Math.min((duration / 60) * 100, 200);
  return {
    height: `${heightPercent}%`,
    minHeight: '24px',
  };
}
</script>

<style scoped>
.calendar-month {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f5f5f5;
}

.calendar-header-cell {
  padding: 12px;
  text-align: center;
  font-weight: 500;
  border-bottom: 1px solid #e0e0e0;
}

.calendar-grid {
  display: flex;
  flex-direction: column;
}

.calendar-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar-day {
  min-height: 100px;
  padding: 4px;
  border: 1px solid #e0e0e0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.calendar-day:hover {
  background-color: #f0f0f0;
}

.calendar-day.other-month {
  background-color: #fafafa;
  color: #999;
}

.calendar-day.today {
  background-color: #e3f2fd;
}

.calendar-day.weekend {
  background-color: #fafafa;
}

.day-number {
  font-weight: 500;
  margin-bottom: 4px;
}

.calendar-day.today .day-number {
  background-color: #1976d2;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.event-chip {
  font-size: 11px;
  padding: 2px 4px;
  border-radius: 4px;
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.event-time {
  font-weight: 600;
  margin-right: 4px;
}

.more-events {
  font-size: 11px;
  padding: 2px 4px;
}

/* Week View Styles */
.calendar-week-view {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.week-grid {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
}

.time-column {
  border-right: 1px solid #e0e0e0;
}

.time-header {
  height: 60px;
  border-bottom: 1px solid #e0e0e0;
}

.time-slot-label {
  height: 60px;
  padding: 4px;
  font-size: 12px;
  color: #666;
  border-bottom: 1px solid #f0f0f0;
}

.day-column {
  border-right: 1px solid #e0e0e0;
}

.day-column:last-child {
  border-right: none;
}

.day-column.today {
  background-color: #e3f2fd;
}

.day-header {
  height: 60px;
  padding: 8px;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
}

.day-name {
  font-weight: 500;
}

.time-slots {
  display: flex;
  flex-direction: column;
}

.time-slot {
  height: 60px;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
  cursor: pointer;
}

.time-slot:hover {
  background-color: #f5f5f5;
}

.week-event {
  position: absolute;
  left: 2px;
  right: 2px;
  top: 2px;
  padding: 2px 4px;
  border-radius: 4px;
  color: white;
  font-size: 11px;
  overflow: hidden;
  cursor: pointer;
}

/* Day View Styles */
.calendar-day-view {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.day-view-header {
  padding: 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.day-view-grid {
  display: flex;
  flex-direction: column;
}

.day-view-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
}

.hour-label {
  width: 80px;
  padding: 8px;
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
}

.hour-slot {
  flex: 1;
  min-height: 60px;
  padding: 4px;
  cursor: pointer;
}

.hour-slot:hover {
  background-color: #f5f5f5;
}

.day-event {
  padding: 8px;
  border-radius: 4px;
  color: white;
  margin-bottom: 4px;
  cursor: pointer;
}
</style>
