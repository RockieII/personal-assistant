// import.js — CSV template export + bulk import
//
// Template columns: title, date, type, important
// Date accepts YYYY-MM-DD or DD/MM/YYYY. Type matches an event type's id or
// label (case-insensitive); unrecognized/blank falls back to the default type.

const Import = {
  downloadTemplate() {
    const rows = [
      ['title', 'date', 'type', 'important'],
      ['Maria Silva', '2026-03-15', 'Birthday', ''],
      ['Team meeting', '2026-07-10', 'Event', ''],
    ];
    const csv = rows.map(r => r.map(csvEscape).join(',')).join('\r\n');
    downloadBlob(csv, 'personal-assistant-import-template.csv', 'text/csv');
  },

  // Parses raw CSV text into rows of string arrays (quote-aware).
  parseCSV(text) {
    const rows = [];
    let row = [], field = '', inQuotes = false;
    const s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (inQuotes) {
        if (c === '"') {
          if (s[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += c;
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field); field = '';
      } else if (c === '\n') {
        row.push(field); rows.push(row); row = []; field = '';
      } else {
        field += c;
      }
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }

    return rows.filter(r => !(r.length === 1 && r[0].trim() === ''));
  },

  // Imports events from CSV text. Returns { imported, skipped: [{row, reason}] }
  // or { error: 'missing_columns' } if title/date columns aren't found.
  importFromCSV(text) {
    const rows = this.parseCSV(text);
    if (rows.length === 0) return { imported: 0, skipped: [] };

    const header = rows[0].map(h => h.trim().toLowerCase());
    const idx = {
      title:     header.indexOf('title'),
      date:      header.indexOf('date'),
      type:      header.indexOf('type'),
      important: header.indexOf('important'),
    };
    if (idx.title === -1 || idx.date === -1) return { error: 'missing_columns' };

    const types = EventTypes.getAll();
    const defaultType = types.find(t => t.id === 'default');
    let imported = 0;
    const skipped = [];

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (r.every(c => c.trim() === '')) continue;

      const title = (r[idx.title] || '').trim();
      const dateRaw = (r[idx.date] || '').trim();
      const typeRaw = idx.type >= 0 ? (r[idx.type] || '').trim() : '';
      const importantRaw = idx.important >= 0 ? (r[idx.important] || '').trim().toLowerCase() : '';

      if (!title) { skipped.push({ row: i + 1, reason: 'missing title' }); continue; }

      const date = parseFlexibleDate(dateRaw);
      if (!date) { skipped.push({ row: i + 1, reason: `invalid date "${dateRaw}"` }); continue; }

      const type = types.find(t => t.id === typeRaw || t.label.toLowerCase() === typeRaw.toLowerCase()) || defaultType;

      Events.save({
        title,
        date,
        type: type.id,
        important: ['yes', 'true', '1', 'sim'].includes(importantRaw),
      });
      imported++;
    }

    return { imported, skipped };
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function csvEscape(field) {
  const s = String(field ?? '');
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Accepts YYYY-MM-DD or DD/MM/YYYY; returns YYYY-MM-DD or null if invalid.
function parseFlexibleDate(str) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return Number.isNaN(new Date(str + 'T00:00:00').getTime()) ? null : str;
  }
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;

  const [, dd, mm, yyyy] = m;
  const iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  const d = new Date(iso + 'T00:00:00');
  // Reject rollover (e.g. 31/02) rather than silently landing on a different day
  if (d.getDate() !== Number(dd) || d.getMonth() + 1 !== Number(mm)) return null;
  return iso;
}
