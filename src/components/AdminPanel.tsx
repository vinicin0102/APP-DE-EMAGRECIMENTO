import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { User, Post, Challenge } from '../lib/supabase'
import './AdminPanel.css'
import PaymentsPage from './PaymentsPage'

const ADMIN_EMAILS = ['admin@gmail.com', 'vv9250400@gmail.com']

// Interfaces
interface Lesson {
    id: string
    title: string
    description: string
    duration: string
    thumbnail: string
    videoUrl: string
    order: number
    completed?: boolean
    locked?: boolean
}

interface Module {
    id: string
    title: string
    description: string
    thumbnail: string
    color: string
    lessons: Lesson[]
    order: number
}

interface AppSettings {
    appName: string
    welcomeTitle: string
    welcomeSubtitle: string
    primaryColor: string
    secondaryColor: string
    heroBannerImage: string
    heroTitle: string
    heroSubtitle: string
}

interface AIResponse {
    id: string
    keyword: string
    response: string
}

interface WorkoutExercise {
    nome: string
    series: number
    repeticoes: string
}

interface Workout {
    id: string
    title: string
    description: string
    type: 'casa' | 'academia' | 'ambos'
    duration: string
    difficulty: 'iniciante' | 'intermediario' | 'avancado'
    exercises: WorkoutExercise[]
    video_url?: string
    thumbnail_url?: string
    is_active: boolean
}

// Módulos padrão
const defaultModules: Module[] = [
    {
        id: '1',
        title: 'Fundamentos do Emagrecimento',
        description: 'Aprenda os conceitos básicos para uma jornada de sucesso',
        thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
        color: '#00C853',
        order: 1,
        lessons: [
            { id: '1-1', title: 'Bem-vindo à sua Transformação', description: 'Introdução completa ao programa', duration: '12 min', thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80', videoUrl: '', order: 1 },
            { id: '1-2', title: 'Entendendo seu Metabolismo', description: 'Como seu corpo queima calorias', duration: '18 min', thumbnail: 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=400&q=80', videoUrl: '', order: 2 },
        ]
    },
    {
        id: '2',
        title: 'Nutrição Inteligente',
        description: 'Domine a alimentação saudável sem dietas restritivas',
        thumbnail: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
        color: '#FF6D00',
        order: 2,
        lessons: [
            { id: '2-1', title: 'Montando seu Prato Perfeito', description: 'Equilibrando macronutrientes', duration: '20 min', thumbnail: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80', videoUrl: '', order: 1 },
        ]
    },
]

const defaultSettings: AppSettings = {
    appName: 'SlimFit',
    welcomeTitle: 'Sua jornada de transformação começa aqui',
    welcomeSubtitle: 'Transforme seu corpo com o poder da comunidade',
    primaryColor: '#00C853',
    secondaryColor: '#FF4081',
    heroBannerImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80',
    heroTitle: 'Transforme seu Corpo',
    heroSubtitle: 'Acesse todas as aulas exclusivas e comece sua jornada de transformação agora mesmo.'
}

const defaultAIResponses: AIResponse[] = [
    { id: '1', keyword: 'dieta', response: 'Dicas de alimentação saudável...' },
    { id: '2', keyword: 'treino', response: 'Treino para iniciantes...' },
    { id: '3', keyword: 'jejum', response: 'Sobre jejum intermitente...' },
]

export default function AdminPanel() {
    const { user, profile } = useAuth()
    const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'posts' | 'challenges' | 'modules' | 'workouts' | 'ai' | 'settings' | 'logs' | 'payments'>('dashboard')
    const [users, setUsers] = useState<User[]>([])
    const [posts, setPosts] = useState<(Post & { user?: User })[]>([])
    const [challenges, setChallenges] = useState<Challenge[]>([])
    const [modules, setModules] = useState<Module[]>(defaultModules)
    const [settings, setSettings] = useState<AppSettings>(defaultSettings)
    const [aiResponses, setAiResponses] = useState<AIResponse[]>(defaultAIResponses)
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [activityLogs, setActivityLogs] = useState<{ action: string, user: string, time: Date }[]>([])

    // Modal states
    const [showModal, setShowModal] = useState(false)
    const [modalType, setModalType] = useState<'challenge' | 'module' | 'lesson' | 'ai' | 'user' | 'workout'>('challenge')
    const [workouts, setWorkouts] = useState<Workout[]>([])
    const [workoutForm, setWorkoutForm] = useState<{
        title: string; description: string; type: 'casa' | 'academia' | 'ambos';
        duration: string; difficulty: 'iniciante' | 'intermediario' | 'avancado';
        exercises: WorkoutExercise[]; video_url: string; is_active: boolean;
    }>({
        title: '', description: '', type: 'casa', duration: '30 min',
        difficulty: 'iniciante', exercises: [], video_url: '', is_active: true
    })
    const [editingItem, setEditingItem] = useState<any>(null)
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)

    // Forms
    const [challengeForm, setChallengeForm] = useState<{
        title: string; description: string; emoji: string; color: string;
        duration_days: number; difficulty: 'Fácil' | 'Intermediário' | 'Avançado'; reward_points: number;
        is_premium: boolean; price: number; checkout_url: string; gateway_product_id: string;
    }>({
        title: '', description: '', emoji: '🎯', color: '#00C853',
        duration_days: 7, difficulty: 'Fácil', reward_points: 100,
        is_premium: false, price: 0, checkout_url: '', gateway_product_id: ''
    })

    const [moduleForm, setModuleForm] = useState({
        title: '', description: '', thumbnail: '', color: '#00C853', order: 1
    })

    const [lessonForm, setLessonForm] = useState({
        title: '', description: '', duration: '15 min', thumbnail: '',
        videoUrl: '', order: 1, locked: false
    })

    const [aiForm, setAiForm] = useState({ keyword: '', response: '' })
    const [userForm, setUserForm] = useState({ name: '', points: 0, streak_days: 0, weight_goal: 0 })

    const currentEmail = user?.email || profile?.email
    const isAdmin = currentEmail && ADMIN_EMAILS.some(email => email.toLowerCase() === currentEmail.toLowerCase().trim())

    console.log('Admin Check:', {
        authEmail: user?.email,
        profileEmail: profile?.email,
        finalDetectedEmail: currentEmail,
        allowedEmails: ADMIN_EMAILS,
        isAdmin
    })

    // Acesso liberado (verificação feita no App.tsx)
    // if (!isAdmin) { ... } removed for debugging/usability

    const fetchData = async () => {
        try {
            setLoading(true)
            const [usersRes, postsRes, challengesRes, workoutsRes] = await Promise.all([
                supabase.from('users').select('*').order('created_at', { ascending: false }),
                supabase.from('posts').select('*, user:users(*)').order('created_at', { ascending: false }),
                supabase.from('challenges').select('*').order('created_at', { ascending: false }),
                supabase.from('workouts').select('*').order('created_at', { ascending: false })
            ])
            setUsers(usersRes.data || [])
            setPosts(postsRes.data || [])
            setChallenges(challengesRes.data || [])
            setWorkouts(workoutsRes.data || [])
        } catch (error) {
            console.error('Erro ao carregar dados do Admin:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        // Timeout de segurança: força loading false após 5 segundos
        const timeout = setTimeout(() => {
            setLoading(false)
        }, 5000)

        // Carregar dados do localStorage
        const savedSettings = localStorage.getItem('appSettings')
        if (savedSettings) setSettings(JSON.parse(savedSettings))
        const savedModules = localStorage.getItem('adminModules')
        if (savedModules) setModules(JSON.parse(savedModules))
        const savedAI = localStorage.getItem('adminAIResponses')
        if (savedAI) setAiResponses(JSON.parse(savedAI))

        return () => clearTimeout(timeout)
    }, [])

    const addLog = (action: string, userName: string = 'Admin') => {
        setActivityLogs(prev => [{ action, user: userName, time: new Date() }, ...prev.slice(0, 49)])
    }

    // User actions
    const openUserModal = (user: User) => {
        setEditingItem(user)
        setUserForm({
            name: user.name,
            points: user.points,
            streak_days: user.streak_days,
            weight_goal: user.weight_goal || 0
        })
        setModalType('user')
        setShowModal(true)
    }

    const saveUser = async () => {
        if (!editingItem) return
        await supabase.from('users').update({
            name: userForm.name,
            points: userForm.points,
            streak_days: userForm.streak_days,
            weight_goal: userForm.weight_goal || null
        }).eq('id', editingItem.id)
        addLog(`Editou usuário: ${userForm.name}`)
        setShowModal(false)
        fetchData()
    }

    const deleteUser = async (userId: string, userName: string) => {
        if (!confirm(`Excluir usuário "${userName}"? Esta ação é irreversível.`)) return
        await supabase.from('users').delete().eq('id', userId)
        addLog(`Excluiu usuário: ${userName}`)
        fetchData()
    }

    // Ban system states
    const [showBanModal, setShowBanModal] = useState(false)
    const [banningUser, setBanningUser] = useState<User | null>(null)

    const openBanModal = (user: User) => {
        setBanningUser(user)
        setShowBanModal(true)
    }

    const calculateBanEndDate = (hours: number) => {
        return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
    }

    // Ban do Feed por 3 dias
    const banFromFeed = async (userId: string, userName: string) => {
        const banEnd = calculateBanEndDate(72) // 3 dias = 72 horas
        await supabase.from('users').update({
            feed_banned_until: banEnd
        }).eq('id', userId)
        addLog(`Baniu ${userName} do Feed por 3 dias`)
        setShowBanModal(false)
        fetchData()
    }

    // Ban do App por 24 horas
    const banFromApp24h = async (userId: string, userName: string) => {
        const banEnd = calculateBanEndDate(24)
        await supabase.from('users').update({
            banned_until: banEnd,
            ban_reason: 'Banido por 24 horas'
        }).eq('id', userId)
        addLog(`Baniu ${userName} do App por 24 horas`)
        setShowBanModal(false)
        fetchData()
    }

    // Ban do App por 7 dias
    const banFromApp7d = async (userId: string, userName: string) => {
        const banEnd = calculateBanEndDate(7 * 24) // 7 dias
        await supabase.from('users').update({
            banned_until: banEnd,
            ban_reason: 'Banido por 7 dias'
        }).eq('id', userId)
        addLog(`Baniu ${userName} do App por 7 dias`)
        setShowBanModal(false)
        fetchData()
    }

    // Ban permanente
    const banPermanently = async (userId: string, userName: string) => {
        if (!confirm(`⚠️ ATENÇÃO: Banir ${userName} PERMANENTEMENTE? Esta ação é séria.`)) return
        await supabase.from('users').update({
            is_banned: true,
            banned_until: null,
            ban_reason: 'Banido permanentemente'
        }).eq('id', userId)
        addLog(`Baniu ${userName} PERMANENTEMENTE`)
        setShowBanModal(false)
        fetchData()
    }

    // Mutar usuário (não pode postar/comentar)
    const muteUser = async (userId: string, userName: string) => {
        const muteEnd = calculateBanEndDate(72) // 3 dias mudo
        await supabase.from('users').update({
            is_muted: true,
            muted_until: muteEnd
        }).eq('id', userId)
        addLog(`Mutou ${userName} por 3 dias`)
        setShowBanModal(false)
        fetchData()
    }

    // Desbanir usuário
    const unbanUser = async (userId: string, userName: string) => {
        await supabase.from('users').update({
            is_banned: false,
            banned_until: null,
            feed_banned_until: null,
            is_muted: false,
            muted_until: null,
            ban_reason: null
        }).eq('id', userId)
        addLog(`Desbaniu ${userName}`)
        setShowBanModal(false)
        fetchData()
    }

    // Remover pontos como punição
    const penalizePoints = async (userId: string, userName: string, points: number) => {
        const user = users.find(u => u.id === userId)
        if (!user) return
        const newPoints = Math.max(0, user.points - points)
        await supabase.from('users').update({ points: newPoints }).eq('id', userId)
        addLog(`Removeu ${points} pontos de ${userName}`)
        setShowBanModal(false)
        fetchData()
    }

    // Post actions
    const deletePost = async (postId: string) => {
        if (!confirm('Excluir este post?')) return
        await supabase.from('posts').delete().eq('id', postId)
        addLog('Excluiu um post')
        fetchData()
    }

    const featurePost = async (postId: string) => {
        await supabase.from('posts').update({ likes_count: 999 }).eq('id', postId)
        addLog('Destacou um post')
        fetchData()
    }

    // Challenge actions
    const openChallengeModal = (challenge?: Challenge) => {
        if (challenge) {
            setEditingItem(challenge)
            setChallengeForm({
                title: challenge.title, description: challenge.description,
                emoji: challenge.emoji, color: challenge.color,
                duration_days: challenge.duration_days,
                difficulty: challenge.difficulty, reward_points: challenge.reward_points,
                is_premium: challenge.is_premium || false, price: challenge.price || 0,
                checkout_url: challenge.checkout_url || '',
                gateway_product_id: challenge.gateway_product_id || ''
            })
        } else {
            setEditingItem(null)
            setChallengeForm({
                title: '', description: '', emoji: '🎯', color: '#00C853',
                duration_days: 7, difficulty: 'Fácil', reward_points: 100,
                is_premium: false, price: 0, checkout_url: '', gateway_product_id: ''
            })
        }
        setModalType('challenge')
        setShowModal(true)
    }

    const saveChallenge = async () => {
        console.log('🔄 saveChallenge chamado!', challengeForm)

        // Validação básica
        if (!challengeForm.title.trim()) {
            alert('❌ O título é obrigatório!')
            return
        }

        try {
            const now = new Date()
            const endDate = new Date(now.getTime() + challengeForm.duration_days * 24 * 60 * 60 * 1000)

            if (editingItem) {
                const { error } = await supabase.from('challenges').update({
                    ...challengeForm,
                    end_date: endDate.toISOString()
                }).eq('id', editingItem.id)

                if (error) {
                    console.error('Erro ao atualizar desafio:', error)
                    alert(`Erro ao atualizar desafio: ${error.message}`)
                    return
                }
                addLog(`Editou desafio: ${challengeForm.title}`)
                alert('✅ Desafio atualizado com sucesso!')
            } else {
                const { error } = await supabase.from('challenges').insert({
                    ...challengeForm,
                    start_date: now.toISOString(),
                    end_date: endDate.toISOString(),
                    participants_count: 0
                })

                if (error) {
                    console.error('Erro ao criar desafio:', error)
                    alert(`Erro ao criar desafio: ${error.message}`)
                    return
                }
                addLog(`Criou desafio: ${challengeForm.title}`)
                alert('✅ Desafio criado com sucesso!')
            }
            setShowModal(false)
            await fetchData()
        } catch (err: any) {
            console.error('Erro inesperado:', err)
            alert(`Erro inesperado: ${err.message || 'Tente novamente'}`)
        }
    }

    const deleteChallenge = async (id: string, title: string) => {
        if (!confirm(`Excluir desafio "${title}"?`)) return
        await supabase.from('challenges').delete().eq('id', id)
        addLog(`Excluiu desafio: ${title}`)
        fetchData()
    }

    // Module actions
    const openModuleModal = (module?: Module) => {
        if (module) {
            setEditingItem(module)
            setModuleForm({
                title: module.title,
                description: module.description,
                thumbnail: module.thumbnail,
                color: module.color,
                order: module.order
            })
        } else {
            setEditingItem(null)
            setModuleForm({ title: '', description: '', thumbnail: '', color: '#00C853', order: modules.length + 1 })
        }
        setModalType('module')
        setShowModal(true)
    }

    const saveModule = () => {
        let newModules: Module[]
        if (editingItem) {
            newModules = modules.map(m => m.id === editingItem.id ? { ...m, ...moduleForm } : m)
            addLog(`Editou módulo: ${moduleForm.title}`)
        } else {
            newModules = [...modules, { id: Date.now().toString(), ...moduleForm, lessons: [] }]
            addLog(`Criou módulo: ${moduleForm.title}`)
        }
        setModules(newModules)
        localStorage.setItem('adminModules', JSON.stringify(newModules))
        setShowModal(false)
    }

    const deleteModule = (id: string, title: string) => {
        if (!confirm(`Excluir módulo "${title}" e todas as suas aulas?`)) return
        const newModules = modules.filter(m => m.id !== id)
        setModules(newModules)
        localStorage.setItem('adminModules', JSON.stringify(newModules))
        addLog(`Excluiu módulo: ${title}`)
    }

    // Lesson actions
    const openLessonModal = (moduleId: string, lesson?: Lesson) => {
        setSelectedModuleId(moduleId)
        const module = modules.find(m => m.id === moduleId)
        if (lesson) {
            setEditingItem(lesson)
            setLessonForm({
                title: lesson.title,
                description: lesson.description,
                duration: lesson.duration,
                thumbnail: lesson.thumbnail,
                videoUrl: lesson.videoUrl || '',
                order: lesson.order,
                locked: lesson.locked || false
            })
        } else {
            setEditingItem(null)
            setLessonForm({
                title: '',
                description: '',
                duration: '15 min',
                thumbnail: '',
                videoUrl: '',
                order: (module?.lessons.length || 0) + 1,
                locked: false
            })
        }
        setModalType('lesson')
        setShowModal(true)
    }

    const saveLesson = () => {
        if (!selectedModuleId) return

        const newModules = modules.map(module => {
            if (module.id !== selectedModuleId) return module

            let newLessons: Lesson[]
            if (editingItem) {
                newLessons = module.lessons.map(l =>
                    l.id === editingItem.id ? { ...l, ...lessonForm } : l
                )
                addLog(`Editou aula: ${lessonForm.title}`)
            } else {
                newLessons = [...module.lessons, { id: Date.now().toString(), ...lessonForm }]
                addLog(`Criou aula: ${lessonForm.title}`)
            }

            return { ...module, lessons: newLessons }
        })

        setModules(newModules)
        localStorage.setItem('adminModules', JSON.stringify(newModules))
        setShowModal(false)
        setSelectedModuleId(null)
    }

    const deleteLesson = (moduleId: string, lessonId: string, title: string) => {
        if (!confirm(`Excluir aula "${title}"?`)) return

        const newModules = modules.map(module => {
            if (module.id !== moduleId) return module
            return { ...module, lessons: module.lessons.filter(l => l.id !== lessonId) }
        })

        setModules(newModules)
        localStorage.setItem('adminModules', JSON.stringify(newModules))
        addLog(`Excluiu aula: ${title}`)
    }

    // AI actions
    const openAIModal = (item?: AIResponse) => {
        if (item) {
            setEditingItem(item)
            setAiForm({ keyword: item.keyword, response: item.response })
        } else {
            setEditingItem(null)
            setAiForm({ keyword: '', response: '' })
        }
        setModalType('ai')
        setShowModal(true)
    }

    const saveAIResponse = () => {
        let newResponses: AIResponse[]
        if (editingItem) {
            newResponses = aiResponses.map(r => r.id === editingItem.id ? { ...r, ...aiForm } : r)
        } else {
            newResponses = [...aiResponses, { id: Date.now().toString(), ...aiForm }]
        }
        setAiResponses(newResponses)
        localStorage.setItem('adminAIResponses', JSON.stringify(newResponses))
        addLog(`Salvou resposta IA: ${aiForm.keyword}`)
        setShowModal(false)
    }

    const deleteAIResponse = (id: string) => {
        const newResponses = aiResponses.filter(r => r.id !== id)
        setAiResponses(newResponses)
        localStorage.setItem('adminAIResponses', JSON.stringify(newResponses))
    }

    // Workout actions
    const openWorkoutModal = (workout?: Workout) => {
        if (workout) {
            setEditingItem(workout)
            setWorkoutForm({
                title: workout.title,
                description: workout.description || '',
                type: workout.type,
                duration: workout.duration,
                difficulty: workout.difficulty,
                exercises: workout.exercises || [],
                video_url: workout.video_url || '',
                is_active: workout.is_active
            })
        } else {
            setEditingItem(null)
            setWorkoutForm({
                title: '', description: '', type: 'casa', duration: '30 min',
                difficulty: 'iniciante', exercises: [], video_url: '', is_active: true
            })
        }
        setModalType('workout')
        setShowModal(true)
    }

    const saveWorkout = async () => {
        if (!workoutForm.title.trim()) {
            alert('O título é obrigatório!')
            return
        }

        try {
            if (editingItem) {
                const { error } = await supabase.from('workouts').update({
                    title: workoutForm.title,
                    description: workoutForm.description,
                    type: workoutForm.type,
                    duration: workoutForm.duration,
                    difficulty: workoutForm.difficulty,
                    exercises: workoutForm.exercises,
                    video_url: workoutForm.video_url || null,
                    is_active: workoutForm.is_active
                }).eq('id', editingItem.id)

                if (error) throw error
                addLog(`Editou treino: ${workoutForm.title}`)
            } else {
                const { error } = await supabase.from('workouts').insert({
                    title: workoutForm.title,
                    description: workoutForm.description,
                    type: workoutForm.type,
                    duration: workoutForm.duration,
                    difficulty: workoutForm.difficulty,
                    exercises: workoutForm.exercises,
                    video_url: workoutForm.video_url || null,
                    is_active: workoutForm.is_active
                })

                if (error) throw error
                addLog(`Criou treino: ${workoutForm.title}`)
            }
            setShowModal(false)
            await fetchData()
            alert('Treino salvo com sucesso!')
        } catch (err: any) {
            console.error('Erro ao salvar treino:', err)
            alert(`Erro: ${err.message}`)
        }
    }

    const deleteWorkout = async (id: string, title: string) => {
        if (!confirm(`Excluir treino "${title}"?`)) return
        try {
            await supabase.from('workouts').delete().eq('id', id)
            addLog(`Excluiu treino: ${title}`)
            await fetchData()
        } catch (err) {
            console.error('Erro ao excluir:', err)
        }
    }

    const addExercise = () => {
        setWorkoutForm(prev => ({
            ...prev,
            exercises: [...prev.exercises, { nome: '', series: 3, repeticoes: '12x' }]
        }))
    }

    const updateExercise = (index: number, field: keyof WorkoutExercise, value: string | number) => {
        setWorkoutForm(prev => ({
            ...prev,
            exercises: prev.exercises.map((ex, i) =>
                i === index ? { ...ex, [field]: value } : ex
            )
        }))
    }

    const removeExercise = (index: number) => {
        setWorkoutForm(prev => ({
            ...prev,
            exercises: prev.exercises.filter((_, i) => i !== index)
        }))
    }

    // Settings
    const saveSettings = () => {
        localStorage.setItem('appSettings', JSON.stringify(settings))
        addLog('Salvou configurações do app')
        alert('Configurações salvas!')
    }

    // Export
    const exportData = (type: 'users' | 'posts' | 'challenges' | 'modules') => {
        const data = type === 'users' ? users : type === 'posts' ? posts : type === 'challenges' ? challenges : modules
        const json = JSON.stringify(data, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.json`
        a.click()
        addLog(`Exportou dados: ${type}`)
    }

    // Stats
    const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0)
    const stats = {
        totalUsers: users.length,
        totalPosts: posts.length,
        totalChallenges: challenges.length,
        totalModules: modules.length,
        totalLessons: totalLessons,
        activeUsers: users.filter(u => u.streak_days > 0).length,
        totalPoints: users.reduce((sum, u) => sum + (u.points || 0), 0),
        avgPoints: users.length ? Math.round(users.reduce((sum, u) => sum + (u.points || 0), 0) / users.length) : 0,
        totalLikes: posts.reduce((sum, p) => sum + (p.likes_count || 0), 0)
    }

    // Filter
    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (!isAdmin) {
        return (
            <div className="admin-denied">
                <span>🔒</span>
                <h2>Acesso Negado</h2>
                <p>Você não tem permissão para acessar esta área.</p>
            </div>
        )
    }

    return (
        <div className="admin-panel">
            <header className="admin-header">
                <div>
                    <h1>⚙️ Painel Admin</h1>
                    <p className="admin-subtitle">Gerencie todo o aplicativo</p>
                </div>
                <span className="admin-badge">ADMIN</span>
            </header>

            {/* Tabs */}
            <div className="admin-tabs">
                {[
                    { id: 'dashboard', label: '📊 Dashboard' },
                    { id: 'users', label: '👥 Usuários' },
                    { id: 'posts', label: '📝 Posts' },
                    { id: 'challenges', label: '🏆 Desafios' },
                    { id: 'modules', label: '📚 Módulos/Aulas' },
                    { id: 'workouts', label: '💪 Treinos' },
                    { id: 'ai', label: '🤖 IA' },
                    { id: 'settings', label: '⚙️ Config' },
                    { id: 'logs', label: '📋 Logs' },
                    { id: 'payments', label: '💳 Pagamentos' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={activeTab === tab.id ? 'active' : ''}
                        onClick={() => setActiveTab(tab.id as any)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="admin-content">
                {loading ? (
                    <div className="admin-loading">🔄 Carregando...</div>
                ) : (
                    <>
                        {/* Dashboard */}
                        {activeTab === 'dashboard' && (
                            <div className="dashboard-section">
                                <div className="stats-grid-admin">
                                    <div className="stat-card-admin primary">
                                        <span className="stat-number">{stats.totalUsers}</span>
                                        <span className="stat-label">Usuários</span>
                                        <span className="stat-icon">👥</span>
                                    </div>
                                    <div className="stat-card-admin success">
                                        <span className="stat-number">{stats.activeUsers}</span>
                                        <span className="stat-label">Ativos</span>
                                        <span className="stat-icon">🔥</span>
                                    </div>
                                    <div className="stat-card-admin info">
                                        <span className="stat-number">{stats.totalPosts}</span>
                                        <span className="stat-label">Posts</span>
                                        <span className="stat-icon">📝</span>
                                    </div>
                                    <div className="stat-card-admin warning">
                                        <span className="stat-number">{stats.totalChallenges}</span>
                                        <span className="stat-label">Desafios</span>
                                        <span className="stat-icon">🏆</span>
                                    </div>
                                    <div className="stat-card-admin purple">
                                        <span className="stat-number">{stats.totalModules}</span>
                                        <span className="stat-label">Módulos</span>
                                        <span className="stat-icon">📚</span>
                                    </div>
                                    <div className="stat-card-admin teal">
                                        <span className="stat-number">{stats.totalLessons}</span>
                                        <span className="stat-label">Aulas</span>
                                        <span className="stat-icon">🎬</span>
                                    </div>
                                    <div className="stat-card-admin pink">
                                        <span className="stat-number">{stats.totalLikes}</span>
                                        <span className="stat-label">Likes</span>
                                        <span className="stat-icon">❤️</span>
                                    </div>
                                    <div className="stat-card-admin orange">
                                        <span className="stat-number">{stats.totalPoints.toLocaleString()}</span>
                                        <span className="stat-label">Pontos Total</span>
                                        <span className="stat-icon">⭐</span>
                                    </div>
                                </div>

                                <div className="dashboard-grid">
                                    <div className="dashboard-card">
                                        <h3>🏅 Top Usuários</h3>
                                        {users.sort((a, b) => b.points - a.points).slice(0, 5).map((u, i) => (
                                            <div key={u.id} className="top-item">
                                                <span className="rank">{i + 1}º</span>
                                                <span className="name">{u.name}</span>
                                                <span className="value">{u.points} pts</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="dashboard-card">
                                        <h3>📝 Posts Recentes</h3>
                                        {posts.slice(0, 5).map(p => (
                                            <div key={p.id} className="recent-item">
                                                <span className="author">{p.user?.name}</span>
                                                <span className="preview">{p.content.substring(0, 30)}...</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="quick-actions">
                                    <h3>⚡ Ações Rápidas</h3>
                                    <div className="action-buttons">
                                        <button onClick={() => { setActiveTab('challenges'); openChallengeModal(); }}>+ Novo Desafio</button>
                                        <button onClick={() => { setActiveTab('modules'); openModuleModal(); }}>+ Novo Módulo</button>
                                        <button onClick={() => exportData('users')}>📥 Exportar Usuários</button>
                                        <button onClick={() => exportData('modules')}>📥 Exportar Módulos</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Users */}
                        {activeTab === 'users' && (
                            <div className="section-admin">
                                <div className="section-header-admin">
                                    <h3>👥 Gerenciar Usuários ({users.length})</h3>
                                    <div className="header-actions">
                                        <input
                                            type="search"
                                            placeholder="Buscar usuário..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="search-input"
                                        />
                                        <button className="btn-export" onClick={() => exportData('users')}>📥 Exportar</button>
                                    </div>
                                </div>
                                <div className="admin-table-container">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Nome</th>
                                                <th>Email</th>
                                                <th>Status</th>
                                                <th>Pontos</th>
                                                <th>Streak</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.map(user => {
                                                const isBanned = (user as any).is_banned ||
                                                    ((user as any).banned_until && new Date((user as any).banned_until) > new Date())
                                                const isFeedBanned = (user as any).feed_banned_until &&
                                                    new Date((user as any).feed_banned_until) > new Date()
                                                const isMuted = (user as any).is_muted ||
                                                    ((user as any).muted_until && new Date((user as any).muted_until) > new Date())

                                                return (
                                                    <tr key={user.id} className={isBanned ? 'row-banned' : ''}>
                                                        <td>
                                                            {user.name}
                                                            {isBanned && <span className="status-badge banned">🚫</span>}
                                                            {isMuted && !isBanned && <span className="status-badge muted">🔇</span>}
                                                        </td>
                                                        <td className="email-cell">{user.email}</td>
                                                        <td>
                                                            {isBanned ? (
                                                                <span className="badge status-banned">Banido</span>
                                                            ) : isFeedBanned ? (
                                                                <span className="badge status-feed-banned">Feed 🚫</span>
                                                            ) : isMuted ? (
                                                                <span className="badge status-muted">Mudo</span>
                                                            ) : (
                                                                <span className="badge status-active">Ativo</span>
                                                            )}
                                                        </td>
                                                        <td><span className="badge points">{user.points}</span></td>
                                                        <td><span className="badge streak">🔥 {user.streak_days}</span></td>
                                                        <td className="actions-cell">
                                                            <button className="btn-icon edit" onClick={() => openUserModal(user)} title="Editar">✏️</button>
                                                            <button className="btn-icon warn" onClick={() => openBanModal(user)} title="Gerenciar Ban">⚖️</button>
                                                            <button className="btn-icon delete" onClick={() => deleteUser(user.id, user.name)} title="Excluir" disabled={ADMIN_EMAILS.includes(user.email || '')}>🗑️</button>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Posts */}
                        {activeTab === 'posts' && (
                            <div className="section-admin">
                                <div className="section-header-admin">
                                    <h3>📝 Gerenciar Posts ({posts.length})</h3>
                                    <button className="btn-export" onClick={() => exportData('posts')}>📥 Exportar</button>
                                </div>
                                <div className="admin-table-container">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Autor</th>
                                                <th>Conteúdo</th>
                                                <th>Likes</th>
                                                <th>Comentários</th>
                                                <th>Data</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {posts.map(post => (
                                                <tr key={post.id}>
                                                    <td>{post.user?.name || 'Anônimo'}</td>
                                                    <td className="content-cell">{post.content.substring(0, 50)}...</td>
                                                    <td><span className="badge likes">❤️ {post.likes_count}</span></td>
                                                    <td><span className="badge comments">💬 {post.comments_count}</span></td>
                                                    <td>{new Date(post.created_at).toLocaleDateString('pt-BR')}</td>
                                                    <td className="actions-cell">
                                                        <button className="btn-icon star" onClick={() => featurePost(post.id)} title="Destacar">⭐</button>
                                                        <button className="btn-icon delete" onClick={() => deletePost(post.id)} title="Excluir">🗑️</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Challenges */}
                        {activeTab === 'challenges' && (
                            <div className="section-admin">
                                <div className="section-header-admin">
                                    <h3>🏆 Gerenciar Desafios ({challenges.length})</h3>
                                    <button className="btn-add" onClick={() => openChallengeModal()}>+ Novo Desafio</button>
                                </div>
                                <div className="cards-grid">
                                    {challenges.map(challenge => (
                                        <div key={challenge.id} className={`item-card ${challenge.is_premium ? 'premium-card' : ''}`} style={{ borderColor: challenge.color }}>
                                            <div className="item-emoji" style={{ background: `${challenge.color}20` }}>
                                                {challenge.emoji}
                                                {challenge.is_premium && <span className="premium-badge-small">💎</span>}
                                            </div>
                                            <div className="item-info">
                                                <h4>
                                                    {challenge.title}
                                                    {challenge.is_premium && <span className="premium-tag">PREMIUM</span>}
                                                </h4>
                                                <p>{challenge.description}</p>
                                                <div className="item-meta">
                                                    <span className={`difficulty ${challenge.difficulty.toLowerCase()}`}>{challenge.difficulty}</span>
                                                    <span>{challenge.duration_days} dias</span>
                                                    <span>🏆 {challenge.reward_points} pts</span>
                                                    <span>👥 {challenge.participants_count}</span>
                                                    {challenge.is_premium && challenge.price && challenge.price > 0 ? (
                                                        <span className="price-tag">💰 R$ {challenge.price.toFixed(2)}</span>
                                                    ) : challenge.is_premium ? (
                                                        <span className="price-tag diamond">💎 Diamond</span>
                                                    ) : (
                                                        <span className="price-tag free">🆓 Grátis</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="item-actions">
                                                <button onClick={() => openChallengeModal(challenge)}>✏️</button>
                                                <button onClick={() => deleteChallenge(challenge.id, challenge.title)}>🗑️</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Modules & Lessons */}
                        {activeTab === 'modules' && (
                            <div className="section-admin">
                                <div className="section-header-admin">
                                    <h3>📚 Gerenciar Módulos e Aulas</h3>
                                    <button className="btn-add" onClick={() => openModuleModal()}>+ Novo Módulo</button>
                                </div>
                                <p className="section-hint">
                                    Configure módulos e aulas da área de membros estilo Netflix.
                                    Cada módulo contém várias aulas.
                                </p>

                                <div className="modules-admin-list">
                                    {modules.map((module, mIndex) => (
                                        <div key={module.id} className="module-admin-card" style={{ borderLeftColor: module.color }}>
                                            <div className="module-admin-header">
                                                <div className="module-admin-thumb">
                                                    {module.thumbnail ? (
                                                        <img src={module.thumbnail} alt={module.title} />
                                                    ) : (
                                                        <div className="module-placeholder">📚</div>
                                                    )}
                                                </div>
                                                <div className="module-admin-info">
                                                    <div className="module-admin-title">
                                                        <span className="module-number-badge" style={{ background: module.color }}>
                                                            Módulo {mIndex + 1}
                                                        </span>
                                                        <h4>{module.title}</h4>
                                                    </div>
                                                    <p>{module.description}</p>
                                                    <div className="module-admin-meta">
                                                        <span>{module.lessons.length} aulas</span>
                                                        <span style={{ color: module.color }}>●</span>
                                                        <span>Ordem: {module.order}</span>
                                                    </div>
                                                </div>
                                                <div className="module-admin-actions">
                                                    <button className="btn-icon edit" onClick={() => openModuleModal(module)} title="Editar Módulo">✏️</button>
                                                    <button className="btn-icon delete" onClick={() => deleteModule(module.id, module.title)} title="Excluir Módulo">🗑️</button>
                                                </div>
                                            </div>

                                            <div className="module-lessons-admin">
                                                <div className="lessons-admin-header">
                                                    <span>Aulas do Módulo</span>
                                                    <button className="btn-add-small" onClick={() => openLessonModal(module.id)}>
                                                        + Adicionar Aula
                                                    </button>
                                                </div>

                                                {module.lessons.length === 0 ? (
                                                    <p className="no-lessons">Nenhuma aula cadastrada. Clique em "Adicionar Aula".</p>
                                                ) : (
                                                    <div className="lessons-admin-list">
                                                        {module.lessons.map((lesson, lIndex) => (
                                                            <div key={lesson.id} className="lesson-admin-item">
                                                                <span className="lesson-order">{lIndex + 1}</span>
                                                                <div className="lesson-admin-thumb">
                                                                    {lesson.thumbnail ? (
                                                                        <img src={lesson.thumbnail} alt={lesson.title} />
                                                                    ) : (
                                                                        <div className="lesson-placeholder">🎬</div>
                                                                    )}
                                                                </div>
                                                                <div className="lesson-admin-info">
                                                                    <h5>{lesson.title}</h5>
                                                                    <p>{lesson.description}</p>
                                                                    <div className="lesson-admin-meta">
                                                                        <span>⏱️ {lesson.duration}</span>
                                                                        {lesson.videoUrl && <span className="has-video">🎥 Vídeo</span>}
                                                                        {lesson.locked && <span className="is-locked">🔒 Bloqueada</span>}
                                                                    </div>
                                                                </div>
                                                                <div className="lesson-admin-actions">
                                                                    <button onClick={() => openLessonModal(module.id, lesson)}>✏️</button>
                                                                    <button onClick={() => deleteLesson(module.id, lesson.id, lesson.title)}>🗑️</button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Workouts */}
                        {activeTab === 'workouts' && (
                            <div className="section-admin">
                                <div className="section-header-admin">
                                    <h3>💪 Treinos do Plano Individual ({workouts.length})</h3>
                                    <button className="btn-add" onClick={() => openWorkoutModal()}>+ Novo Treino</button>
                                </div>
                                <p className="section-hint">Cadastre treinos que serão sorteados para os planos individuais das usuárias</p>

                                <div className="workouts-admin-list">
                                    {workouts.length === 0 ? (
                                        <div className="empty-state-admin">
                                            <p>Nenhum treino cadastrado ainda.</p>
                                            <button className="btn-add" onClick={() => openWorkoutModal()}>Criar Primeiro Treino</button>
                                        </div>
                                    ) : (
                                        workouts.map(workout => (
                                            <div key={workout.id} className={`workout-admin-card ${!workout.is_active ? 'inactive' : ''}`}>
                                                <div className="workout-admin-header">
                                                    <div className="workout-admin-title">
                                                        <h4>{workout.title}</h4>
                                                        <div className="workout-admin-badges">
                                                            <span className={`badge type-${workout.type}`}>
                                                                {workout.type === 'casa' ? '🏠 Casa' : workout.type === 'academia' ? '🏋️ Academia' : '🔄 Ambos'}
                                                            </span>
                                                            <span className={`badge difficulty-${workout.difficulty}`}>
                                                                {workout.difficulty === 'iniciante' ? '🟢 Iniciante' : workout.difficulty === 'intermediario' ? '🟡 Intermediário' : '🔴 Avançado'}
                                                            </span>
                                                            <span className="badge duration">⏱ {workout.duration}</span>
                                                            {!workout.is_active && <span className="badge inactive">❌ Inativo</span>}
                                                        </div>
                                                    </div>
                                                    <div className="workout-admin-actions">
                                                        <button className="btn-icon edit" onClick={() => openWorkoutModal(workout)} title="Editar">✏️</button>
                                                        <button className="btn-icon delete" onClick={() => deleteWorkout(workout.id, workout.title)} title="Excluir">🗑️</button>
                                                    </div>
                                                </div>
                                                {workout.description && <p className="workout-admin-desc">{workout.description}</p>}
                                                {workout.exercises && workout.exercises.length > 0 && (
                                                    <div className="workout-admin-exercises">
                                                        <strong>Exercícios ({workout.exercises.length}):</strong>
                                                        <ul>
                                                            {workout.exercises.slice(0, 3).map((ex, i) => (
                                                                <li key={i}>{ex.nome} - {ex.series}x {ex.repeticoes}</li>
                                                            ))}
                                                            {workout.exercises.length > 3 && <li>... e mais {workout.exercises.length - 3}</li>}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* AI */}
                        {activeTab === 'ai' && (
                            <div className="section-admin">
                                <div className="section-header-admin">
                                    <h3>🤖 Respostas da IA ({aiResponses.length})</h3>
                                    <button className="btn-add" onClick={() => openAIModal()}>+ Nova Resposta</button>
                                </div>
                                <p className="section-hint">Configure palavras-chave e respostas automáticas da IA</p>
                                <div className="ai-list">
                                    {aiResponses.map(item => (
                                        <div key={item.id} className="ai-item">
                                            <div className="ai-keyword">🔑 {item.keyword}</div>
                                            <div className="ai-response">{item.response.substring(0, 100)}...</div>
                                            <div className="ai-actions">
                                                <button onClick={() => openAIModal(item)}>✏️</button>
                                                <button onClick={() => deleteAIResponse(item.id)}>🗑️</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Settings */}
                        {activeTab === 'settings' && (
                            <div className="section-admin">
                                <h3>⚙️ Configurações do App</h3>
                                <div className="settings-form">
                                    <div className="settings-section">
                                        <h4>🏠 Configurações Gerais</h4>
                                        <div className="form-group">
                                            <label>Nome do App</label>
                                            <input type="text" value={settings.appName} onChange={e => setSettings({ ...settings, appName: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Título de Boas-vindas</label>
                                            <input type="text" value={settings.welcomeTitle} onChange={e => setSettings({ ...settings, welcomeTitle: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Subtítulo</label>
                                            <input type="text" value={settings.welcomeSubtitle} onChange={e => setSettings({ ...settings, welcomeSubtitle: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="settings-section">
                                        <h4>🎬 Banner da Área de Membros</h4>
                                        <div className="form-group">
                                            <label>URL da Imagem de Fundo</label>
                                            <input
                                                type="text"
                                                value={settings.heroBannerImage}
                                                onChange={e => setSettings({ ...settings, heroBannerImage: e.target.value })}
                                                placeholder="https://..."
                                            />
                                            <span className="form-hint">Recomendado: 1920x1080 pixels</span>
                                        </div>
                                        <div className="form-group">
                                            <label>Título do Banner</label>
                                            <input
                                                type="text"
                                                value={settings.heroTitle}
                                                onChange={e => setSettings({ ...settings, heroTitle: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Subtítulo do Banner</label>
                                            <textarea
                                                value={settings.heroSubtitle}
                                                onChange={e => setSettings({ ...settings, heroSubtitle: e.target.value })}
                                                rows={2}
                                            />
                                        </div>
                                    </div>

                                    <div className="settings-section">
                                        <h4>🎨 Cores</h4>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Cor Primária</label>
                                                <input type="color" value={settings.primaryColor} onChange={e => setSettings({ ...settings, primaryColor: e.target.value })} />
                                            </div>
                                            <div className="form-group">
                                                <label>Cor Secundária</label>
                                                <input type="color" value={settings.secondaryColor} onChange={e => setSettings({ ...settings, secondaryColor: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    <button className="btn-primary btn-save" onClick={saveSettings}>💾 Salvar Configurações</button>
                                </div>
                            </div>
                        )}

                        {/* Logs */}
                        {activeTab === 'logs' && (
                            <div className="section-admin">
                                <h3>📋 Logs de Atividade</h3>
                                <div className="logs-list">
                                    {activityLogs.length === 0 ? (
                                        <p className="empty-logs">Nenhuma atividade registrada ainda</p>
                                    ) : (
                                        activityLogs.map((log, i) => (
                                            <div key={i} className="log-item">
                                                <span className="log-time">{log.time.toLocaleTimeString('pt-BR')}</span>
                                                <span className="log-user">{log.user}</span>
                                                <span className="log-action">{log.action}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Pagamentos */}
                        {activeTab === 'payments' && (
                            <PaymentsPage />
                        )}
                    </>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowModal(false)}>×</button>

                        {/* Challenge Modal */}
                        {modalType === 'challenge' && (
                            <>
                                <h3>{editingItem ? '✏️ Editar Desafio' : '🆕 Novo Desafio'}</h3>
                                <div className="form-group"><label>Título</label><input value={challengeForm.title} onChange={e => setChallengeForm({ ...challengeForm, title: e.target.value })} /></div>
                                <div className="form-group"><label>Descrição</label><textarea value={challengeForm.description} onChange={e => setChallengeForm({ ...challengeForm, description: e.target.value })} rows={3} /></div>
                                <div className="form-row">
                                    <div className="form-group"><label>Emoji</label><input value={challengeForm.emoji} onChange={e => setChallengeForm({ ...challengeForm, emoji: e.target.value })} /></div>
                                    <div className="form-group"><label>Cor</label><input type="color" value={challengeForm.color} onChange={e => setChallengeForm({ ...challengeForm, color: e.target.value })} /></div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group"><label>Duração (dias)</label><input type="number" value={challengeForm.duration_days} onChange={e => setChallengeForm({ ...challengeForm, duration_days: parseInt(e.target.value) || 7 })} /></div>
                                    <div className="form-group"><label>Pontos</label><input type="number" value={challengeForm.reward_points} onChange={e => setChallengeForm({ ...challengeForm, reward_points: parseInt(e.target.value) || 100 })} /></div>
                                </div>
                                <div className="form-group">
                                    <label>Dificuldade</label>
                                    <select value={challengeForm.difficulty} onChange={e => setChallengeForm({ ...challengeForm, difficulty: e.target.value as any })}>
                                        <option value="Fácil">Fácil</option><option value="Intermediário">Intermediário</option><option value="Avançado">Avançado</option>
                                    </select>
                                </div>

                                {/* Seção Premium */}
                                <div className="form-section premium-section">
                                    <h4>💎 Configuração Premium</h4>
                                    <div className="form-group checkbox-group">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={challengeForm.is_premium}
                                                onChange={e => setChallengeForm({ ...challengeForm, is_premium: e.target.checked })}
                                            />
                                            <span className="checkmark"></span>
                                            Desafio Premium (Pago)
                                        </label>
                                    </div>
                                    {challengeForm.is_premium && (
                                        <>
                                            <div className="form-group">
                                                <label>💰 Preço (R$)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={challengeForm.price}
                                                    onChange={e => setChallengeForm({ ...challengeForm, price: parseFloat(e.target.value) || 0 })}
                                                    placeholder="Ex: 29.90"
                                                />
                                                <span className="form-hint">Deixe 0 para gratuito (usuários Diamond têm acesso)</span>
                                            </div>
                                            <div className="form-group">
                                                <label>🔗 Link de Pagamento (Checkout)</label>
                                                <input
                                                    type="url"
                                                    value={challengeForm.checkout_url}
                                                    onChange={e => setChallengeForm({ ...challengeForm, checkout_url: e.target.value })}
                                                    placeholder="https://pay.kiwify.com.br/..."
                                                />
                                                <span className="form-hint">Cole aqui o link do seu gateway (Mercado Pago, Stripe, Kiwify, etc)</span>
                                            </div>
                                            <div className="form-group">
                                                <label>🔑 ID do Produto (Webhook)</label>
                                                <input
                                                    value={challengeForm.gateway_product_id}
                                                    onChange={e => setChallengeForm({ ...challengeForm, gateway_product_id: e.target.value })}
                                                    placeholder="Ex: kiwify_prod_123..."
                                                />
                                                <span className="form-hint">ID único do produto na plataforma de pagamento (para liberação automática)</span>
                                            </div>
                                        </>
                                    )}
                                    {!challengeForm.is_premium && (
                                        <p className="form-info">🆓 Este desafio será gratuito para todos os usuários</p>
                                    )}
                                </div>

                                <button className="btn-primary btn-save" onClick={saveChallenge}>💾 Salvar</button>
                            </>
                        )}

                        {/* Module Modal */}
                        {modalType === 'module' && (
                            <>
                                <h3>{editingItem ? '✏️ Editar Módulo' : '🆕 Novo Módulo'}</h3>
                                <div className="form-group">
                                    <label>Título do Módulo</label>
                                    <input value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} placeholder="Ex: Fundamentos do Emagrecimento" />
                                </div>
                                <div className="form-group">
                                    <label>Descrição</label>
                                    <textarea value={moduleForm.description} onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })} rows={3} placeholder="Breve descrição do módulo..." />
                                </div>
                                <div className="form-group">
                                    <label>URL da Imagem de Capa</label>
                                    <input value={moduleForm.thumbnail} onChange={e => setModuleForm({ ...moduleForm, thumbnail: e.target.value })} placeholder="https://images.unsplash.com/..." />
                                    <span className="form-hint">Recomendado: 600x400 pixels (proporção 16:10)</span>
                                </div>
                                {moduleForm.thumbnail && (
                                    <div className="image-preview">
                                        <img src={moduleForm.thumbnail} alt="Preview" />
                                    </div>
                                )}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Cor do Módulo</label>
                                        <input type="color" value={moduleForm.color} onChange={e => setModuleForm({ ...moduleForm, color: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label>Ordem</label>
                                        <input type="number" value={moduleForm.order} onChange={e => setModuleForm({ ...moduleForm, order: parseInt(e.target.value) || 1 })} />
                                    </div>
                                </div>
                                <button className="btn-primary btn-save" onClick={saveModule}>💾 Salvar Módulo</button>
                            </>
                        )}

                        {/* Lesson Modal */}
                        {modalType === 'lesson' && (
                            <>
                                <h3>{editingItem ? '✏️ Editar Aula' : '🆕 Nova Aula'}</h3>
                                <div className="form-group">
                                    <label>Título da Aula</label>
                                    <input value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="Ex: Bem-vindo à sua Transformação" />
                                </div>
                                <div className="form-group">
                                    <label>Descrição</label>
                                    <textarea value={lessonForm.description} onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })} rows={2} placeholder="Breve descrição da aula..." />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Duração</label>
                                        <input value={lessonForm.duration} onChange={e => setLessonForm({ ...lessonForm, duration: e.target.value })} placeholder="15 min" />
                                    </div>
                                    <div className="form-group">
                                        <label>Ordem</label>
                                        <input type="number" value={lessonForm.order} onChange={e => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) || 1 })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>URL da Thumbnail</label>
                                    <input value={lessonForm.thumbnail} onChange={e => setLessonForm({ ...lessonForm, thumbnail: e.target.value })} placeholder="https://images.unsplash.com/..." />
                                    <span className="form-hint">Recomendado: 400x225 pixels (proporção 16:9)</span>
                                </div>
                                {lessonForm.thumbnail && (
                                    <div className="image-preview small">
                                        <img src={lessonForm.thumbnail} alt="Preview" />
                                    </div>
                                )}
                                <div className="form-group">
                                    <label>Código Embed do Vídeo</label>
                                    <textarea
                                        value={lessonForm.videoUrl}
                                        onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                                        placeholder='Cole aqui: <iframe src="https://..." ...></iframe> ou URL do YouTube/Vimeo'
                                        rows={4}
                                    />
                                    <span className="form-hint">Suporta: YouTube, Vimeo, iframe embed ou URL direta de vídeo</span>
                                </div>
                                <div className="form-group checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={lessonForm.locked}
                                            onChange={e => setLessonForm({ ...lessonForm, locked: e.target.checked })}
                                        />
                                        <span>🔒 Aula Bloqueada (requer upgrade)</span>
                                    </label>
                                </div>
                                <button className="btn-primary btn-save" onClick={saveLesson}>💾 Salvar Aula</button>
                            </>
                        )}

                        {/* AI Modal */}
                        {modalType === 'ai' && (
                            <>
                                <h3>{editingItem ? '✏️ Editar Resposta' : '🆕 Nova Resposta IA'}</h3>
                                <div className="form-group"><label>Palavra-chave</label><input value={aiForm.keyword} onChange={e => setAiForm({ ...aiForm, keyword: e.target.value })} placeholder="Ex: dieta, treino, jejum" /></div>
                                <div className="form-group"><label>Resposta</label><textarea value={aiForm.response} onChange={e => setAiForm({ ...aiForm, response: e.target.value })} rows={6} placeholder="Resposta completa da IA..." /></div>
                                <button className="btn-primary btn-save" onClick={saveAIResponse}>💾 Salvar</button>
                            </>
                        )}

                        {/* User Modal */}
                        {modalType === 'user' && editingItem && (
                            <>
                                <h3>✏️ Editar Usuário</h3>
                                <div className="form-group"><label>Nome</label><input value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} /></div>
                                <div className="form-row">
                                    <div className="form-group"><label>Pontos</label><input type="number" value={userForm.points} onChange={e => setUserForm({ ...userForm, points: parseInt(e.target.value) || 0 })} /></div>
                                    <div className="form-group"><label>Streak</label><input type="number" value={userForm.streak_days} onChange={e => setUserForm({ ...userForm, streak_days: parseInt(e.target.value) || 0 })} /></div>
                                </div>
                                <div className="form-group"><label>Meta de Peso (kg)</label><input type="number" value={userForm.weight_goal} onChange={e => setUserForm({ ...userForm, weight_goal: parseFloat(e.target.value) || 0 })} /></div>
                                <button className="btn-primary btn-save" onClick={saveUser}>💾 Salvar</button>
                            </>
                        )}

                        {/* Workout Modal */}
                        {modalType === 'workout' && (
                            <>
                                <h3>{editingItem ? '✏️ Editar Treino' : '🆕 Novo Treino'}</h3>
                                <div className="form-group">
                                    <label>Título do Treino*</label>
                                    <input
                                        value={workoutForm.title}
                                        onChange={e => setWorkoutForm({ ...workoutForm, title: e.target.value })}
                                        placeholder="Ex: Treino HIIT em Casa"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Descrição</label>
                                    <textarea
                                        value={workoutForm.description}
                                        onChange={e => setWorkoutForm({ ...workoutForm, description: e.target.value })}
                                        rows={2}
                                        placeholder="Breve descrição do treino..."
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Tipo</label>
                                        <select value={workoutForm.type} onChange={e => setWorkoutForm({ ...workoutForm, type: e.target.value as any })}>
                                            <option value="casa">🏠 Em Casa</option>
                                            <option value="academia">🏋️ Academia</option>
                                            <option value="ambos">🔄 Ambos</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Dificuldade</label>
                                        <select value={workoutForm.difficulty} onChange={e => setWorkoutForm({ ...workoutForm, difficulty: e.target.value as any })}>
                                            <option value="iniciante">🟢 Iniciante</option>
                                            <option value="intermediario">🟡 Intermediário</option>
                                            <option value="avancado">🔴 Avançado</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Duração</label>
                                        <input
                                            value={workoutForm.duration}
                                            onChange={e => setWorkoutForm({ ...workoutForm, duration: e.target.value })}
                                            placeholder="Ex: 30 min"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>URL do Vídeo (opcional)</label>
                                        <input
                                            value={workoutForm.video_url}
                                            onChange={e => setWorkoutForm({ ...workoutForm, video_url: e.target.value })}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <div className="exercises-header">
                                        <label>Exercícios</label>
                                        <button type="button" className="btn-add-small" onClick={addExercise}>+ Adicionar</button>
                                    </div>
                                    {workoutForm.exercises.length === 0 ? (
                                        <p className="no-exercises">Nenhum exercício adicionado. Clique em "+ Adicionar".</p>
                                    ) : (
                                        <div className="exercises-form-list">
                                            {workoutForm.exercises.map((ex, index) => (
                                                <div key={index} className="exercise-form-item">
                                                    <input
                                                        placeholder="Nome do exercício"
                                                        value={ex.nome}
                                                        onChange={e => updateExercise(index, 'nome', e.target.value)}
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Séries"
                                                        value={ex.series}
                                                        onChange={e => updateExercise(index, 'series', parseInt(e.target.value) || 0)}
                                                        style={{ width: '70px' }}
                                                    />
                                                    <input
                                                        placeholder="Reps"
                                                        value={ex.repeticoes}
                                                        onChange={e => updateExercise(index, 'repeticoes', e.target.value)}
                                                        style={{ width: '80px' }}
                                                    />
                                                    <button type="button" className="btn-remove-exercise" onClick={() => removeExercise(index)}>🗑️</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="form-group checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={workoutForm.is_active}
                                            onChange={e => setWorkoutForm({ ...workoutForm, is_active: e.target.checked })}
                                        />
                                        <span>✅ Treino Ativo (disponível para sorteio)</span>
                                    </label>
                                </div>

                                <button className="btn-primary btn-save" onClick={saveWorkout}>💾 Salvar Treino</button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Ban Modal */}
            {showBanModal && banningUser && (
                <div className="modal-backdrop" onClick={() => setShowBanModal(false)}>
                    <div className="modal-content ban-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowBanModal(false)}>×</button>

                        <h3>⚖️ Gerenciar Usuário</h3>
                        <div className="ban-user-info">
                            <span className="ban-user-name">{banningUser.name}</span>
                            <span className="ban-user-email">{banningUser.email}</span>
                        </div>

                        <div className="ban-options">
                            <h4>🔇 Silenciar</h4>
                            <button className="ban-btn mute" onClick={() => muteUser(banningUser.id, banningUser.name)}>
                                🔇 Mutar por 3 dias
                                <span className="ban-description">Não pode postar ou comentar</span>
                            </button>

                            <h4>🚫 Banir do Feed</h4>
                            <button className="ban-btn feed-ban" onClick={() => banFromFeed(banningUser.id, banningUser.name)}>
                                📰 Banido do Feed por 3 dias
                                <span className="ban-description">Não pode ver ou postar no feed</span>
                            </button>

                            <h4>⛔ Banir do App</h4>
                            <button className="ban-btn warning" onClick={() => banFromApp24h(banningUser.id, banningUser.name)}>
                                ⏰ Ban por 24 horas
                                <span className="ban-description">Suspensão temporária do app</span>
                            </button>
                            <button className="ban-btn danger" onClick={() => banFromApp7d(banningUser.id, banningUser.name)}>
                                📅 Ban por 7 dias
                                <span className="ban-description">Suspensão de uma semana</span>
                            </button>
                            <button className="ban-btn permanent" onClick={() => banPermanently(banningUser.id, banningUser.name)}>
                                ⛔ Ban PERMANENTE
                                <span className="ban-description">Acesso bloqueado indefinidamente</span>
                            </button>

                            <h4>💰 Penalidades</h4>
                            <div className="penalty-buttons">
                                <button className="ban-btn penalty" onClick={() => penalizePoints(banningUser.id, banningUser.name, 50)}>
                                    -50 pts
                                </button>
                                <button className="ban-btn penalty" onClick={() => penalizePoints(banningUser.id, banningUser.name, 100)}>
                                    -100 pts
                                </button>
                                <button className="ban-btn penalty" onClick={() => penalizePoints(banningUser.id, banningUser.name, 500)}>
                                    -500 pts
                                </button>
                            </div>

                            <h4>✅ Restaurar</h4>
                            <button className="ban-btn success" onClick={() => unbanUser(banningUser.id, banningUser.name)}>
                                ✅ Remover todos os bans
                                <span className="ban-description">Restaurar acesso completo</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
