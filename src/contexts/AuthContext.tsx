import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { User } from '../lib/supabase'

interface AuthContextType {
    user: SupabaseUser | null
    profile: User | null
    session: Session | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>
    signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>
    signOut: () => Promise<void>
    updateProfile: (updates: Partial<User>) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<SupabaseUser | null>(null)
    const [profile, setProfile] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const loadingCompleted = useRef(false)

    useEffect(() => {
        let mounted = true
        loadingCompleted.current = false

        // Timeout de segurança - 10 segundos máximo (aumentado para desktop)
        const timeout = setTimeout(() => {
            if (mounted && !loadingCompleted.current) {
                console.log('Auth timeout - forcing load complete')
                loadingCompleted.current = true
                setLoading(false)
            }
        }, 10000) // CORRIGIDO: aumentado de 3s para 10s para evitar timeout prematuro no desktop

        const completeLoading = () => {
            if (!loadingCompleted.current) {
                loadingCompleted.current = true
                setLoading(false)
            }
        }

        const initAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession()

                if (!mounted) return

                if (error) {
                    console.error('Error getting session:', error)
                    completeLoading()
                    return
                }

                setSession(session)
                setUser(session?.user ?? null)

                if (session?.user) {
                    await fetchProfile(session.user.id)
                } else {
                    completeLoading()
                }
            } catch (error) {
                console.error('Auth init error:', error)
                if (mounted) completeLoading()
            }
        }

        initAuth()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (!mounted) return

                setSession(session)
                setUser(session?.user ?? null)

                if (session?.user) {
                    await fetchProfile(session.user.id)
                } else {
                    setProfile(null)
                    setLoading(false)
                }
            }
        )

        return () => {
            mounted = false
            clearTimeout(timeout)
            subscription.unsubscribe()
        }
    }, [])

    const fetchProfile = async (userId: string) => {
        try {
            console.log('📋 Buscando perfil para user ID:', userId)
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                if (error.code === 'PGRST116') {
                    console.warn('⚠️ Perfil não encontrado, criando um novo...')
                    // Tentar criar o perfil automaticamente se não existir
                    const { data: { user } } = await supabase.auth.getUser()
                    if (user) {
                        const newProfile = {
                            id: user.id,
                            email: user.email,
                            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
                            points: 0,
                            streak_days: 0,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }

                        console.log('💾 Criando perfil:', newProfile)
                        const { data: insertedData, error: insertError } = await supabase
                            .from('users')
                            .insert(newProfile)
                            .select()
                            .single()

                        if (!insertError && insertedData) {
                            console.log('✅ Perfil criado automaticamente!', insertedData)
                            setProfile(insertedData as User)
                        } else {
                            console.error('❌ Erro ao criar perfil fallback:', insertError)
                            // Mesmo com erro, criar perfil temporário para não bloquear login
                            setProfile(newProfile as User)
                        }
                    }
                } else {
                    console.error('❌ Error fetching profile:', error)
                    // Não bloquear login mesmo se houver erro ao buscar perfil
                }
            } else {
                console.log('✅ Perfil encontrado:', data?.email)
                setProfile(data)
            }
        } catch (error) {
            console.error('❌ Fetch profile error:', error)
        } finally {
            // Marcar como completado para evitar que o timeout force loading=false novamente
            loadingCompleted.current = true
            setLoading(false)
        }
    }

    const signIn = async (email: string, password: string) => {
        try {
            console.log('🔐 Tentando fazer login com:', email)
            const { data, error } = await supabase.auth.signInWithPassword({ email, password })
            
            if (error) {
                console.error('❌ Erro no login:', error.message, error)
                return { error: error as Error }
            }

            if (data?.user) {
                console.log('✅ Login bem-sucedido! User ID:', data.user.id)
                // Garantir que o perfil existe após login
                if (data.user) {
                    await fetchProfile(data.user.id)
                }
            }

            return { error: null }
        } catch (err: any) {
            console.error('❌ Erro inesperado no login:', err)
            return { error: err as Error }
        }
    }

    const signUp = async (email: string, password: string, name: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name }
            }
        })

        if (!error && data.user) {
            try {
                await supabase.from('users').insert({
                    id: data.user.id,
                    email,
                    name,
                    points: 0,
                    streak_days: 0
                })
            } catch (e) {
                console.error('Error creating profile:', e)
            }
        }

        return { error: error as Error | null }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setSession(null)
        setProfile(null)
    }

    const updateProfile = async (updates: Partial<User>) => {
        if (!user) return { error: new Error('Not authenticated') }

        const { error } = await supabase
            .from('users')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', user.id)

        if (!error) {
            setProfile(prev => prev ? { ...prev, ...updates } : null)
        }

        return { error: error as Error | null }
    }

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            session,
            loading,
            signIn,
            signUp,
            signOut,
            updateProfile
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
