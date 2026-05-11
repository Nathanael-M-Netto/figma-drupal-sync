# Continuação da Sessão — v4.0 Implementation

**Contexto**: Sessão interrompida durante implementação das correções maiores. Este doc é o handoff exato.

---

## O que já foi feito (esta sessão)

| Arquivo | O que mudou |
|---|---|
| `src/components/ui/badge.jsx` | ✅ Adicionou variante `info` e tamanho `xs` (faltavam, causavam falha silenciosa em VariationCard) |
| `src/ui/components/shared/Modal.jsx` | ✅ Reescrito — usava classes CSS inexistentes (`modal-overlay`, `modal-box`). Agora usa Tailwind + Framer Motion |
| `src/api/drupalClient.js` | ✅ **BUG CRÍTICO CORRIGIDO**: `deployPage` filtrava módulos `source:'drupal'`, apagando o canvas do Drupal. Agora envia TODOS os módulos em ordem |
| `src/ui/stores/deployStore.js` | ✅ Adicionou `moduleOverrides: {}` + `setModuleOverride(moduleId, fieldName, value)` + `reset` limpa overrides |
| `src/ui/App.jsx` | ✅ Adicionou `deployModalOpen` state, mudou `startDeployReview` de `navigate('deployReview')` para `setDeployModalOpen(true)`, corrigiu `handleConfirmDeploy` (inclui todos os módulos + aplica `moduleOverrides`) |
| `src/ui/components/deploy/DeployReviewScreen.jsx` | ✅ Reescrito: header com botão X (recebe `onClose`), toggle JSON completo da página, campos editáveis não-Figma (BOOLEAN/VARIANT faltantes vs template), badge de overrides, layout modal-friendly |

---

## O que AINDA FALTA (próxima sessão)

### 1. `src/ui/App.jsx` — Adicionar o render do modal (CRÍTICO)
O estado `deployModalOpen` existe mas o JSX do modal ainda NÃO foi adicionado ao return.  
Deve ser inserido **depois do `<ToastContainer />`** e **fora do `<ResizableContainer>`**:

```jsx
{/* Deploy Modal — bottom sheet */}
<AnimatePresence>
  {deployModalOpen && (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => { if (!isDeployingRef) { resetDeploy(); setDeployModalOpen(false); } }}
      />
      <motion.div
        className="relative bg-bg-secondary rounded-t-[var(--radius-lg)] shadow-glass flex flex-col overflow-hidden"
        style={{ maxHeight: '88vh' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      >
        <DeployReviewScreen
          onConfirm={handleConfirmDeploy}
          onClose={() => { resetDeploy(); setDeployModalOpen(false); }}
        />
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

Também precisa passar `onSyncLocal` para `BoundState`:
```jsx
<BoundState
  ...props existentes...
  onSyncLocal={figma.syncPropsLocal}
/>
```

### 2. `src/ui/components/home/BoundState.jsx` — Remover glass-panel do wrapper
O `glass-panel` tem `hover: translateY(-2px)` que faz o layout inteiro pular ao hover.  
Substituir o wrapper externo:
```jsx
// DE:
<motion.div className="glass-panel p-4 mb-4" ...>
// PARA:
<motion.div className="flex flex-col" ...>
```

Também adicionar botão **Sync Local** no grid de ações (ao lado de Sync):
```jsx
// Recebe prop: onSyncLocal
<Button variant="outline" onClick={onSyncLocal} className="flex-1">
  <ArrowLeftRight className="w-3.5 h-3.5" />
  Local Sync
</Button>
```

### 3. `src/ui/components/templates/VariationCard.jsx` — Fix clipboard fallback
`handleCopyName` não tem fallback para `navigator.clipboard` (falha silenciosa no Figma):
```js
// Adicionar esta função helper no topo do arquivo:
function copyText(text) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => copyFallback(text));
  } else {
    copyFallback(text);
  }
}
function copyFallback(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;pointer-events:none';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch {}
  document.body.removeChild(ta);
}

// Trocar handleCopyName:
const handleCopyName = (e) => {
  e.stopPropagation();
  copyText(variation.name);
  setNameCopied(true);
  setTimeout(() => setNameCopied(false), 1500);
};
```

### 4. `src/ui/components/layout/ResizableContainer.jsx` — Fix screenOrder
Adicionar telas faltantes na array `screenOrder`:
```js
// DE:
const screenOrder = ['login', 'home', 'templates', 'scan', 'settings'];
// PARA:
const screenOrder = ['login', 'home', 'templates', 'scan', 'settings', 'deploy', 'deployReview', 'inspect'];
```

### 5. `src/ui/globals.css` — Adicionar utilitários faltantes
Ao final do arquivo:
```css
/* ── Deploy Modal Sheet ── */
/* Garante que o bottom-sheet fecha o bottom corretamente dentro do iframe */
.deploy-modal-sheet {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

### 6. Verificar build
```bash
cd ~/Downloads/figma-plugin-v0.2
npm run build
```
Se der erro de import ou tipo, verificar:
- `DeployReviewScreen` importa `useTemplateStore` → verificar se o store exporta `templates` diretamente (yes: `s.templates`)
- `App.jsx` importa `AnimatePresence` de `framer-motion` (já adicionado)
- `isDeployingRef` no overlay click → usar `useDeployStore((s) => s.isDeploying)` diretamente ou usar ref

---

## Issues de CSS menores ainda pendentes

| Componente | Problema | Fix |
|---|---|---|
| `UnboundState.jsx` | `Card className="glass-panel"` → hover TranslateY em cards | Remover `glass-panel` das Cards, manter `.glass-panel` só para o Card principal de vínculo |
| `NavBar.jsx` | `position: fixed` sobrepõe conteúdo | OK — já compensado com `pb-[calc(var(--spacing-nav)+20px)]` no ResizableContainer |
| `ScanReport.jsx` | `glass-panel` no relatório tem hover translateY | Substituir por `bg-bg border border-border rounded-[var(--radius-md)]` |
| `DeployScreen.jsx` (tela legada) | Esta tela (`case 'deploy'`) pode ser removida — foi substituída pelo modal. Verificar se ainda é usado em alguma navegação | Verificar e remover se não usado |

---

## Mapa de navegação atual (pós-modal)

```
Home (BoundState) → botão Deploy → startDeployReview() → deployModalOpen=true → modal overlay
Modal → onConfirm → handleConfirmDeploy() → deployPage (ALL modules) → fecha modal
Modal → onClose → resetDeploy() + setDeployModalOpen(false)
```

O `case 'deployReview'` em `renderScreen()` pode ser mantido como fallback mas não será mais atingido pela Home.

---

## Nota sobre white-label (hooks do projeto)
O projeto tem um hook/linter que aplica white-label automaticamente ao salvar `drupalClient.js`:
- `X-TIM-Key` → `X-CMS-Key` (header de auth)
- URL hardcoded → `https://api.example.com` (placeholder)
- O `.env` com `VITE_API_URL` é a fonte real da URL em produção

**Não reverter essas mudanças** — são intencionais por decisão do projeto.

---

## Regras críticas a não quebrar

1. **`deployPage` SEMPRE envia TODOS os módulos** (Figma + Drupal-preserved, em ordem). Nunca filtrar por `source`.
2. **`moduleOverrides` é mesclado em `handleConfirmDeploy`**: `data: { ...m.data, ...(moduleOverrides[m.id] || {}) }`
3. **NID via `figma.root.setPluginData`** — já é file-specific, não mudar.
4. **Clipboard em Figma**: sempre usar `navigator.clipboard` + fallback `execCommand('copy')`.

---

## Testes mínimos a rodar após completar

1. **Deploy modal abre**: Clique em "Deploy" na Home → modal aparece como bottom sheet
2. **JSON completo exibido**: Botão `<Code2>` no header do modal → mostra JSON com módulos Drupal-only incluídos
3. **Drupal-only preservado**: Se página tem 5 módulos no Drupal e Figma só tocou 2, os 5 aparecem no modal (3 com badge "Drupal"), todos os 5 são enviados
4. **Override salvo**: Expande módulo → campo BOOLEAN não-Figma → toggle → confirma deploy → data inclui o override
5. **Clipboard VariationCard**: Clica no nome do template em Templates → `setNameCopied(true)` → ícone Check aparece
6. **Build limpo**: `npm run build` sem erros
