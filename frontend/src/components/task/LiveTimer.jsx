import { useState, useEffect, useRef } from 'react'

/**
 * LiveTimer — displays a live counting HH:MM:SS timer.
 * Extracted from DevDashboard.jsx.
 *
 * @param {number}  baseSeconds - Starting seconds count
 * @param {boolean} running     - If true, timer increments every second
 */
export default function LiveTimer({ baseSeconds, running, className = "text-forest-600" }) {
  const [seconds, setSeconds] = useState(baseSeconds)
  const ref = useRef(null)

  useEffect(() => {
    setSeconds(baseSeconds)
    clearInterval(ref.current)
    if (running) {
      ref.current = setInterval(() => setSeconds(s => s + 1), 1000)
    }
    return () => clearInterval(ref.current)
  }, [baseSeconds, running])

  const h = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')

  return (
    <span className={`font-mono font-bold text-2xl ${className}`}>
      {h}:{m}:{s}
    </span>
  )
}
