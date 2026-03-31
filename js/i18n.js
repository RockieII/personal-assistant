// i18n.js — internationalization (English / Portuguese)
// Usage: T('key') returns the string in the current language.

const TRANSLATIONS = {
  en: {
    // Navigation
    nav_calendar:  'Calendar',
    nav_agenda:    'Agenda',
    nav_settings:  'Settings',

    // Calendar tabs
    tab_month:     'Month',
    tab_week:      'Week',
    tab_agenda:    'Agenda',

    // Header labels
    header_upcoming:  'Upcoming',
    header_week_of:   'Week of',

    // Event form
    form_new_event:       'New Event',
    form_edit_event:      'Edit Event',
    form_title:           'Title',
    form_title_hint:      "What's happening?",
    form_type:            'Type',
    form_date:            'Date',
    form_time:            'Time',
    form_time_optional:   '(optional)',
    form_reminder:        'Reminder',
    form_notify_at:       'Notify at (time of day)',
    form_days_before:     'Days before event',
    form_important:       'Important',
    form_save:            'Save',
    form_delete:          'Delete Event',

    // Event type recurrence
    recurrence_none:      'Never',
    recurrence_daily:     'Daily',
    recurrence_weekly:    'Weekly',
    recurrence_monthly:   'Monthly',
    recurrence_yearly:    'Yearly',
    recurrence_label:     'Repeats',
    recurrence_desc_none:    "Doesn't repeat",
    recurrence_desc_daily:   'Repeats every day',
    recurrence_desc_weekly:  'Repeats every week',
    recurrence_desc_monthly: 'Repeats every month',
    recurrence_desc_yearly:  'Repeats every year',

    // Event card meta
    all_day:       'All day',

    // Agenda / calendar date labels
    today:         'Today',
    tomorrow:      'Tomorrow',

    // Empty state
    empty_title:   'No upcoming events',
    empty_desc:    'Tap + to add one',

    // Settings
    settings_notifications:  'Notifications',
    settings_event_types:    'Event Types',
    settings_data:           'Data',
    settings_language:       'Language',

    // Notification permission states
    notif_permission:        'Permission',
    notif_enabled:           'Enabled',
    notif_blocked:           'Blocked — change in browser settings',
    notif_default:           'Not yet enabled',
    notif_unsupported:       'Not supported on this browser',
    notif_enable_btn:        'Enable',

    // Event type settings
    type_builtin:            'Built-in',
    type_add:                'Add Event Type',
    type_edit:               'Edit',

    // Add / edit type form
    type_form_add:           'New Event Type',
    type_form_edit:          'Edit Event Type',
    type_form_name:          'Name',
    type_form_color:         'Color',
    type_form_icon:          'Icon (emoji)',
    type_form_save:          'Save Type',

    // Data section
    data_clear:              'Clear All Events',
    data_clear_desc:         'Permanently deletes all events',

    // Language setting
    lang_english:            'English',
    lang_portuguese:         'Português',

    // Confirmations
    confirm_delete_event:    'Delete this event?',
    confirm_delete_type:     'Delete this event type? Events of this type will keep their data.',
    confirm_clear_all:       'Delete ALL events? This cannot be undone.',

    // Default event type names (used when seeding)
    type_event:              'Event',
    type_birthday:           'Birthday',
  },

  pt: {
    // Navigation
    nav_calendar:  'Calendário',
    nav_agenda:    'Agenda',
    nav_settings:  'Definições',

    // Calendar tabs
    tab_month:     'Mês',
    tab_week:      'Semana',
    tab_agenda:    'Agenda',

    // Header labels
    header_upcoming:  'Próximos',
    header_week_of:   'Semana de',

    // Event form
    form_new_event:       'Novo Evento',
    form_edit_event:      'Editar Evento',
    form_title:           'Título',
    form_title_hint:      'O que acontece?',
    form_type:            'Tipo',
    form_date:            'Data',
    form_time:            'Hora',
    form_time_optional:   '(opcional)',
    form_reminder:        'Lembrete',
    form_notify_at:       'Notificar às (hora do dia)',
    form_days_before:     'Dias antes do evento',
    form_important:       'Importante',
    form_save:            'Guardar',
    form_delete:          'Eliminar Evento',

    // Event type recurrence
    recurrence_none:      'Nunca',
    recurrence_daily:     'Diariamente',
    recurrence_weekly:    'Semanalmente',
    recurrence_monthly:   'Mensalmente',
    recurrence_yearly:    'Anualmente',
    recurrence_label:     'Repete',
    recurrence_desc_none:    'Não se repete',
    recurrence_desc_daily:   'Repete todos os dias',
    recurrence_desc_weekly:  'Repete todas as semanas',
    recurrence_desc_monthly: 'Repete todos os meses',
    recurrence_desc_yearly:  'Repete todos os anos',

    // Event card meta
    all_day:       'Dia inteiro',

    // Agenda / calendar date labels
    today:         'Hoje',
    tomorrow:      'Amanhã',

    // Empty state
    empty_title:   'Sem eventos próximos',
    empty_desc:    'Toca + para adicionar',

    // Settings
    settings_notifications:  'Notificações',
    settings_event_types:    'Tipos de Evento',
    settings_data:           'Dados',
    settings_language:       'Idioma',

    // Notification permission states
    notif_permission:        'Permissão',
    notif_enabled:           'Ativado',
    notif_blocked:           'Bloqueado — altera nas definições do browser',
    notif_default:           'Ainda não ativado',
    notif_unsupported:       'Não suportado neste browser',
    notif_enable_btn:        'Ativar',

    // Event type settings
    type_builtin:            'Predefinido',
    type_add:                'Adicionar Tipo de Evento',
    type_edit:               'Editar',

    // Add / edit type form
    type_form_add:           'Novo Tipo de Evento',
    type_form_edit:          'Editar Tipo de Evento',
    type_form_name:          'Nome',
    type_form_color:         'Cor',
    type_form_icon:          'Ícone (emoji)',
    type_form_save:          'Guardar Tipo',

    // Data section
    data_clear:              'Apagar Todos os Eventos',
    data_clear_desc:         'Elimina todos os eventos permanentemente',

    // Language setting
    lang_english:            'English',
    lang_portuguese:         'Português',

    // Confirmations
    confirm_delete_event:    'Eliminar este evento?',
    confirm_delete_type:     'Eliminar este tipo de evento? Os eventos deste tipo mantêm os seus dados.',
    confirm_clear_all:       'Apagar TODOS os eventos? Esta ação não pode ser revertida.',

    // Default event type names
    type_event:              'Evento',
    type_birthday:           'Aniversário',
  },
};

const I18n = {
  lang: localStorage.getItem('lang') || 'en',

  // Get a translated string by key
  t(key) {
    return TRANSLATIONS[this.lang]?.[key] || TRANSLATIONS['en']?.[key] || key;
  },

  // Change the active language and reload the UI
  setLanguage(lang) {
    this.lang = lang;
    localStorage.setItem('lang', lang);
  },

  // The locale string used for date formatting
  locale() {
    return this.lang === 'pt' ? 'pt-PT' : 'en-US';
  },
};

// Shorthand — use T('key') anywhere in the app
function T(key) { return I18n.t(key); }

// Locale-aware date formatter
function formatDate(dateStr, options) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(I18n.locale(), options);
}
