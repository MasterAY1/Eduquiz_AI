export interface User {
  id: string;
  full_name: string;
  email: string;
  educational_level?: string;
  school_name?: string;
  department?: string;
  class_level?: string;
  preferred_subjects?: string[];
  avatar_url?: string;
  xp_points: number;
  streak_days: number;
  created_at: string;
  learning_profiles: LearningProfile[];
}

export interface LearningProfile {
  id: string;
  user_id: string;
  persona: 'exam_candidate' | 'tertiary_student' | 'educator';
  academic_category: string;
  institution_name?: string;
  faculty?: string;
  department?: string;
  academic_level?: string;
  target_exam?: string;
  preferred_subjects?: string[];
  is_active: boolean;
}

export interface Document {
  id: string;
  title: string;
  source_type: 'pdf' | 'docx' | 'ppt' | 'txt' | 'image';
  original_filename?: string;
  file_url?: string;
  subject?: string;
  detected_level?: string;
  topics: string[];
  subtopics: Record<string, string[]>;
  summary?: string;
  word_count?: number;
  chunk_count: number;
  analysis_status: 'pending' | 'processing' | 'indexed' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  items: Document[];
  total: number;
  skip: number;
  limit: number;
}

export interface Question {
  id: string;
  question_number: number;
  question_text: string;
  question_type: 'mcq' | 'fill_blank' | 'true_false' | 'theory';
  options?: Array<{ key: string; text: string }>;
  topic_reference?: string;
  marks: number;
}

export interface Quiz {
  id: string;
  title: string;
  exam_style: string;
  subject?: string;
  difficulty: string;
  question_count: number;
  time_limit_minutes?: number;
  language: string;
  model_used?: string;
  created_at: string;
  questions: Question[];
}

export interface QuizAttempt {
  attempt_id: string;
  quiz_id: string;
  score: number;
  max_score: number;
  percentage: number;
  time_taken_seconds?: number;
  xp_earned: number;
  overall_evaluation?: string;
  questions: QuestionResult[];
}

export interface QuestionResult {
  question_id: string;
  question_text: string;
  question_type: string;
  user_answer?: string;
  correct_answer: string;
  explanation?: string;
  is_correct: boolean;
  marks_earned: number;
  max_marks: number;
}

export interface DashboardStats {
  total_documents: number;
  total_quizzes: number;
  quizzes_taken: number;
  average_score: number;
  xp_points: number;
  streak_days: number;
  recent_documents: Partial<Document>[];
  recent_attempts: RecentAttempt[];
}

export interface RecentAttempt {
  attempt_id: string;
  quiz_id: string;
  quiz_title: string;
  score: number;
  max_score: number;
  percentage: number;
  time_taken_seconds?: number;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
}

export interface GenerateQuizData {
  document_id: string;
  title?: string;
  exam_style: string;
  difficulty: string;
  question_count: number;
  question_types: string[];
  time_limit_minutes?: number;
}

export interface DocumentStatus {
  id: string;
  analysis_status: Document['analysis_status'];
  error_message?: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}
