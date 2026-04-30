# Documentação Técnica — Figma-Drupal Sync v3.0

## Visão Geral
O plugin permite a ponte direta entre o Figma e o Drupal, tratando o design como "Single Source of Truth" para a estrutura de dados.

### Fluxo de Dados
1. **Extração:** O plugin lê a árvore de camadas, identifica prefixos (`TXT_`, `VAR_`, etc.) e gera um JSON hierárquico.
2. **Scanner:** Cruza o JSON extraído com o catálogo de templates do Drupal via API.
3. **Deploy:** Envia o payload final para o CMS.
4. **Sync:** Busca dados do CMS e atualiza os TextNodes no Figma (incluindo Desktop/Mobile simultaneamente).

## Camadas de Execução
| Camada | Arquivo | Função |
|--------|---------|--------|
| **Sandbox** | `dist/code.js` | Manipulação de API do Figma, leitura de camadas. |
| **UI** | `dist/index.html` | Interface React, chamadas HTTP para o Drupal. |

## Módulos Principais

### `src/utils/nodeMapper.js`
- Responsável por agrupar nós por nome em arrays.
- Garante que ao atualizar um texto "Título", ele seja aplicado tanto no Desktop quanto no Mobile (Multi-mapeamento).
- Detecta ordem visual dos módulos (Eixo Y).

### `src/api/drupalClient.js`
- Abstração de chamadas HTTP.
- Implementa o **Single-Call Deploy** para enviar a página inteira de uma vez.

### `src/ui/stores/`
- **authStore:** Gerencia login e tokens.
- **scanStore:** Estado do relatório de scan e progresso de deploy.
- **appStore:** Navegação e toasts.

## Design System (Glassmorphism)
Implementado via `App.css` e a classe utilitária `.glass-panel`.
- **Blur:** 12px.
- **Transparência:** Variável conforme o tema do Figma.
- **Responsividade:** Layout fluido usando Flexbox.

## Manutenção
Para adicionar novos mapeamentos de cores ou prefixos:
1. Edite `src/utils/colorMap.js` para cores.
2. Edite `src/utils/scanValidator.js` para novos prefixos.
