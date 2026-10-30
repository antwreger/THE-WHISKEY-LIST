import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

let scrollToMiddleSubscribers = 0
let scrollToMiddleOnHashChange = null

const customScrollRules = {
  '#meny': { behavior: 'auto', block: 'start', offset: 80 },
  '#dynamic-menu': { behavior: 'auto', block: 'start', offset: 80 },
  '#about': { behavior: 'auto', block: 'start', offset: 80 },
  '#findus': { behavior: 'auto', block: 'start', offset: 80 },
  // Sits flush after the "Boka Provning" CTA with no spacing of its
  // own, so a mismatched offset leaves the CTA's edge peeking out
  // under the header. Track the header's real height instead of a
  // guessed pixel value so it stays flush on any breakpoint.
  '#catalogue': { behavior: 'auto', block: 'start', offset: 'header' },
}

// On desktop the whiskey/rom page should load in full (intro visible),
// not jump straight to the catalogue — that jump is only useful on the
// cramped mobile viewport where scrolling past the intro costs more.
const MOBILE_ONLY_ANCHORS = new Set(['#catalogue'])
const MOBILE_BREAKPOINT = 800

export function scrollToId(id) {
  if (!id || !id.startsWith('#')) return false

  if (MOBILE_ONLY_ANCHORS.has(id) && window.innerWidth > MOBILE_BREAKPOINT) {
    return false
  }

  const target = document.querySelector(id)
  if (!target) return false

  const rule = customScrollRules[id]
  if (rule && rule.block === 'start' && rule.offset) {
    const offset =
      rule.offset === 'header'
        ? (document.querySelector('header')?.getBoundingClientRect()
            .height ?? 0)
        : rule.offset
    const rect = target.getBoundingClientRect()
    const scrollTop = window.scrollY + rect.top - offset
    window.scrollTo({ top: scrollTop, behavior: rule.behavior })
  } else {
    target.scrollIntoView({ behavior: 'auto', block: 'center' })
  }

  return true
}

export default function useScrollToMiddle() {
  const location = useLocation()

  useEffect(() => {
    if (!scrollToMiddleOnHashChange) {
      scrollToMiddleOnHashChange = () => {
        const hash = window.location.hash
        if (!hash) return

        setTimeout(() => {
          scrollToId(hash)
        }, 0)
      }
    }

    if (scrollToMiddleSubscribers === 0) {
      window.addEventListener('hashchange', scrollToMiddleOnHashChange)
    }

    scrollToMiddleSubscribers += 1

    return () => {
      scrollToMiddleSubscribers = Math.max(0, scrollToMiddleSubscribers - 1)
      if (scrollToMiddleSubscribers === 0) {
        window.removeEventListener('hashchange', scrollToMiddleOnHashChange)
      }
    }
  }, [])

  useEffect(() => {
    if (!location.hash) return

    const timeoutId = window.setTimeout(() => {
      scrollToId(location.hash)
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [location.hash, location.pathname])
}
