// calendar.js — Month, Week, and Agenda views

const Calendar = {
  mode: 'month',
  selectedDate: null,

  render(container, currentDate) {
    if      (this.mode === 'month')  this.renderMonth(container, currentDate);
    else if (this.mode === 'week')   this.renderWeek(container, currentDate);
    else if (this.mode === 'agenda') this.renderAgenda(container);
  },

  // ── Month View ────────────────────────────────────────────────────────────

  renderMonth(container, date) {
    const year  = date.getFullYear();
    const month = date.getMonth();

    const start = new Date(year, month, 1);
    const end   = new Date(year, month + 1, 0);
    const events = Events.getAllInRange(start, end);

    const byDate = {};
    for (const e of events) {
      if (!byDate[e.occurrenceDate]) byDate[e.occurrenceDate] = [];
      byDate[e.occurrenceDate].push(e);
    }

    const today    = toDateStr(new Date());
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth     = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Day-of-week names (locale-aware)
    const dayNames = getDayNames();

    let html = `<div class="month-grid">`;
    for (const name of dayNames) {
      html += `<div class="day-header">${name}</div>`;
    }

    // Prev month overflow
    for (let i = 0; i < firstDay; i++) {
      html += `<div class="day-cell other-month"><div class="day-number">${daysInPrevMonth - firstDay + i + 1}</div></div>`;
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
      const isToday = dateStr === today;
      const isSel   = dateStr === this.selectedDate;
      const dayEvts = byDate[dateStr] || [];

      html += `<div class="day-cell${isToday ? ' today' : ''}${isSel ? ' selected' : ''}" data-date="${dateStr}">`;
      html += `<div class="day-number">${d}</div>`;
      if (dayEvts.length > 0) {
        html += `<div class="event-dots">`;
        for (const e of dayEvts.slice(0, 3)) {
          const t = EventTypes.getById(e.type);
          html += e.important
            ? `<div class="event-dot event-dot--important" style="background:${t?.color || '#999'}"></div>`
            : `<div class="event-dot" style="background:${t?.color || '#999'}"></div>`;
        }
        if (dayEvts.length > 3) html += `<div class="event-dot" style="background:var(--text-secondary)"></div>`;
        html += `</div>`;
      }
      html += `</div>`;
    }

    // Next month overflow
    const total    = firstDay + daysInMonth;
    const overflow = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (let i = 1; i <= overflow; i++) {
      html += `<div class="day-cell other-month"><div class="day-number">${i}</div></div>`;
    }
    html += `</div>`;

    if (this.selectedDate && byDate[this.selectedDate]) {
      html += this.dayPanelHtml(byDate[this.selectedDate], this.selectedDate);
    }

    container.innerHTML = html;

    container.querySelectorAll('.day-cell:not(.other-month)').forEach(cell => {
      cell.addEventListener('click', () => {
        this.selectedDate = this.selectedDate === cell.dataset.date ? null : cell.dataset.date;
        App.renderCurrentView();
      });
    });
    container.querySelectorAll('.event-card[data-id]').forEach(card => {
      card.addEventListener('click', e => { e.stopPropagation(); App.openEventForm(card.dataset.id); });
    });
  },

  dayPanelHtml(events, dateStr) {
    const label = formatDate(dateStr, { weekday: 'long', month: 'long', day: 'numeric' });
    let html = `<div class="day-events-panel"><div class="agenda-date-header">${label}</div>`;
    for (const e of events) html += this.eventCardHtml(e);
    return html + `</div>`;
  },

  // ── Week View ─────────────────────────────────────────────────────────────

  renderWeek(container, date) {
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

    const today    = toDateStr(new Date());
    const dayNames = getDayNames();

    let html = `<div class="week-strip">`;
    for (let i = 0; i < 7; i++) {
      const d       = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = toDateStr(d);
      const isToday = dateStr === today;
      const isSel   = dateStr === this.selectedDate;
      const dayEvts = byDate[dateStr] || [];

      html += `<div class="week-day${isToday ? ' today' : ''}${isSel ? ' selected' : ''}" data-date="${dateStr}">`;
      html += `<div class="week-day-name">${dayNames[i]}</div>`;
      html += `<div class="week-day-number">${d.getDate()}</div>`;
      for (const e of dayEvts.slice(0, 4)) {
        const t = EventTypes.getById(e.type);
        html += e.important
          ? `<div class="event-dot event-dot--important" style="background:${t?.color || '#999'};width:8px;height:8px;border-radius:50%;margin:2px auto;"></div>`
          : `<div class="event-dot" style="background:${t?.color || '#999'};width:8px;height:8px;border-radius:50%;margin:2px auto;"></div>`;
      }
      html += `</div>`;
    }
    html += `</div>`;

    const focus = this.selectedDate || today;
    const focusEvents = byDate[focus] || [];
    if (focusEvents.length > 0) {
      html += this.dayPanelHtml(focusEvents, focus);
    } else if (this.selectedDate) {
      html += `<div class="empty-state" style="padding:32px 24px;"><div class="empty-state-desc">No events on this day</div></div>`;
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
        <div class="empty-state-title">${T('empty_title')}</div>
        <div class="empty-state-desc">${T('empty_desc')}</div>
      </div>`;
    } else {
      const todayStr    = toDateStr(new Date());
      const tomorrowStr = toDateStr(new Date(Date.now() + 86400000));
      let lastDate = null;

      for (const e of events) {
        if (e.occurrenceDate !== lastDate) {
          lastDate = e.occurrenceDate;
          let label;
          if      (e.occurrenceDate === todayStr)    label = T('today');
          else if (e.occurrenceDate === tomorrowStr) label = T('tomorrow');
          else label = formatDate(e.occurrenceDate, { weekday: 'long', month: 'long', day: 'numeric' });
          html += `<div class="agenda-date-header">${label}</div>`;
        }
        html += this.eventCardHtml(e);
      }
    }

    container.innerHTML = html;

    container.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => this.renderAgenda(container, chip.dataset.filter || null));
    });
    container.querySelectorAll('.event-card[data-id]').forEach(card => {
      card.addEventListener('click', () => App.openEventForm(card.dataset.id));
    });
  },

  // ── Shared: event card HTML ───────────────────────────────────────────────

  eventCardHtml(event) {
    const type = EventTypes.getById(event.type);
    const recurrenceDesc = type?.recurrence && type.recurrence !== 'none'
      ? EventTypes.recurrenceLabel(type.recurrence)
      : null;
    const meta = [
      type?.label,
      event.time || (type?.recurrence !== 'none' ? T('all_day') : null),
      recurrenceDesc,
    ].filter(Boolean).join(' · ');

    return `<div class="event-card${event.important ? ' event-card--important' : ''}" data-id="${event.id}">
      <div class="event-type-bar" style="background:${type?.color || '#999'}"></div>
      <div class="event-info">
        <div class="event-title">${event.important ? '⭐ ' : ''}${event.title}</div>
        <div class="event-meta">${meta}</div>
      </div>
      <div class="event-type-icon">${type?.icon || ''}</div>
    </div>`;
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function pad(n) { return String(n).padStart(2, '0'); }

// Locale-aware short day names (Su Mo Tu... or Dom Seg Ter...)
function getDayNames() {
  const base = new Date(2023, 0, 1); // Jan 1 2023 was a Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    return d.toLocaleDateString(I18n.locale(), { weekday: 'short' }).slice(0, 2);
  });
}
