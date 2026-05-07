# Figma-Drupal Sync: O Futuro do Deploy de Páginas
**Documento Mestre de Planejamento e Arquitetura do Produto**

Este documento centraliza todas as definições, o pitch de apresentação e as decisões tomadas durante a concepção e evolução da versão mais recente do plugin Figma-to-Drupal Sync.

---

## 1. O Pitch de Apresentação
### Introdução: A Nossa Visão
*"Pessoal, hoje nosso fluxo de criação de páginas envolve o designer criando tudo no Figma, repassando para o desenvolvimento, e alguém montando isso manualmente no Drupal usando o Cohesion. Isso consome horas, gera ruídos de comunicação e atrasa o time-to-market.*

*A solução que estou trazendo é a criação de um Plugin de Figma de altíssimo nível. A ideia é simples, mas extremamente poderosa: dar autonomia total ao designer. Vamos criar uma ponte direta onde o próprio criador da página consegue sincronizar, mapear e fazer o deploy das alterações direto do Figma para o nosso ambiente Drupal, usando a API que o nosso time de DevOps já está construindo."*

### A Experiência do Usuário (O Fluxo Completo)
Para que isso funcione de forma impecável, o fluxo do plugin será dividido em quatro grandes etapas:

1. **Autenticação Segura (X-TIM-Key)**
   O plugin começa com uma tela de login conectada ao nosso backend. Sem a API Key (X-TIM-Key), o plugin não funciona. Isso garante que apenas pessoas do time (designers e devOps) tenham acesso à ponte com o Drupal.

2. **O Dashboard do Designer (Home / Status)**
   Após o login, o designer cai num painel elegante. O plugin varre a página atual do Figma e diz:
   *  *"Você está na página de Ofertas Móvel".*
   *  *"Essa página já está sincronizada com o Drupal?"* (Verde se sim, Vermelho se não).
   Aqui ele pode Vincular um NID existente ou Criar uma Nova Página.

3. **O Motor de Scan (O Coração da Inteligência)**
   Quando o designer clica em "Escanear", a mágica acontece. Nosso plugin lê a árvore de layers do Figma e procura pelos componentes que seguem o nosso padrão de nomenclatura (ex: `M12_Banner`, `M04_Cards`).
   * Ele extrai textos, URLs, variações (Desktop/Mobile) e variáveis booleanas.
   * Mostra um relatório na tela: *"Encontramos 5 componentes. 4 estão perfeitos, 1 está com nome errado"*.
   * Mostra um Diff (O que mudou em relação ao Drupal?).

4. **Deploy Direto (1 Clique)**
   Se tudo estiver verde, o designer clica em "Fazer Deploy". O plugin empacota a árvore de componentes num JSON perfeito, junta com as propriedades da página (Node Fields) e joga para a nossa API do Drupal. Em 3 segundos, a página atualiza no ambiente de staging. Fim.

---

## 2. A Evolução Técnica: Tailwind CSS v4 + Shadcn UI

Para atingir a qualidade visual "premium, state-of-the-art" (Liquid Glass, dark mode elegante, glassmorphism) descrita na visão do produto, foi realizada a modernização completa da stack de interface (UI) do plugin.

### Decisões de Arquitetura UI
1. **Remoção de CSS Legado:** Todos os arquivos de CSS isolados (`App.css`, `style.css`, etc.) foram deletados.
2. **Tailwind CSS v4:** A UI foi inteiramente reescrita usando utility classes do Tailwind CSS v4, alavancando as novas funcionalidades de `@theme` centralizado no `globals.css`.
3. **Componentização (Shadcn UI mode):** A filosofia da biblioteca shadcn/ui foi aplicada no ambiente JavaScript puro (`.jsx`).
   * Foram criados componentes reutilizáveis em `src/components/ui/` (`Button`, `Badge`, `Card`, `Input`, `Dialog`, `Progress`, etc.).
   * A função `cn()` (`clsx` + `tailwind-merge`) é o motor de consolidação de classes.
4. **TanStack Query (React Query):** Foi introduzido para gerenciar as requisições API, lidando com caching, refetching automático e sincronização eficiente dos schemas do Drupal.
5. **Autenticação:** Correção da chave de autenticação nas requests para o Drupal. O cabeçalho foi padronizado de `X-CMS-Key` para **`X-TIM-Key`**, acompanhando o padrão estabelecido pela equipe de DevOps.

### Arquitetura de Pastas Modernizada
```text
src/
├── api/          # Comunicação com o Drupal (X-TIM-Key)
├── plugin/       # Lógica do sandbox do Figma (leitura da árvore de layers)
├── ui/           # Interface em React.js
│   ├── components/
│   │   ├── ui/        # Componentes base (Botão, Input, etc) seguindo Shadcn
│   │   ├── auth/      # Telas de login e validação de chaves
│   │   ├── home/      # Dashboards de status
│   │   ├── deploy/    # Diff visual e submissão
│   │   ├── scan/      # Auditoria de layers e Json preview
│   │   ├── templates/ # Referências de nomenclatura (Catálogo)
│   │   └── inspect/   # Detalhamento de propriedades desktop/mobile
│   ├── hooks/    # TanStack Query & Zustand listeners
│   ├── stores/   # Estado global do app UI
│   ├── main.jsx  # Ponto de entrada (QueryProvider, Tailwind setup)
│   └── App.jsx   # Roteador central
```

*(Para um mergulho profundo por arquivo, consulte o documento complementar `.planning/CODE_ARCHITECTURE.md` gerado na mesma sessão).*

---

## 3. Próximos Passos (Backlog Ativo)

Agora que a migração da interface visual e as configurações base da API foram estabilizadas:

- [ ] **Integração Real com o Endpoint DevOps:** Testar o Deploy e o Sync diretamente no servidor de dev/staging com a chave `X-TIM-Key` em ambiente não simulado.
- [ ] **Mapeamento de Variáveis Booleanas/Variantes:** Refinar a extração no `code.ts` do Figma para garantir que os "variants" (ex: Dark Mode, Invert) sejam lidos nativamente pelo Figma API e enviados ao Drupal.
- [ ] **Tratamento de Imagens:** Evoluir o processo para não apenas extrair URLs de imagens, mas preparar o plugin para upload binário futuro, caso a API do Drupal ganhe suporte de media proxy.
- [ ] **Feedback de Erros Pós-Deploy:** Capturar mensagens de erro amigáveis vindas da API DevOps caso faltem *required fields* para a criação de um Node.
