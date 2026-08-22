'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/** Copia para o clipboard com fallback para navegadores sem Clipboard API. */
export function useCopy(resetMs = 1600) {
  const [copied, setCopied] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const copy = useCallback(
    async (text: string, tag = 'ok') => {
      let done = false
      try {
        await navigator.clipboard.writeText(text)
        done = true
      } catch {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.setAttribute('readonly', '')
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        try {
          done = document.execCommand('copy')
        } catch {
          done = false
        }
        document.body.removeChild(ta)
      }
      if (done) {
        setCopied(tag)
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(null), resetMs)
      }
      return done
    },
    [resetMs],
  )

  return { copied, copy }
}
