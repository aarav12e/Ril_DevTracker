/**
 * KpiCard — statistic card with icon, label, value and sub-text.
 * Extracted from AdminDashboard.jsx to be reusable across dashboards.
 *
 * @param {React.ElementType} icon
 * @param {string}            label
 * @param {string|number}     value
 * @param {string}            [sub]
 * @param {'forest'|'amber'|'blue'|'red'} [color='forest']
 */
export default function KpiCard({ icon: Icon, label, value, sub, color = 'forest' }) {
  const colors = {
    forest: 'bg-forest-50 text-forest-600 border-forest-600',
    amber:  'bg-amber-50  text-amber-600  border-amber-500',
    blue:   'bg-blue-50   text-blue-600   border-blue-500',
    red:    'bg-red-50    text-red-600    border-red-500',
  }
  const [bg, text, border] = colors[color].split(' ')
  return (
    <div className={`card border-b-4 ${border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-muted uppercase tracking-wide mb-1">{label}</p>
          <p className="font-bold text-3xl text-charcoal font-display">{value}</p>
          {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bg} ${text}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}
