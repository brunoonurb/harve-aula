'use client'

const KEYS: [string, string][] = [
  ['→ ␣ ↓ N', 'Próximo slide'],
  ['← ↑ P', 'Slide anterior'],
  ['1…9 Enter', 'Ir para um slide pelo número'],
  ['Home / End', 'Primeiro / último slide'],
  ['G', 'Grade com todos os slides'],
  ['F', 'Tela cheia do navegador'],
  ['A', 'Modo apresentador (cronômetro + próximo slide)'],
  ['T', 'Iniciar / pausar o cronômetro'],
  ['C', 'Copiar o prompt do slide'],
  ['Shift + C', 'Copiar o prompt sem os 【 】'],
  ['E', 'Abrir o prompt em tela cheia'],
  ['B', 'Ligar / desligar o destaque dos 【 】'],
  ['?', 'Esta ajuda'],
  ['Esc', 'Fechar o que estiver aberto'],
]

export default function HelpOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay help-overlay" role="dialog" aria-modal="true" aria-label="Atalhos do teclado">
      <div className="help-card">
        <header className="overlay-head">
          <h2>Atalhos</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Fechar <kbd>Esc</kbd>
          </button>
        </header>
        <dl className="help-list">
          {KEYS.map(([k, d]) => (
            <div className="help-row" key={k}>
              <dt>
                {k.split(' ').map((part, i) => (
                  <kbd key={i}>{part}</kbd>
                ))}
              </dt>
              <dd>{d}</dd>
            </div>
          ))}
        </dl>
        <p className="help-foot">
          Nos slides com prompt, os botões <em>Copiar</em> e <em>tela cheia</em> aparecem no canto do
          bloco de código ao passar o mouse. Em telas de toque, arraste para os lados para trocar de
          slide.
        </p>
      </div>
    </div>
  )
}
