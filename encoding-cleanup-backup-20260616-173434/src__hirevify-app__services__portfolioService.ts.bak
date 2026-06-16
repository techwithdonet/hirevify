import { createSupabaseBrowserClient } from '@/src/lib/supabase';

export interface PortfolioItemRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  project_url: string | null;
  github_url: string | null;
  image_url: string | null;
  technologies: string[];
  category: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

class PortfolioService {
    private mapPortfolioItem(item: PortfolioItemRow) {
    const technologies = Array.isArray(item.technologies) ? item.technologies : [];

    return {
      id: item.id,
      userId: item.user_id,
      title: item.title,
      description: item.description || '',
      projectUrl: item.project_url || '',
      githubUrl: item.github_url || '',
      imageUrl: item.image_url || '',
      technologies,
      skills: technologies,
      techStack: technologies,
      tags: technologies,
      category: item.category || 'Project',
      isFeatured: item.is_featured || false,
      createdAt: item.created_at,
      updatedAt: item.updated_at,

      user_id: item.user_id,
      project_url: item.project_url,
      github_url: item.github_url,
      image_url: item.image_url,
      is_featured: item.is_featured,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  
  }

  async getUserPortfolio(userId?: string) {
    return this.getMyPortfolioItems();
  }

  async getMyPortfolioItems() {
    try {
      const supabase = createSupabaseBrowserClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user?.id) {
        console.warn('No Supabase auth user found:', authError?.message);
        return { data: [], error: authError || new Error('No auth user') };
      }

      const { data, error } = await supabase
        .from('candidate_portfolio_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Portfolio fetch failed:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        return { data: [], error };
      }

      return {
        data: (data || []).map((item) => this.mapPortfolioItem(item as PortfolioItemRow)),
        error: null,
      };
    } catch (error: any) {
      console.warn('Portfolio service failed:', error?.message || error);
      return { data: [], error };
    }
  }

  async addPortfolioItem(input: {
    title: string;
    description: string;
    projectUrl?: string;
    githubUrl?: string;
    imageUrl?: string;
    technologies?: string[];
    skills?: string[];
    category?: string;
    isFeatured?: boolean;
  }) {
    try {
      const supabase = createSupabaseBrowserClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user?.id) {
        console.warn('No Supabase auth user found:', authError?.message);
        return { data: null, error: authError || new Error('No auth user') };
      }

      const { data, error } = await supabase
        .from('candidate_portfolio_items')
        .insert({
          user_id: user.id,
          title: input.title,
          description: input.description,
          project_url: input.projectUrl || null,
          github_url: input.githubUrl || null,
          image_url: input.imageUrl || null,
          technologies: input.technologies || input.skills || [],
          category: input.category || 'Project',
          is_featured: input.isFeatured || false,
        })
        .select()
        .single();

      if (error) {
        console.warn('Portfolio save failed:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        return { data: null, error };
      }

      return {
        data: this.mapPortfolioItem(data as PortfolioItemRow),
        error: null,
      };
    } catch (error: any) {
      console.warn('Portfolio save service failed:', error?.message || error);
      return { data: null, error };
    }
  }

  async createPortfolioItem(input: {
    title: string;
    description: string;
    projectUrl?: string;
    githubUrl?: string;
    imageUrl?: string;
    technologies?: string[];
    skills?: string[];
    category?: string;
    isFeatured?: boolean;
  }) {
    return this.addPortfolioItem(input);
  }

  async updatePortfolioItem(
    id: string,
    input: {
      title?: string;
      description?: string;
      projectUrl?: string;
      githubUrl?: string;
      imageUrl?: string;
      technologies?: string[];
      skills?: string[];
      category?: string;
      isFeatured?: boolean;
    }
  ) {
    try {
      const supabase = createSupabaseBrowserClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user?.id) {
        return { data: null, error: authError || new Error('No auth user') };
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.projectUrl !== undefined) updateData.project_url = input.projectUrl || null;
      if (input.githubUrl !== undefined) updateData.github_url = input.githubUrl || null;
      if (input.imageUrl !== undefined) updateData.image_url = input.imageUrl || null;
      if (input.technologies !== undefined || input.skills !== undefined) {
        updateData.technologies = input.technologies || input.skills || [];
      }
      if (input.category !== undefined) updateData.category = input.category || 'Project';
      if (input.isFeatured !== undefined) updateData.is_featured = input.isFeatured;

      const { data, error } = await supabase
        .from('candidate_portfolio_items')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.warn('Portfolio update failed:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        return { data: null, error };
      }

      return {
        data: this.mapPortfolioItem(data as PortfolioItemRow),
        error: null,
      };
    } catch (error: any) {
      console.warn('Portfolio update service failed:', error?.message || error);
      return { data: null, error };
    }
  }

  async deletePortfolioItem(id: string) {
    try {
      const supabase = createSupabaseBrowserClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user?.id) {
        return { error: authError || new Error('No auth user') };
      }

      const { error } = await supabase
        .from('candidate_portfolio_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.warn('Portfolio delete failed:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        return { error };
      }

      return { error: null };
    } catch (error: any) {
      console.warn('Portfolio delete service failed:', error?.message || error);
      return { error };
    }
  }
}

export const portfolioService = new PortfolioService();

