# 02 — Arquitetura: deck `/mcp` e projeto "Lojinha da Marina"

São dois sistemas: (A) o **deck** neste repositório e (B) o **projeto do aluno**, que os prompts dos slides mandam construir.

## A. Deck `/mcp` (neste repositório)
- Usa o mesmo motor dos outros decks (`Deck` + `DeckSource`). O conteúdo é só dados em `lib/mcp-content.ts`, o layout reaproveita o builder do `/agentes` e o kit de agentes fica em `public/mcp-kit/*.md`.
- Rotas estáticas `/mcp` e `/mcp/slide/[n]` (`generateStaticParams` com `dynamicParams = false`).
- O `/agentes` não pode mudar visualmente.

## B. Projeto do aluno
Monolito Next.js: os Route Handlers são a única porta de entrada e o Supabase Postgres guarda os dados.

```mermaid
flowchart LR
  curl[curl / tela futura] -->|HTTP + cookie sessao| API[Route Handlers app/api/**]
  API --> AUTH[getSessao: cookie -> sessoes -> usuarios]
  API -->|supabase-js + service_role| DB[(Supabase Postgres)]
  DB --> FN[verificar_login via pgcrypto]
  Claude[Claude Code + agentes] -. MCP Supabase (escrita, só no projeto de estudo) .-> DB
```

### Componentes
| Componente | Responsabilidade |
|---|---|
| `app/api/health` | Checa se o app e o banco respondem |
| `app/api/auth/*` | Login (RPC `verificar_login` e cria a sessão), logout e me |
| `app/api/produtos/**` | CRUD do lojista e listagem por papel |
| `app/api/carrinho/**` | Carrinho do cliente |
| `lib/supabase.ts` | Cliente supabase-js com a service_role, **só no servidor** |
| `lib/sessao.ts` | `getSessao()` e helpers que exigem um papel e devolvem 401 ou 403 |
| MCP Supabase (ferramenta de desenvolvimento, fora do runtime) | O Claude inspeciona e, com o seu ok, cria o schema (`apply_migration`) e o seed (`execute_sql`) no projeto de estudo |

### Segurança
- A service_role só fica em `.env.local`, nunca no git nem no cliente. A RLS fica ligada em todas as tabelas, sem policies (a anon key não lê nada).
- A senha é guardada com hash bcrypt (pgcrypto) e verificada dentro do banco. O cookie `sessao` é httpOnly e SameSite=Lax, com expiração.
- A identidade e o papel vêm só da sessão (RN11). Recurso de outro usuário devolve 404, para não vazar que ele existe.
- O MCP do banco fica com `project_ref` fixo (sem `read_only`), limitado a UM projeto de estudo sem dado real. Nunca aponte para produção; mantenha a aprovação de cada chamada de ferramenta e leia o SQL antes de aprovar o `apply_migration`. Em projeto real, use `read_only=true`.

### Observabilidade (MVP)
`/api/health`, respostas de erro em JSON `{ erro: "mensagem" }` com os status da RN12, e logs do servidor no terminal do `npm run dev`.

## ADRs
- **ADR-01. Supabase como banco.** Tem MCP oficial, não exige instalação e a aula anterior já usou. Trade-off: depende de conta e internet.
- **ADR-02. Login com tabelas próprias, não Supabase Auth.** Pedido do professor: é mais didático ver usuário, senha e sessão no banco. O hash fica no Postgres (pgcrypto), para o aluno não ter que implementar criptografia. Trade-off: é menos seguro que um provedor pronto, então fica explícito que serve só para a aula.
- **ADR-03. Tudo via Route Handlers `/api`, sem Server Actions.** Uma porta única de regras, testável com curl e que serve qualquer front. Trade-off: mais código que Server Actions.
- **ADR-04. supabase-js com service_role e RLS sem policies.** Como a auth é própria, a RLS do Supabase não conhece o usuário. A autorização fica no Route Handler e a RLS só bloqueia a anon key. Trade-off: um bug na rota vaza dados, e por isso existem os testes de permissão do QA.
- **ADR-05. SQL puro, sem ORM.** Menos conceitos para o aluno; o SQL fica em `docs/mcp/03-dados.md` e o dba o aplica pelo MCP; os slides só explicam o resultado.
- **ADR-06. Prompt único para os 7 agentes, em 2 slides.** Cumpre o "um prompt para todos" sem estourar o cartão de prompt (~2400 caracteres).
- **ADR-07. Deck sem tipos novos de slide, salvo se for indispensável.** Reuso máximo do motor do `/agentes`.
- **ADR-08. MCP do Supabase com escrita, travado no projeto de estudo.** Justificativa: aula, o aluno só informa o `project_ref` e não cola SQL. Trade-off: o Claude pode gravar no banco; mitigação com `project_ref` fixo, aprovação de cada chamada e leitura do SQL antes do ok. Em projeto real, `read_only=true`. Plano B, só se o MCP falhar: o aluno roda o SQL no SQL Editor (ver ADR-09).
- **ADR-09. Aluno sem console no MCP e no banco.** Na conexão e na Parte 3 o aluno não usa terminal nem SQL Editor: pede tudo ao Claude no chat. Ele só informa o `project_ref`, autentica em `/mcp` › supabase › Authenticate, aprova o SQL e cola a `service_role` no `.env.local` pelo editor (o MCP não entrega essa chave e ela não passa pelo chat). O Claude cria o `.mcp.json` (escopo project, `project_ref` literal, que não é segredo). Trade-off: o Claude só carrega servidor MCP novo ao reiniciar, então o aluno reabre a sessão uma vez e volta com `/resume`. O Plano B do ADR-08 (SQL Editor) deixa de ser o fluxo da aula.
- **ADR-10. O MCP é ferramenta de desenvolvimento, fora do runtime do sistema.** O app acessa o banco só por `supabase-js` com a `service_role` do `.env.local` (`lib/supabase.ts`); nenhuma rota, biblioteca ou variável de ambiente depende do MCP, e o `.mcp.json` não vai para o deploy. Prova na aula: desligar o MCP (`/mcp` › supabase › Disable) e repetir o roteiro de testes do qa só com `curl`. Trade-off: nenhum para o sistema; o MCP só deixa de ajudar o Claude a inspecionar o banco.
