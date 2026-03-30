// calendar.js — renders Month, Week, and Agenda views

const Calendar = {
  mode: 'month',         // current view mode
  selectedDate: null,    // YYYY-MM-DD string, set when user taps a day

  // Main render dispatcher
  render(container, currentDate) {
    if      (this.mode === 'month')  this.renderMonth(container, currentDate);
    else if (this.mode === 'week')   this.renderWeek(container, currentDate);
    else if (this.mode === 'agenda') this.renderAgenda(container);
  },

  // ── Month View ────────────────────────────────────────────────────────────

  renderMonth(container, date) {
    const year  = date.getFullYear();
    const month = date.getMonth(); // 0-indexed

    // Get all events that fall in this calendar month
    const start = new Date(year, month, 1);
    const end   = new Date(year, month + 1, 0);
    const events = Events.getAllInRange(start, end);

    // Group events by their occurrence date string for quick lookup
    const byDate = {};
    for (const e of events) {
      if (!byDate[e.occurrenceDate]) byDate[e.occurrenceDate] = [];
      byDate[e.occurrenceDate].push(e);
    }

    const today     = toDateStr(new Date());
    const firstDay  = new Date(year, month, 1).getDay();  // 0 = Sunday
    const daysInMonth     = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    let html = `<div class="month-grid">`;

    // Day-of-week headers
    for (const name of ['Su','Mo','Tu','We','Th','Fr','Sa']) {
      html += `<div class="day-header">${name}</div>`;
    }

    // Filler days from previous month
    for (let i = 0; i < firstDay; i++) {
      const d = daysInPrevMonth - firstDay + i + 1;
      html += `<div class="day-cell other-month"><div class="day-number">${d}</div></div>`;
    }

    // Days of the current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr  = `${year}-${pad(month + 1)}-${pad(d)}`;
      const isToday  = dateStr === today;
      const isSel    = dateStr === this.selectedDate;
      const dayEvts  = byDate[dateStr] || [];

      html += `<div class="day-cell${isToday ? ' today' : ''}${isSel ? ' selected' : ''}" data-date="${dateStr}">`;
      html += `<div class="day-number">${d}</div>`;

      if (dayEvts.length > 0) {
        html += `<div class="event-dots">`;
        // Show up to 3 dots; a grey dot indicates more
        const visible = dayEvts.slice(0, 3);
        for (const e of visible) {
          const type = EventTypes.getById(e.type);
          html += `<div class="event-dot" style="background:${type?.color || '#999'}"></div>`;
        }
        if (dayEvts.length > 3) {
          html += `<div class="event-dot" style="background:var(--text-secondary)"></div>`;
        }
        html += `</div>`;
      }

      html += `</div>`;
    }

    // Filler days from next month
    const totalCells = firstDay + daysInMonth;
    const remainder  = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remainder; i++) {
      html += `<div class="day-cell other-month"><div class="day-number">${i}</div></div>`;
    }

    html += `</div>`;

    // If a day is selected, show its events below the grid
    if (this.selectedDate && byDate[this.selectedDate]) {
      html += this.dayPanelHtml(byDate[this.selectedDate], this.selectedDate);
    }

    container.innerHTML = html;

    // Tap a day cell → select it and re-render
    container.querySelectorAll('.day-cell:not(.other-month)').forEach(cell => {
      cell.addEventListener('click', () => {
        this.selectedDate = this.selectedDate === cell.dataset.date ? null : cell.dataset.date;
        App.renderCurrentView();
      });
    });

    // Tap an event card → open edit form
    container.querySelectorAll('.event-card[data-id]').forEach(card => {
      card.addEventListener('click', e => {
        e.stopPropagation();
        App.openEventForm(card.dataset.id);
      });
    });
  },

  // Panel shown below the grid when a day is tapped
  dayPanelHtml(events, dateStr) {
    const d     = new Date(dateStr + 'T00:00:00');
    const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    let html = `<div class="day-events-panel">`;
    html += `<div class="agenda-date-header">${label}</div>`;
    for (const e of events) html += this.eventCardHtml(e);
    html += `</div>`;
    return html;
  },

  // ── Week View ─────────────────────────────────────────────────────────────

  renderWeek(container, date) {
    // Find the Sunday that starts this week
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const events = Events.getAllInRange(weekStart, weekEnd);
    const byDate = {};
    for (const e of events) {
      if (!byDate[e.occurrenceDate]) byDate[e.occurrenceDate] = [];
      byDate[e.occurrenceDate].push(e);
    }

    const today = toDateStr(new Date());
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    let html = `<div class="week-strip">`;
    for (let i = 0; i < 7; i++) {
      const d       = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = toDateStr(d);
      const isSel   = dateStr === this.selectedDate;
      const isToday = dateStr === today;
      const dayEvts = byDate[dateStr] || [];

      html += `<div class="week-day${isToday ? ' today' : ''}${isSel ? ' selected' : ''}" data-date="${dateStr}">`;
      html += `<div class="week-day-name">${dayNames[i]}</div>`;
      html += `<div class="week-day-number">${d.getDate()}</div>`;
      for (const e of dayEvts.slice(0, 4)) {
        const type = EventTypes.getById(e.type);
        html += `<div class="event-dot" style="background:${type?.color || '#999'};width:8px;height:8px;border-radius:50%;margin:2px auto;"></div>`;
      }
      html += `</div>`;
    }
    html += `</div>`;

    // Show events for the selected day (or today)
    const focus = this.selectedDate || today;
    const focusEvents = byDate[focus] || [];
    if (focusEvents.length > 0) {
      html += this.dayPanelHtml(focusEvents, focus);
    } else if (this.selectedDate) {
      html += `<div class="empty-state" style="padding:32px 24px;">
        <div class="empty-state-desc">No events on this day</div>
      </div>`;
    }

    container.innerHTML = html;

    container.querySelectorAll('.week-day').forEach(cell => {
      cell.addEventListener('click', () => {
        this.selectedDate = this.selectedDate === cell.dataset.date ? null : cell.dataset.date;
        App.renderCurrentView();
      });
    });

    container.querySelectorAll('.event-card[data-id]').forEach(card => {
      card.addEventListener('click', () => App.openEventForm(card.dataset.id));
    });
  },

  // ── Agenda View ───────────────────────────────────────────────────────────

  renderAgenda(container, filterType = null) {
    const now     = new Date();
    const oneYear = new Date(now);
    oneYear.setFullYear(oneYear.getFullYear() + 1);

    let events = Events.getAllInRange(now, oneYear);
    if (filterType) events = events.filter(e => e.type === filterType);

    // Build filter chips
    const types = EventTypes.getAll();
    let html = `<div class="agenda-filters">`;
    html += `<div class="filter-chip${!filterType ? ' active' : ''}" data-filter="">All</div>`;
    for (const t of types) {
      html += `<div class="filter-chip${filterType === t.id ? ' active' : ''}" data-filter="${t.id}">${t.icon} ${t.label}</div>`;
    }
    html += `</div>`;

    if (events.length === 0) {
      html += `<div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-title">No upcoming events</div>
        <div class="empty-state-desc">Tap + to add one</div>
      </div>`;
    } else {
      const todayStr    = toDateStr(new Date());
      const tomorrowStr = toDateStr(new Date(Date.now() + 86400000));
      let lastDate = null;

      for (const e of events) {
        // Date section header (Today / Tomorrow / full date)
        if (e.occurrenceDate !== lastDate) {
          lastDate = e.occurrenceDate;
          let label;
          if      (e.occurrenceDate === todayStr)    label = 'Today';
          else if (e.occurrenceDate === tomorrowStr) label = 'Tomorrow';
          else {
            const d = new Date(e.occurrenceDate + 'T00:00:00');
            label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
          }
          html += `<div class="agenda-date-header">${label}</div>`;
        }
        html += this.eventCardHtml(e);
      }
    }

    container.innerHTML = html;

    container.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.renderAgenda(container, chip.dataset.filter || null);
      });
    });

    container.querySelectorAll('.event-card[data-id]').forEach(card => {
      card.addEventListener('click', () => App.openEventForm(card.dataset.id));
    });
  },

  // ── Shared: event card HTML ───────────────────────────────────────────────

  eventCardHtml(event) {
    const type = EventTypes.getById(event.type);
    const meta = [
      type?.label,
      event.time || (type?.recurringYearly ? 'All day' : null),
    ].filter(Boolean).join(' · ');

    return `<div class="event-card" data-id="${event.id}">
      <div class="event-type-bar" style="background:${type?.color || '#999'}"></div>
      <div class="event-info">
        <div class="event-title">${event.title}</div>
        <div class="event-meta">${meta}</div>
      </div>
      <div class="event-type-icon">${type?.icon || ''}</div>
    </div>`;
  },
};

// Pad a number to 2 digits (e.g. 3 → "03")
function pad(n) { return String(n).padStart(2, '0'); }
