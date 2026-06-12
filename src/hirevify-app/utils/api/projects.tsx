import { projectId, publicAnonKey } from '../supabase/info'

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44`

export interface Project {
  id: string
  title: string
  description: string
  company: string
  location: string
  type: 'full-time' | 'part-time' | 'contract' | 'freelance'
  skills: string[]
  budget: string
  budgetRange: string
  timeline: string
  requirements: string[]
  responsibilities: string[]
  benefits: string[]
  status: 'active' | 'paused' | 'closed' | 'deleted'
  applications: string[]
  views: number
  bookmarks: number
  createdBy: string
  createdAt: string
  updatedAt?: string
}

export interface ProjectFilters {
  search?: string
  skills?: string[]
  location?: string
  type?: string
  budget?: string
  sortBy?: 'newest' | 'oldest' | 'mostApplied' | 'budget'
  page?: number
  limit?: number
}

export class ProjectsAPI {
  static async createProject(projectData: Partial<Project>, accessToken: string): Promise<Project> {
    const response = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(projectData)
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create project')
    }

    return result.project
  }

  static async getProjects(filters?: ProjectFilters): Promise<{
    projects: Project[]
    totalCount: number
    page: number
    limit: number
    totalPages: number
  }> {
    const params = new URLSearchParams()
    
    if (filters?.search) params.append('search', filters.search)
    if (filters?.skills?.length) params.append('skills', filters.skills.join(','))
    if (filters?.location) params.append('location', filters.location)
    if (filters?.type) params.append('type', filters.type)
    if (filters?.budget) params.append('budget', filters.budget)
    if (filters?.sortBy) params.append('sortBy', filters.sortBy)
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await fetch(`${API_BASE}/projects?${params}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch projects')
    }

    return result
  }

  static async getProject(projectId: string): Promise<Project> {
    const response = await fetch(`${API_BASE}/projects/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch project')
    }

    return result.project
  }

  static async updateProject(projectId: string, updates: Partial<Project>, accessToken: string): Promise<Project> {
    const response = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(updates)
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to update project')
    }

    return result.project
  }

  static async deleteProject(projectId: string, accessToken: string): Promise<void> {
    const response = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete project')
    }
  }
}






