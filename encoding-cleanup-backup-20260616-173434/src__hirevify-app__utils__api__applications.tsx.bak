import { projectId, publicAnonKey } from '../supabase/info'

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44`

export interface Application {
  id: string
  projectId: string
  candidateId: string
  coverLetter: string
  resumeData: any
  portfolioItems: any[]
  status: 'pending' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'
  aiScore: number
  notes: Array<{
    id: string
    text: string
    createdBy: string
    createdAt: string
  }>
  tags: string[]
  createdAt: string
  updatedAt?: string
  interviews?: string[]
  candidate?: any
  project?: any
}

export class ApplicationsAPI {
  static async submitApplication(applicationData: {
    projectId: string
    coverLetter: string
    resumeData: any
    portfolioItems?: any[]
  }, accessToken: string): Promise<Application> {
    const response = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(applicationData)
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to submit application')
    }

    return result.application
  }

  static async getCandidateApplications(accessToken: string): Promise<Application[]> {
    const response = await fetch(`${API_BASE}/applications/candidate`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch applications')
    }

    return result.applications
  }

  static async getProjectApplications(projectId: string, accessToken: string): Promise<Application[]> {
    const response = await fetch(`${API_BASE}/applications/project/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch project applications')
    }

    return result.applications
  }

  static async updateApplicationStatus(applicationId: string, status: string, notes?: string, accessToken?: string): Promise<Application> {
    const response = await fetch(`${API_BASE}/applications/${applicationId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ status, notes })
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to update application status')
    }

    return result.application
  }
}







