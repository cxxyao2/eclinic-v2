import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true,
  pure: true
})
export class TimeAgoPipe implements PipeTransform {

  transform(timestamp: Date | string): string {
    if (!timestamp) {
      return '';
    }

    const targetDate = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

    if (seconds < 0) {
      return 'in the future';
    }

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      
      if (interval >= 1) {
        return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
      }
    }

    return 'just now';
  }
}

