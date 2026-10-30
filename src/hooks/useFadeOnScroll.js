import { useEffect } from 'react'

let fadeOnScrollSubscribers = 0
let fadeOnScrollElements = []
let fadeOnScrollTicking = false
let fadeOnScrollOnScroll = null
let fadeOnScrollOnResize = null
let fadeOnScrollUpdate = null

export default function useFadeOnScroll(className = 'fade-on-scroll') {
  useEffect(() => {
    fadeOnScrollElements = Array.from(
      document.querySelectorAll(`.${className}`)
    )

    const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

    if (!fadeOnScrollUpdate) {
      fadeOnScrollUpdate = () => {
        const winH = window.innerHeight
        const center = winH / 2
        const fadeDist = winH / 2
        for (const el of fadeOnScrollElements) {
          const rect = el.getBoundingClientRect()
          const distFromCenter = Math.abs(rect.top + rect.height / 2 - center)
          const t = clamp(distFromCenter / fadeDist, 0, 1)
          el.style.opacity = (1 - t).toFixed(3)
        }
        fadeOnScrollTicking = false
      }
    }

    if (!fadeOnScrollOnScroll) {
      fadeOnScrollOnScroll = () => {
        if (!fadeOnScrollTicking) {
          fadeOnScrollTicking = true
          requestAnimationFrame(fadeOnScrollUpdate)
        }
      }
    }

    if (!fadeOnScrollOnResize) {
      fadeOnScrollOnResize = () => {
        fadeOnScrollUpdate()
      }
    }

    if (fadeOnScrollSubscribers === 0) {
      window.addEventListener('scroll', fadeOnScrollOnScroll, { passive: true })
      window.addEventListener('resize', fadeOnScrollOnResize, { passive: true })
    }

    fadeOnScrollSubscribers += 1
    fadeOnScrollUpdate()

    return () => {
      fadeOnScrollSubscribers = Math.max(0, fadeOnScrollSubscribers - 1)
      if (fadeOnScrollSubscribers === 0) {
        window.removeEventListener('scroll', fadeOnScrollOnScroll)
        window.removeEventListener('resize', fadeOnScrollOnResize)
        for (const el of fadeOnScrollElements) el.style.opacity = ''
        fadeOnScrollElements = []
        fadeOnScrollTicking = false
      }
    }
  }, [className])
}
