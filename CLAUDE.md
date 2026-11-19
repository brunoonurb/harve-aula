@AGENTS.md

# Projeto: Da Planilha ao Aplicativo (harve-aula)

Apresentação web fiel ao PPTX "Da Planilha ao Aplicativo" (Harve TI & Dados), usada em aula. Site 100% estático, sem backend nem banco; deploy na Vercel. Escaneamento completo em [docs/00-escaneamento.md](docs/00-escaneamento.md).

## Stack

- Next.js 16.3 (App Router), React 19.2, Tailwind 4, TypeScript 5.9. Dependências de runtime: só `next`, `react`, `react-dom`; não adicione outras sem necessidade.
- Python 3 só para extrair o conteúdo do PPTX e do PDF (o do PDF usa PyMuPDF `fitz` e PIL).

## Comandos

- `npm install`: rodar antes de tudo, porque os docs do Next em `node_modules/next/dist/docs/` dependem dele.
- `npm run dev` / `npm run build` / `npm start`
- `npm run extract`: regenera `data/deck.json` e `public/media/` a partir de `../Da Planilha ao Aplicativo.pptx`, que fica fora do repo.
- `npm run extract:next`: regenera `data/next-deck.json` e `public/next-media/` (WebP 1920×1080 + miniatura por página) a partir de `apresentacao_RNIA_*.pdf` na raiz do repo. O PDF é ignorado pelo git (nome contém e-mail) e **nunca** vai para `public/`. O script lista os blocos de código que ainda não têm correção em `data/next-code-overrides.json`.
- `npm run lint` usa `next lint`, que provavelmente não existe mais no Next 16; não confie nele.

## Arquitetura

- `data/deck.json` é **gerado**: não edite à mão, porque é sobrescrito pelo `extract`. Os ajustes que não vêm do PPTX ficam em `lib/deck.ts` (ex.: `slideDownloads`).
- `lib/deck.ts`: tipos do deck, mapeamento de fontes, detecção de blocos de código (todo o texto em Consolas e ≥ 20 caracteres; abre em tela cheia a partir de 5 linhas), placeholders `【】`, títulos dos slides.
- `components/Deck.tsx` orquestra estado, atalhos de teclado, swipe e URL; `SlideStage` escala um palco **fixo de 960×540** via `transform`; `SlideView` posiciona os elementos em coordenadas absolutas desse palco.
- Duas apresentações usam o mesmo motor: `lib/deck-core.ts` tem tipos e utilitários puros (sem JSON); `lib/deck.ts` liga o `deck.json` do PPTX (`mainSource`) e `lib/next-deck.ts` liga o deck do PDF (`nextSource`). Ambos são um `DeckSource` (slides, títulos, blocos copiáveis, `basePath`, `mediaPath`) passado por prop ao `Deck` pelos wrappers `MainDeck` e `NextDeck`; o resto do motor lê a fonte via `useDeckSource()` (`components/DeckSourceContext.tsx`). Componentes importam de `@/lib/deck-core`, nunca de `lib/deck.ts` (para não vazar o JSON de um deck no bundle do outro).
- Deck `/next` ("React com Next.js e IA", 187 páginas, do PDF): cada página é uma imagem de fundo do palco inteiro (`kind: 'image'`) e cada bloco de código/prompt/comando é um elemento `kind: 'copy'` invisível sobre o cartão, com os mesmos botões Copiar/tela cheia (C, Shift+C, E). O texto do PDF vem corrompido nas ligaduras da JetBrains Mono (`//`→`./`, `=>`→`<>`, `||`→`<|`...), então o texto copiado vem **só** de `data/next-code-overrides.json` (editado à mão, nunca sobrescrito pelo extrator; um bloco sem entrada não ganha botão). Formato: `{ "<página>": { "b1": { "kind": "code|prompt|cmd", "label"?, "text": ["linha", ...] } | { "skip": true } } }`. Os ids `bN` vêm de `data/next-deck.json`, na ordem de cima para baixo; se mudar o agrupamento no extrator, reconfira os ids. Em prompts, cada linha do array é um parágrafo (quebras visuais já unidas).
- Deck `/agentes` ("Time de agentes no Claude Code", 38 slides): sem PPTX/PDF, os slides são montados em código. Conteúdo **só dados** em `lib/agentes-content.ts` (`agentesSlides` com tipos `cover|section|question|bullets|prompt|code-bullets|team|downloads|checkpoint`, `agentesTeam`, `agentesDownloads`); layout no builder compartilhado `lib/shape-deck.ts` (`createShapeDeck`, tipos em `lib/shape-deck-types.ts`; elementos `shape` no palco 960×540, fonte mono do cartão com auto-size, listas num único bloco de texto com recuo deslocado), e `lib/agentes-deck.ts` só liga conteúdo e builder. Os 6 agentes prontos para download ficam em `public/agentes-kit/*.md`. Rotas `/agentes` e `/agentes/slide/[n]`, mesmo padrão do `/next`.
- Deck `/mcp` ("MCP e a Lojinha da Marina", 47 slides): mesmo motor e mesmo builder `lib/shape-deck.ts` do `/agentes`, sem tipo novo de slide. Conteúdo **só dados** em `lib/mcp-content.ts` (`mcpSlides`, `mcpTeam` com 6 agentes, `mcpDownloads`); `lib/mcp-deck.ts` liga conteúdo e builder; `components/McpDeck.tsx` e rotas `/mcp` e `/mcp/slide/[n]`. Os 7 agentes prontos ficam em `public/mcp-kit/*.md` e o prompt único dos slides 15 e 16 deve continuar coerente com eles. Os slides não têm mais SQL, só explicação (garantias do banco, segurança e seed) e um prompt em que o dba cria e aplica a migração pelo MCP do Supabase, com escrita no projeto de estudo (sem `read_only`; em projeto real, use `read_only=true`); o SQL fica em `docs/mcp/03-dados.md`, que é a fonte. Decisões e plano em `docs/mcp/` (`01-negocio.md` … `04-plano-tecnico.md`). Na conexão do MCP e na Parte 3 o aluno não usa terminal nem SQL Editor: o Claude cria o `.mcp.json` (escopo project, `project_ref` literal), o aluno reabre a sessão (`/resume`), autentica em `/mcp`, aprova o SQL e só cola a `service_role` no `.env.local` pelo editor; o techlead roda ele mesmo npm e curl de verificação. Limite real do cartão: 14 linhas a 8pt (prompt de 832 px e code-bullets de 476 px).
- Rotas: `/` (slide 1) e `/slide/[n]`, estáticas via `generateStaticParams` com `dynamicParams = false`; `params` é uma `Promise`. O deck do PDF segue o mesmo padrão em `/next` e `/next/slide/[n]` (1–187).

## Convenções

- Comentários e textos de UI em português; código e identificadores em inglês.
- Preserve a fidelidade visual ao PPTX: nunca layout responsivo dentro do palco, sempre medidas em px do palco 960×540.
- Tudo em `public/` é publicado: não deixe arquivos de teste lá (ex.: `public/teste2.html`).

## Time de agentes

Agentes em `.claude/agents/`: `arquiteto-de-sistema` (orquestrador), `especialista-negocio`, `dba`, `techlead`. Guia de uso em [GUIA-AGENTES.md](GUIA-AGENTES.md). A documentação de decisões vai em `docs/` (`01-negocio.md` … `04-plano-tecnico.md`).
