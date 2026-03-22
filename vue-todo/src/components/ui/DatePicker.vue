<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps<{
  modelValue: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const isOpen = ref(false)
const currentMonth = ref(new Date())
const selectedDate = ref<Date | null>(null)
const selectedHour = ref(12)
const selectedMinute = ref(0)
const inputRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref({ top: '0px', left: '0px', width: '0px' })

// Initialize from modelValue
watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      const date = new Date(value)
      selectedDate.value = date
      selectedHour.value = date.getHours()
      selectedMinute.value = date.getMinutes()
      currentMonth.value = new Date(date.getFullYear(), date.getMonth(), 1)
    } else {
      selectedDate.value = null
    }
  },
  { immediate: true },
)

const updateDropdownPosition = () => {
  if (inputRef.value) {
    const rect = inputRef.value.getBoundingClientRect()
    dropdownStyle.value = {
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      width: `${Math.max(rect.width, 320)}px`,
    }
  }
}

const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const calendarDays = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const days: Array<{ date: number; isCurrentMonth: boolean; fullDate: Date }> = []

  // Previous month days
  const startDayOfWeek = firstDay.getDay()
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: prevMonthLastDay - i,
      isCurrentMonth: false,
      fullDate: new Date(year, month - 1, prevMonthLastDay - i),
    })
  }

  // Current month days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({
      date: i,
      isCurrentMonth: true,
      fullDate: new Date(year, month, i),
    })
  }

  // Next month days
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: i,
      isCurrentMonth: false,
      fullDate: new Date(year, month + 1, i),
    })
  }

  return days
})

const monthYearLabel = computed(() => {
  const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' }
  return currentMonth.value.toLocaleDateString('en-US', options)
})

const displayValue = computed(() => {
  if (!selectedDate.value) return ''
  const date = selectedDate.value
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const timeStr = `${String(selectedHour.value).padStart(2, '0')}:${String(selectedMinute.value).padStart(2, '0')}`
  return `${dateStr} at ${timeStr}`
})

const isSelected = (day: { fullDate: Date }) => {
  if (!selectedDate.value) return false
  return (
    day.fullDate.getDate() === selectedDate.value.getDate() &&
    day.fullDate.getMonth() === selectedDate.value.getMonth() &&
    day.fullDate.getFullYear() === selectedDate.value.getFullYear()
  )
}

const isToday = (day: { fullDate: Date }) => {
  const today = new Date()
  return (
    day.fullDate.getDate() === today.getDate() &&
    day.fullDate.getMonth() === today.getMonth() &&
    day.fullDate.getFullYear() === today.getFullYear()
  )
}

const prevMonth = () => {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() - 1,
    1,
  )
}

const nextMonth = () => {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() + 1,
    1,
  )
}

const selectDate = (day: { fullDate: Date }) => {
  selectedDate.value = new Date(day.fullDate)
}

const confirmSelection = () => {
  if (selectedDate.value) {
    const date = new Date(selectedDate.value)
    date.setHours(selectedHour.value, selectedMinute.value, 0, 0)
    emit('update:modelValue', date.toISOString())
  }
  isOpen.value = false
}

const clearDate = () => {
  selectedDate.value = null
  emit('update:modelValue', null)
  isOpen.value = false
}

const quickSelect = (type: 'today' | 'tomorrow' | 'nextWeek') => {
  const now = new Date()
  let targetDate: Date

  switch (type) {
    case 'today':
      targetDate = new Date(now)
      break
    case 'tomorrow':
      targetDate = new Date(now)
      targetDate.setDate(targetDate.getDate() + 1)
      break
    case 'nextWeek':
      targetDate = new Date(now)
      targetDate.setDate(targetDate.getDate() + 7)
      break
  }

  selectedDate.value = targetDate
  currentMonth.value = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
}

const toggle = async () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    await nextTick()
    updateDropdownPosition()
  }
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.datepicker') && !target.closest('.datepicker-portal')) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', updateDropdownPosition, true)
  window.addEventListener('resize', updateDropdownPosition)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', updateDropdownPosition, true)
  window.removeEventListener('resize', updateDropdownPosition)
})

const hours = Array.from({ length: 24 }, (_, i) => i)
const minutes = Array.from({ length: 12 }, (_, i) => i * 5)
</script>

<template>
  <div class="datepicker">
    <div ref="inputRef" class="datepicker-input" @click="toggle">
      <span v-if="displayValue" class="datepicker-value">{{ displayValue }}</span>
      <span v-else class="datepicker-placeholder">Select due date</span>
      <button v-if="modelValue" type="button" class="datepicker-clear" @click.stop="clearDate">
        &times;
      </button>
      <span class="datepicker-icon">📅</span>
    </div>

    <Teleport to="body">
      <div v-if="isOpen" class="datepicker-portal" :style="dropdownStyle">
        <div class="datepicker-dropdown">
          <div class="datepicker-header">
            <button type="button" class="nav-btn" @click="prevMonth">&lsaquo;</button>
            <span class="month-year">{{ monthYearLabel }}</span>
            <button type="button" class="nav-btn" @click="nextMonth">&rsaquo;</button>
          </div>

          <div class="datepicker-weekdays">
            <span v-for="day in weekDays" :key="day" class="weekday">{{ day }}</span>
          </div>

          <div class="datepicker-days">
            <button
              v-for="(day, index) in calendarDays"
              :key="index"
              type="button"
              class="day-btn"
              :class="{
                'other-month': !day.isCurrentMonth,
                today: isToday(day),
                selected: isSelected(day),
              }"
              @click="selectDate(day)"
            >
              {{ day.date }}
            </button>
          </div>

          <div class="time-picker">
            <label class="time-label">Time:</label>
            <div class="time-selects">
              <select v-model="selectedHour" class="time-select">
                <option v-for="h in hours" :key="h" :value="h">
                  {{ String(h).padStart(2, '0') }}
                </option>
              </select>
              <span class="time-separator">:</span>
              <select v-model="selectedMinute" class="time-select">
                <option v-for="m in minutes" :key="m" :value="m">
                  {{ String(m).padStart(2, '0') }}
                </option>
              </select>
            </div>
          </div>

          <div class="quick-select">
            <button type="button" class="quick-btn" @click="quickSelect('today')">Today</button>
            <button type="button" class="quick-btn" @click="quickSelect('tomorrow')">
              Tomorrow
            </button>
            <button type="button" class="quick-btn" @click="quickSelect('nextWeek')">
              Next Week
            </button>
          </div>

          <div class="datepicker-actions">
            <button type="button" class="btn-secondary" @click="clearDate">Clear</button>
            <button type="button" class="btn-primary" @click="confirmSelection">Confirm</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.datepicker {
  position: relative;
  width: 100%;
}

.datepicker-input {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.2s ease;
  gap: 0.5rem;
}

.datepicker-input:hover {
  border-color: var(--accent-primary);
}

.datepicker-value {
  flex: 1;
  color: var(--text-primary);
  font-size: 1rem;
}

.datepicker-placeholder {
  flex: 1;
  color: var(--text-secondary);
  font-size: 1rem;
}

.datepicker-clear {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 1.25rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.datepicker-clear:hover {
  background: var(--bg-secondary);
  color: var(--color-error);
}

.datepicker-icon {
  font-size: 1.25rem;
}

.datepicker-portal {
  position: fixed;
  z-index: 1000;
}

.datepicker-dropdown {
  width: 100%;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 0.75rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.datepicker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.nav-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-primary);
}

.month-year {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.datepicker-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 0.25rem;
}

.weekday {
  text-align: center;
  font-size: 0.625rem;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 0.25rem 0;
}

.datepicker-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.day-btn {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.day-btn:hover {
  background: var(--bg-tertiary);
}

.day-btn.other-month {
  color: var(--text-secondary);
  opacity: 0.5;
}

.day-btn.today {
  border: 1px solid var(--accent-primary);
}

.day-btn.selected {
  background: var(--accent-primary);
  color: var(--bg-primary);
  font-weight: 600;
}

.day-btn.selected:hover {
  background: var(--accent-hover);
}

.time-picker {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-color);
}

.time-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.time-selects {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.time-select {
  padding: 0.25rem 0.5rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 0.75rem;
  cursor: pointer;
}

.time-select:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.time-separator {
  color: var(--text-secondary);
  font-weight: 600;
}

.quick-select {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-color);
}

.quick-btn {
  flex: 1;
  padding: 0.375rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 0.625rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-btn:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.datepicker-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-color);
}

.btn-primary,
.btn-secondary {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--accent-primary);
  color: var(--bg-primary);
  border: none;
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
</style>
