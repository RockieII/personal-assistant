// events.js — event CRUD and recurrence expansion
//
// Recurrence is defined on the event TYPE, not the event itself.
// When rendering any view, we expand events into occurrences for the date range.

const Events = {
  KEY: 'events',

  getAll()    { return DB.getAll(this.KEY); },
  getById(id) { return DB.getById(this.KEY, id); },

  save(data) {
    const event = {
      id:           data.id || DB.generateId(),
      title:        data.title.trim(),
      date:         data.date,
      time:         data.time || null,
      type:         data.type || 'default',
      reminder:     data.reminder !== undefined ? data.reminder : 86400000,
      reminderTime: data.reminderTime || '12:00',
    };
    DB.save(this.KEY, event);
    return event;
  },

  remove(id) { DB.remove(this.KEY, id); },

  // ── Recurrence expansion ──────────────────────────────────────────────────
  //
  // Returns all occurrences of one event within [startDate, endDate].
  // Occurrences are only generated on or after the event's base date.
  // Each result gets an extra `occurrenceDate` field (YYYY-MM-DD).

  getOccurrencesInRange(event, startDate, endDate) {
    const type       = EventTypes.getById(event.type);
    const recurrence = type?.recurrence || 'none';
    const baseDate   = new Date(event.date + 'T00:00:00');
    const occurrences = [];

    if (recurrence === 'none') {
      // Single occurrence — just check if it falls in range
      if (baseDate >= startDate && baseDate <= endDate) {
        occurrences.push({ ...event, occurrenceDate: event.date });
      }
      return occurrences;
    }

    // For recurring events, find the first occurrence >= max(baseDate, startDate)
    // then step forward until we pass endDate.

    let current = new Date(baseDate);

    if (recurrence === 'daily') {
      // Advance to startDate (or baseDate, whichever is later)
      if (startDate > current) current = new Date(startDate);
      while (current <= endDate) {
        occurrences.push({ ...event, occurrenceDate: toDateStr(current) });
        current.setDate(current.getDate() + 1);
      }

    } else if (recurrence === 'weekly') {
      // Advance by 7-day steps until we reach startDate
      while (current < startDate) current.setDate(current.getDate() + 7);
      while (current <= endDate) {
        occurrences.push({ ...event, occurrenceDate: toDateStr(current) });
        current.setDate(current.getDate() + 7);
      }

    } else if (recurrence === 'monthly') {
      const targetDay = baseDate.getDate();
      // Advance month by month until we reach startDate
      while (current < startDate) current = addMonths(current, 1, targetDay);
      while (current <= endDate) {
        occurrences.push({ ...event, occurrenceDate: toDateStr(current) });
        current = addMonths(current, 1, targetDay);
      }

    } else if (recurrence === 'yearly') {
      // Advance year by year until we reach startDate
      while (current < startDate) current.setFullYear(current.getFullYear() + 1);
      while (current <= endDate) {
        occurrences.push({ ...event, occurrenceDate: toDateStr(current) });
        current.setFullYear(current.getFullYear() + 1);
      }
    }

    return occurrences;
  },

  // Get all events (occurrences expanded) within a range, sorted by date
  getAllInRange(startDate, endDate) {
    const results = [];
    for (const event of this.getAll()) {
      results.push(...this.getOccurrencesInRange(event, startDate, endDate));
    }
    return results.sort((a, b) => a.occurrenceDate.localeCompare(b.occurrenceDate));
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

// Format a Date as YYYY-MM-DD
function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Add one month to a date, keeping the original target day (handles short months)
// e.g. Jan 31 + 1 month → Feb 28 (not Mar 3)
function addMonths(date, months, targetDay) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  // If the month rolled over (e.g. Jan 31 → Mar 3), step back to end of target month
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(targetDay, lastDay));
  return d;
}
