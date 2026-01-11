import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cpkpeputbmztfianbqct.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwa3BlcHV0Ym16dGZpYW5icWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NzAzNjksImV4cCI6MjA4MzQ0NjM2OX0.nN9wLq3LWskDkhwMSIED_slzai7LuTC6J9SlGQWpuwg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for database tables
export interface User {
    id: string
    email: string
    phone?: string
    name: string
    avatar_url?: string
    weight_goal?: number
    current_weight?: number
    points: number
    streak_days: number
    height?: number
    birth_date?: string
    created_at: string
    updated_at: string
}

export interface Post {
    id: string
    user_id: string
    content: string
    image_url?: string
    likes_count: number
    comments_count: number
    shares_count: number
    created_at: string
    user?: User
}

export interface Challenge {
    id: string
    title: string
    description: string
    emoji: string
    color: string
    duration_days: number
    difficulty: 'Fácil' | 'Intermediário' | 'Avançado'
    reward_points: number
    participants_count: number
    start_date: string
    end_date: string
    created_at: string
    is_premium?: boolean
    price?: number
    checkout_url?: string
    gateway_product_id?: string
}

export interface ChallengeParticipant {
    id: string
    user_id: string
    challenge_id: string
    progress: number
    joined_at: string
    completed_at?: string
}

export interface WeightLog {
    id: string
    user_id: string
    weight: number
    notes?: string
    logged_at: string
}

export interface Like {
    id: string
    user_id: string
    post_id: string
    created_at: string
}

export interface Comment {
    id: string
    user_id: string
    post_id: string
    content: string
    created_at: string
    user?: User
}
