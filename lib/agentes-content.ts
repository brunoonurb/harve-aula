/* ------------------------------------------------------------------ *
 * Conteudo do deck /agentes ("Time de agentes no Claude Code").
 * SO DADOS: nenhum layout aqui. O layout dos slides fica em
 * lib/agentes-deck.ts. Troque o conteudo livremente respeitando os
 * limites praticos documentados no fim do arquivo.
 * ------------------------------------------------------------------ */

export type AgSlideSpec =
  | { type: 'cover'; title: string; subtitle: string }
  | { type: 'section'; title: string }
  | { type: 'question'; text: string }
  | { type: 'bullets'; kicker: string; title: string; subtitle?: string; bullets: string[] }
  | {
      type: 'prompt'
      kicker: string
      title: string
      subtitle?: string
      badge?: string
      label: string
      kind: 'prompt' | 'cmd' | 'code'
      lines: string[]
    }
  | {
      type: 'code-bullets'
      kicker: string
      title: string
      bullets: string[]
      label: string
      kind: 'code' | 'cmd'
      lines: string[]
    }
  | { type: 'team' }
  | { type: 'downloads'; title: string; subtitle?: string }
  | { type: 'checkpoint'; title: string; bullets: string[] }

export const agentesSlides: AgSlideSpec[] = [
  {
    "type": "cover",
    "title": "Time de agentes no Claude Code",
    "subtitle": "Crie dentro da Caderneta da Cláudia um time de especialistas: negócio, UX, arquitetura, QA e um techlead no comando."
  },
  {
    "type": "question",
    "text": "A Cláudia pediu uma função nova. Você vai usar um prompt gigante ou chamar quem entende de cada parte?"
  },
  {
    "type": "bullets",
    "kicker": "POR QUE UM TIME",
    "title": "Um prompt gigante faz tudo mal",
    "subtitle": "Requisitos, telas, código e testes numa conversa só enchem o contexto e misturam os papéis.",
    "bullets": [
      "Um prompt de 40 linhas tenta ser analista, designer e QA ao mesmo tempo, e nenhum papel sai bom",
      "Cada subagente tem contexto próprio: a conversa principal não enche de leitura de arquivos",
      "Cada especialista tem só as ferramentas de que precisa (o de UX não escreve código)",
      "O time fica no git: o Paulo clona o projeto e usa os mesmos agentes",
      "Você troca 'faça tudo' por 'chame o especialista certo', e o resultado é mais previsível"
    ]
  },
  {
    "type": "code-bullets",
    "kicker": "ANATOMIA",
    "title": "Um agente é um arquivo .md",
    "bullets": [
      "Frontmatter YAML: name, description, tools e model",
      "description diz QUANDO usar: é com ela que o Claude escolhe o agente",
      "tools limita o que o agente pode fazer",
      "O corpo é o system prompt: papel, limites e formato da resposta"
    ],
    "label": ".claude/agents/qa.md",
    "kind": "code",
    "lines": [
      "---",
      "name: qa",
      "description: Use depois de implementar,",
      "  para criar testes dos critérios.",
      "tools: Read, Grep, Glob, Bash",
      "model: sonnet",
      "---",
      "Você é o QA da Caderneta da Cláudia.",
      "Escreva testes, nunca altere o código",
      "de produção. Responda com a lista de",
      "testes criados e como rodá-los."
    ]
  },
  {
    "type": "bullets",
    "kicker": "ONDE MORA",
    "title": "No projeto ou na sua máquina",
    "subtitle": "O mesmo formato de arquivo vale nos dois lugares. Muda quem enxerga o agente.",
    "bullets": [
      "Projeto: .claude/agents/ na raiz da Caderneta. Vai para o git e o time inteiro usa",
      "Usuário: ~/.claude/agents/ vale para todos os seus projetos, mas só na sua máquina",
      "Mesmo name nos dois lugares: o agente do projeto vence",
      "Nesta aula tudo fica no projeto, porque as regras são da Caderneta",
      "O comando /agents lista os agentes e ajuda a criar novos"
    ]
  },
  {
    "type": "section",
    "title": "INSTALAR"
  },
  {
    "type": "prompt",
    "kicker": "INSTALAR · MAC E LINUX",
    "title": "Instale no macOS, Linux ou WSL",
    "subtitle": "Instalador nativo, o recomendado: se atualiza sozinho. Depois, abra um terminal novo.",
    "badge": "Faça junto",
    "label": "NO TERMINAL",
    "kind": "cmd",
    "lines": [
      "curl -fsSL https://claude.ai/install.sh | bash",
      "",
      "claude --version"
    ]
  },
  {
    "type": "prompt",
    "kicker": "INSTALAR · WINDOWS",
    "title": "Instale no Windows (PowerShell)",
    "subtitle": "Rode no PowerShell (o prompt começa com PS C:\\). No WSL, use o comando do Linux.",
    "badge": "Faça junto",
    "label": "NO POWERSHELL",
    "kind": "cmd",
    "lines": [
      "irm https://claude.ai/install.ps1 | iex",
      "",
      "claude --version"
    ]
  },
  {
    "type": "prompt",
    "kicker": "INSTALAR · ALTERNATIVA",
    "title": "Prefere npm? Também funciona",
    "subtitle": "Exige Node.js 22 ou mais novo e nunca use sudo. O nativo segue o recomendado.",
    "label": "NO TERMINAL",
    "kind": "cmd",
    "lines": [
      "npm install -g @anthropic-ai/claude-code",
      "",
      "claude --version"
    ]
  },
  {
    "type": "code-bullets",
    "kicker": "INSTALAR · ABRIR",
    "title": "Abra o Claude na Caderneta e confira",
    "bullets": [
      "Entre na pasta do projeto e rode claude",
      "No primeiro uso, o login abre no navegador",
      "Precisa de conta Pro, Max, Team, Enterprise ou Console",
      "Dentro do Claude, /agents mostra os agentes: por ora, só os nativos",
      "Se der erro de instalação, rode claude doctor"
    ],
    "label": "NO TERMINAL",
    "kind": "cmd",
    "lines": [
      "cd 【pasta-da-caderneta】",
      "claude",
      "",
      "# já dentro do Claude Code:",
      "/agents"
    ]
  },
  {
    "type": "bullets",
    "kicker": "SEM TERMINAL",
    "title": "Está no chat? Use o Claude Code na web",
    "subtitle": "Em claude.ai/code o Claude Code roda na nuvem, ligado ao repositório da Caderneta no GitHub.",
    "bullets": [
      "Abra claude.ai/code (ou a aba Code do app Claude no desktop) e conecte o seu GitHub",
      "Escolha o repositório da Caderneta: os agentes em .claude/agents/ vêm junto",
      "Os prompts desta aula funcionam igual: o Claude cria os arquivos e abre um branch para você revisar",
      "No chat comum (conversa) não existem subagentes: lá ele só ajuda a escrever o .md",
      "Precisa de plano pago (Pro ou Max); a conta gratuita não tem Claude Code"
    ]
  },
  {
    "type": "prompt",
    "kicker": "SEM TERMINAL · PLANO B",
    "title": "Só tem o chat? Gere o arquivo e suba no GitHub",
    "subtitle": "O chat escreve o agente; você cola no GitHub e usa depois no claude.ai/code.",
    "badge": "Faça junto",
    "label": "NO CHAT DO CLAUDE",
    "kind": "prompt",
    "lines": [
      "Vou te passar o pedido de criação de um subagente do Claude Code. Devolva SÓ o conteúdo final do arquivo .md (frontmatter YAML + corpo), pronto para colar, sem comentários.",
      "Pedido: 【cole aqui o prompt do agente que está nesta aula】",
      "Depois, no GitHub: repositório da Caderneta › Add file › Create new file › nome .claude/agents/【nome】.md › cole o conteúdo › Commit changes."
    ]
  },
  {
    "type": "section",
    "title": "O TIME"
  },
  {
    "type": "team"
  },
  {
    "type": "bullets",
    "kicker": "TECHLEAD",
    "title": "O techlead comanda o time",
    "subtitle": "É o único que recebe a demanda e fala com os outros cinco. Ele decide e implementa.",
    "bullets": [
      "Recebe a demanda e quebra em tarefas pequenas",
      "Chama os especialistas pela ferramenta Agent, em paralelo quando são independentes",
      "Consolida as respostas, decide e mostra o plano antes de codar",
      "Pede a sua aprovação e só depois implementa, em etapas",
      "Modelo inherit (usa o da sua sessão), com todas as ferramentas"
    ]
  },
  {
    "type": "prompt",
    "kicker": "TECHLEAD",
    "title": "Peça ao Claude Code para criar o techlead",
    "subtitle": "Um prompt só. O Claude cria o arquivo e você revisa antes de salvar.",
    "badge": "Faça junto",
    "label": "O PEDIDO AO CLAUDE CODE",
    "kind": "prompt",
    "lines": [
      "Crie o arquivo .claude/agents/techlead.md neste projeto. É a Caderneta da Cláudia: Next.js App Router, TypeScript, Tailwind, Supabase via supabase-js, Server Actions.",
      "Frontmatter YAML: name: techlead; description: 'Use SEMPRE que chegar uma demanda nova de funcionalidade: coordena os especialistas e implementa'; model: inherit; sem o campo tools (herda todas).",
      "Corpo, em português. Responsabilidade: receber a demanda, delegar aos agentes analista-negocio, ux, arquiteto-next, qa e redutor-token pela ferramenta Agent, em paralelo quando forem independentes.",
      "Regra: cada subagente não vê a conversa. Todo prompt de delegação deve ser autocontido (demanda, contexto da Caderneta, arquivos relevantes, formato esperado).",
      "Fluxo: consolidar, decidir, mostrar o plano e PEDIR APROVAÇÃO antes de codar; implementar em etapas pequenas; chamar o qa no fim. Nunca afrouxar a regra do user_id."
    ]
  },
  {
    "type": "bullets",
    "kicker": "ANALISTA DE NEGÓCIO",
    "title": "O analista transforma pedido em regra",
    "subtitle": "Antes de qualquer tela ou código, alguém precisa dizer o que a Cláudia realmente quer.",
    "bullets": [
      "Escreve requisitos, regras de negócio e o escopo mínimo da demanda",
      "Cria critérios de aceite no formato Dado / Quando / Então",
      "Aponta o que é suposição e o que precisa ser perguntado a você",
      "Só lê o projeto e pesquisa na web (WebSearch), sem editar nada",
      "Modelo sonnet"
    ]
  },
  {
    "type": "prompt",
    "kicker": "ANALISTA DE NEGÓCIO",
    "title": "Peça ao Claude Code para criar o analista",
    "badge": "Faça junto",
    "label": "O PEDIDO AO CLAUDE CODE",
    "kind": "prompt",
    "lines": [
      "Crie o arquivo .claude/agents/analista-negocio.md neste projeto (Caderneta da Cláudia: controle financeiro pessoal em Next.js + Supabase; a Cláudia divide a planilha com o Paulo e cada lançamento tem um user_id dono).",
      "Frontmatter YAML: name: analista-negocio; description: 'Use ao receber uma demanda nova, ANTES de desenhar telas ou código, para definir requisitos e critérios de aceite'; tools: Read, Grep, Glob, WebSearch; model: sonnet.",
      "Corpo em português. Responsabilidade: requisitos, regras de negócio, critérios de aceite em Dado/Quando/Então e o menor escopo que entrega valor.",
      "O que NÃO faz: não escolhe tecnologia, não escreve código, não edita arquivos. Dúvidas viram perguntas marcadas como [PERGUNTA]; palpites viram [SUPOSIÇÃO].",
      "Formato da resposta: Objetivo, Regras de negócio (RN01...), Critérios de aceite, Fora do escopo, Perguntas em aberto. Máximo de 40 linhas."
    ]
  },
  {
    "type": "bullets",
    "kicker": "UX",
    "title": "O UX pensa em quem usa a tela",
    "subtitle": "Uma tela bonita no caminho feliz não basta: a Cláudia também vê erro e lista vazia.",
    "bullets": [
      "Desenha o fluxo e as telas da demanda, passo a passo",
      "Define os estados: vazio, carregando, erro e sucesso",
      "Cuida de acessibilidade e escreve os textos de UI em português",
      "Sugere componentes com classes Tailwind, sem alterar arquivos",
      "Só leitura, modelo sonnet"
    ]
  },
  {
    "type": "prompt",
    "kicker": "UX",
    "title": "Peça ao Claude Code para criar o UX",
    "badge": "Faça junto",
    "label": "O PEDIDO AO CLAUDE CODE",
    "kind": "prompt",
    "lines": [
      "Crie o arquivo .claude/agents/ux.md neste projeto (Caderneta da Cláudia: Next.js App Router, TypeScript e Tailwind; telas de login, lançamentos, categorias e dashboard).",
      "Frontmatter YAML: name: ux; description: 'Use para desenhar fluxo, telas, estados e textos de interface de uma funcionalidade, antes da implementação'; tools: Read, Grep, Glob; model: sonnet.",
      "Corpo em português. Responsabilidade: fluxo do usuário, estrutura das telas, estados (vazio, carregando, erro, sucesso), acessibilidade (rótulos, foco, contraste) e textos de UI.",
      "Reaproveite os componentes e o estilo que já existem no projeto: leia antes de propor. Sugira componentes com classes Tailwind em blocos curtos.",
      "O que NÃO faz: não edita arquivos, não decide regra de negócio nem arquitetura. Formato da resposta: Fluxo, Telas, Estados, Textos, Componentes."
    ]
  },
  {
    "type": "bullets",
    "kicker": "ARQUITETO NEXT",
    "title": "O arquiteto decide onde cada coisa mora",
    "subtitle": "O Next muda entre versões, então ele lê a documentação do projeto antes de opinar.",
    "bullets": [
      "Escolhe Server ou Client Component, Server Action, rota e estrutura de pastas",
      "Decide cache e revalidatePath depois de cada gravação",
      "Cuida da segurança: user_id em todo insert e RLS no Supabase",
      "Lê node_modules/next/dist/docs/ antes de dar qualquer opinião",
      "Leitura + Bash, modelo sonnet"
    ]
  },
  {
    "type": "prompt",
    "kicker": "ARQUITETO NEXT",
    "title": "Peça ao Claude Code para criar o arquiteto",
    "badge": "Faça junto",
    "label": "O PEDIDO AO CLAUDE CODE",
    "kind": "prompt",
    "lines": [
      "Crie o arquivo .claude/agents/arquiteto-next.md neste projeto (Caderneta da Cláudia: Next.js App Router, TypeScript, Tailwind, Supabase via supabase-js, Server Actions, deploy na Vercel).",
      "Frontmatter YAML: name: arquiteto-next; description: 'Use para decidir arquitetura de uma funcionalidade: Server vs Client Component, Server Action, cache, rotas, pastas e segurança'; tools: Read, Grep, Glob, Bash; model: sonnet.",
      "Corpo em português. REGRA: antes de opinar, leia a documentação em node_modules/next/dist/docs/ da versão instalada, porque o Next muda entre versões.",
      "Responsabilidade: onde cada código mora, quando usar revalidatePath, e segurança: todo insert grava user_id e a RLS impede o Paulo de ver ou editar dados da Cláudia.",
      "O que NÃO faz: não edita arquivos (Bash só para ler, como ls e cat). Formato da resposta: Decisões, Estrutura de pastas, Riscos, Passos de implementação."
    ]
  },
  {
    "type": "bullets",
    "kicker": "QA",
    "title": "O QA prova que a regra funciona",
    "subtitle": "Parte dos critérios de aceite do analista e escreve testes. Não mexe no código de produção.",
    "bullets": [
      "Vitest para unitário, Playwright para e2e e integração contra Postgres de teste",
      "Drizzle ORM só nos testes e seeds: o app continua com supabase-js",
      "Drizzle é TypeScript puro e usa a mesma connection string; TypeORM exige decorators e combina mal com o App Router",
      "Banco de teste em DATABASE_URL_TEST (Docker local ou branch do Supabase), com seed e limpeza por teste",
      "Teste obrigatório: o Paulo não vê nem edita lançamento da Cláudia"
    ]
  },
  {
    "type": "prompt",
    "kicker": "QA",
    "title": "Peça ao Claude Code para criar o QA",
    "badge": "Faça junto",
    "label": "O PEDIDO AO CLAUDE CODE",
    "kind": "prompt",
    "lines": [
      "Crie o arquivo .claude/agents/qa.md neste projeto (Caderneta da Cláudia: Next.js, TypeScript, Supabase via supabase-js; cada lançamento tem user_id, e Cláudia e Paulo dividem a planilha).",
      "Frontmatter YAML: name: qa; description: 'Use depois de implementar ou ao receber critérios de aceite, para planejar e escrever testes'; tools: Read, Grep, Glob, Bash, Write, Edit; model: sonnet.",
      "Corpo em português. Responsabilidade: plano de testes a partir dos critérios Dado/Quando/Então; Vitest (unitário), Playwright (e2e) e integração contra Postgres com Drizzle ORM (drizzle-orm + driver postgres).",
      "Drizzle SÓ em testes e seeds; o app segue com supabase-js. Banco via DATABASE_URL_TEST (Docker local ou branch do Supabase), com seed e limpeza a cada teste. Nunca rodar contra produção.",
      "Sempre testar: o Paulo não vê nem edita lançamento da Cláudia. NÃO faz: alterar código de produção (só pastas de teste). Resposta: tabela critério → teste, arquivos criados, como rodar."
    ]
  },
  {
    "type": "bullets",
    "kicker": "REDUTOR DE TOKEN",
    "title": "O redutor lê muito e devolve pouco",
    "subtitle": "O mais barato do time: model haiku, só leitura. Protege o contexto do agente principal.",
    "bullets": [
      "Faz as buscas e leituras grandes no lugar do agente principal",
      "Devolve um resumo de até 15 linhas, no formato caminho:linha",
      "Nunca cola o arquivo inteiro na resposta",
      "Ferramentas: só Read, Grep e Glob. Modelo: haiku",
      "Menos texto no contexto principal significa menos custo e menos respostas confusas"
    ]
  },
  {
    "type": "prompt",
    "kicker": "REDUTOR DE TOKEN",
    "title": "Peça ao Claude Code para criar o redutor",
    "badge": "Faça junto",
    "label": "O PEDIDO AO CLAUDE CODE",
    "kind": "prompt",
    "lines": [
      "Crie o arquivo .claude/agents/redutor-token.md neste projeto (Caderneta da Cláudia: Next.js App Router, TypeScript, Tailwind, Supabase).",
      "Frontmatter YAML: name: redutor-token; description: 'Use para buscas e leituras grandes no código (onde algo é usado, o que um arquivo faz) e receber só um resumo'; tools: Read, Grep, Glob; model: haiku.",
      "Corpo em português. Responsabilidade: pesquisar no projeto e devolver um resumo de NO MÁXIMO 15 linhas, cada achado no formato caminho:linha e uma frase curta.",
      "O que NÃO faz: não cola arquivos nem trechos longos, não edita nada, não opina sobre arquitetura. Se não achar, diz isso em uma linha.",
      "Formato da resposta: lista de achados (caminho:linha, descrição), seguida de uma linha 'Conclusão'."
    ]
  },
  {
    "type": "code-bullets",
    "kicker": "TECHLEAD PRINCIPAL",
    "title": "O techlead precisa ser o agente da sessão",
    "bullets": [
      "Subagente NÃO chama outro subagente",
      "Por isso o techlead roda como agente principal da sessão",
      "Inicie com claude --agent techlead",
      "Ou grave em .claude/settings.json e vale para todo o time",
      "Daí em diante, toda conversa já começa com ele"
    ],
    "label": ".claude/settings.json",
    "kind": "code",
    "lines": [
      "{",
      "  \"agent\": \"techlead\"",
      "}"
    ]
  },
  {
    "type": "section",
    "title": "USAR"
  },
  {
    "type": "prompt",
    "kicker": "USAR · PELO NOME",
    "title": "Chame um agente pelo nome",
    "subtitle": "Para tarefa pequena, peça direto ao especialista. Volta só o resumo; a conversa fica limpa.",
    "badge": "Faça junto",
    "label": "NO CLAUDE CODE",
    "kind": "prompt",
    "lines": [
      "Use o agente redutor-token para listar onde a Caderneta lê ou grava o user_id. Devolva até 15 linhas, no formato caminho:linha."
    ]
  },
  {
    "type": "question",
    "text": "A Cláudia quer registrar uma conta que vai pagar mês que vem, sem mexer no saldo de hoje. Quem do time entra, e em que ordem?"
  },
  {
    "type": "prompt",
    "kicker": "USAR · PONTA A PONTA",
    "title": "Demanda real: marcar lançamento como previsto",
    "subtitle": "Inicie com claude --agent techlead e entregue a demanda inteira. Ele conduz o resto.",
    "badge": "Faça junto",
    "label": "A DEMANDA AO TECHLEAD",
    "kind": "prompt",
    "lines": [
      "Quero a função 'Marcar lançamento como previsto' na Caderneta: a Cláudia registra um gasto futuro e ele não entra no saldo até ser confirmado.",
      "Siga o seu fluxo: 1) chame analista-negocio e ux EM PARALELO, cada um com prompt autocontido; 2) com as respostas, chame arquiteto-next; 3) mostre o plano consolidado e ESPERE o meu ok.",
      "Depois do ok, implemente em etapas pequenas e chame o qa para os testes dos critérios de aceite.",
      "Regra que não pode quebrar: o Paulo nunca vê nem edita lançamento da Cláudia."
    ]
  },
  {
    "type": "bullets",
    "kicker": "USAR · O QUE ACONTECE",
    "title": "Acompanhe o time trabalhando",
    "subtitle": "Você não precisa pedir cada passo: o techlead segue o fluxo que está no arquivo dele.",
    "bullets": [
      "O techlead lê a demanda e, se o código for grande, aciona o redutor-token",
      "Negócio e UX trabalham ao mesmo tempo, porque um não depende do outro",
      "O arquiteto-next lê a documentação do Next e define Server Actions, cache e user_id",
      "Você revisa o plano e aprova: nada de código antes do seu ok",
      "O techlead implementa em etapas e o qa escreve e roda os testes no final"
    ]
  },
  {
    "type": "bullets",
    "kicker": "USAR · AJUSTAR",
    "title": "Ajuste o agente, não o prompt de hoje",
    "subtitle": "Se o time errou, corrija na origem. Assim o erro não volta amanhã.",
    "bullets": [
      "Respostas longas demais? Acrescente um limite de linhas no corpo do agente",
      "Agente fazendo o que não devia? Escreva um 'O que NÃO faz' mais específico",
      "Escolha errada de agente? Reescreva a description com o 'quando usar'",
      "Editou o .md à mão? Reinicie a sessão. Pelo /agents, a mudança vale na hora",
      "Faça commit: o ajuste vale para todo mundo que clonar a Caderneta"
    ]
  },
  {
    "type": "bullets",
    "kicker": "ERROS COMUNS",
    "title": "Quatro erros que travam o time",
    "subtitle": "Quase todo problema com agentes cai em um destes quatro casos.",
    "bullets": [
      "Esperar que um subagente chame outro: não chama. Quem delega é o techlead, como agente principal",
      "Prompt de delegação sem contexto: o subagente não vê a conversa, então explique tudo nele",
      "Dar tools demais: o analista com Write e Edit acaba mexendo no código",
      "Description vaga: sem 'quando usar', o Claude não sabe escolher o agente"
    ]
  },
  {
    "type": "code-bullets",
    "kicker": "ERROS COMUNS",
    "title": "A description decide quem é chamado",
    "bullets": [
      "O Claude escolhe o agente lendo a description",
      "Descreva QUANDO usar, com situações concretas",
      "Evite palavras genéricas como 'ajuda' e 'projeto'",
      "Teste: peça uma tarefa e veja se o agente certo entrou"
    ],
    "label": "DESCRIPTION VAGA × BOA",
    "kind": "code",
    "lines": [
      "# vaga",
      "description: Ajuda com testes",
      "",
      "# boa",
      "description: Use depois de",
      "  implementar ou ao receber",
      "  critérios de aceite, para",
      "  planejar e escrever testes",
      "  (Vitest, Playwright)."
    ]
  },
  {
    "type": "bullets",
    "kicker": "HÁBITOS",
    "title": "Gaste menos contexto e menos dinheiro",
    "subtitle": "O redutor ajuda, mas os hábitos do dia a dia fazem a maior diferença.",
    "bullets": [
      "/compact resume a conversa longa; /clear zera o contexto ao trocar de tarefa",
      "/cost ou /usage mostra quanto você já gastou na sessão",
      "Prompts enxutos: diga o objetivo, o arquivo e o formato da resposta",
      "CLAUDE.md curto, só com o que vale para toda tarefa",
      "Leituras grandes vão para o redutor-token, não para o agente principal"
    ]
  },
  {
    "type": "downloads",
    "title": "Baixe os 6 agentes prontos",
    "subtitle": "Copie para .claude/agents/ (ou, no GitHub, Add file › Upload files) e confira com /agents."
  },
  {
    "type": "checkpoint",
    "title": "CHECK-POINT",
    "bullets": [
      "Claude Code instalado: claude --version mostra a versão e você está logado",
      "Os 6 arquivos estão em .claude/agents/ e aparecem no /agents",
      "O techlead é o agente da sessão: claude --agent techlead ou settings.json com agent",
      "Você rodou uma demanda real: negócio e UX em paralelo, aprovação do plano, QA no fim",
      "Sabe os 4 erros: subagente chamando subagente, delegação sem contexto, tools demais, description vaga"
    ]
  }
]

/** Diagrama do slide 'team': techlead no centro, agentes ao redor. */
export type AgTeamMember = { name: string; role: string; model: string }

export const agentesTeam: { center: AgTeamMember; agents: AgTeamMember[] } = {
  center: { name: 'techlead', role: 'Agente principal: delega, decide e implementa', model: 'inherit' },
  agents: [
    { name: 'analista-negocio', role: 'Regras e critérios de aceite', model: 'sonnet' },
    { name: 'ux', role: 'Define telas, fluxos e textos', model: 'sonnet' },
    { name: 'arquiteto-next', role: 'Server/Client, actions, cache e segurança', model: 'sonnet' },
    { name: 'qa', role: 'Vitest, Playwright e Drizzle no Postgres', model: 'sonnet' },
    { name: 'redutor-token', role: 'Lê muito, devolve resumo de 15 linhas', model: 'haiku' },
  ],
}

/** Arquivos em public/agentes-kit/ (um botao por arquivo no slide 'downloads'). */
export const agentesDownloads: { file: string; label: string }[] = [
  { file: 'techlead.md', label: 'techlead.md' },
  { file: 'analista-negocio.md', label: 'analista-negocio.md' },
  { file: 'ux.md', label: 'ux.md' },
  { file: 'arquiteto-next.md', label: 'arquiteto-next.md' },
  { file: 'qa.md', label: 'qa.md' },
  { file: 'redutor-token.md', label: 'redutor-token.md' },
]

/*
 * Limites praticos (palco 960x540):
 *  - title (bullets/prompt/code-bullets): ate ~50 caracteres (1 linha).
 *  - subtitle: ate ~100 caracteres (1 linha).
 *  - bullets: ate 6 itens, ~120 caracteres cada (a fonte encolhe de 18 a 13pt).
 *  - prompt: cartao de 832x312 px; fonte mono 11 a 8pt automatica;
 *    cabe ~16 linhas curtas a 9pt; a 8pt ~ 20 linhas ou ~2400 caracteres.
 *  - code-bullets: cartao de 476x320 px (~73 colunas a 8pt); ate ~18 linhas.
 *  - question: ate ~160 caracteres. section: ate ~60 caracteres.
 */
