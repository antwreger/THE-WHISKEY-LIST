import { useEffect } from 'react'

let fadeNearHeaderSubscribers = 0
let fadeNearHeaderHeader = null
let fadeNearHeaderSections = []
let fadeNearHeaderTicking = false
let fadeNearHeaderOnScroll = null
let fadeNearHeaderOnResize = null
let fadeNearHeaderUpdate = null

export default function useFadeNearHeader(
  sectionClass = 'fade-near-header-text',
  headerSelector = 'header',
  headerMaskClass = 'is-fading'
) {
  useEffect(() => {
    fadeNearHeaderHeader = document.querySelector(headerSelector)
    fadeNearHeaderSections = Array.from(
      document.querySelectorAll(`.${sectionClass}`)
    )

    function isTouchingHeaderBottom(rect, headerBottomY, eps = 0.5) {
      return (
        rect.top - eps <= headerBottomY && rect.bottom + eps >= headerBottomY
      )
    }

    if (!fadeNearHeaderUpdate) {
      fadeNearHeaderUpdate = () => {
        if (!fadeNearHeaderHeader || !fadeNearHeaderSections.length) {
          fadeNearHeaderTicking = false
          return
        }
        const hb = fadeNearHeaderHeader.getBoundingClientRect().bottom
        let active = false
        for (const el of fadeNearHeaderSections) {
          const r = el.getBoundingClientRect()
          if (isTouchingHeaderBottom(r, hb)) {
            active = true
            break
          }
        }
        fadeNearHeaderHeader.classList.toggle(headerMaskClass, active)
        fadeNearHeaderTicking = false
      }
    }

    if (!fadeNearHeaderOnScroll) {
      fadeNearHeaderOnScroll = () => {
        if (!fadeNearHeaderTicking) {
          fadeNearHeaderTicking = true
          requestAnimationFrame(fadeNearHeaderUpdate)
        }
      }
    }

    if (!fadeNearHeaderOnResize) {
      fadeNearHeaderOnResize = () => {
        fadeNearHeaderUpdate()
      }
    }

    if (fadeNearHeaderSubscribers === 0) {
      window.addEventListener('scroll', fadeNearHeaderOnScroll, {
        passive: true,
      })
      window.addEventListener('resize', fadeNearHeaderOnResize, {
        passive: true,
      })
    }

    fadeNearHeaderSubscribers += 1
    fadeNearHeaderUpdate()

    return () => {
      fadeNearHeaderSubscribers = Math.max(0, fadeNearHeaderSubscribers - 1)
      if (fadeNearHeaderSubscribers === 0) {
        window.removeEventListener('scroll', fadeNearHeaderOnScroll)
        window.removeEventListener('resize', fadeNearHeaderOnResize)
        if (fadeNearHeaderHeader) {
          fadeNearHeaderHeader.classList.remove(headerMaskClass)
        }
        fadeNearHeaderHeader = null
        fadeNearHeaderSections = []
        fadeNearHeaderTicking = false
      }
    }
  }, [sectionClass, headerSelector, headerMaskClass])
}
