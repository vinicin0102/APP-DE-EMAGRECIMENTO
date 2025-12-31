// SCRIPT DA EDGE FUNCTION DO SUPABASE
// ==========================================================
// Este arquivo deve ser colocado em: supabase/functions/payment-webhook/index.ts
// Depois você deve fazer o deploy: supabase functions deploy payment-webhook
// ==========================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Criar cliente Supabase Admin (ignora RLS)
        const supabaseClient = createClient(
            // Variáveis de ambiente injetadas automaticamente pelo Supabase
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 2. Ler o corpo do Webhook
        const payload = await req.json()
        console.log('Webhook recebido:', payload)

        // ------------------------------------------------------------------
        // ADAPTAÇÃO PARA DIFERENTES GATEWAYS (Kiwify, Hotmart, Stripe)
        // ------------------------------------------------------------------

        // Exemplo KIWIFY:
        // payload.product_id (ID do produto)
        // payload.order_status (paid, refunded)
        // payload.Customer.email (email do cliente)

        // Extrair dados (ajuste conforme seu gateway!)
        const productId = payload.product_id || payload.Product?.product_id || payload.id
        const userEmail = payload.Customer?.email || payload.email || payload.data?.object?.customer_email
        const status = payload.order_status || payload.status || 'approved' // Assumimos approved se não vier status

        if (!productId || !userEmail) {
            throw new Error('Dados incompletos: Faltando Product ID ou Email')
        }

        if (status !== 'paid' && status !== 'approved' && status !== 'completed') {
            console.log(`Status ${status} ignorado. Apenas compras aprovadas são processadas.`)
            return new Response(JSON.stringify({ message: 'Ignored status' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        console.log(`Processando compra: Produto ${productId} para ${userEmail}`)

        // 3. Buscar qual Desafio corresponde a esse Produto
        const { data: challenge, error: challengeError } = await supabaseClient
            .from('challenges')
            .select('id, title')
            .eq('gateway_product_id', productId)
            .single()

        if (challengeError || !challenge) {
            console.error('Desafio não encontrado para este Product ID:', productId)
            throw new Error(`Produto não mapeado no sistema: ${productId}`)
        }

        // 4. Buscar Usuário pelo Email
        // Nota: Buscamos na tabela auth.users via RPC ou admin API se possível,
        // mas por segurança vamos buscar na tabela 'profiles' ou tentar resolver o ID.
        // A melhor forma no Supabase Edge Functions é listar usuários pelo admin auth.

        // Método via Admin Auth
        const { data: { users }, error: userError } = await supabaseClient.auth.admin.listUsers()
        const user = users.find((u: any) => u.email === userEmail)

        if (!user) {
            console.error('Usuário não encontrado com email:', userEmail)
            // Opcional: Criar conta para o usuário aqui se desejar
            throw new Error('Usuário não cadastrado no app')
        }

        // 5. Liberar Acesso (Inserir em challenge_participants)
        const { error: insertError } = await supabaseClient
            .from('challenge_participants')
            .upsert({
                user_id: user.id,
                challenge_id: challenge.id,
                progress: 0,
                joined_at: new Date().toISOString()
            }, { onConflict: 'user_id, challenge_id' })

        if (insertError) {
            console.error('Erro ao liberar acesso:', insertError)
            throw insertError
        }

        // 6. Registrar Venda (Log)
        await supabaseClient.from('sales_history').insert({
            user_email: userEmail,
            challenge_id: challenge.id,
            gateway_transaction_id: payload.order_id || 'N/A',
            gateway_provider: 'webhook',
            amount: payload.amount || 0,
            status: 'approved'
        })

        console.log(`Sucesso! Desafio "${challenge.title}" liberado para ${userEmail}`)

        return new Response(JSON.stringify({ success: true, message: 'Acesso liberado' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        console.error('Erro no webhook:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }

})
