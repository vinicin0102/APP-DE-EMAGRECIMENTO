# GUIA DE CONFIGURAÇÃO DE WEBHOOK E PAGAMENTOS 💰

Siga este guia para ativar a liberação automática de desafios após a compra.

## 1. Atualizar o Banco de Dados
Execute o script `preparar_webhook_database.sql` no **Supabase SQL Editor**.
Isso cria as colunas necessárias para salvar o ID do produto.

## 2. Configurar a Edge Function (Backend)
Esta função recebe o aviso de pagamento e libera o acesso.

### Opção A: Via Supabase Dashboard (Mais Fácil)
1. Vá em **Edge Functions** no menu lateral do Supabase.
2. Se não tiver como criar pela interface web, você precisará usar o CLI (terminal).
3. **Instale o Supabase CLI** no seu computador (se não tiver).
4. Rode no terminal: `supabase login`
5. Rode: `supabase functions deploy payment-webhook` (estando na pasta do projeto).

### Opção B: Copiar e Colar (Se disponível no Dashboard)
Se o Supabase permitir criar função direto no site:
1. Crie uma função chamada `payment-webhook`.
2. Cole o conteúdo do arquivo `supabase/functions/payment-webhook/index.ts`.

## 3. Configurar o Gateway (Ex: Kiwify)
1. Entre na sua conta **Kiwify** (ou Hotmart/Eduzz).
2. Vá nas configurações do seu produto.
3. Procure por **Webhooks** ou **Integrações**.
4. Crie um novo Webhook.
5. **URL do Webhook:** Será algo como: `https://seu-projeto.supabase.co/functions/v1/payment-webhook`
   *(Você pega essa URL no painel do Supabase após o deploy)*.
6. **Eventos:** Marque "Compra aprovada" (Purchase Approved).

## 4. Conectar Desafio ao Produto
1. No seu **App (Admin Panel)**, vá em **Desafios**.
2. Edite o desafio que você quer vender.
3. No campo **🔑 ID do Produto (Webhook)**, cole o ID do produto da Kiwify.
   *(Geralmente é um código tipo `kiwify_prod_...` ou o ID que aparece na URL do produto)*.
4. Salve.

## ✅ Como Funciona
1. O aluno compra na Kiwify.
2. Kiwify manda um aviso para o Supabase (Webhook).
3. Supabase lê o ID do Produto e o Email do aluno.
4. O sistema libera o desafio automaticamente para esse email.

---
**Observação Importante:**
O aluno precisa ter uma conta no app com o **mesmo email** da compra para que a liberação funcione.
