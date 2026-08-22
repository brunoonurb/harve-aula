# Da Planilha ao Aplicativo — apresentação web

Versão web da apresentação `Da Planilha ao Aplicativo.pptx` (Harve TI & Dados), fiel ao
original slide a slide, com **cópia de prompt** e **prompt em tela cheia** nos passos
práticos da oficina.

Next.js 16 (App Router) + Tailwind v4. Saída 100% estática — pronta para a Vercel.

## Rodar

```bash
npm install
npm run dev     # http://localhost:3000
```

## Publicar na Vercel

O projeto vive na subpasta `deck-harve/`. Duas opções:

**A — projeto só do deck (mais simples)**

```bash
cd deck-harve
git init && git add -A && git commit -m "Apresentação web"
npx vercel        # aceite os padrões; framework detectado: Next.js
npx vercel --prod
```

**B — repositório inteiro (`harve/`) na Vercel**

Ao importar o repositório, em *Settings → Build & Deployment*, defina
**Root Directory = `deck-harve`**. O resto é detectado automaticamente
(build `next build`, sem variáveis de ambiente).

## Como usar na aula

| Tecla | Ação |
| --- | --- |
| `→` `␣` `↓` `N` | próximo slide |
| `←` `↑` `P` | slide anterior |
| dígitos + `Enter` | ir para um slide pelo número |
| `Home` / `End` | primeiro / último slide |
| `G` | grade com todos os slides |
| `F` | tela cheia do navegador |
| `A` | modo apresentador (cronômetro + próximo slide) |
| `T` | inicia / pausa o cronômetro |
| `C` | copia o prompt do slide |
| `Shift`+`C` | copia o prompt sem os `【 】` |
| `E` | abre o prompt em tela cheia |
| `B` | liga / desliga o destaque dos `【 】` |
| `?` | ajuda |
| `Esc` | fecha o que estiver aberto |

Em telas de toque, arraste para os lados para trocar de slide.

Cada slide tem URL própria: `/slide/16` abre direto no prompt do Passo 2 — útil para
mandar no chat da turma.

### Prompts

Os 10 blocos de código do roteiro (slides 14, 16, 19, 20, 21, 22 com dois, 23 e 24)
ganham controles no canto do bloco, que aparecem ao passar o mouse:

- **Copiar** — o prompt como está, com os `【placeholders】`.
- **Copiar sem 【 】** — remove só os colchetes e mantém os valores da planilha-modelo,
  pronto para colar no chat de IA.
- **⤢** — abre o prompt em tela cheia, com o corpo dimensionado para caber na projeção.

As mesmas ações estão na barra inferior, no modo apresentador e no atalho de teclado.

## Como a fidelidade é garantida

`scripts/extract-pptx.py` lê o `.pptx` (que é um zip de XML) e gera `data/deck.json`
com a geometria e o estilo de cada shape, já convertidos de EMU para pixels num palco
de **960×540**. O componente `SlideView` posiciona cada elemento em coordenadas
absolutas nesse palco, e `SlideStage` escala o palco inteiro por `transform` para caber
na janela — o layout é sempre calculado em 960×540, então as quebras de linha nunca
mudam com o tamanho da tela, e o texto continua vetorial (nítido em 4K, selecionável,
indexável).

Três detalhes que importam:

- **Fontes.** O PPTX usa Nunito, Nunito Light e Titillium Web — todas no Google Fonts,
  carregadas por `next/font` (mesmos desenhos, mesmas métricas).
- **Monospace.** O original usa Consolas (avanço 0,5498em), que não existe na web.
  Roboto Mono (0,6em) entra a **0,916** do corpo: o avanço fica idêntico (0,55em) e a
  altura-x bate (0,484 vs 0,488). Os blocos de código ocupam exatamente a mesma
  largura de linha do PPTX.
- **Entrelinha.** `100%` no PPTX equivale a `1.2 ×` o corpo da fonte, e o *strut* de
  cada parágrafo usa a fonte e o corpo do maior run — sem isso o navegador infla a
  caixa de linha e o texto desce alguns pixels.

O resultado foi auditado slide a slide: **nenhuma** das 200+ caixas de texto transborda
a altura que o PowerPoint mediu para ela, o que confirma que a contagem de linhas e a
entrelinha coincidem com o original.

## Regerar a partir de um PPTX novo

Se a apresentação mudar, sobrescreva o `.pptx` e rode:

```bash
npm run extract   # regenera data/deck.json e public/media/
```

O script aceita tanto o `.pptx` quanto uma pasta já descompactada:

```bash
python3 scripts/extract-pptx.py <arquivo.pptx|pasta> data/deck.json public/media
```

Os blocos de prompt são detectados automaticamente (todo shape cujo texto está
inteiramente em Consolas, com 20+ caracteres); os limites ficam em `lib/deck.ts`
(`COPY_MIN_CHARS`, `EXPAND_MIN_LINES`).

## Estrutura

```
app/
  layout.tsx            fontes (Nunito, Titillium Web, Roboto Mono) e metadados
  page.tsx              slide 1
  slide/[n]/page.tsx    uma rota estática por slide (1–36)
components/
  Deck.tsx              estado, teclado, swipe, URL, cronômetro
  SlideStage.tsx        palco 960×540 escalado por transform
  SlideView.tsx         renderiza os shapes do PPTX
  CodeBlockControls.tsx botões de copiar/expandir no bloco de prompt
  PromptModal.tsx       prompt em tela cheia
  SlideGrid.tsx         grade de todos os slides
  PresenterPanel.tsx    cronômetro, prompts e próximo slide
  Toolbar.tsx           barra inferior + progresso
  Thumb.tsx             miniatura (o mesmo HTML em escala menor)
lib/
  deck.ts               tipos, tipografia, detecção de prompts, 【placeholders】
  useCopy.ts            clipboard com fallback
data/deck.json          geometria e estilo dos 36 slides
public/media/           as 42 imagens originais do PPTX
scripts/extract-pptx.py conversor PPTX → JSON
```

## Observação

O PPTX não tem notas do orador (só o marcador de número de página), então o modo
apresentador mostra cronômetro, título, prompts do slide e o próximo slide — não há
notas para exibir.
# harve-aula
