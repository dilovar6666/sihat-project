import React, { useEffect, useRef, useState } from 'react'

export const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    // Only enable on desktop devices with a fine pointer (mouse/trackpad)
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (!hasFinePointer) return

    setIsEnabled(true)
    document.body.classList.add('custom-cursor-active')

    const onMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
      }
      if (!isVisible) setIsVisible(true)
    }

    const onMouseEnter = () => setIsVisible(true)
    const onMouseLeave = () => setIsVisible(false)

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('mouseenter', onMouseEnter)
    document.addEventListener('mouseleave', onMouseLeave)

    return () => {
      document.body.classList.remove('custom-cursor-active')
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseenter', onMouseEnter)
      document.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [isVisible])

  if (!isEnabled) return null

  return (
    <div
      ref={cursorRef}
      className={`fixed top-0 left-0 pointer-events-none z-[99999] will-change-transform transition-opacity duration-150 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      {/* Outer sleek ring - transparent, no blur, no zoom/magnifier */}
      <div
        className="w-6 h-6 -ml-3 -mt-3 rounded-full border border-[#17A884]/70 dark:border-[#2EC4A7]/70 bg-transparent pointer-events-none"
        style={{
          boxShadow: '0 0 6px rgba(23, 168, 132, 0.2)',
        }}
      />

      {/* Center precision dot */}
      <div
        className="absolute top-0 left-0 w-1.5 h-1.5 -ml-[3px] -mt-[3px] rounded-full bg-[#17A884] dark:bg-[#2EC4A7] pointer-events-none"
        style={{
          boxShadow: '0 0 4px rgba(23, 168, 132, 0.8)',
        }}
      />
    </div>
  )
}
