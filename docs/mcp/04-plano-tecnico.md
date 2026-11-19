# Plano técnico: deck `/mcp` "MCP e a Lojinha da Marina"

Status: planejamento (nenhum código alterado). Depende de `docs/mcp/03-dados.md` (DBA, em paralelo): este plano só referencia tabelas e colunas, não as define.

Verificado em `node_modules/next/dist/docs/01-app` (Next 16.3.2):
- `cookies()` de `next/headers` é **assíncrono** (`await cookies()`); lê e escreve (`set`/`delete`) em Route Handlers.
- `params` do Route Handler é **Promise**: `{ params }: { params: Promise<{ id: string }> }` e `await params`.
- `RouteContext<'/api/produtos/[id]'>` existe como helper global, mas só depois do typegen (`next dev|build|typegen`). Nos slides, usar a assinatura explícita (funciona sem typegen).
- Route Handlers não são cacheados por padrão. Ler `cookies()`/`request.cookies` já os torna dinâmicos.
- `middleware` agora se chama `proxy`. O MVP não usa nenhum dos dois (checagem de sessão dentro de cada handler via `getSessao()`).
- Variáveis sem `NEXT_PUBLIC_` ficam só no servidor (`SUPABASE_SERVICE_ROLE_KEY` nunca leva esse prefixo).
- `npm run lint` (`next lint`) não é confiável: usar `npx tsc --noEmit` + `npm run build`.

## 1. Estratégia de código do deck

Opções:
- **A. Copiar** `agentes-deck.ts` para `mcp-deck.ts`. Zero risco para `/agentes`; custo: ~470 linhas duplicadas, e todo ajuste visual futuro precisa ser feito duas vezes (paleta, auto-size, team).
- **B. Extrair** `lib/shape-deck.ts` com `createShapeDeck({ specs, team, downloads, downloadBase, basePath, mediaPath, docTitle })`, que devolve `{ source, total, titles }`. O estado hoje é de módulo (`slides`, `codeBlocks`, `downloads`) e passa a ser local da função. `agentes-deck.ts` vira ~15 linhas.

**Recomendação: B, em duas etapas protegidas.** O código já é puro (specs -> elementos), então a extração é mecânica. Para não quebrar `/agentes`: antes de mexer, gerar um snapshot JSON de `agentesSource.slides/codeBlocks/downloadsOf` (script em `scratchpad`, não vai ao repo); depois do refactor, comparar com `diff` (tem de ser idêntico byte a byte). Só então criar o `/mcp`. Se o diff falhar e não for trivial, cair para a opção A sem prejuízo.

Detalhes da extração:
- Mover os tipos de spec (`AgSlideSpec`, `AgTeamMember`) para `lib/shape-deck-types.ts` (nomes `ShapeSlideSpec`, `TeamMember`) e reexportar os antigos em `agentes-content.ts` (`export type AgSlideSpec = ShapeSlideSpec`). Assim `mcp-content.ts` não importa nada do conteúdo de `/agentes` (sem vazar no bundle).
- `downloads` do spec passa a carregar `{ file, label }[]` e o builder recebe `downloadBase` (`/agentes-kit` ou `/mcp-kit`).
- O spec `team` ganha `title?` opcional (hoje o título "cinco especialistas" está fixo em `teamSlide`). Sem `title`, mantém o texto atual (preserva o diff).
- Opcional em `checkpoint`: `kicker?` (hoje fixo "Para fechar"). Não é necessário.

## 2. Arquivos

Criar:
- `lib/shape-deck.ts` (builder genérico) e `lib/shape-deck-types.ts` (tipos).
- `lib/mcp-content.ts`: `mcpSlides`, `mcpTeam`, `mcpDownloads` (só dados, mesmas regras de limite do comentário final de `agentes-content.ts`).
- `lib/mcp-deck.ts`: `createShapeDeck(...)`; exporta `mcpSource`, `MCP_TOTAL`, `mcpTitles`.
- `components/McpDeck.tsx` (`'use client'`, `<Deck source={mcpSource} initial={initial} />`).
- `app/mcp/layout.tsx` (metadata, pt_BR), `app/mcp/page.tsx`, `app/mcp/slide/[n]/page.tsx` (cópia do padrão de `/agentes`: `generateStaticParams`, `dynamicParams = false`, `params` Promise, `notFound()`).
- `public/mcp-kit/{techlead,analista-negocio,ux,arquiteto-api,dba,qa,redutor-token}.md` (7 arquivos, frontmatter `name/description/model`; `techlead` com `model: inherit`, `redutor-token` com `haiku`, os demais `sonnet`).

Alterar:
- `lib/agentes-deck.ts` (vira wrapper), `lib/agentes-content.ts` (tipos reexportados), `components/AgentesDeck.tsx` só se mudar o import (não deve).
- `CLAUDE.md`: parágrafo do deck `/mcp` (uma linha de rotas + onde fica o conteúdo).
- Verificar se há índice/links entre decks (`grep -rn "/agentes" app components`): hoje só `layout` e `page` de `/agentes`, então não há home a atualizar.

Não tocar: `lib/deck-core.ts`, `components/Deck.tsx`, `data/*`.

## 3. Ajustes no motor

- **Team com 6 agentes: necessário, mas só em `teamSlide`** (não no motor). Layout: 3 + 3, centro entre as linhas.
  - Cartões `NW = 230`, linha de cima `topX = [64, 365, 666]` (y 158), centro `350,285`, linha de baixo `botX = [64, 365, 666]` (y 410).
  - Conectores de baixo: barra horizontal em y 390 de `botX[0]+NW/2` a `botX[2]+NW/2`, e uma haste de 21 px por cartão, igual ao de cima.
  - Generalizar: `agents.slice(0,3)` em cima e `slice(3)` embaixo; `botX` = 2 posições (layout atual, preservado) se `n === 5`, 3 posições se `n === 6`. O diff do `/agentes` fica intacto.
  - Título do slide: "Um tech lead no centro, seis especialistas ao redor" (cabe em 1 linha, ~52 caracteres a 21pt/832px).
- **Tipo novo "tabela de endpoints": dispensável.** A lista cabe em `code-bullets` (cartão mono à direita com `METODO /rota - papel`, ~10 linhas; bullets à esquerda explicam 401/403/404/422). Não criar tipo novo.
- **Tipo `cmd` no cartão**: já existe (`kind: 'cmd'`, não expansível). Usar nos curls.
- Limite crítico: cartão `prompt` comporta ~2400 caracteres a 8pt (~20 linhas). O prompt único dos 7 agentes (1/2 e 2/2) precisa de **~1000 a 1100 caracteres por slide**, ou ficará em 8pt e ilegível em sala. Os prompts criam cada agente com `description` curta e 3 a 5 regras; a versão completa fica nos `.md` do kit (slide de downloads). Ver riscos.

## 4. Snippets canônicos do projeto do aluno

Validados contra a doc do Next instalada (cookies async, params Promise). A parte `supabase-js` não está instalada neste repo e **não foi executada**: nomes de colunas **alinhados com `03-dados.md`** na revisão cruzada do arquiteto (token uuid gerado pelo banco, `preco_centavos` inteiro, seed `marina@loja.dev`/`senha123`).

`lib/supabase.ts` (cliente só no servidor):
```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)
```

Route Handler com `params` (`app/api/produtos/[id]/route.ts`):
```ts
import { getSessao } from '@/lib/sessao'
import { supabase } from '@/lib/supabase'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessao = await getSessao()
  if (!sessao) return Response.json({ erro: 'não autenticado' }, { status: 401 })
  const { id } = await params
  const { data } = await supabase
    .from('produtos').select('*').eq('id', id).maybeSingle()
  if (!data) return Response.json({ erro: 'não encontrado' }, { status: 404 })
  return Response.json(data)
}
```

Gravar cookie no login (`app/api/auth/login/route.ts`):
```ts
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { email, senha } = await request.json().catch(() => ({}))
  if (!email || !senha)
    return Response.json({ erro: 'email e senha são obrigatórios' }, { status: 422 })
  const { data: u } = await supabase
    .rpc('verificar_login', { p_email: email, p_senha: senha }).maybeSingle()
  if (!u) return Response.json({ erro: 'credenciais inválidas' }, { status: 401 })
  const { data: s } = await supabase.from('sessoes')
    .insert({ usuario_id: u.id }).select('token').single()
  ;(await cookies()).set('sessao', s!.token, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production',
  })
  return Response.json({ id: u.id, papel: u.papel })
}
```
`secure` condicional é obrigatório: com `secure: true` o curl em `http://localhost` não reenvia o cookie e o aluno acha que o login falhou.

Apagar cookie no logout: `(await cookies()).delete('sessao')` (opcional: `delete().eq('token', token)` em `sessoes`).

`getSessao()` (`lib/sessao.ts`):
```ts
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

export type Sessao = { usuarioId: string; papel: 'lojista' | 'cliente' }

export async function getSessao(): Promise<Sessao | null> {
  const token = (await cookies()).get('sessao')?.value
  if (!token) return null
  const { data: s } = await supabase.from('sessoes')
    .select('usuario_id').eq('token', token)
    .gt('expira_em', new Date().toISOString()).maybeSingle()
  if (!s) return null
  const { data: u } = await supabase.from('usuarios')
    .select('papel').eq('id', s.usuario_id).maybeSingle()
  return u ? { usuarioId: s.usuario_id, papel: u.papel } : null
}
```
Duas consultas simples em vez de join embutido: sem tipos gerados do Supabase, o embed volta tipado como array/objeto ambíguo e o `tsc` do aluno reclama.

curl com cookie (`-c` grava, `-b` envia):
```bash
curl -i -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"marina@loja.dev","senha":"senha123"}'

curl -b cookies.txt http://localhost:3000/api/auth/me

curl -b cookies.txt -X POST http://localhost:3000/api/produtos \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Caneca","preco_centavos":3990,"estoque":10}'
```
Notas: usar `-i` só no login (mostra `Set-Cookie ... HttpOnly`). Carlos usa outro arquivo (`-c carlos.txt`) para as duas personas coexistirem. `cookies.txt` deve ir para o `.gitignore` do aluno, junto com `.env.local`.

Prompts do techlead devem sempre dizer: "Leia `node_modules/next/dist/docs/` (Route Handlers, `cookies`) antes de escrever; `cookies()` e `params` são assíncronos; apenas `app/api/**/route.ts`; nenhuma Server Action; `SUPABASE_SERVICE_ROLE_KEY` só no servidor."

Fatos de MCP para os slides (confirmar na doc oficial no dia da implementação, pois mudam rápido; hoje 2026-11):
- `claude mcp add --transport http <nome> <url>`; `claude mcp list`; `/mcp` dentro da sessão; escopos `--scope local` (padrão, só você neste projeto), `project` (grava `.mcp.json`, vai ao git), `user` (todos os projetos).
- `.mcp.json` aceita `${VAR}` e `${VAR:-padrao}` em `url`, `headers`, `env`; segredo vem do ambiente, nunca literal no arquivo versionado.
- Supabase MCP com `?read_only=true&project_ref=<ref>`; Playwright via stdio (`npx @playwright/mcp@latest`); Context7 por HTTP.
- Slide de segurança: somente leitura, escopo por projeto, não apontar para produção, token fora do git, aprovar chamadas.

## 5. Etapas de implementação

| Etapa | Objetivo | Arquivos | Critério de pronto |
|---|---|---|---|
| E0 | Snapshot de referência do `/agentes` | script em scratchpad | JSON de slides/codeBlocks/downloads salvo; `npm run build` verde |
| E1 | Extrair builder (refactor puro) | `lib/shape-deck.ts`, `shape-deck-types.ts`, `agentes-deck.ts`, `agentes-content.ts` | `diff` do snapshot vazio; `tsc --noEmit` e build verdes; `/agentes` e `/agentes/slide/38` abrem |
| E2 | Team para 5 ou 6 agentes + `title` opcional | `shape-deck.ts` | snapshot de `/agentes` ainda idêntico; teste visual com 6 (screenshot via Playwright) sem sobreposição |
| E3 | Casca `/mcp` com 3 slides de teste | `app/mcp/*`, `McpDeck.tsx`, `mcp-deck.ts`, `mcp-content.ts` mínimo | build gera `/mcp` e `/mcp/slide/1..3`; slide 4 dá 404 |
| E4 | Parte 1 (~10 slides) + check-point | `mcp-content.ts` | todos os comandos revisados na doc oficial; sem estouro de texto (screenshot de cada slide) |
| E5 | Parte 2 (agentes): 2 prompts, team, downloads + 7 `.md` | `mcp-content.ts`, `public/mcp-kit/*` | prompts ~1100 caracteres cada e fonte >= 9pt; 7 botões de download baixam; os `.md` batem com o prompt |
| E6 | Parte 3 (banco): SQL em blocos, migração, seed, `.env.local`, health, curl | `mcp-content.ts` | SQL idêntico ao de `03-dados.md` (copiar, não reescrever); blocos copiáveis com Copiar |
| E7 | Parte 4 (login, criar, listar/atualizar, carrinho): prompt + curl por etapa | `mcp-content.ts` | snippets da seção 4 usados sem desvios; curls da ordem login -> produtos -> carrinho coerentes |
| E8 | Validação ponta a ponta do roteiro | projeto-piloto em scratchpad (não vai ao repo) | seguir os prompts em um projeto Next novo + Supabase de teste; todos os curls retornam o esperado (200/401/403/404/422) |
| E9 | Fechamento | `CLAUDE.md`, README se citar decks | `npm run build` gera `/mcp/slide/1..N` (N ~ 45) e `/agentes/slide/1..38`; `git status` sem arquivos soltos em `public/` |

Orçamento de slides: P1 = 10 (+ capa e secção no início, total ~12), P2 = ~8, P3 = ~11, P4 = ~12, cada parte fechando com `checkpoint`. Total alvo 45; o total real vem de `mcpSlides.length`.

## 6. Riscos

- **Prompt dos 7 agentes grande demais para 2 cartões**: mitigação, descrição curta no prompt + `.md` completo no kit; medir caracteres no E5; se estourar, o prompt vira 3 slides (1/3..3/3) mantendo "mesma sessão".
- **Divergência schema x slides**: nomes de colunas e SQL vêm do DBA. Mitigação: E6 e E7 só começam com `03-dados.md` pronto; copiar literal.
- **API de MCP/Supabase muda**: URL e flags do Supabase MCP, `read_only`, transportes. Mitigação: reconferir na doc oficial em E4 e E8.
- **Cookie `secure` e curl em http**: tratado com `secure` condicional ao `NODE_ENV`.
- **Service role key vaza**: `.env.local` no `.gitignore`, sem `NEXT_PUBLIC_`, cliente só em `lib/supabase.ts` importado por handlers; slide de segurança reforça. RLS ligada sem policy é só rede de proteção: a service role ignora RLS, então a autorização real está nos handlers (401/403/404).
- **`verificar_login` chamável por qualquer um via PostgREST**: pedir ao DBA `revoke execute ... from public, anon, authenticated` e `grant` só para `service_role`. O mesmo vale para `usuarios` e `sessoes` (nunca expostas).
- **Token de sessão em texto puro na tabela**: aceitável no MVP didático; alternativa (guardar sha256 do token) fica como comentário de "próximo passo".
- **Regressão em `/agentes`**: coberta por snapshot (E0/E1/E2).
- **Tipagem do alunos com `RouteContext`**: não depende de typegen se usarem a assinatura explícita (adotada).
- **Linha de `GET /api/health` ser prerenderizada no build**: se não acessar request nem rede, pode ser estática. Como consulta o banco, o handler deve fazer a consulta dentro do `GET` e o E8 confere em `next build` que aparece como dinâmica (`ƒ`).
- **Preview em sala**: 45 slides com `preload: 'all'` é leve (sem imagens), sem problema.

## Discordâncias e observações sobre a arquitetura

1. "RLS ligada sem policies" protege só contra o acesso por `anon`; com a service role ela é ignorada. Manter, mas não vender como segurança do app.
2. As funções `verificar_login` (e tabelas) precisam de `revoke` explícito, como acima.
3. Recomendo extração do builder (B) com snapshot, em vez de cópia, desde que o diff do `/agentes` seja vazio.
