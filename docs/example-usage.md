# Exemplo de Uso - SETUP-PROMPT.md

Este arquivo mostra como usar o SETUP-PROMPT.md na prática com uma tarefa real.

---

## Cenário: Você precisa implementar a página de Deals

### Passo 1: Abra SETUP-PROMPT.md

Copie TODO o conteúdo de `SETUP-PROMPT.md`.

### Passo 2: Abra Claude Code

Inicie uma nova conversa no Claude Code.

### Passo 3: Cole o Prompt + Descreva a Tarefa

Cole o conteúdo completo de SETUP-PROMPT.md, então adicione sua tarefa no final:

```
[... todo o conteúdo de SETUP-PROMPT.md aqui ...]

---

## Current Task

Implementar a página /deals com os seguintes requisitos:

1. **Estrutura:**
   - Página em /app/deals/page.tsx
   - Título: "Travel Deals & Discounts"
   - Seções para cada parceiro afiliado

2. **Parceiros a destacar:**
   - GoWithGuide (guided tours): https://tidd.ly/4s8kRkI
   - Xcaret (Mexico experiences): https://tidd.ly/4sH1xfw
   - Klook (activities): https://affiliate.klook.com/redirect?aid=117089&aff_adid=1248864&k_site=https%3A%2F%2Fwww.klook.com%2F
   - Booking.com (hotels/flights/cars)

3. **Design:**
   - Usar brand colors: #FF8210, #00447B
   - Tipografia: Poppins para títulos, Inter para corpo
   - Fotos reais via Unsplash (não emojis)
   - Ícones: Lucide React em brand colors

4. **Funcionalidades:**
   - Cards clicáveis para cada parceiro
   - CTA buttons com affiliate links
   - Responsive design
   - Loading states

Antes de começar, verifique:
- Se /app/deals/page.tsx já existe
- Estrutura de outras páginas como referência
- Componentes reutilizáveis disponíveis
```

### Passo 4: Aguarde Discovery

Claude Code vai:
1. Ler CLAUDE.md
2. Ler CONVENTIONS.md
3. Verificar commits recentes
4. Buscar deployment state via Vercel tools
5. Verificar se /app/deals/page.tsx existe
6. Listar componentes reutilizáveis

**Importante:** Deixe Claude Code completar todo o discovery antes de prosseguir.

### Passo 5: Claude Code Implementa

Claude Code vai:
- Criar /app/deals/page.tsx
- Usar brand colors corretos
- Aplicar tipografia Poppins/Inter
- Buscar fotos via Unsplash
- Usar Lucide icons em #FF8210 e #00447B
- Adicionar affiliate links corretos

### Passo 6: Revise as Mudanças

```bash
git status
git diff
```

Se aprovar, continue para Passo 7. Se não, peça ajustes a Claude Code.

### Passo 7: Atualize o Contexto

```bash
./scripts/update-context.sh
```

Isso vai adicionar `/app/deals/page.tsx` ao CLAUDE.md para futuras sessões.

### Passo 8: Revise o Contexto Atualizado

```bash
git diff CLAUDE.md
```

Confirme que a nova página está documentada.

### Passo 9: Commit Tudo

```bash
git add -A
git commit -m "feat: implement deals page with affiliate partners + context update

- Created /app/deals/page.tsx with GoWithGuide, Xcaret, Klook, Booking.com
- Applied brand colors and typography
- Added real Unsplash photos
- Updated CLAUDE.md with new route"
```

### Passo 10: Push para Deploy

```bash
git push origin main
```

Vercel vai fazer deploy automático.

---

## Resultado

### Próxima Sessão Claude Code

Quando você iniciar nova sessão e colar SETUP-PROMPT.md:

```
Claude Code: Ler CLAUDE.md...
Claude Code: [vê que /app/deals/page.tsx existe]
Claude Code: [vê affiliate links e estrutura da página]
Claude Code: Ready to work! What's the task?

Você: "Adicione uma seção de Featured Destinations na página de Deals"

Claude Code: [já sabe que /app/deals/page.tsx existe]
Claude Code: [já sabe a estrutura atual da página]
Claude Code: [adiciona nova seção sem recriar a página]
```

**Contexto persistente funcionando!**

---

## Outro Exemplo: Bug Fix

### Tarefa: Corrigir bug de foto em saved trips

```
[... conteúdo completo de SETUP-PROMPT.md ...]

---

## Current Task

Corrigir bug onde fotos não atualizam ao carregar saved trips:

**Contexto do bug:**
- Fotos são salvas no JSONB saved_trips.trip_data
- Quando usuário carrega saved trip, fotos ficam congeladas
- Precisam re-fetch para mostrar fotos atualizadas

**Solução esperada:**
1. Identificar onde saved trips são carregados
2. Adicionar re-fetch de fotos após carregar trip_data
3. Usar mesma pipeline: Unsplash → Pexels
4. Manter Cache-Control: no-store

Antes de começar:
- Verificar rota de carregamento de saved trips
- Verificar API route de destination-photos
- Verificar se lógica de re-fetch já existe em algum lugar
```

Claude Code vai descobrir tudo antes de propor a solução.

---

## Dica Pro: Tarefa Multi-Etapa

Para tarefas complexas, use o mesmo prompt mas descreva todas as etapas:

```
## Current Task

Implementar sistema de favoritos para saved trips:

**Etapa 1:** Database
- Confirmar que coluna is_favorite existe em saved_trips
- Se não, criar migration

**Etapa 2:** API
- Criar /api/toggle-favorite/route.ts
- Recebe trip_id, toggled is_favorite
- Retorna trip atualizado

**Etapa 3:** Frontend
- Adicionar ícone de estrela (Lucide) em trip cards
- Click no ícone chama API toggle-favorite
- Atualiza UI optimistically

**Etapa 4:** Filtro
- Adicionar filtro "Show only favorites" na lista de trips
- Filter client-side baseado em is_favorite

Antes de começar, descobrir:
- Se is_favorite já existe
- Onde trips são listados (qual componente)
- Se já existe API similar para referência
```

Claude Code vai fazer discovery completo e implementar tudo de forma coerente.

---

## Resumo

**Sempre:**
1. Copie TODO SETUP-PROMPT.md
2. Cole no início da conversa Claude Code
3. Adicione sua tarefa no final
4. Aguarde discovery completo
5. Após aprovação: `./scripts/update-context.sh` → commit → push

**Resultado:**
- Claude Code sempre informado
- Sem recriar código existente
- Sem quebrar features
- Continuidade entre sessões

---

**Este exemplo está no repositório como referência.**
**Use como template para todas as suas sessões Claude Code.**
