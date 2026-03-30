// db.js — localStorage wrapper
// All data is stored as JSON arrays, keyed by a string (e.g. 'events', 'eventTypes')

const DB = {

  // Read all items for a given key (returns [] if nothing stored)
  getAll(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch { return []; }
  },

  // Write the full array for a key
  setAll(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  },

  // Find a single item by its id
  getById(key, id) {
    return this.getAll(key).find(item => item.id === id) || null;
  },

  // Create or update an item (matched by id)
  save(key, item) {
    const all = this.getAll(key);
    const idx = all.findIndex(i => i.id === item.id);
    if (idx >= 0) all[idx] = item;   // update existing
    else          all.push(item);    // insert new
    this.setAll(key, all);
    return item;
  },

  // Delete an item by id
  remove(key, id) {
    this.setAll(key, this.getAll(key).filter(i => i.id !== id));
  },

  // Generate a unique id (timestamp + random suffix)
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
};
