# Como configurar a IA no site online (Vercel)

O erro "Chave de API não configurada" ocorre porque a chave de segurança do ChatGPT não é enviada para o GitHub por motivos de proteção. Você precisa adicioná-la manualmente no painel da Vercel.

## Passo a Passo

1. Acesse seu painel na [Vercel](https://vercel.com/dashboard).
2. Selecione o projeto **app-de-emagrecimento**.
3. Clique na aba **Settings** (Configurações) no topo.
4. No menu lateral esquerdo, clique em **Environment Variables**.
5. Adicione uma nova variável:
   - **Key:** `VITE_OPENAI_API_KEY`
   - **Value:** `sk-proj-...` (Copie sua chave completa aqui)
6. Clique no botão **Save**.
7. **Importante:** Para a mudança surtir efeito, você precisa fazer um novo Deploy.
   - Vá na aba **Deployments**.
   - Clique nos três pontinhos (...) do último deploy.
   - Selecione **Redeploy**.

Após o deploy terminar, a IA (Camila e Jessica) funcionará perfeitamente! 🚀
