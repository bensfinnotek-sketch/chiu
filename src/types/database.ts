export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          native_language: string;
          target_language: string;
          hsk_level: number;
          learning_goal: string;
          daily_minutes: number;
          speaking_level: number;
          listening_level: number;
          reading_level: number;
          writing_level: number;
          show_pinyin: boolean;
          show_translation: boolean;
          preferred_voice: string | null;
          speech_speed: number;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & {
          id: string;
          email: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: [];
      };
      conversation_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          topic: string;
          learner_level: number;
          summary: string;
          key_facts: string[];
          vocabulary: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['conversation_sessions']['Row']> & {
          user_id: string;
          title: string;
          topic: string;
        };
        Update: Partial<Database['public']['Tables']['conversation_sessions']['Row']>;
        Relationships: [];
      };
      conversation_messages: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          role: string;
          chinese: string;
          pinyin: string | null;
          translation: string | null;
          analysis: any | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          role: string;
          chinese: string;
          pinyin?: string | null;
          translation?: string | null;
          analysis?: any | null;
          timestamp?: string;
        };
        Update: Partial<Database['public']['Tables']['conversation_messages']['Row']>;
        Relationships: [];
      };
      learning_progress: {
        Row: {
          user_id: string;
          total_study_minutes: number;
          lessons_completed: number;
          words_learned: number;
          speaking_minutes: number;
          conversations_completed: number;
          current_streak: number;
          longest_streak: number;
          last_study_date: string | null;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['learning_progress']['Row']> & {
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['learning_progress']['Row']>;
        Relationships: [];
      };
      user_vocabulary: {
        Row: {
          id: string;
          user_id: string;
          hanzi: string;
          pinyin: string;
          meaning: string;
          hsk_level: number;
          status: string;
          review_count: number;
          last_reviewed_at: string | null;
          next_review_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['user_vocabulary']['Row']> & {
          user_id: string;
          hanzi: string;
          pinyin: string;
          meaning: string;
        };
        Update: Partial<Database['public']['Tables']['user_vocabulary']['Row']>;
        Relationships: [];
      };
      user_lesson_progress: {
        Row: {
          user_id: string;
          lesson_id: string;
          level_number: number;
          status: string;
          progress_percent: number;
          current_section_id: string | null;
          score: number | null;
          attempts: number;
          started_at: string | null;
          completed_at: string | null;
          last_accessed_at: string;
        };
        Insert: Partial<Database['public']['Tables']['user_lesson_progress']['Row']> & {
          user_id: string;
          lesson_id: string;
          level_number: number;
          status: string;
        };
        Update: Partial<Database['public']['Tables']['user_lesson_progress']['Row']>;
        Relationships: [];
      };
      quiz_attempts: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          score: number;
          total_points: number;
          earned_points: number;
          correct_answers: number;
          total_questions: number;
          passed: boolean;
          answers: unknown[];
          started_at: string;
          completed_at: string;
        };
        Insert: Partial<Database['public']['Tables']['quiz_attempts']['Row']> & {
          id: string;
          user_id: string;
          lesson_id: string;
        };
        Update: Partial<Database['public']['Tables']['quiz_attempts']['Row']>;
        Relationships: [];
      };
      user_vocabulary_progress: {
        Row: {
          user_id: string;
          vocabulary_id: string;
          status: string;
          exposure_count: number;
          correct_count: number;
          incorrect_count: number;
          last_seen_at: string | null;
          mastered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['user_vocabulary_progress']['Row']> & {
          user_id: string;
          vocabulary_id: string;
        };
        Update: Partial<Database['public']['Tables']['user_vocabulary_progress']['Row']>;
        Relationships: [];
      };
      user_grammar_progress: {
        Row: {
          user_id: string;
          grammar_point_id: string;
          exposure_count: number;
          correct_count: number;
          incorrect_count: number;
          mastery_score: number;
          last_practiced_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['user_grammar_progress']['Row']> & {
          user_id: string;
          grammar_point_id: string;
        };
        Update: Partial<Database['public']['Tables']['user_grammar_progress']['Row']>;
        Relationships: [];
      };
      user_skill_progress: {
        Row: {
          user_id: string;
          skill: string;
          level: number;
          score: number;
          completed_activities: number;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['user_skill_progress']['Row']> & {
          user_id: string;
          skill: string;
          level: number;
        };
        Update: Partial<Database['public']['Tables']['user_skill_progress']['Row']>;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          user_id: string;
          plan: string;
          status: string;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['subscriptions']['Row']> & {
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['subscriptions']['Row']>;
        Relationships: [];
      };
    };
    Functions: {
      complete_lesson: {
        Args: {
          p_user_id: string;
          p_lesson_id: string;
          p_score: number;
          p_level_number: number;
        };
        Returns: unknown;
      };
      increment_user_skill_score: {
        Args: {
          p_user_id: string;
          p_skill: string;
          p_level: number;
          p_points_delta: number;
        };
        Returns: unknown;
      };
    };
  };
}
