export interface KeyTerm {
  term: string
  definition: string
}

export interface VisualMoment {
  timestamp: string
  description: string
}

export interface Section {
  title: string
  timestamp: string
  concept_explanation: string
  key_terms: KeyTerm[]
  example: string
  why_it_matters: string
  visual_moments: VisualMoment[]
  section_takeaways: string[]
}

export interface LearningModule {
  video_id: string
  video_title: string
  overview: string
  learning_objectives: string[]
  sections: Section[]
  key_takeaways: string[]
  review_questions: string[]
  notion_page_url: string | null
  notion_error: string | null
  truncated: boolean
}

export interface SavedModule {
  id: string
  user_id: string
  video_id: string
  video_title: string | null
  notion_page_url: string | null
  notion_error: string | null
  truncated: boolean
  summary: LearningModule
  created_at: string
}

export interface UserKeys {
  gemini_api_key: string | null
  groq_api_key: string | null
  notion_api_key: string | null
  notion_database_id: string | null
}

export interface VideoRecommendation {
  video_id: string
  title: string
  channel_name: string
  thumbnail_url: string
  duration_seconds: number
  duration_formatted: string
  view_count: number
  youtube_url: string
}
