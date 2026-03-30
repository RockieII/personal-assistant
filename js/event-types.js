// event-types.js — event type definitions and management
//
// An event type defines how a category of events looks and behaves.
// Built-in types cannot be deleted. Custom types can be added/removed.

const DEFAULT_TYPES = [
  {
    id: 'default',
    label: 'Event',
    color: '#5C6BC0',  // indigo
    icon: '📅',
    recurringYearly: false,
    builtin: true,
  },
  {
    id: 'birthday',
    label: 'Birthday',
    color: '#E91E63',  // pink
    icon: '🎂',
    recurringYearly: true,   // birthdays repeat every year automatically
    builtin: true,
  },
];

const EventTypes = {
  KEY: 'eventTypes',

  // On first launch, seed the default types
  init() {
    if (DB.getAll(this.KEY).length === 0) {
      DB.setAll(this.KEY, DEFAULT_TYPES);
    }
  },

  getAll()     { return DB.getAll(this.KEY); },
  getById(id)  { return DB.getById(this.KEY, id); },

  // Add a new custom event type
  add({ label, color, icon, recurringYearly }) {
    const type = {
      id: DB.generateId(),
      label,
      color,
      icon: icon || '📌',
      recurringYearly: !!recurringYearly,
      builtin: false,
    };
    return DB.save(this.KEY, type);
  },

  // Remove a custom type (built-in types are protected)
  remove(id) {
    const type = this.getById(id);
    if (!type || type.builtin) return false;
    DB.remove(this.KEY, id);
    return true;
  },
};
