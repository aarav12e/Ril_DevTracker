/**
 * LoadingSpinner — reusable centered spinner used across all pages.
 * Replaces the repeated 6-line inline div pattern.
 *
 * @param {string} [size='md']  - 'sm' (w-6 h-6) | 'md' (w-8 h-8)
 * @param {string} [className]  - extra wrapper classes
 */
export default function LoadingSpinner({ size = 'md', className = '' }) {
  const dim = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'
  return (
    <div className={`flex items-center justify-center py-16 ${className}`}>
      <div className={`${dim} border-2 border-forest-600/20 border-t-forest-600 rounded-full animate-spin`} />
    </div>
  )
}
