import React, { useRef } from 'react'
import gsap from 'gsap'

interface StarThemeToggleProps {
  theme: 'light' | 'dark'
  onToggle: (e?: React.MouseEvent<HTMLElement>) => void
}

export const StarThemeToggle: React.FC<StarThemeToggleProps> = ({ theme, onToggle }) => {
  const toggleRef = useRef<HTMLLabelElement | null>(null)
  const isDark = theme === 'dark'

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()
    const toggle = toggleRef.current
    if (!toggle) return

    if (toggle.classList.contains('animated')) {
      return
    }
    toggle.classList.add('animated')

    // Trigger theme wave from button
    onToggle(e)

    // Run Aaron Iker's iconic GSAP star flip animation
    gsap.to(toggle, {
      keyframes: [
        {
          '--y': '-48px',
          duration: 0.3,
          ease: 'power2.out',
        },
        {
          '--y': '68px',
          '--scale': 0.4,
          duration: 0.325,
          onStart() {
            toggle.classList.add('star-round')
          },
        },
        {
          '--y': '-80px',
          '--scale': 1,
          duration: 0.45,
          ease: 'power2.out',
          onStart() {
            setTimeout(() => toggle.classList.remove('star-round'), 100)
          },
        },
        {
          '--y': '0px',
          duration: 0.45,
          ease: 'power2.in',
          onComplete() {
            toggle.classList.add('star-bottom')
            setTimeout(() => toggle.classList.remove('star-bottom'), 200)
          },
        },
        {
          '--toggle-y': '3px',
          duration: 0.2,
        },
        {
          '--toggle-y': '0px',
          '--face-scale': !isDark ? 1 : 0.4,
          '--face-tear-o': !isDark ? 1 : 0,
          '--face-tear-y': !isDark ? '0px' : 0,
          '--face-tear-s': !isDark ? 1.5 : 1,
          duration: 0.125,
        },
        {
          '--face-scale': 1,
          '--face-tear-o': 0,
          '--face-tear-y': !isDark ? '4px' : 0,
          '--face-tear-s': !isDark ? 2.5 : 1,
          duration: 0.15,
        },
      ],
      clearProps: true,
      onComplete() {
        toggle.classList.remove('animated')
      },
    })

    gsap.to(toggle, {
      keyframes: [
        {
          '--hole-scale': 0.8,
          duration: 0.5,
          ease: 'elastic.out(1, .75)',
        },
        {
          '--hole-scale': 0,
          duration: 0.2,
          delay: 0.2,
        },
      ],
    })

    gsap.to(toggle, {
      '--rotate': '360deg',
      duration: 1.55,
      clearProps: true,
    })
  }

  return (
    <div
      id="theme-toggle-btn"
      onClick={handleClick}
      className="w-9 h-9 flex items-center justify-center shrink-0 cursor-pointer select-none"
      title={isDark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
      aria-label="Переключатель темы"
    >
      <div className="scale-[0.72] origin-center flex items-center justify-center pointer-events-none">
        <label
          ref={toggleRef}
          className="star-toggle"
        >
          <input type="checkbox" checked={isDark} readOnly />
          <div className="icon">
            <div className="star">
              <div className="eye"></div>
            </div>
          </div>
        </label>
      </div>
    </div>
  )
}
