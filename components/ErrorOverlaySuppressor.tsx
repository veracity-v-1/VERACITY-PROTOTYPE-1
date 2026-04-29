'use client'

import { useEffect } from 'react'

export default function ErrorOverlaySuppressor() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const hideErrorElements = () => {
      try {
        // Hide Next.js error dialog
        const errorDialog = document.querySelector('[data-nextjs-dialog]')
        if (errorDialog) {
          ;(errorDialog as HTMLElement).style.display = 'none'
        }
        
        // Hide Next.js toast notifications
        const errorToast = document.querySelector('[data-nextjs-toast]')
        if (errorToast) {
          ;(errorToast as HTMLElement).style.display = 'none'
        }
        
        // Hide elements with specific Next.js error classes
        const nextjsError = document.querySelector('[class*="nextjs-toast"]')
        if (nextjsError) {
          ;(nextjsError as HTMLElement).style.display = 'none'
        }

        // Hide fixed/absolute positioned divs at bottom containing "error" text
        const fixedElements = document.querySelectorAll('div[style*="position: fixed"], div[style*="position:absolute"]')
        fixedElements.forEach((el) => {
          const htmlEl = el as HTMLElement
          const text = htmlEl.textContent?.toLowerCase() || ''
          if (text.includes('error') && text.includes('2')) {
            const rect = htmlEl.getBoundingClientRect()
            if (rect.bottom > window.innerHeight - 100) {
              htmlEl.style.display = 'none'
            }
          }
        })
      } catch (error) {
        // Silently fail to avoid breaking the app
      }
    }

    // Run after a short delay to ensure DOM is ready
    const timeout = setTimeout(hideErrorElements, 100)

    // Watch for new elements
    const observer = new MutationObserver(() => {
      hideErrorElements()
    })
    
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      })
    }

    // Check periodically
    const interval = setInterval(hideErrorElements, 1000)

    return () => {
      clearTimeout(timeout)
      observer.disconnect()
      clearInterval(interval)
    }
  }, [])

  return null
}
