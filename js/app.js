// app.js — main controller
// Handles navigation, the event form modal, and the settings view.

const App = {
  currentNav:     'calendar',  // 'calendar' | 'agenda' | 'settings'
  currentDate:    new Date(),  // used for calendar month/week navigation
  editingEventId: null,        // id of the event being edited (null = new event)

  // ── Init ──────────────────────────────────────────────────────────────────

  async init() {
    // Set up data and notifications
    EventTypes.init();
    await Notifications.requestPermission().catch(() => {});

    // Register service worker (enables offline use and notifications)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(console.error);
    }

    // Wire up navigation buttons
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => this.navigate(btn.dataset.nav));
    });

    // Wire up calendar view mode tabs (Month / Week / Agenda)
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        Calendar.mode = tab.dataset.view;
        Calendar.selectedDate = null;
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderCurrentView();
      });
    });

    // Prev/Next header arrows (navigate months or weeks)
    document.getElementById('prev-btn').addEventListener('click', () => this.shiftDate(-1));
    document.getElementById('next-btn').addEventListener('click', () => this.shiftDate(1));

    // FAB opens the new event form
    document.getElementById('fab').addEventListener('click', () => {
      this.openEventForm(null, Calendar.selectedDate);
    });

    // Close modal by clicking the X or the backdrop
    document.getElementById('modal-close').addEventListener('click', () => this.closeEventForm());
    document.getElementById('modal-overlay').addEventListener('click', e => {
      if (e.target.id === 'modal-overlay') this.closeEventForm();
    });

    // Schedule any pending reminder notifications
    await Notifications.scheduleAll();

    // Render the starting view
    this.navigate('calendar');
  },

  // ── Navigation ────────────────────────────────────────────────────────────

  navigate(nav) {
    this.currentNav = nav;

    // Highlight the active nav button
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.nav === nav);
    });

    // Show tabs + arrows only on the calendar view
    const showCalendarControls = nav === 'calendar';
    document.getElementById('view-tabs').classList.toggle('hidden', !showCalendarControls);
    document.getElementById('prev-btn').classList.toggle('hidden', !showCalendarControls);
    document.getElementById('next-btn').classList.toggle('hidden', !showCalendarControls);

    // Hide FAB on settings (no events to add there)
    document.getElementById('fab').classList.toggle('hidden', nav === 'settings');

    this.renderCurrentView();
  },

  renderCurrentView() {
    const main = document.getElementById('main-view');
    this.updateHeaderTitle();

    if      (this.currentNav === 'calendar') Calendar.render(main, this.currentDate);
    else if (this.currentNav === 'agenda')   Calendar.renderAgenda(main);
    else if (this.currentNav === 'settings') this.renderSettings(main);
  },

  updateHeaderTitle() {
    const el = document.getElementById('header-title');
    if (this.currentNav === 'calendar') {
      if      (Calendar.mode === 'month') el.textContent = this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      else if (Calendar.mode === 'week')  el.textContent = 'Week of ' + this.currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      else                                el.textContent = 'Upcoming';
    } else if (this.currentNav === 'agenda') {
      el.textContent = 'Agenda';
    } else {
      el.textContent = 'Settings';
    }
  },

  // Move the calendar forward or backward by one month/week
  shiftDate(direction) {
    if      (Calendar.mode === 'month') this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    else if (Calendar.mode === 'week')  this.currentDate.setDate(this.currentDate.getDate() + direction * 7);
    Calendar.selectedDate = null;
    this.renderCurrentView();
  },

  // ── Event Form Modal ──────────────────────────────────────────────────────

  openEventForm(eventId = null, prefilledDate = null) {
    this.editingEventId = eventId;
    const event  = eventId ? Events.getById(eventId) : null;
    const types  = EventTypes.getAll();
    const today  = toDateStr(new Date());

    document.getElementById('modal-title').textContent = eventId ? 'Edit Event' : 'New Event';

    const selType     = event?.type || 'default';
    const selDate     = event?.date || prefilledDate || today;
    const hasTime     = !!event?.time;
    const hasReminder = event ? event.reminder !== null : true;

    // Build the form HTML
    const form = document.getElementById('event-form');
    form.innerHTML = `
      <div class="form-group">
        <label class="form-label">Title</label>
        <input id="f-title" type="text" class="form-input" placeholder="What's happening?" value="${event?.title || ''}" required>
      </div>

      <div class="form-group">
        <label class="form-label">Type</label>
        <div class="type-selector" id="f-type-selector">
          ${types.map(t => `
            <div class="type-pill${t.id === selType ? ' selected' : ''}"
                 data-type="${t.id}"
                 style="${t.id === selType ? 'border-color:' + t.color : ''}">
              ${t.icon} ${t.label}
            </div>
          `).join('')}
        </div>
        <input id="f-type" type="hidden" value="${selType}">
      </div>

      <div class="form-group">
        <label class="form-label">Date</label>
        <input id="f-date" type="date" class="form-input" value="${selDate}">
      </div>

      <div class="toggle-row">
        <span>Time <span class="toggle-hint">(optional)</span></span>
        <div class="toggle${hasTime ? ' on' : ''}" id="time-toggle"></div>
      </div>
      <div class="form-group${hasTime ? '' : ' hidden'}" id="time-group">
        <input id="f-time" type="time" class="form-input" value="${event?.time || ''}">
      </div>

      <div class="toggle-row">
        <span>Reminder</span>
        <div class="toggle${hasReminder ? ' on' : ''}" id="reminder-toggle"></div>
      </div>
      <div class="${hasReminder ? '' : 'hidden'}" id="reminder-group">
        <div class="form-group">
          <label class="form-label">Notify at (time of day)</label>
          <input id="f-reminder-time" type="time" class="form-input" value="${event?.reminderTime || '12:00'}">
        </div>
        <div class="form-group">
          <label class="form-label">Days before event</label>
          <input id="f-reminder-days" type="number" class="form-input" min="0" max="30" value="${Math.round((event?.reminder ?? 86400000) / 86400000)}">
        </div>
      </div>

      <button type="submit" class="btn-primary">Save</button>
      ${eventId ? '<button type="button" id="delete-btn" class="btn-danger">Delete Event</button>' : ''}
    `;

    // Type pill selection
    form.querySelectorAll('.type-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        form.querySelectorAll('.type-pill').forEach(p => { p.classList.remove('selected'); p.style.borderColor = ''; });
        pill.classList.add('selected');
        const type = EventTypes.getById(pill.dataset.type);
        pill.style.borderColor = type?.color || '';
        document.getElementById('f-type').value = pill.dataset.type;
      });
    });

    // Time toggle
    document.getElementById('time-toggle').addEventListener('click', e => {
      e.currentTarget.classList.toggle('on');
      document.getElementById('time-group').classList.toggle('hidden');
    });

    // Reminder toggle
    document.getElementById('reminder-toggle').addEventListener('click', e => {
      e.currentTarget.classList.toggle('on');
      document.getElementById('reminder-group').classList.toggle('hidden');
    });

    // Delete button (edit mode only)
    document.getElementById('delete-btn')?.addEventListener('click', () => {
      if (confirm('Delete this event?')) {
        Events.remove(eventId);
        Notifications.scheduleAll();
        this.closeEventForm();
        this.renderCurrentView();
      }
    });

    // Form submit
    form.onsubmit = e => { e.preventDefault(); this.saveEvent(); };

    // Show modal and focus title
    document.getElementById('modal-overlay').classList.remove('hidden');
    setTimeout(() => document.getElementById('f-title').focus(), 50);
  },

  closeEventForm() {
    document.getElementById('modal-overlay').classList.add('hidden');
    this.editingEventId = null;
  },

  saveEvent() {
    const title = document.getElementById('f-title').value.trim();
    if (!title) return;

    const hasTime     = document.getElementById('time-toggle').classList.contains('on');
    const hasReminder = document.getElementById('reminder-toggle').classList.contains('on');
    const days        = parseInt(document.getElementById('f-reminder-days').value) || 1;

    Events.save({
      id:           this.editingEventId || undefined,
      title,
      date:         document.getElementById('f-date').value,
      time:         hasTime ? document.getElementById('f-time').value : null,
      type:         document.getElementById('f-type').value,
      reminder:     hasReminder ? days * 86400000 : null,
      reminderTime: document.getElementById('f-reminder-time').value || '12:00',
    });

    Notifications.scheduleAll();
    this.closeEventForm();
    this.renderCurrentView();
  },

  // ── Settings View ─────────────────────────────────────────────────────────

  renderSettings(container) {
    const types      = EventTypes.getAll();
    const permission = Notifications.getPermission();

    const permissionLabel = {
      granted:     'Enabled',
      denied:      'Blocked — change in browser settings',
      default:     'Not yet enabled',
      unsupported: 'Not supported on this browser',
    }[permission] || permission;

    container.innerHTML = `
      <div class="settings-section">
        <div class="settings-section-title">Notifications</div>
        <div class="settings-item">
          <div class="settings-item-icon" style="background:#E8F5E9;">🔔</div>
          <div class="settings-item-text">
            <div class="settings-item-title">Permission</div>
            <div class="settings-item-desc">${permissionLabel}</div>
          </div>
          ${permission === 'default' ? '<button class="filter-chip" id="req-notif-btn">Enable</button>' : ''}
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Event Types</div>
        ${types.map(t => `
          <div class="settings-item">
            <div class="settings-item-icon" style="background:${t.color}22;">${t.icon}</div>
            <div class="settings-item-text">
              <div class="settings-item-title">${t.label}</div>
              <div class="settings-item-desc">${t.recurringYearly ? 'Repeats yearly' : 'One-time'} ${t.builtin ? '· Built-in' : ''}</div>
            </div>
            ${!t.builtin ? `<button class="settings-item-action" data-delete-type="${t.id}" style="background:none;border:none;font-size:18px;cursor:pointer;">🗑</button>` : ''}
          </div>
        `).join('')}
        <div class="settings-item" id="add-type-btn">
          <div class="settings-item-icon" style="background:var(--primary-bg);">➕</div>
          <div class="settings-item-text">
            <div class="settings-item-title" style="color:var(--primary);">Add Event Type</div>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Data</div>
        <div class="settings-item" id="clear-data-btn">
          <div class="settings-item-icon" style="background:#FFEBEE;">🗑️</div>
          <div class="settings-item-text">
            <div class="settings-item-title" style="color:var(--danger);">Clear All Events</div>
            <div class="settings-item-desc">Permanently deletes all events</div>
          </div>
        </div>
      </div>
    `;

    // Enable notifications button
    document.getElementById('req-notif-btn')?.addEventListener('click', async () => {
      await Notifications.requestPermission();
      this.renderSettings(container);
    });

    // Delete a custom event type
    container.querySelectorAll('[data-delete-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this event type? Events of this type will keep their data.')) {
          EventTypes.remove(btn.dataset.deleteType);
          this.renderSettings(container);
        }
      });
    });

    // Add a new event type
    document.getElementById('add-type-btn').addEventListener('click', () => {
      this.renderAddTypeForm(container);
    });

    // Clear all events
    document.getElementById('clear-data-btn').addEventListener('click', () => {
      if (confirm('Delete ALL events? This cannot be undone.')) {
        localStorage.removeItem('events');
        this.renderSettings(container);
      }
    });
  },

  // Inline form appended to settings for adding a new event type
  renderAddTypeForm(container) {
    // Remove any existing add-form first
    container.querySelector('#add-type-form')?.remove();

    const div = document.createElement('div');
    div.id = 'add-type-form';
    div.className = 'settings-section';
    div.style.marginTop = '0';
    div.innerHTML = `
      <div class="settings-section-title">New Event Type</div>
      <div style="padding:16px;">
        <div class="form-group">
          <label class="form-label">Name</label>
          <input id="nt-name" type="text" class="form-input" placeholder="e.g. Meeting">
        </div>
        <div class="form-group">
          <label class="form-label">Color</label>
          <input id="nt-color" type="color" class="form-input" value="#FF5722" style="height:50px;padding:4px;">
        </div>
        <div class="form-group">
          <label class="form-label">Icon (emoji)</label>
          <input id="nt-icon" type="text" class="form-input" placeholder="📌" maxlength="2">
        </div>
        <div class="toggle-row" style="border-top:none;padding-top:0;">
          <span>Repeats yearly</span>
          <div class="toggle" id="nt-recurring"></div>
        </div>
        <button class="btn-primary" id="nt-save" style="margin-top:16px;">Add Type</button>
      </div>
    `;
    container.appendChild(div);

    div.querySelector('#nt-recurring').addEventListener('click', e => e.currentTarget.classList.toggle('on'));

    div.querySelector('#nt-save').addEventListener('click', () => {
      const name = document.getElementById('nt-name').value.trim();
      if (!name) return;
      EventTypes.add({
        label:          name,
        color:          document.getElementById('nt-color').value,
        icon:           document.getElementById('nt-icon').value || '📌',
        recurringYearly: document.getElementById('nt-recurring').classList.contains('on'),
      });
      this.renderSettings(container);
    });
  },
};

// Boot the app when the page is ready
document.addEventListener('DOMContentLoaded', () => App.init());
