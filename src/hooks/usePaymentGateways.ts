import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

export interface PaymentGateway {
    id: string;
    name: string;
    webhook_url: string;
    secret?: string;
    created_at: string;
    updated_at: string;
}

export const usePaymentGateways = () => {
    const [gateways, setGateways] = useState<PaymentGateway[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchGateways = async () => {
        const { data, error } = await supabase
            .from('payment_gateways')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error && data) setGateways(data as PaymentGateway[]);
        setLoading(false);
    };

    const upsertGateway = async (gw: Partial<PaymentGateway>) => {
        const { error } = await supabase
            .from('payment_gateways')
            .upsert(gw, { onConflict: 'id' });
        if (!error) fetchGateways();
        return error;
    };

    const deleteGateway = async (id: string) => {
        const { error } = await supabase.from('payment_gateways').delete().eq('id', id);
        if (!error) fetchGateways();
        return error;
    };

    useEffect(() => { fetchGateways(); }, []);

    return { gateways, loading, upsertGateway, deleteGateway };
};
