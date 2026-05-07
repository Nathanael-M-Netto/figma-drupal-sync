# Figma Drupal Sync — Professional Plugin v4.0

Plugin Figma profissional para sincronização bidirecional entre design (Figma) e conteúdo (Drupal CMS). Desenvolvido para transformar o Figma em um ambiente de staging ativo com validação, scan inteligente e deploy automático.

## 📚 Documentação Central

Toda a documentação técnica foi consolidada na pasta `docs/` para manter a raiz do projeto limpa.

- **[Guia de Arquitetura e Código (CODE_ARCHITECTURE.md)](docs/CODE_ARCHITECTURE.md)**: Explicação de todos os arquivos, fluxos, stores do Zustand, design system e convenções de nomenclatura. Leia este arquivo para entender como o plugin funciona.
- **[Referência da API (API_REFERENCE.md)](docs/API_REFERENCE.md)**: Endpoints do middleware Azure, payloads aceitos e fluxo de deploy.

*(A pasta `.planning/` contém artefatos internos gerenciados por agentes de automação. Você não precisa alterá-los manualmente).*

---

## ✨ Destaques da v4.0
- **Templates como Mapa de Referência**: Catálogo embutido para guiar os desenvolvedores na nomenclatura das layers.
- **Motor de Scan & Property Loading**: Match fuzzy com templates e linkagem automática de propriedades entre frames Desktop e Mobile.
- **Auto-Sync Inteligente**: Diff visual entre o Figma e o Drupal sempre que o plugin é aberto em um nó existente.
- **Design System Liquid Glass**: UI translúcida de alta performance, construída apenas com variáveis CSS e filtros SVG.
- **Deploy Unificado**: Tela completa de revisão com diff de campos do content-type.

---

## 🚀 Setup & Desenvolvimento

### Instalação
```bash
npm install
```

### Comandos
| Comando | Descrição |
|---------|-----------|
| `npm run build` | Build completo para produção (`dist/`) |
| `npm run dev` | Dev server para preview da UI |
| `npm run build:ui` | Build apenas da interface |
| `npm run build:plugin` | Build apenas do sandbox (`main.js`) |

### Como carregar no Figma
1. Execute `npm run build`.
2. No Figma Desktop: Menu > Plugins > Development > **Import plugin from manifest...**.
3. Selecione o arquivo `manifest.json`.

---

**Status:** Produção v4.0 (Estável)
