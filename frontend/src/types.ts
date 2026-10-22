export type UserRole = 'user' | 'admin'

export type UserProfile = {
  id: string
  email: string
  full_name: string
  role: UserRole
  age_group: string
}

export type Category = {
  id: string
  slug: string
  localizations: Record<string, { title: string; description?: string }>
}

export type MethodologyPassport = {
  name: string
  version: string
  evidence_status: 'validated' | 'digital' | 'educational' | 'pending_review'
  source: string | null
  limitations: string
  warnings: string[]
  license_info?: string | null
  device_conditions?: string[]
}

export type TestItem = {
  id: string
  category_id: string
  slug: string
  type: 'validated_screening' | 'digital_check' | 'educational_exercise' | 'symptom_questionnaire'
  status: 'draft' | 'published' | 'blocked'
  guest_allowed: boolean
  min_age: number
  max_age: number | null
  localizations: Record<string, { title: string; description?: string }>
  methodology: MethodologyPassport | null
}

export type QuestionOption = {
  value: string
  label?: string
  localizations?: Record<string, string>
}

export type Question = {
  id: string
  text?: string
  type?: string
  options?: QuestionOption[]
  localizations?: Record<string, { text: string; options?: Record<string, string> }>
}

export type Attempt = {
  id: string
  current_question: Question | null
}

export type Completion = {
  id: string
  result?: {
    summary?: string
    message?: string
    metrics?: Record<string, unknown>
  }
}

export type SavedResult = {
  id: string
  test_slug: string
  test_type: string
  test_title: string
  methodology_name: string
  methodology_version: string
  definition_version: string
  compatibility_conditions: Record<string, unknown>
  result: Record<string, unknown>
  limitations: string
  warnings: string[]
  completed_at: string
}

export type ComparisonOutput = {
  test_slug: string
  methodology_version: string
  definition_version: string
  compatibility_conditions: Record<string, unknown>
  results: SavedResult[]
}

export type FaqItem = {
  id: string
  slug: string
  category: string
  question: Record<string, string>
  answer: Record<string, string>
  sort_order: number
}

export type KnowledgeArticle = {
  id: string
  slug: string
  category: string
  sort_order: number
  localizations: Record<string, { title: string; summary?: string; content?: string }>
}

export type SupportTicket = {
  id: string
  user_id: string | null
  contact_email: string
  subject: string
  message: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  admin_notes: string | null
  created_at: string
}

export type AdminDashboard = {
  total_users: number
  users_by_age_group: Record<string, number>
  active_users: number
  inactive_users: number
  total_categories: number
  tests_by_status: Record<string, number>
  tests_by_type: Record<string, number>
  total_completed_attempts: number
  total_saved_results: number
  tickets_by_status: Record<string, number>
}

export type AdminUser = {
  id: string
  email: string
  full_name: string
  role: UserRole
  age_group: string
  is_active: boolean
  created_at: string
}

export type DialogMessage = { role: 'user' | 'assistant'; text: string }
export type AssistantAction = { name: string; arguments: Record<string, string>; requires_confirmation?: boolean }
export type AssistantReply = { message: string; actions: AssistantAction[]; provider_available: boolean }
export type ActivityKind = 'visual' | 'audio' | 'memory' | 'attention' | 'reflection' | 'reaction' | 'pointer' | 'processing'
export type Activity = { slug: string; title: string; description: string; kind: ActivityKind }
