/**
 * EmptyState — reusable empty-table placeholder.
 * Replaces repeated icon + text pattern inside table cells.
 *
 * @param {React.ElementType} icon      - Lucide icon component
 * @param {string}            message   - Primary message
 * @param {string}            [sub]     - Optional secondary hint
 * @param {number}            [colSpan] - colSpan for the wrapping <td>
 */
export default function EmptyState({ icon: Icon, message, sub, colSpan = 8 }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-14 text-center">
        {Icon && <Icon size={34} className="mx-auto mb-3 text-slate-300" />}
        <p className="text-muted text-sm font-medium">{message}</p>
        {sub && <p className="text-muted text-xs mt-1">{sub}</p>}
      </td>
    </tr>
  )
}
