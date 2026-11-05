'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CodeBlock, DeckSource, stripPlaceholders } from '@/lib/deck-core'
import { DeckSourceProvider } from '@/components/DeckSourceContext'
import SlideStage from '@/components/SlideStage'
import SlideView from '@/components/SlideView'
import SlideGrid from '@/components/SlideGrid'
import PresenterPanel from '@/components/PresenterPanel'
import PromptModal from '@/components/PromptModal'
import HelpOverlay from '@/components/HelpOverlay'
import Toolbar from '@/components/Toolbar'
import { useCopy } from '@/lib/useCopy'

export default function Deck({ source, initial = 1 }: { source: DeckSource; initial?: number }) {
  const { slides, total: TOTAL, titles: slideTitles, basePath, mediaPath, docTitle } = source
  const clamp = useCallback((v: number) => Math.min(TOTAL, Math.max(1, v)), [TOTAL])
  const [n, setN] = useState(() => Math.min(TOTAL, Math.max(1, initial)))
  const [dir, setDir] = useState<1 | -1>(1)
  const [grid, setGrid] = useState(false)
  const [help, setHelp] = useState(false)
  const [presenter, setPresenter] = useState(false)
  const [highlight, setHighlight] = useState(true)
  const [modal, setModal] = useState<CodeBlock | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const jumpBuf = useRef('')
  const jumpTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { copy } = useCopy()

  const slide = slides[n - 1]
  // deck pequeno: pre-carrega tudo uma vez (nao depende do slide atual)
  const nearN = source.preload === 'all' ? 0 : n
  const prompts = useMemo(() => source.codeBlocksOf(n), [source, n])

  /* ---------------- navegacao ---------------- */

  const go = useCallback((to: number) => {
    setN((prev) => {
      const next = clamp(to)
      if (next !== prev) setDir(next > prev ? 1 : -1)
      return next
    })
  }, [clamp])

  const step = useCallback((delta: 1 | -1) => go(n + delta), [go, n])

  /* URL compartilhavel por slide, sem recarregar a pagina */
  useEffect(() => {
    const path = n === 1 ? basePath || '/' : `${basePath}/slide/${n}`
    if (window.location.pathname !== path) {
      window.history.replaceState(null, '', path)
    }
    document.title = `${n}. ${slideTitles[n - 1]} · ${docTitle}`
  }, [n, basePath, docTitle, slideTitles])

  /* Botoes voltar/avancar do navegador */
  useEffect(() => {
    const onPop = () => {
      const m = window.location.pathname.match(/\/slide\/(\d+)/)
      go(m ? Number(m[1]) : 1)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [go])

  /* ---------------- cronometro ---------------- */

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  /* ---------------- avisos rapidos ---------------- */

  const flash = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 1500)
  }, [])

  /* ---------------- atalhos de teclado ---------------- */

  const copyCurrent = useCallback(
    (clean: boolean) => {
      const b = prompts[0]
      if (!b) {
        flash('Este slide não tem nada para copiar')
        return
      }
      copy(clean ? stripPlaceholders(b.text) : b.text)
      flash(clean ? 'Copiado sem 【 】' : b.kind === 'code' || b.kind === 'cmd' ? 'Código copiado' : 'Prompt copiado')
    },
    [copy, flash, prompts],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const k = e.key

      if (k === 'Escape') {
        if (modal) return setModal(null)
        if (help) return setHelp(false)
        if (grid) return setGrid(false)
        if (document.fullscreenElement) return void document.exitFullscreen()
        return
      }
      if (modal) return

      if (/^[0-9]$/.test(k)) {
        jumpBuf.current += k
        flash(`Ir para o slide ${jumpBuf.current}`)
        if (jumpTimer.current) clearTimeout(jumpTimer.current)
        jumpTimer.current = setTimeout(() => {
          jumpBuf.current = ''
        }, 1200)
        return
      }
      if (k === 'Enter' && jumpBuf.current) {
        go(Number(jumpBuf.current))
        jumpBuf.current = ''
        return
      }

      switch (k) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'PageDown':
        case 'n':
        case 'N':
          e.preventDefault()
          step(1)
          break
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
        case 'p':
        case 'P':
          e.preventDefault()
          step(-1)
          break
        case 'Home':
          go(1)
          break
        case 'End':
          go(TOTAL)
          break
        case 'g':
        case 'G':
          setGrid((v) => !v)
          break
        case 'f':
        case 'F':
          toggleFullscreen()
          break
        case 'a':
        case 'A':
          setPresenter((v) => !v)
          break
        case 'c':
          copyCurrent(false)
          break
        case 'C':
          copyCurrent(true)
          break
        case 'e':
        case 'E': {
          const b = prompts.find((x) => x.expandable)
          if (b) setModal(b)
          else flash('Este slide não tem bloco para ampliar')
          break
        }
        case 'b':
        case 'B':
          setHighlight((v) => {
            flash(v ? 'Destaque dos 【 】 desligado' : 'Destaque dos 【 】 ligado')
            return !v
          })
          break
        case 't':
        case 'T':
          setRunning((v) => !v)
          setPresenter(true)
          break
        case '?':
          setHelp((v) => !v)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [TOTAL, copyCurrent, flash, go, grid, help, modal, prompts, step])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else document.documentElement.requestFullscreen?.()
  }

  /* Pre-carrega imagens para nao haver espera no meio da fala: o deck pequeno
   * carrega tudo; o deck grande (uma imagem por pagina) so as vizinhas do slide atual. */
  useEffect(() => {
    const targets = source.preload === 'all' ? slides : [nearN + 1, nearN + 2, nearN - 1].flatMap((i) => slides[i - 1] ?? [])
    const srcs = new Set<string>()
    for (const s of targets) for (const el of s.els) if (el.kind === 'image' && el.src) srcs.add(el.src)
    const timer = setTimeout(() => {
      srcs.forEach((src) => {
        const img = new Image()
        img.src = `${mediaPath}/${src}`
      })
    }, 400)
    return () => clearTimeout(timer)
  }, [source.preload, slides, mediaPath, nearN])

  return (
    <DeckSourceProvider value={source}>
      <div className={`deck${presenter ? ' has-presenter' : ''}`}>
        <main className="deck-main">
          <SlideStage onSwipe={(d) => step(d)}>
            <div key={n} className={`slide-anim ${dir > 0 ? 'from-right' : 'from-left'}`}>
              <SlideView slide={slide} interactive highlight={highlight} onExpand={setModal} />
            </div>
          </SlideStage>

          <Toolbar
            n={n}
            total={TOTAL}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
            onGo={go}
            onGrid={() => setGrid(true)}
            onHelp={() => setHelp(true)}
            onFullscreen={toggleFullscreen}
            onPresenter={() => setPresenter((v) => !v)}
            presenter={presenter}
            prompts={prompts}
            onExpand={setModal}
          />
        </main>

        {presenter && (
          <PresenterPanel
            current={n}
            seconds={seconds}
            running={running}
            onToggleTimer={() => setRunning((v) => !v)}
            onResetTimer={() => {
              setSeconds(0)
              setRunning(false)
            }}
            onGo={go}
            prompts={prompts}
            onExpand={setModal}
          />
        )}

        {grid && (
          <SlideGrid
            current={n}
            onPick={(x) => {
              go(x)
              setGrid(false)
            }}
            onClose={() => setGrid(false)}
          />
        )}

        {modal && <PromptModal block={modal} highlight={highlight} onClose={() => setModal(null)} />}
        {help && <HelpOverlay onClose={() => setHelp(false)} />}

        {toast && <div className="toast">{toast}</div>}

        <p className="sr-only" aria-live="polite">
          Slide {n} de {TOTAL}: {slideTitles[n - 1]}
        </p>
      </div>
    </DeckSourceProvider>
  )
}
