# Luna Let's Go - Sistema de Contexto Persistente

**Problema resolvido:** Claude Code perde contexto entre sessões e após updates.

**Solução:** Sistema de documentação auto-regenerável + convenções rígidas + protocolo de inicialização.

---

## 📁 Arquivos do Sistema

### 1. **CLAUDE.md** (Contexto Dinâmico)
- Regenerado após cada update aprovado
- Contém: estrutura atual, commits recentes, rotas ativas, issues conhecidos
- **Fonte da verdade** para o estado atual do projeto
- **Sempre leia este arquivo no início de cada sessão Claude Code**

### 2. **CONVENTIONS.md** (Regras Imutáveis)
- NUNCA muda (salvo mudanças arquiteturais raras)
- Contém: padrões de nomenclatura, brand guidelines, patterns de código
- **Autoridade máxima** em caso de conflitos
- **Sempre leia este arquivo no início de cada sessão Claude Code**

### 3. **SETUP-PROMPT.md** (Protocolo de Inicialização)
- Template para colar no início de TODA sessão Claude Code
- Contém: checklist de discovery, lembretes críticos, workflow de commit
- **Cole este conteúdo no início de cada nova sessão Claude Code**

### 4. **scripts/update-context.sh** (Regenerador)
- Script que atualiza CLAUDE.md com estado atual do projeto
- Roda localmente, **NÃO faz deploy**
- Execute manualmente após aprovar mudanças, antes do push

---

## 🔄 Workflow Completo

### Antes de Começar uma Tarefa

1. **Abra Claude Code**

2. **Cole o conteúdo de SETUP-PROMPT.md** no início da conversa
   - Adicione a descrição da tarefa no final do prompt

3. **Claude Code vai:**
   - Ler CLAUDE.md (estado atual)
   - Ler CONVENTIONS.md (regras fixas)
   - Verificar commits recentes
   - Confirmar estrutura de rotas via Vercel tools
   - Verificar localizações de arquivos

4. **Só então** começar a codificar

### Durante o Trabalho

- Claude Code segue os patterns de CONVENTIONS.md
- Claude Code nunca assume localizações de arquivos
- Claude Code nunca faz deploy automático

### Depois que Claude Code Terminar

```bash
# 1. Revise as mudanças
git status
git diff

# 2. Teste localmente (se aplicável)
npm run dev
# Teste a feature modificada

# 3. SE APROVAR, atualize o contexto
./scripts/update-context.sh

# 4. Revise as mudanças no contexto
git diff CLAUDE.md

# 5. Commit tudo junto
git add -A
git commit -m "feat: descrição da mudança + context update"

# 6. Push para deploy
git push origin main
```

**Vercel faz deploy automático após push para main.**

---

## 🎯 Como Funciona

### Antes (Problema)
```
Sessão 1: Claude Code cria feature A
Update aprovado, push para main
---
Sessão 2: Claude Code não sabe que feature A existe
Recria código similar ou quebra feature A
```

### Depois (Solução)
```
Sessão 1: Claude Code cria feature A
Update aprovado
./scripts/update-context.sh (atualiza CLAUDE.md)
Commit + push
---
Sessão 2: Cole SETUP-PROMPT.md
Claude Code lê CLAUDE.md atualizado
Claude Code VÊ que feature A existe
Claude Code trabalha com contexto correto
```

---

## 📋 Checklist de Uso Diário

### Toda Nova Sessão Claude Code:
- [ ] Abrir SETUP-PROMPT.md
- [ ] Copiar todo o conteúdo
- [ ] Colar no início da conversa Claude Code
- [ ] Adicionar descrição da tarefa no final
- [ ] Deixar Claude Code fazer discovery antes de codificar

### Após Aprovar Mudanças:
- [ ] `git diff` (revisar tudo)
- [ ] Testar localmente se necessário
- [ ] `./scripts/update-context.sh`
- [ ] `git diff CLAUDE.md` (revisar contexto atualizado)
- [ ] `git add -A`
- [ ] `git commit -m "..."`
- [ ] `git push origin main`

### Semanalmente (Manutenção):
- [ ] Revisar seção "Known Active Issues" no CLAUDE.md
- [ ] Atualizar manualmente se necessário
- [ ] Marcar issues resolvidos como ✅
- [ ] Adicionar novos issues conhecidos

---

## 🛠️ Manutenção do Sistema

### Quando Atualizar CONVENTIONS.md
Apenas quando houver mudanças arquiteturais fundamentais:
- Mudança de framework
- Nova convenção de nomenclatura permanente
- Novo padrão de auth/database
- Nova regra de brand identity

**CONVENTIONS.md é quase imutável.**

### Quando Atualizar SETUP-PROMPT.md
Quando você descobrir novos patterns de problemas recorrentes:
- Novo tipo de bug comum
- Nova ferramenta de diagnosis útil
- Novo workflow que funciona melhor

**Atualizar a cada 2-3 meses ou quando identificar pattern.**

### CLAUDE.md Se Atualiza Automaticamente
Via `./scripts/update-context.sh` - não edite manualmente (salvo seção "Known Active Issues").

---

## 🚨 Troubleshooting

### "Claude Code ainda está perdido após seguir tudo"

**Diagnóstico:**
```bash
# Verifique se CLAUDE.md está atualizado
cat CLAUDE.md | head -20
# Deve mostrar data recente

# Verifique estrutura do projeto
tree -L 2 -I 'node_modules|.next'
# Compare com CLAUDE.md
```

**Solução:**
```bash
# Regenere o contexto manualmente
./scripts/update-context.sh

# Confirme que foi atualizado
git diff CLAUDE.md
```

### "Script update-context.sh não funciona"

**Verifique permissões:**
```bash
ls -la scripts/update-context.sh
# Deve mostrar -rwxr-xr-x (executável)
```

**Se não estiver executável:**
```bash
chmod +x scripts/update-context.sh
```

### "Claude Code está assumindo localizações erradas"

**Causa:** Não seguiu o protocolo de discovery.

**Solução:** 
- Sempre cole SETUP-PROMPT.md no início
- Aguarde Claude Code completar discovery antes de codificar
- Se já começou, interrompa e reinicie com o prompt correto

---

## 📊 Estrutura de Arquivos do Sistema

```
luna-letsgo/
├── CLAUDE.md                    # Contexto dinâmico (regenerado)
├── CONVENTIONS.md               # Regras imutáveis
├── SETUP-PROMPT.md              # Template de inicialização
├── scripts/
│   └── update-context.sh        # Regenerador de contexto
├── app/                         # Código Next.js
├── lib/                         # Utilities
└── ... (resto do projeto)
```

---

## 🎓 Conceitos-Chave

### Contexto Persistente ≠ Memória de IA
Claude Code não tem memória entre sessões. Este sistema:
- ✅ Documenta estado atual do projeto
- ✅ Define regras que não mudam
- ✅ Força discovery no início de cada sessão
- ❌ NÃO dá memória real ao Claude Code

### Documentação Viva
CLAUDE.md é "documentação viva" porque:
- Reflete estado REAL do projeto (não fica desatualizado)
- Regenera automaticamente após mudanças
- É a fonte da verdade para Claude Code

### Convenções vs Contexto
- **Convenções (CONVENTIONS.md):** Nunca mudam
- **Contexto (CLAUDE.md):** Muda após cada update

---

## ✅ Benefícios

### Antes do Sistema
- ❌ Claude Code recriava código existente
- ❌ Claude Code quebrava features já implementadas
- ❌ Cada sessão começava do zero
- ❌ Conflitos entre sessões diferentes

### Depois do Sistema
- ✅ Claude Code sabe o que já existe
- ✅ Claude Code preserva features implementadas
- ✅ Cada sessão começa informada
- ✅ Continuidade entre sessões

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique que seguiu o workflow completo
2. Confirme que CLAUDE.md está atualizado (data recente)
3. Confirme que colou SETUP-PROMPT.md no início da sessão
4. Verifique logs do script: `./scripts/update-context.sh`

**Lembre-se:** Claude Code não tem memória real. O sistema funciona via documentação + protocolo, não via IA mágica.

---

**Versão:** 1.0
**Data:** 2025-01-10
**Última Atualização:** Criação inicial do sistema
