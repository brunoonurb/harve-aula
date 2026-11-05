# 04 — Plano técnico: módulo "Como usar IA"

## Stack
Não muda: Next.js 16.3, React 19.2, Tailwind 4 e TypeScript, sem dependências novas. As rotas e as APIs do Next não mudam; só os dados mudam.

## Arquivos
- **Novos:** `lib/types.ts`, `lib/ia-builders.ts`, `data/ia-slides.ts`.
- **Alterados:**
  - `lib/deck.ts`: mescla os slides, guarda `orig`, expõe `finalN` e passa a usar `downloadsOf(slide)`.
  - `components/SlideView.tsx`: uma linha.
  - `README.md`: números dos slides com prompt (20, 22, 25–30 e os novos), `/slide/22` e o total de 42.
- **Intocados:** `data/deck.json`, o script de extração, `Deck.tsx`, o Presenter, a Grade e as rotas.

## Etapas
| # | Entrega | Validação |
|---|---|---|
| E1 | Tipos em `lib/types.ts` e mescla neutra (`iaSlides = []`), com `orig`, `finalN` e downloads por origem | `tsc` e `build`. Deck idêntico: 36 slides, download no slide 15 |
| E2 | `lib/ia-builders.ts` | `tsc`. Slide de teste confere na grade |
| E3 | Slides 1–3 do módulo com notas (o prompt de anatomia tem 5 linhas ou mais, para abrir em tela cheia) | Total 39. Copiar, tela cheia e títulos funcionam |
| E4 | Slides 4–6 | Total 42. Os 2 prompts do slide 4 têm rótulo e são copiados separadamente |
| E5 | README e conferência da renumeração | `/slide/21` com download, `/slide/22` com o Passo 2, `/slide/43` dá 404. Transições 12→13 e 18→19 no apresentador |
| E6 | Verificação final | `tsc`, `build` com 42 rotas e passada visual completa |

## Riscos
- **Texto transbordando no palco**, porque o layout não é medido. Mitigação: caixas generosas, no máximo cerca de 6 bullets por slide e conferência visual.
- **Heurísticas de título e de rótulo.** Mitigação: os builders respeitam as regras (título em 24pt; heading bold até 90px acima do prompt).
- **Links `/slide/N` antigos mudam de destino.** Mitigação: avisar a turma e atualizar o README.
- **O atalho `C` copia só o primeiro prompt do slide** (afeta o slide 4). Aceitável e registrado nas notas.
