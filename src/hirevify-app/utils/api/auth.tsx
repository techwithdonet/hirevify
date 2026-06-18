import { createClient } from '../supabase/client';
const supabase = createClient();
import { projectId, publicAnonKey } from '../supabase/info'

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-d4feca44`

export interface User {
 id: string
 email: string
 name: string
 userType: 'recruiter' | 'candidate'
 isActive: boolean
 createdAt: string
}

export interface SignupData {
 email: string
 password: string
 name: string
 userType: 'recruiter' | 'candidate'
}

// Local storage fallback for when backend is not available
class LocalStorageAuth {
 private static readonly USERS_KEY = 'hirevify_users'
 private static readonly CURRENT_USER_KEY = 'hirevify_current_user'

 static generateId(): string {
 return 'usr_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
 }

 static getUsers(): Array<User & { password: string }> {
 try {
 const users = localStorage.getItem(this.USERS_KEY)
 return users? JSON.parse(users): []
 } catch {
 return []
 }
 }

 static saveUsers(users: Array<User & { password: string }>): void {
 try {
 localStorage.setItem(this.USERS_KEY, JSON.stringify(users))
 } catch (error) {
 console.error('Failed to save users to local storage:', error)
 }
 }

 static getCurrentUser(): User | null {
 try {
 const user = localStorage.getItem(this.CURRENT_USER_KEY)
 return user? JSON.parse(user): null
 } catch {
 return null
 }
 }

 static setCurrentUser(user: User | null): void {
 try {
 if (user) {
 localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user))
 } else {
 localStorage.removeItem(this.CURRENT_USER_KEY)
 }
 } catch (error) {
 console.error('Failed to save current user to local storage:', error)
 }
 }

 static async signup(data: SignupData): Promise<User> {
 const users = this.getUsers()
 
 // CRITICAL FIX: Check if user already exists
 const existingUser = users.find(u => u.email.toLowerCase() === data.email.toLowerCase())
 if (existingUser) {
 throw new Error('An account with this email already exists. Please sign in instead.')
 }

 const newUser: User & { password: string } = {
 id: this.generateId(),
 email: data.email.toLowerCase(), // Normalize email to lowercase
 name: data.name,
 userType: data.userType,
 isActive: true,
 createdAt: new Date().toISOString(),
 password: data.password
 }

 users.push(newUser)
 this.saveUsers(users)

 const { password,...userWithoutPassword } = newUser
 this.setCurrentUser(userWithoutPassword)
 return userWithoutPassword
 }

 static async signIn(email: string, password: string): Promise<{ user: User; accessToken: string }> {
 const users = this.getUsers()
 const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password)

 if (!user) {
 throw new Error('Invalid email or password. Please check your credentials and try again.')
 }

 const { password: _,...userWithoutPassword } = user
 this.setCurrentUser(userWithoutPassword)

 return {
 user: userWithoutPassword,
 accessToken: `local_token_${user.id}_${Date.now()}`
 }
 }

 static async getSession(): Promise<{ user: User }> {
 const user = this.getCurrentUser()
 if (!user) {
 throw new Error('No active session')
 }
 return { user }
 }

 static async signOut(): Promise<void> {
 this.setCurrentUser(null)
 }

 static async updateProfile(updates: Partial<User>): Promise<User> {
 const currentUser = this.getCurrentUser()
 if (!currentUser) {
 throw new Error('Not authenticated')
 }

 const users = this.getUsers()
 const userIndex = users.findIndex(u => u.id === currentUser.id)
 
 if (userIndex === -1) {
 throw new Error('User not found')
 }

 const updatedUser = {...users[userIndex],...updates }
 users[userIndex] = updatedUser
 this.saveUsers(users)

 const { password,...userWithoutPassword } = updatedUser
 this.setCurrentUser(userWithoutPassword)
 
 return userWithoutPassword
 }
}

export class AuthAPI {
 static async signup(data: SignupData): Promise<User> {
 console.log(` Creating ${data.userType} account: ${data.email}`)
 
 // Normalize email to lowercase
 const normalizedData = {...data,
 email: data.email.toLowerCase().trim()
 }
 
 // Try backend first
 try {
 const response = await fetch(`${API_BASE}/auth/signup`, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 'Authorization': `Bearer ${publicAnonKey}`
 },
 body: JSON.stringify(normalizedData)
 })

 const result = await response.json()
 
 if (!response.ok) {
 console.error('Error Backend signup failed:', result.error)
 
 // Handle specific error cases
 if (result.error.includes('already exists') || 
 result.error.includes('already registered') ||
 result.error.includes('duplicate')) {
 throw new Error('An account with this email already exists. Please sign in instead.')
 }
 
 throw new Error(result.error || `HTTP ${response.status}: Signup failed`)
 }

 console.log('Done Backend signup successful')
 return result.user
 } catch (error) {
 console.log(' Backend signup failed, using local storage:', error.message)
 
 // If it's a user-already-exists error, don't fall back to local storage
 if (error.message.includes('already exists')) {
 throw error
 }
 
 // Fall back to local storage for other errors
 try {
 const user = await LocalStorageAuth.signup(normalizedData)
 console.log(' Local storage signup successful')
 return user
 } catch (localError) {
 console.error('Error Local storage signup failed:', localError)
 throw localError
 }
 }
 }

 static async signIn(email: string, password: string): Promise<{ user: User; accessToken: string }> {
 console.log(` Signing in: ${email}`)
 
 // Normalize email to lowercase
 const normalizedEmail = email.toLowerCase().trim()
 
 // Try backend signin first (which handles Supabase auth internally)
 try {
 const response = await fetch(`${API_BASE}/auth/signin`, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 'Authorization': `Bearer ${publicAnonKey}`
 },
 body: JSON.stringify({ email: normalizedEmail, password })
 })

 const result = await response.json()
 
 if (!response.ok) {
 console.log(' Backend signin failed:', result.error)
 throw new Error(result.error || 'Sign in failed')
 }

 console.log('Done Backend signin successful')
 return {
 user: result.user,
 accessToken: result.accessToken
 }
 } catch (backendError) {
 console.log(' Backend signin failed, trying direct Supabase:', backendError.message)
 
 // Try direct Supabase auth as fallback
 try {
 const { data, error } = await supabase.auth.signInWithPassword({
 email: normalizedEmail,
 password
 })

 if (error) {
 throw new Error(error.message)
 }

 if (!data.session) {
 throw new Error('No session created during sign in')
 }

 console.log('Done Direct Supabase sign in successful')
 const sessionData = await this.getSession(data.session.access_token)
 
 return {
 user: sessionData.user,
 accessToken: data.session.access_token
 }
 } catch (supabaseError) {
 console.log(' Direct Supabase failed, trying local storage:', supabaseError.message)
 
 // Fall back to local storage
 try {
 const result = await LocalStorageAuth.signIn(normalizedEmail, password)
 console.log(' Local storage sign in successful')
 return result
 } catch (localError) {
 console.error('Error All sign in methods failed')
 
 // Provide user-friendly error messages
 if (backendError.message.includes('Invalid login credentials') || 
 backendError.message.includes('Invalid email or password') ||
 supabaseError.message.includes('Invalid login credentials') ||
 localError.message.includes('Invalid email or password')) {
 throw new Error('Invalid email or password. Please check your credentials and try again.')
 }
 
 throw new Error('Sign in failed. Please check your internet connection and try again.')
 }
 }
 }
 }

 static async signOut(): Promise<void> {
 console.log('‹ Signing out')
 
 // Try both backend and local storage
 try {
 const { error } = await supabase.auth.signOut()
 if (error) {
 console.log('Warning Supabase sign out error:', error)
 } else {
 console.log('Done Supabase sign out successful')
 }
 } catch (error) {
 console.log(' Supabase sign out failed:', error)
 }

 try {
 await LocalStorageAuth.signOut()
 console.log(' Local storage sign out successful')
 } catch (error) {
 console.error('Error Local storage sign out failed:', error)
 }
 }

 static async getSession(accessToken?: string): Promise<{ user: User }> {
 // Try backend first if we have an access token
 if (accessToken) {
 try {
 const response = await fetch(`${API_BASE}/auth/session`, {
 headers: {
 'Authorization': `Bearer ${accessToken}`
 }
 })

 const result = await response.json()
 
 if (response.ok) {
 console.log('Done Backend session validation successful')
 return result
 } else {
 console.log(' Backend session validation failed:', result.error)
 throw new Error(result.error || 'Session validation failed')
 }
 } catch (error) {
 console.log(' Backend session validation error:', error.message)
 }
 }

 // Try Supabase session
 try {
 let token = accessToken
 if (!token) {
 const { data } = await supabase.auth.getSession()
 token = data.session?.access_token
 }

 if (token) {
 const { data: { user }, error } = await supabase.auth.getUser(token)
 if (!error && user) {
 // Try to get additional user data from backend
 try {
 const response = await fetch(`${API_BASE}/auth/session`, {
 headers: {
 'Authorization': `Bearer ${token}`
 }
 })
 
 if (response.ok) {
 const result = await response.json()
 console.log('Done Enhanced user data from backend')
 return result
 }
 } catch {}
 
 // Fallback to basic user data from Supabase
 console.log('Done Basic user data from Supabase')
 return {
 user: {
 id: user.id,
 email: user.email || '',
 name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
 userType: user.user_metadata?.userType || 'candidate',
 isActive: true,
 createdAt: user.created_at
 }
 }
 }
 }
 } catch (error) {
 console.log(' Supabase session check failed:', error.message)
 }

 // Fall back to local storage
 try {
 const result = await LocalStorageAuth.getSession()
 console.log(' Local storage session found')
 return result
 } catch (error) {
 throw new Error('No active session')
 }
 }

 static async updateProfile(updates: Partial<User>, accessToken: string): Promise<User> {
 // Try backend first
 try {
 const response = await fetch(`${API_BASE}/auth/profile`, {
 method: 'PUT',
 headers: {
 'Content-Type': 'application/json',
 'Authorization': `Bearer ${accessToken}`
 },
 body: JSON.stringify(updates)
 })

 const result = await response.json()
 
 if (response.ok) {
 console.log('Done Backend profile update successful')
 return result.profile
 } else {
 throw new Error(result.error || 'Profile update failed')
 }
 } catch (error) {
 console.log(' Backend profile update failed, using local storage:', error.message)
 
 // Fall back to local storage
 try {
 const user = await LocalStorageAuth.updateProfile(updates)
 console.log(' Local storage profile update successful')
 return user
 } catch (localError) {
 console.error('Error Local storage profile update failed:', localError)
 throw localError
 }
 }
 }
}







