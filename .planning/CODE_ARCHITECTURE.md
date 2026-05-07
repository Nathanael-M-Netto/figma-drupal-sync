# Arquitetura de Código - Figma-Drupal Sync

Este documento detalha o propósito e a função de cada arquivo e componente na arquitetura do plugin (v0.2), facilitando a manutenção e futuras expansões.

## Estrutura de Diretórios

O projeto segue uma arquitetura baseada em responsabilidades:

- `src/api/`: Clientes de comunicação HTTP com o Drupal
- `src/hooks/`: Hooks customizados React para lógica de negócio
- `src/stores/`: Gerenciamento de estado global com Zustand
- `src/plugin/`: Código que roda no ambiente Figma (sandbox)
- `src/ui/`: Interface React (janela do plugin)
  - `components/ui/`: Componentes base reutilizáveis (shadcn/ui + Tailwind)
  - `components/auth/`: Telas de autenticação
  - `components/home/`: Telas principais de dashboard
  - `components/deploy/`: Telas de publicação/deploy
  - `components/inspect/`: Telas de inspeção de módulos
  - `components/scan/`: Telas de scan/auditoria de página
  - `components/templates/`: Catálogo e referência de templates
  - `components/dev/`: Ferramentas de desenvolvedor

## Detalhamento dos Arquivos

### Ponto de Entrada (`src/ui/`)
- **`main.jsx`**: Arquivo raiz do React. Inicializa o `QueryClientProvider` para o TanStack Query e renderiza o `<App />`. Importa o CSS global (`globals.css`).
- **`App.jsx`**: Componente orquestrador da UI. Contém a lógica de roteamento principal (renderScreen), lida com o auto-sync de NIDs, e gerencia os layouts globais (`Header`, `NavBar`, `ResizableContainer`).
- **`globals.css`**: Arquivo de estilos globais usando Tailwind CSS v4. Contém a configuração principal do `@theme`, variáveis CSS, animações customizadas e reset.

### Componentes Base (`src/components/ui/`)
*Estes componentes seguem o padrão shadcn/ui adaptado para JavaScript puro.*
- **`badge.jsx`**: Componente de etiqueta visual (Badge) com suporte a múltiplas variantes de cor através do `class-variance-authority`.
- **`button.jsx`**: Botão primário do sistema com suporte a ícones, estado de loading e múltiplas variantes visuais (primary, deploy, outline, danger).
- **`card.jsx`**: Componentes de contêineres e cartões (`Card`, `CardHeader`, `CardTitle`, `CardContent`) estilizados como superfícies modulares (`glass-panel`).
- **`dialog.jsx`**: Componente de modal construído com Framer Motion, utilizado para confirmações e exibições contextuais de dados na interface.
- **`input.jsx`**: Campo de formulário de texto padrão, com foco estendido e suporte a ícones.
- **`progress.jsx`**: Barra de progresso linear animada, utilizada para mostrar loading de chamadas da API ou processos longos de scan.
- **`skeleton.jsx`**: Componente de placeholder animado para loading states complexos.

### Módulos Funcionais (`src/ui/components/`)

#### Home
- **`BoundState.jsx`**: Tela exibida quando a página do Figma está vinculada a um NID no Drupal. Mostra os dados do módulo, NID e permite sincronizar ou enviar (Deploy).
- **`UnboundState.jsx`**: Tela padrão quando nenhum NID está vinculado. Permite vincular um NID existente ou criar uma nova página a partir do módulo selecionado no Figma.

#### Scan
- **`ScanReport.jsx`**: Componente mestre do relatório de auditoria de página. Coordena a verificação visual dos módulos do Figma com o Drupal.
- **`ModuleStatusItem.jsx`**: Item individual no relatório de scan que indica erro, aviso ou sucesso (se a nomenclatura do Figma está correta e bate com o JSON de props).
- **`JsonPreview.jsx`**: Ferramenta dev para pré-visualizar o JSON da estrutura antes que ele seja postado na API do Drupal.

#### Deploy
- **`DeployScreen.jsx`**: A tela de orquestração de deploy (nova página ou atualização). Coordena Diff visual, schema extra de NodeFields e requisição final.
- **`DeployDiff.jsx`**: Componente comparativo visual que mostra a diferença entre os dados presentes no Drupal e os dados novos no Figma (campos removidos, modificados ou novos).
- **`NodeFieldsForm.jsx`**: Formulário gerado dinamicamente para os `node_field_values` (ex: title, path alias, boolean status) que o Content Type exige no Drupal.

#### Inspect
- **`InspectScreen.jsx`**: Interface que interage com os frames selecionados no Figma. Informa o match entre as layers do Figma e o catálogo de componentes registrados no Drupal.
- **`ModuleDetail.jsx`**: Expansão do InspectScreen; quebra as propriedades analisadas em Desktop-Only, Mobile-Only e Compartilhadas.

#### Templates
- **`TemplateList.jsx`**: Catálogo completo visual dos templates do Drupal que são sincronizáveis. Serve como um dicionário vivo para os desenvolvedores.
- **`VariationCard.jsx`**: Cartão de expansão que mostra as props e schema de uma variação específica de template.
- **`FieldList.jsx`**: Sub-componente do `VariationCard` que exibe cada field, seu tipo (Text, Boolean, URL, Slot) e como nomear a layer no Figma de forma idêntica à API.
- **`TemplateSearch.jsx`**: Ferramenta de filtro dentro da biblioteca de templates.

#### Dev Settings & Auth
- **`DevSettingsTab.jsx`**: Aba de ferramentas para testes e depuração de schema. Permite limpar o cache de schemas, testar payloads e lidar com JWT manual.
- **`LoginScreen.jsx`**: Tela inicial de autenticação do plugin. Protege as requisições API e lida com a configuração de chaves (TIM Key).

#### Shared/Layout
- **`Header.jsx`**: Barra do topo do plugin, mostra branding, botão "Dev" e a foto de perfil/logout do usuário.
- **`NavBar.jsx`**: Barra inferior de roteamento de acesso rápido (Home, Scan, Inspect).
- **`ResizableContainer.jsx`**: Wrapper responsável pelo controle de redimensionamento drag-and-drop na parte inferior-direita da janela do plugin.
- **`Toast.jsx`**: Sistema de alertas não intrusivos usando Framer Motion, gerenciado no AppStore.
- **`NidBadge.jsx`**: Badge reutilizável que mostra o NID ativo.
- **`PropertyList.jsx`**: Visualização universal em lista das propriedades extraídas no momento pelo hook do Figma.

### Integração Backend e Estado

#### API Clientes (`src/api/`)
- **`drupalClient.js`**: Define os métodos GET (sync) e POST (deploy e new page) padronizados com a header de autorização e endpoints base do Drupal.
- **`templateClient.js`**: Cliente focado apenas no dicionário e cache de templates/variants disponíveis para a integração.

#### Hooks (`src/hooks/`)
- **`useFigmaMessages.js`**: O "cérebro" de comunicação assíncrona com o Figma. Posta e reage a mensagens vindas do plugin local (`code.ts`).
- **`useScan.js`**: Gerencia a máquina de estados do scan de página. Lida com o ciclo loading -> analysis -> result.
- **`useTemplates.js`**: Hook de cache e busca inteligente da lista de templates usando TanStack Query por baixo dos panos e lidando com fallback offline se necessário.

#### Estado Global (`src/stores/`)
- **`appStore.js`**: Zustand Store para controle de rota UI (`currentScreen`), gerenciamento da pilha de toasts, e controle visual global do App.
- **`deployStore.js`**: Zustand Store que persiste e gerencia os dados do formulário de deploy entre a renderização de telas, para não perder o input ao navegar via abas.

### Figma Context (`src/plugin/`)
- **`code.ts / main.js`**: O código rodando diretamente no thread principal do Figma, sem acesso ao DOM. Este arquivo escuta comandos, seleciona e itera pelas properties dos components do Figma e envia um JSON serializado para o `useFigmaMessages`.
