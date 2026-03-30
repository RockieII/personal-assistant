// notifications.js — notification permission and scheduling
//
// Two strategies depending on browser support:
//   1. Notification Triggers API (Chrome Android 80+) — fires even when app is closed
//   2. Fallback — shows immediate notification when app opens if reminder time just passed

const Notifications = {
  // Is the Notification Triggers API available? (Chrome Android)
  triggersSupported: typeof TimestampTrigger !== 'undefined',

  getPermission() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  },

  async requestPermission() {
    if (!('Notification' in window)) return 'unsupported';
    return await Notification.requestPermission();
  },

  // ── Timing calculation ────────────────────────────────────────────────────
  //
  // Returns the exact Date when a notification should fire for an event.
  // Default: the day before the event at 12:00 noon.
  // The reminder field is in ms (86400000 = 1 day).

  getReminderDate(event) {
    const [hours, mins] = (event.reminderTime || '12:00').split(':').map(Number);
    const eventDay = new Date((event.occurrenceDate || event.date) + 'T00:00:00');

    const reminderDay = new Date(eventDay);
    reminderDay.setDate(reminderDay.getDate() - Math.round((event.reminder || 86400000) / 86400000));
    reminderDay.setHours(hours, mins, 0, 0);

    return reminderDay;
  },

  // ── Strategy 1: Notification Triggers API ────────────────────────────────
  //
  // Schedules a persistent notification that fires at a future time,
  // even if the app is closed. Uses the service worker.

  async scheduleWithTrigger(event, occurrenceDate) {
    const sw = await navigator.serviceWorker.ready;
    const fireAt = this.getReminderDate({ ...event, occurrenceDate });

    if (fireAt <= new Date()) return; // already passed

    const type = EventTypes.getById(event.type);

    await sw.showNotification(`${type?.icon || ''} ${event.title}`, {
      body: `${type?.label || 'Event'} ${occurrenceDate ? 'on ' + occurrenceDate : 'tomorrow'}`,
      tag:  `event-${event.id}-${occurrenceDate}`,  // tag prevents duplicates
      showTrigger: new TimestampTrigger(fireAt.getTime()),
      data: { eventId: event.id },
    });
  },

  // ── Strategy 2: Fallback — check on app open ──────────────────────────────
  //
  // When the app opens, check if any reminder time passed in the last hour
  // and hasn't been shown yet. If so, show an immediate notification.

  checkAndNotifyNow() {
    if (this.getPermission() !== 'granted') return;

    const now   = new Date();
    const start = new Date(now.getTime() - 3600000); // 1 hour ago
    const end   = new Date(now.getTime() + 172800000); // 2 days ahead

    for (const event of Events.getAllInRange(start, end)) {
      if (event.reminder === null) continue;

      const fireAt   = this.getReminderDate(event);
      const shownKey = `shown-${event.id}-${event.occurrenceDate}`;

      // Fire if the reminder time just passed and we haven't shown it yet
      if (fireAt >= start && fireAt <= now && !localStorage.getItem(shownKey)) {
        const type = EventTypes.getById(event.type);
        new Notification(`${type?.icon || ''} ${event.title}`, {
          body: `Reminder: ${type?.label || 'Event'} tomorrow`,
          tag:  `event-${event.id}-${event.occurrenceDate}`,
        });
        localStorage.setItem(shownKey, '1');
      }
    }
  },

  // ── Main entry point ──────────────────────────────────────────────────────
  //
  // Call this on app open and whenever events are saved.
  // Schedules all upcoming reminders (or falls back to immediate check).

  async scheduleAll() {
    if (this.getPermission() !== 'granted') return;

    if (!this.triggersSupported) {
      // Fallback: just check for anything due right now
      this.checkAndNotifyNow();
      return;
    }

    // Schedule notifications for all events in the next year
    const now    = new Date();
    const oneYear = new Date(now);
    oneYear.setFullYear(oneYear.getFullYear() + 1);

    for (const event of Events.getAllInRange(now, oneYear)) {
      if (event.reminder === null) continue;
      await this.scheduleWithTrigger(event, event.occurrenceDate);
    }
  },
};
