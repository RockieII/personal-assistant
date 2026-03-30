// event-types.js — event type definitions and management
//
// recurrence values: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
// Built-in types cannot be deleted (but can be edited).

const DEFAULT_TYPES = [
  {
    id:         'default',
    label:      'Event',     // overridden at runtime by T('type_event')
    color:      '#5C6BC0',
    icon:       '📅',
    recurrence: 'none',
    builtin:    true,
  },
  {
    id:         'birthday',
    label:      'Birthday',  // overridden at runtime by T('type_birthday')
    color:      '#E91E63',
    icon:       '🎂',
    recurrence: 'yearly',
    builtin:    true,
  },
];

const EventTypes = {
  KEY: 'eventTypes',

  init() {
    const existing = DB.getAll(this.KEY);

    // Migration: convert old { recurringYearly: boolean } to { recurrence: string }
    const needsMigration = existing.some(t => 'recurringYearly' in t && !('recurrence' in t));
    if (needsMigration) {
      const migrated = existing.map(t => {
        if ('recurringYearly' in t && !('recurrence' in t)) {
          const { recurringYearly, ...rest } = t;
          return { ...rest, recurrence: recurringYearly ? 'yearly' : 'none' };
        }
        return t;
      });
      DB.setAll(this.KEY, migrated);
      return;
    }

    // First launch: seed with defaults
    if (existing.length === 0) {
      DB.setAll(this.KEY, DEFAULT_TYPES);
    }
  },

  getAll()    { return DB.getAll(this.KEY); },
  getById(id) { return DB.getById(this.KEY, id); },

  // Add a new custom type
  add({ label, color, icon, recurrence }) {
    const type = {
      id:         DB.generateId(),
      label,
      color,
      icon:       icon || '📌',
      recurrence: recurrence || 'none',
      builtin:    false,
    };
    return DB.save(this.KEY, type);
  },

  // Edit an existing type (built-in types can also be edited)
  edit(id, { label, color, icon, recurrence }) {
    const type = this.getById(id);
    if (!type) return null;
    const updated = { ...type, label, color, icon: icon || '📌', recurrence: recurrence || 'none' };
    return DB.save(this.KEY, updated);
  },

  // Delete a custom type (built-in types are protected from deletion)
  remove(id) {
    const type = this.getById(id);
    if (!type || type.builtin) return false;
    DB.remove(this.KEY, id);
    return true;
  },

  // Human-readable recurrence description
  recurrenceDesc(recurrence) {
    return T(`recurrence_desc_${recurrence || 'none'}`);
  },

  recurrenceLabel(recurrence) {
    return T(`recurrence_${recurrence || 'none'}`);
  },
};
