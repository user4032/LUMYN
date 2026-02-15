/**
 * Global time formatting utility that respects user settings
 * Reads format and seconds setting from localStorage
 */

export interface TimeSettings {
  timeFormat: '12' | '24';
  showSeconds: boolean;
}

export const getTimeSettings = (): TimeSettings => {
  try {
    const settings = JSON.parse(localStorage.getItem('disgram_settings') || '{}');
    return {
      timeFormat: settings.timeFormat || '24',
      showSeconds: settings.showSeconds || false,
    };
  } catch {
    return { timeFormat: '24', showSeconds: false };
  }
};

export const formatTime = (timestamp: number | string | Date): string => {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const settings = getTimeSettings();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    let timeStr = '';

    if (settings.timeFormat === '12') {
      const isPM = hours >= 12;
      hours = hours % 12 || 12;
      const hourStr = hours.toString().padStart(2, '0');
      timeStr = `${hourStr}:${minutes}`;
      if (settings.showSeconds) {
        timeStr += `:${seconds}`;
      }
      timeStr += ` ${isPM ? 'PM' : 'AM'}`;
    } else {
      const hourStr = hours.toString().padStart(2, '0');
      timeStr = `${hourStr}:${minutes}`;
      if (settings.showSeconds) {
        timeStr += `:${seconds}`;
      }
    }

    return timeStr;
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

export const formatDateTime = (timestamp: number | string | Date): string => {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    let dateStr = '';

    if (isToday) {
      dateStr = formatTime(timestamp);
    } else if (isYesterday) {
      dateStr = `Yesterday ${formatTime(timestamp)}`;
    } else {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      dateStr = `${month}/${day}/${year} ${formatTime(timestamp)}`;
    }

    return dateStr;
  } catch (error) {
    console.error('Error formatting date time:', error);
    return '';
  }
};

// Listen for storage changes to update time format across app
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'disgram_settings') {
      // Dispatch custom event so components can react to setting changes
      window.dispatchEvent(new CustomEvent('disgram-settings-changed'));
    }
  });
}
