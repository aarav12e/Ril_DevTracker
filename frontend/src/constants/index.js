// ─── Track & Development Constants ───────────────────────────────────────────
export const TRACKS = [
  'RFH',
  'BPL',
  'SAP',
  'NON_SAP',
  'PROD',
  'MEETING',
  'CODE_REVIEW',
  'RESEARCH',
]

export const DEV_TYPES = ['SAP', 'Non-SAP']

export const TYPE_OF_DEV = [
  'Development',
  'Code Review',
  'Production Issue',
  'Development Status Call',
  'Discussion',
  'Debugging',
]

export const PRIORITIES = ['low', 'medium', 'high']

// ─── User / Role Constants ────────────────────────────────────────────────────
export const ROLES = ['admin', 'manager', 'developer', 'intern']

export const DEV_STACK_TYPES = ['python', 'angular', 'react', 'node', 'sap', 'other']

// ─── Chart Colors ─────────────────────────────────────────────────────────────
export const STATUS_COLORS = {
  completed:   '#10B981',
  in_progress: '#C9A84C',
  pending:     '#94A3B8',
  on_hold:     '#EF4444',
}

export const TRACK_COLORS = [
  '#0D4F3C',
  '#C9A84C',
  '#3B82F6',
  '#8B5CF6',
  '#EF4444',
  '#64748B',
  '#F97316',
  '#14B8A6',
]

// ─── Role Permission Map ──────────────────────────────────────────────────────
export const PERMISSION_LABELS = {
  create_user:      'Create Users',
  delete_user:      'Delete Users',
  view_all:         'View All Logs',
  edit_all:         'Edit Any Log',
  edit_own:         'Edit Own Logs',
  view_own:         'View Own Logs',
  upload_task:      'Upload Excel',
  view_reports:     'View Reports',
  assign_task:      'Assign Tasks',
  log_hours:        'Log Hours',
  configure_system: 'Configure System',
}

export const ROLE_PERMISSIONS = {
  admin:     { permissions: Object.keys(PERMISSION_LABELS), access_level: 4 },
  manager:   { permissions: ['view_all', 'edit_all', 'upload_task', 'view_reports', 'assign_task'], access_level: 3 },
  developer: { permissions: ['view_own', 'edit_own', 'upload_task', 'log_hours'], access_level: 2 },
  intern:    { permissions: ['view_own', 'log_hours'], access_level: 1 },
}
