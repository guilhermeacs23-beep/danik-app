# DANIK — Como colocar no ar

## Pré-requisitos
- Conta no GitHub ✅
- Conta no Supabase ✅
- Conta no Vercel ✅

---

## PASSO 1 — Criar projeto no Supabase

1. Acesse https://supabase.com/dashboard
2. Clique em **New Project**
3. Nome: `danik-prod`
4. Senha do banco: gere uma forte e guarde
5. Região: `South America (São Paulo)` — melhor latência para o Brasil
6. Aguarde ~2 minutos para provisionar

---

## PASSO 2 — Criar o banco de dados

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Copie todo o conteúdo do arquivo `supabase/schema.sql`
4. Cole e clique em **Run**
5. Deve aparecer "Success. No rows returned"

---

## PASSO 3 — Criar o primeiro usuário (proprietária)

1. No Supabase, vá em **Authentication > Users**
2. Clique em **Invite User** (ou Add User)
3. Digite o e-mail da proprietária
4. No SQL Editor, execute:

```sql
-- Substitua pelo ID do usuário criado e pelo nome da loja
INSERT INTO tenants (name, slug, email)
VALUES ('Nome da Loja', 'nome-da-loja', 'email@daloja.com');

-- Depois atualize o profile com o tenant_id correto
UPDATE profiles
SET tenant_id = (SELECT id FROM tenants LIMIT 1),
    name = 'Nome da Proprietária',
    role = 'owner'
WHERE id = (SELECT id FROM auth.users LIMIT 1);
```

---

## PASSO 4 — Pegar as chaves do Supabase

1. No painel, vá em **Settings > API**
2. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (só no servidor, nunca expor)

---

## PASSO 5 — Subir o código no GitHub

```bash
# Na pasta danik-app:
git init
git add .
git commit -m "chore: initial DANIK setup"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/danik-app.git
git push -u origin main
```

---

## PASSO 6 — Deploy no Vercel

1. Acesse https://vercel.com/new
2. Clique em **Import Git Repository**
3. Selecione o repositório `danik-app`
4. Em **Environment Variables**, adicione:

| Nome | Valor |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | sua URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sua anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | sua service role key |
| `NEXT_PUBLIC_APP_URL` | https://danik.vercel.app |

5. Clique em **Deploy**
6. Aguarde ~2 minutos
7. Acesse a URL gerada pelo Vercel 🎉

---

## PASSO 7 — Domínio próprio (opcional)

1. No Vercel, vá em **Settings > Domains**
2. Adicione seu domínio (ex: `app.danik.com.br`)
3. Configure os DNS conforme instruído pelo Vercel

---

## Atualizações futuras

Todo `git push origin main` faz deploy automático no Vercel. Sem necessidade de nenhuma ação manual.

---

## Integrações futuras

- **n8n**: configure webhooks para receber eventos do Supabase e disparar mensagens WhatsApp
- **Railway**: hospede o servidor Evolution API para WhatsApp
- **Valora**: integração via webhooks configurados no n8n

---

## Suporte

Para dúvidas, abra o Claude e diga: "preciso de ajuda com o DANIK"
