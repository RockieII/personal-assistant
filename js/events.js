// events.js — event CRUD and recurring logic
//
// All events share the same structure regardless of type.
// Recurring behaviour (e.g. birthdays) is driven by the event's type definition.

const Events = {
  KEY: 'events',

  getAll()      { return DB.getAll(this.KEY); },
  getById(id)   { return DB.getById(this.KEY, id); },

  // Create or update an event
  save(data) {
    const event = {
      id:           data.id || DB.generateId(),
      title:        data.title.trim(),
      date:         data.date,               // YYYY-MM-DD (original/base date)
      time:         data.time || null,       // HH:MM or null (all-day)
      type:         data.type || 'default',
      reminder:     data.reminder !== undefined ? data.reminder : 86400000, // ms before (null = no reminder)
      reminderTime: data.reminderTime || '12:00',  // HH:MM — when the notification fires
    };
    DB.save(this.KEY, event);
    return event;
  },

  remove(id) { DB.remove(this.KEY, id); },

  // ── Recurring logic ──────────────────────────────────────────────────────
  //
  // Returns all occurrences of one event that fall within [startDate, endDate].
  // For non-recurring events: 0 or 1 result (just checks if the date is in range).
  // For yearly-recurring events: one result per year in the range.
  // Each result has an extra `occurrenceDate` field (YYYY-MM-DD string).

  getOccurrencesInRange(event, startDate, endDate) {
    const type = EventTypes.getById(event.type);
    const occurrences = [];

    if (!type || !type.recurringYearly) {
      // Non-recurring: just check if the single date falls in range
      const d = new Date(event.date + 'T00:00:00');
      if (d >= startDate && d <= endDate) {
        occurrences.push({ ...event, occurrenceDate: event.date });
      }
      return occurrences;
    }

    // Yearly-recurring: generate one occurrence per year in the range
    const base = new Date(event.date + 'T00:00:00');
    for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
      const d = new Date(year, base.getMonth(), base.getDate());
      if (d >= startDate && d <= endDate) {
        const dateStr = toDateStr(d);
        occurrences.push({ ...event, occurrenceDate: dateStr });
      }
    }

    return occurrences;
  },

  // Get all events (with occurrences expanded) within a date range, sorted by date
  getAllInRange(startDate, endDate) {
    const results = [];
    for (const event of this.getAll()) {
      results.push(...this.getOccurrencesInRange(event, startDate, endDate));
    }
    return results.sort((a, b) => a.occurrenceDate.localeCompare(b.occurrenceDate));
  },
};

// Helper: format a Date as YYYY-MM-DD
function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
