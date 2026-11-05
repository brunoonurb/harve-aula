# 03 — Dados

**Não há banco de dados.** Os "dados" do projeto são o conteúdo dos slides, versionado no repositório. Por isso o DBA não foi acionado.

## Fontes
| Fonte | Origem | Editável à mão? |
|---|---|---|
| `data/deck.json` | Gerado por `scripts/extract-pptx.py` | Não |
| `data/ia-slides.ts` | Autoral (módulo IA) | Sim |
| `lib/deck.ts` → `slideDownloads` | Autoral (indexado por `orig`) | Sim |
| `public/clientes-modelo.{csv,xlsx}` | Planilha-modelo fictícia | Sim |

## Modelo
```mermaid
erDiagram
  DECK ||--o{ SLIDE : contém
  SLIDE ||--o{ ELEMENT : contém
  ELEMENT ||--o| TEXTBODY : tem
  TEXTBODY ||--o{ PARA : tem
  PARA ||--o{ RUN : tem
  SLIDE ||--o| DOWNLOAD_GROUP : "orig →"
  SLIDE { int n "final, sequencial" int orig "nº no PPTX (ausente no módulo IA)" string notes }
  ELEMENT { string kind "shape|image" string id Box box string src }
  RUN { string t string f "fonte: Consolas = prompt" number sz string c }
```

## Regras de integridade
- `n` é sequencial de 1 a 42 depois da mescla. `orig` é único entre os slides do PPTX.
- Um elemento de prompt precisa de `id` único no slide e de todo o texto em Consolas.
- `finalN(orig)` precisa encontrar o slide. Se o PPTX mudar, revisar `INSERT_AFTER = 12`.
