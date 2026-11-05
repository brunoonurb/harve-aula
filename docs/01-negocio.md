# 01 — Negócio: módulo "Como usar IA"

## Visão
A aula usa IA o tempo todo, mas hoje só ensina a colar prompts prontos. O módulo ensina o aluno a usar IA com **autonomia e segurança**: entender o que ela faz e onde erra, escrever um bom prompt, proteger os dados da planilha e validar o código gerado. É um exemplo de aula, então o escopo é enxuto.

## Encaixe no roteiro
São 6 slides **integrados ao deck**, entre "As 3 Regras que Evitam 90% dos Erros" (slide 12) e "O Projeto Base" (antigo 13). O módulo vem antes da parte prática porque os riscos precisam ser conhecidos antes do primeiro prompt. Duração-alvo: cerca de 10 minutos.

## Personas
| Persona | Necessidade |
|---|---|
| Aluno na aula (leigo, vem de planilha) | Saber o que esperar da IA e o que fazer quando ela erra |
| Aluno revisando depois | Acessar os slides por URL e copiar os modelos de prompt |
| Professor | Ter conteúdo curto, legível em projeção e com notas do apresentador |

## Conteúdo (6 slides)
1. Abertura: "Antes de colar o primeiro prompt: usando IA do jeito certo".
2. O que a IA é e não é: ela prevê texto plausível e pode alucinar. Quem testa o resultado é você.
3. Anatomia de um bom prompt: contexto, tarefa, formato da resposta e restrições, com um prompt copiável.
4. Prompt ruim vs. bom: 2 pares lado a lado (o prompt "bom" pode ser copiado).
5. Privacidade: o que nunca colar na IA e a alternativa, que é usar dados fictícios.
6. Validar o código, com um checklist de 4 itens ou mais.

## Requisitos funcionais
- RF01: os slides novos seguem a identidade visual do deck e usam o palco 960×540.
- RF02: os prompts podem ser copiados (copiar e copiar sem 【】) e abertos em tela cheia, como no resto do deck.
- RF03: cada slide novo tem URL própria (`/slide/13` a `/slide/18`), aparece na grade e tem notas no modo apresentador.
- RF04: todas as referências existentes continuam corretas depois da renumeração: o download do CSV e os prompts dos passos.

## Requisitos não funcionais
- O site continua 100% estático. Não há IA rodando nele, nem backend, nem custo.
- O texto é legível em projeção de 1280×720 ou mais, sem corte nem sobreposição.
- Não entram dependências novas.

## Regras de negócio
- RN01: citar só ferramentas gratuitas, de forma neutra (ChatGPT, Gemini, Claude, Copilot).
- RN02: os exemplos usam apenas dados fictícios. Nunca orientar a colar dados pessoais reais nem chaves (`.env.local`, `service_role`).
- RN03: deixar claro que a IA pode errar e que o aluno é responsável por testar.
- RN04: os exemplos seguem a stack do deck (Next.js, Tailwind, Supabase) e a planilha de clientes.
- RN05: não repetir o que o deck já cobre (dinâmica, ferramentas, 3 regras).

## MVP
- **Dentro:** os 6 slides acima, com notas, prompts copiáveis e o README atualizado.
- **Fora:** página separada, IA no site, quiz, vídeos, comparativo de planos e apêndice de aprofundamento.

## Critérios de aceite
- CA01: o deck tem 42 slides e `/slide/13` a `/slide/18` mostram o módulo.
- CA02: os prompts dos slides novos podem ser copiados, com e sem 【】, e o prompt de anatomia abre em tela cheia.
- CA03: o slide de privacidade lista explicitamente o que nunca colar e a alternativa.
- CA04: o slide de validação tem um checklist de 4 itens ou mais.
- CA05: o download do CSV continua no slide "PASSO 1" (agora o 21) e o Passo 2 abre em `/slide/22`.
- CA06: `npx tsc --noEmit` e `npm run build` passam, e `/slide/43` retorna 404.
- CA07: nenhum exemplo contém dado real nem ferramenta paga.
