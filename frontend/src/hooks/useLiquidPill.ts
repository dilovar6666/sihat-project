import { useRef, useEffect } from 'react'
import gsap from 'gsap'

export interface UseLiquidPillOptions {
  orientation?: 'horizontal' | 'vertical' | 'auto'
  duration?: number
}

/**
 * Ultra-smooth, 60fps GPU-accelerated liquid glass indicator tab hook.
 * Fluidly morphs, stretches, and glides between active tabs/nav items during route transitions.
 */
export function useLiquidPill<T extends string>(
  activeId: T | null | undefined,
  options: UseLiquidPillOptions = {}
) {
  const containerRef = useRef<any>(null)
  const pillRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Record<string, HTMLElement | null>>({})
  const isMountedRef = useRef(false)
  const lastGeometryRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null)

  const { orientation = 'auto', duration = 0.34 } = options

  useEffect(() => {
    const container = containerRef.current
    const pill = pillRef.current
    if (!container || !pill) return

    let rafId: number | null = null

    const updatePill = (animate: boolean) => {
      const activeEl = activeId ? itemRefs.current[activeId] : null

      // Target item not active or deselected (e.g. Home page)
      if (!activeEl) {
        gsap.killTweensOf(pill)
        if (animate && isMountedRef.current) {
          gsap.to(pill, {
            opacity: 0,
            scale: 0.8,
            duration: 0.22,
            ease: 'power2.out',
            overwrite: 'auto',
          })
        } else {
          gsap.set(pill, { opacity: 0, scale: 0.8 })
        }
        return
      }

      const containerRect = container.getBoundingClientRect()
      const targetRect = activeEl.getBoundingClientRect()

      // If DOM has not finished layout/painting, wait for next animation frame
      if (targetRect.width === 0 || targetRect.height === 0 || containerRect.width === 0) {
        rafId = requestAnimationFrame(() => updatePill(animate))
        return
      }

      const targetX = targetRect.left - containerRect.left + (container.scrollLeft || 0)
      const targetY = targetRect.top - containerRect.top + (container.scrollTop || 0)
      const targetWidth = targetRect.width
      const targetHeight = targetRect.height

      const isFirstRender = !isMountedRef.current
      isMountedRef.current = true

      // First mount without animation to prevent initial page-load jumps
      if (isFirstRender && !animate) {
        lastGeometryRef.current = { x: targetX, y: targetY, width: targetWidth, height: targetHeight }
        gsap.set(pill, {
          x: targetX,
          y: targetY,
          width: targetWidth,
          height: targetHeight,
          opacity: 1,
          scale: 1,
          scaleX: 1,
          scaleY: 1,
        })
        return
      }

      const currentX = (gsap.getProperty(pill, 'x') as number) ?? targetX
      const currentY = (gsap.getProperty(pill, 'y') as number) ?? targetY
      const currentOpacity = (gsap.getProperty(pill, 'opacity') as number) ?? 0

      const dx = targetX - currentX
      const dy = targetY - currentY

      let axis = orientation
      if (axis === 'auto') {
        axis = Math.abs(dx) >= Math.abs(dy) ? 'horizontal' : 'vertical'
      }

      lastGeometryRef.current = { x: targetX, y: targetY, width: targetWidth, height: targetHeight }

      // Kill any running tweens to prevent stutter or competing transforms
      gsap.killTweensOf(pill)

      // If pill was previously hidden, smoothly zoom & fade in at target
      if (currentOpacity < 0.1) {
        gsap.set(pill, {
          x: targetX,
          y: targetY,
          width: targetWidth,
          height: targetHeight,
          scale: 0.82,
          opacity: 0,
        })
        gsap.to(pill, {
          opacity: 1,
          scale: 1,
          scaleX: 1,
          scaleY: 1,
          duration: duration * 0.9,
          ease: 'power3.out',
          overwrite: 'auto',
        })
        return
      }

      // Smooth coordinated liquid glide timeline
      const tl = gsap.timeline({ overwrite: 'auto' })

      tl.to(
        pill,
        {
          x: targetX,
          y: targetY,
          width: targetWidth,
          height: targetHeight,
          opacity: 1,
          scale: 1,
          duration,
          ease: 'power3.out',
        },
        0
      )

      // Organic fluid liquid stretch along movement axis
      const distance = axis === 'horizontal' ? Math.abs(dx) : Math.abs(dy)
      if (distance > 18) {
        const prop = axis === 'horizontal' ? 'scaleX' : 'scaleY'
        tl.to(
          pill,
          {
            [prop]: 1.09,
            duration: duration * 0.45,
            ease: 'sine.out',
          },
          0
        )
        tl.to(
          pill,
          {
            [prop]: 1,
            duration: duration * 0.55,
            ease: 'sine.inOut',
          },
          duration * 0.45
        )
      }
    }

    updatePill(true)

    // ResizeObserver: only recalibrate when NOT currently actively tweening
    const ro = new ResizeObserver(() => {
      if (!gsap.isTweening(pill)) {
        updatePill(false)
      }
    })
    ro.observe(container)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      ro.disconnect()
    }
  }, [activeId, orientation, duration])

  return { containerRef, pillRef, itemRefs }
}
