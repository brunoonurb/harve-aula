# 01 — Negócio: aula "MCP e a Lojinha da Marina" (deck `/mcp`)

## Visão
Ao final da aula, o aluno entende o MCP e cria com **um único prompt** o time de agentes do e-commerce. Depois, monta o banco passo a passo e entrega um MVP de loja em que **toda a interação passa por `/api`**: login de 2 personas, criar, listar e atualizar produto, e adicionar ao carrinho.

## Público e pré-requisitos
- Alunos que vieram do Excel e já fizeram a aula `/agentes`. **O Claude Code já está instalado**, então não há slides de instalação.
- Cada aluno tem uma conta no Supabase.

## Personas
| Persona | Papel | Pode | Não pode |
|---|---|---|---|
| Aluno | — | Copiar os prompts "Faça junto", testar com curl | — |
| Professor | — | Seguir o roteiro com check-points por parte | — |
| Marina Souza (`marina@loja.dev`) | `lojista` | Criar, listar e atualizar os **próprios** produtos | Usar carrinho |
| Carlos Lima (`carlos@loja.dev`) | `cliente` | Listar produtos ativos, gerenciar o **próprio** carrinho | Criar ou editar produto, ver carrinho alheio |

A senha das duas personas é `senha123`, só para demonstração.

## Regras de negócio (MVP)
- RN01: cada usuário tem exatamente 1 papel (`lojista` ou `cliente`), definido no seed. Não há cadastro público.
- RN02: só o lojista cria e atualiza produtos; só o cliente usa carrinho.
- RN03: o lojista só altera os produtos **dele**.
- RN04: o nome do produto tem de 3 a 80 caracteres, o preço é > 0 (inteiro, em centavos) e o estoque é um inteiro >= 0.
- RN05: produto com estoque 0 é exibido como "esgotado" e não entra no carrinho.
- RN06: o cliente vê só produtos ativos; o lojista vê todos os seus.
- RN07: cada cliente tem no máximo 1 carrinho aberto, criado no primeiro item.
- RN08: a quantidade vai de 1 até o estoque. Repetir um produto soma a quantidade, sem passar do estoque.
- RN09: o item guarda o preço do momento em que foi adicionado.
- RN10: adicionar ao carrinho não baixa o estoque (a baixa fica para o checkout, fora do MVP).
- RN11: o `user_id` e o papel vêm sempre da sessão, nunca do corpo da requisição.
- RN12: erros seguem o padrão 401 (sem login), 403 (papel errado), 404 (recurso de outro usuário ou inexistente) e 422 (validação).

## Endpoints e critérios de aceite
| Método e rota | Quem | Critério principal |
|---|---|---|
| GET `/api/health` | público | Responde 200 com `{ ok: true }` e o banco acessível |
| POST `/api/auth/login` | público | Dado o Carlos, quando envia credenciais corretas, então recebe 200 e o cookie `sessao`; senha errada recebe 401 |
| POST `/api/auth/logout` | logado | Apaga a sessão; a chamada seguinte recebe 401 |
| GET `/api/auth/me` | logado | A Marina vê o nome e o papel `lojista` |
| POST `/api/produtos` | lojista | A Marina cria "Caneca" (3990, estoque 10) e recebe 201; preço <= 0 recebe 422; o Carlos recebe 403 |
| GET `/api/produtos` | logado | O Carlos vê só os ativos, com a flag esgotado; a Marina vê só os dela |
| GET `/api/produtos/[id]` | logado | Retorna o produto; id inexistente recebe 404 |
| PATCH `/api/produtos/[id]` | lojista dono | A Marina muda o preço e recebe 200; produto de outro lojista recebe 404 |
| GET `/api/carrinho` | cliente | Sem carrinho, retorna itens vazios e total 0 |
| POST `/api/carrinho/itens` | cliente | Adicionar 2 canecas leva ao total correto; quantidade acima do estoque recebe 422; o lojista recebe 403 |

### Critério de aceite global
Dado o sistema pronto, quando o MCP do Supabase é desligado (`/mcp` › supabase › Disable) e o roteiro de testes do qa roda só com `curl`, então todos os casos passam (inclusive 401, 403, 404 e 422). O sistema não depende do MCP em tempo de execução.

## Roteiro (~47 slides; o deck tem 47)
1. **Abertura**: capa, pergunta provocativa, o que vamos construir.
2. **Parte 1, MCP** (~10): o que é, cliente/servidor, tools/resources/prompts, transportes, `claude mcp add`, escopos, `.mcp.json`, MCPs úteis (Supabase com escrita no projeto de estudo, Playwright, Context7), segurança e check-point.
3. **Parte 2, o time**: diagrama, prompt único em 2 slides (1/2 e 2/2), conferência e techlead fixo, downloads e check-point.
4. **Parte 3, banco via /api**: por que /api, modelo, o que o banco garante, segurança e seed (só explicação, sem SQL nos slides), prompt em que o dba cria a migração e o seed pelo MCP (o aluno só informa o `project_ref` e aprova), conferência pelo MCP, `.env.local` (o aluno cola só a `service_role`), `/api/health`, curl e check-point.
5. **Parte 4, a Lojinha**: regras, login, criar produto, listar e atualizar, carrinho (cada etapa com prompt e curl), QA e check-point.
6. **Fechamento**: o sistema roda sem o MCP (bullets e prova sem MCP), erros comuns, próximos passos, downloads e check-point final.

## Fora do escopo
Checkout, pagamento, baixa de estoque, pedidos, upload de imagem, categorias, busca, paginação, cadastro público, recuperação de senha, deploy do projeto do aluno, telas (só curl) e Server Actions.
