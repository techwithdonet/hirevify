import { createSupabaseBrowserClient } from '@/src/lib/supabase';

export interface AssessmentResultPayload {
  userId: string;
  assessmentId: string;
  score: number;
  passed: boolean;
  answers: Record<string, string>;
  timeSpent: number;
}

class AssessmentsService {
  async getAssessments() {
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from('skills_assessments')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading assessments:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  }

  async getMyResults(userId: string) {
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from('assessment_results')
      .select('*')
      .eq('user_id', String(userId))
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error loading my assessment results:', error);
      return { data: [], error };
    }

    const mappedResults = (data || []).map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      assessmentId: item.assessment_id,
      score: Number(item.score || 0),
      passed: Boolean(item.passed),
      answers: item.answers || {},
      timeSpent: Number(item.time_spent || 0),
      completedAt: item.completed_at || item.created_at || new Date().toISOString(),
      createdAt: item.created_at || item.completed_at || new Date().toISOString(),
    }));

    return { data: mappedResults, error: null };
  }

  async saveResult(result: AssessmentResultPayload) {
    const supabase = createSupabaseBrowserClient();

    const payload = {
      user_id: String(result.userId),
      assessment_id: result.assessmentId,
      score: Number(result.score || 0),
      passed: Boolean(result.passed),
      answers: result.answers || {},
      time_spent: Number(result.timeSpent || 0),
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('assessment_results')
      .upsert(payload, { onConflict: 'user_id,assessment_id' })
      .select('*')
      .single();

    if (error) {
      console.error('Error saving assessment result details:', JSON.stringify(error, null, 2));
      alert('Assessment result save failed: ' + (error.message || JSON.stringify(error)));
      return { data: null, error };
    }

    return {
      data: {
        id: data.id,
        userId: data.user_id,
        assessmentId: data.assessment_id,
        score: Number(data.score || 0),
        passed: Boolean(data.passed),
        answers: data.answers || {},
        timeSpent: Number(data.time_spent || 0),
        completedAt: data.completed_at || data.created_at || new Date().toISOString(),
        createdAt: data.created_at || data.completed_at || new Date().toISOString(),
      },
      error: null,
    };
  }
}

export const assessmentsService = new AssessmentsService();
