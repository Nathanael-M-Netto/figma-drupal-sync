# Figma Drupal Sync — Professional Plugin v3.0

Plugin profissional para sincronização bidirecional entre design (Figma) e conteúdo (Drupal CMS). Desenvolvido para agilizar o workflow de entrega entre UX Designers e Desenvolvedores.

## ✨ Destaques da v3.0
- **Design System Glassmorphism:** Interface moderna, translúcida e responsiva.
- **RBAC (Role-Based Access Control):** Interfaces customizadas para UX (focada em deploy) e DEV (focada em schema e integração).
- **Scanner Inteligente:** Análise automática de módulos da página com cruzamento de dados via API.
- **Deploy em Massa:** Envio da árvore hierárquica completa em uma única chamada.
- **Multi-Mapeamento:** Sincronização automática entre variantes Desktop e Mobile.

---

## 🏗️ Arquitetura Modular

O projeto utiliza **Vite + React** para a UI e um backend modular em JS para o sandbox do Figma.

```
src/
├── plugin/          # Backend (Sandbox) - Manipulação de nós do Figma
├── api/             # Clientes de API (Drupal, Auth, Templates)
├── utils/           # Mapeamento de nós, cores e validadores
└── ui/              # Frontend React (Interface Glassmorphism)
    ├── components/  # Componentes de UI modulares
    ├── hooks/       # Hooks customizados (useScan, useAuth, useFigmaMessages)
    └── stores/      # Gestão de estado global (Zustand)
```

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
| `npm run build:plugin` | Build apenas do sandbox |

### Como carregar no Figma
1. Execute `npm run build`.
2. No Figma Desktop: Menu > Plugins > Development > **Import plugin from manifest...**.
3. Selecione o arquivo `manifest.json`.

---

## 🛠️ Convenções de Nomenclatura
Para que a extração automática funcione, siga os prefixos:
- `TXT_` : Campos de texto.
- `VAR_` : Variantes e enums.
- `URL_` : Links e imagens.
- `BOOL_` : Toggles booleanos.
- `MOD_` : Frames de módulos.
- `COMP_` : Componentes internos.

---

## 📄 Documentação
- [Guia Técnico Detalhado](DOCS.md)
- [Instruções para Desenvolvedores](DEV_INSTRUCTIONS.md)

---
**Status:** Produção v3.0 (Estável)
