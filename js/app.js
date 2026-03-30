// app.js — main controller

const App = {
  currentNav:     'calendar',
  currentDate:    new Date(),
  editingEventId: null,

  // ── Init ──────────────────────────────────────────────────────────────────

  async init() {
    EventTypes.init();
    await Notifications.requestPermission().catch(() => {});

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(console.error);
    }

    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => this.navigate(btn.dataset.nav));
    });

    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        Calendar.mode = tab.dataset.view;
        Calendar.selectedDate = null;
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderCurrentView();
      });
    });

    document.getElementById('prev-btn').addEventListener('click', () => this.shiftDate(-1));
    document.getElementById('next-btn').addEventListener('click', () => this.shiftDate(1));
    document.getElementById('fab').addEventListener('click', () => this.openEventForm(null, Calendar.selectedDate));
    document.getElementById('modal-close').addEventListener('click', () => this.closeEventForm());
    document.getElementById('modal-overlay').addEventListener('click', e => {
      if (e.target.id === 'modal-overlay') this.closeEventForm();
    });

    await Notifications.scheduleAll();
    this.applyLanguage();
    this.navigate('calendar');
  },

  // Apply current language to all static UI text
  applyLanguage() {
    // Nav labels
    document.querySelector('[data-nav="calendar"] .nav-label').textContent = T('nav_calendar');
    document.querySelector('[data-nav="agenda"] .nav-label').textContent   = T('nav_agenda');
    document.querySelector('[data-nav="settings"] .nav-label').textContent = T('nav_settings');

    // Tab labels
    document.querySelector('[data-view="month"]').textContent  = T('tab_month');
    document.querySelector('[data-view="week"]').textContent   = T('tab_week');
    document.querySelector('[data-view="agenda"]').textContent = T('tab_agenda');
  },

  // ── Navigation ────────────────────────────────────────────────────────────

  navigate(nav) {
    this.currentNav = nav;
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.nav === nav);
    });
    const isCalendar = nav === 'calendar';
    document.getElementById('view-tabs').classList.toggle('hidden', !isCalendar);
    document.getElementById('prev-btn').classList.toggle('hidden', !isCalendar);
    document.getElementById('next-btn').classList.toggle('hidden', !isCalendar);
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
      if      (Calendar.mode === 'month') el.textContent = this.currentDate.toLocaleDateString(I18n.locale(), { month: 'long', year: 'numeric' });
      else if (Calendar.mode === 'week')  el.textContent = T('header_week_of') + ' ' + this.currentDate.toLocaleDateString(I18n.locale(), { month: 'short', day: 'numeric' });
      else                                el.textContent = T('header_upcoming');
    } else if (this.currentNav === 'agenda') {
      el.textContent = T('nav_agenda');
    } else {
      el.textContent = T('nav_settings');
    }
  },

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

    document.getElementById('modal-title').textContent = T(eventId ? 'form_edit_event' : 'form_new_event');

    const selType     = event?.type || 'default';
    const selDate     = event?.date || prefilledDate || today;
    const hasTime     = !!event?.time;
    const hasReminder = event ? event.reminder !== null : true;

    const form = document.getElementById('event-form');
    form.innerHTML = `
      <div class="form-group">
        <label class="form-label">${T('form_title')}</label>
        <input id="f-title" type="text" class="form-input" placeholder="${T('form_title_hint')}" value="${event?.title || ''}" required>
      </div>

      <div class="form-group">
        <label class="form-label">${T('form_type')}</label>
        <div class="type-selector" id="f-type-selector">
          ${types.map(t => `
            <div class="type-pill${t.id === selType ? ' selected' : ''}" data-type="${t.id}"
                 style="${t.id === selType ? 'border-color:' + t.color : ''}">
              ${t.icon} ${t.label}
            </div>
          `).join('')}
        </div>
        <input id="f-type" type="hidden" value="${selType}">
      </div>

      <div class="form-group">
        <label class="form-label">${T('form_date')}</label>
        <input id="f-date" type="date" class="form-input" value="${selDate}">
      </div>

      <div class="toggle-row">
        <span>${T('form_time')} <span class="toggle-hint">${T('form_time_optional')}</span></span>
        <div class="toggle${hasTime ? ' on' : ''}" id="time-toggle"></div>
      </div>
      <div class="form-group${hasTime ? '' : ' hidden'}" id="time-group">
        <input id="f-time" type="time" class="form-input" value="${event?.time || ''}">
      </div>

      <div class="toggle-row">
        <span>${T('form_reminder')}</span>
        <div class="toggle${hasReminder ? ' on' : ''}" id="reminder-toggle"></div>
      </div>
      <div class="${hasReminder ? '' : 'hidden'}" id="reminder-group">
        <div class="form-group">
          <label class="form-label">${T('form_notify_at')}</label>
          <input id="f-reminder-time" type="time" class="form-input" value="${event?.reminderTime || '12:00'}">
        </div>
        <div class="form-group">
          <label class="form-label">${T('form_days_before')}</label>
          <input id="f-reminder-days" type="number" class="form-input" min="0" max="30" value="${Math.round((event?.reminder ?? 86400000) / 86400000)}">
        </div>
      </div>

      <button type="submit" class="btn-primary">${T('form_save')}</button>
      ${eventId ? `<button type="button" id="delete-btn" class="btn-danger">${T('form_delete')}</button>` : ''}
    `;

    form.querySelectorAll('.type-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        form.querySelectorAll('.type-pill').forEach(p => { p.classList.remove('selected'); p.style.borderColor = ''; });
        pill.classList.add('selected');
        const type = EventTypes.getById(pill.dataset.type);
        pill.style.borderColor = type?.color || '';
        document.getElementById('f-type').value = pill.dataset.type;
      });
    });

    document.getElementById('time-toggle').addEventListener('click', e => {
      e.currentTarget.classList.toggle('on');
      document.getElementById('time-group').classList.toggle('hidden');
    });

    document.getElementById('reminder-toggle').addEventListener('click', e => {
      e.currentTarget.classList.toggle('on');
      document.getElementById('reminder-group').classList.toggle('hidden');
    });

    document.getElementById('delete-btn')?.addEventListener('click', () => {
      if (confirm(T('confirm_delete_event'))) {
        Events.remove(eventId);
        Notifications.scheduleAll();
        this.closeEventForm();
        this.renderCurrentView();
      }
    });

    form.onsubmit = e => { e.preventDefault(); this.saveEvent(); };
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
    const permLabel  = T({
      granted:     'notif_enabled',
      denied:      'notif_blocked',
      default:     'notif_default',
      unsupported: 'notif_unsupported',
    }[permission] || 'notif_default');

    container.innerHTML = `
      <div class="settings-section">
        <div class="settings-section-title">${T('settings_notifications')}</div>
        <div class="settings-item">
          <div class="settings-item-icon" style="background:#E8F5E9;">🔔</div>
          <div class="settings-item-text">
            <div class="settings-item-title">${T('notif_permission')}</div>
            <div class="settings-item-desc">${permLabel}</div>
          </div>
          ${permission === 'default' ? `<button class="filter-chip" id="req-notif-btn">${T('notif_enable_btn')}</button>` : ''}
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">${T('settings_event_types')}</div>
        ${types.map(t => `
          <div class="settings-item">
            <div class="settings-item-icon" style="background:${t.color}22;">${t.icon}</div>
            <div class="settings-item-text">
              <div class="settings-item-title">${t.label}</div>
              <div class="settings-item-desc">${EventTypes.recurrenceDesc(t.recurrence)}${t.builtin ? ' · ' + T('type_builtin') : ''}</div>
            </div>
            <button class="filter-chip" data-edit-type="${t.id}" style="margin-right:6px;">${T('type_edit')}</button>
            ${!t.builtin ? `<button style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--danger);" data-delete-type="${t.id}">🗑</button>` : ''}
          </div>
        `).join('')}
        <div class="settings-item" id="add-type-btn">
          <div class="settings-item-icon" style="background:var(--primary-bg);">➕</div>
          <div class="settings-item-text">
            <div class="settings-item-title" style="color:var(--primary);">${T('type_add')}</div>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">${T('settings_language')}</div>
        <div class="settings-item" id="lang-en" style="cursor:pointer;">
          <div class="settings-item-icon" style="background:#E3F2FD;">🇬🇧</div>
          <div class="settings-item-text">
            <div class="settings-item-title">${T('lang_english')}</div>
          </div>
          ${I18n.lang === 'en' ? '<div style="color:var(--primary);font-size:18px;">✓</div>' : ''}
        </div>
        <div class="settings-item" id="lang-pt" style="cursor:pointer;">
          <div class="settings-item-icon" style="background:#E8F5E9;">🇵🇹</div>
          <div class="settings-item-text">
            <div class="settings-item-title">${T('lang_portuguese')}</div>
          </div>
          ${I18n.lang === 'pt' ? '<div style="color:var(--primary);font-size:18px;">✓</div>' : ''}
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">${T('settings_data')}</div>
        <div class="settings-item" id="clear-data-btn" style="cursor:pointer;">
          <div class="settings-item-icon" style="background:#FFEBEE;">🗑️</div>
          <div class="settings-item-text">
            <div class="settings-item-title" style="color:var(--danger);">${T('data_clear')}</div>
            <div class="settings-item-desc">${T('data_clear_desc')}</div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('req-notif-btn')?.addEventListener('click', async () => {
      await Notifications.requestPermission();
      this.renderSettings(container);
    });

    container.querySelectorAll('[data-edit-type]').forEach(btn => {
      btn.addEventListener('click', () => this.renderTypeForm(container, btn.dataset.editType));
    });

    container.querySelectorAll('[data-delete-type]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm(T('confirm_delete_type'))) {
          EventTypes.remove(btn.dataset.deleteType);
          this.renderSettings(container);
        }
      });
    });

    document.getElementById('add-type-btn').addEventListener('click', () => {
      this.renderTypeForm(container, null);
    });

    // Language switchers
    document.getElementById('lang-en').addEventListener('click', () => {
      I18n.setLanguage('en');
      this.applyLanguage();
      this.renderSettings(container);
    });
    document.getElementById('lang-pt').addEventListener('click', () => {
      I18n.setLanguage('pt');
      this.applyLanguage();
      this.renderSettings(container);
    });

    document.getElementById('clear-data-btn').addEventListener('click', () => {
      if (confirm(T('confirm_clear_all'))) {
        localStorage.removeItem('events');
        this.renderSettings(container);
      }
    });
  },

  // ── Add / Edit Event Type Form ────────────────────────────────────────────

  renderTypeForm(container, typeId) {
    const existing  = typeId ? EventTypes.getById(typeId) : null;
    const isEdit    = !!existing;
    const recurrenceOptions = ['none', 'daily', 'weekly', 'monthly', 'yearly'];

    container.querySelector('#type-form-section')?.remove();

    const div = document.createElement('div');
    div.id = 'type-form-section';
    div.className = 'settings-section';
    div.innerHTML = `
      <div class="settings-section-title">${T(isEdit ? 'type_form_edit' : 'type_form_add')}</div>
      <div style="padding:16px;">
        <div class="form-group">
          <label class="form-label">${T('type_form_name')}</label>
          <input id="tf-name" type="text" class="form-input" value="${existing?.label || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">${T('type_form_color')}</label>
          <input id="tf-color" type="color" class="form-input" value="${existing?.color || '#FF5722'}" style="height:50px;padding:4px;">
        </div>
        <div class="form-group">
          <label class="form-label">${T('type_form_icon')}</label>
          <input id="tf-icon" type="text" class="form-input" value="${existing?.icon || ''}" placeholder="📌" maxlength="2">
        </div>
        <div class="form-group">
          <label class="form-label">${T('recurrence_label')}</label>
          <select id="tf-recurrence" class="form-input">
            ${recurrenceOptions.map(r => `
              <option value="${r}" ${(existing?.recurrence || 'none') === r ? 'selected' : ''}>
                ${T('recurrence_' + r)}
              </option>
            `).join('')}
          </select>
        </div>
        <button class="btn-primary" id="tf-save">${T('type_form_save')}</button>
      </div>
    `;
    container.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth', block: 'start' });

    document.getElementById('tf-save').addEventListener('click', () => {
      const name = document.getElementById('tf-name').value.trim();
      if (!name) return;
      const data = {
        label:      name,
        color:      document.getElementById('tf-color').value,
        icon:       document.getElementById('tf-icon').value || '📌',
        recurrence: document.getElementById('tf-recurrence').value,
      };
      if (isEdit) EventTypes.edit(typeId, data);
      else        EventTypes.add(data);
      this.renderSettings(container);
    });
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
