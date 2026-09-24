      completedActivities: d.completed_activities,
      updatedAt: d.updated_at,
    }));
  }

  async updateSkillScore(
    userId: string,
    skill: 'vocabulary' | 'grammar' | 'listening' | 'speaking' | 'reading' | 'writing',
    level: HSKLevelNumber,
    pointsDelta: number
  ): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    const { error } = await supabase.rpc('increment_user_skill_score', {
      p_user_id: userId,
      p_skill: skill,
      p_level: level,
      p_points_delta: pointsDelta,
    });

    if (error) {
      throw new Error(`Không thể cập nhật tiến độ kỹ năng: ${error.message}`);
    }
  }
}

export function getLessonProgressRepository(userId: string | null): LessonProgressRepository {
  if (userId && isSupabaseConfigured) {
    return new SupabaseLessonProgressRepository();
  }
  return new LocalStorageLessonProgressRepository();
}