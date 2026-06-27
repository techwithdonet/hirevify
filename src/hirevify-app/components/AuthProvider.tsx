"use client";

import {
 createContext,
 useCallback,
 useContext,
 useEffect,
 useState,
 ReactNode,
} from "react";
import { toast } from "sonner";
import { supabase } from "@/src/lib/supabase";
import type { Session } from "@supabase/supabase-js";

export interface User {
 id: string;
 email: string;
 name: string;
 userType: "recruiter" | "candidate";
 isEmailVerified: boolean;
 profileComplete: boolean;
 createdAt: string;
 accessToken: string;
}

interface AuthContextType {
 user: User | null;
 accessToken: string | null;
 getAccessToken: () => Promise<string | null>;
 setUser: (user: User | null) => void;
 isLoading: boolean;
 authInitialized: boolean;
 connectionStatus: "checking" | "connected" | "error";
 signUp: (
 email: string,
 password: string,
 name: string,
 userType: "recruiter" | "candidate"
 ) => Promise<{ success: boolean; message: string; user?: User }>;
 signIn: (
 email: string,
 password: string
 ) => Promise<{ success: boolean; message: string; user?: User }>;
 signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
 children: ReactNode;
}

function mapUserTypeToDbRole(userType: "recruiter" | "candidate") {
 return userType;
}

function mapDbRoleToUserType(role: string): "recruiter" | "candidate" {
 return role === "recruiter"? "recruiter": "candidate";
}
export function AuthProvider({ children }: AuthProviderProps) {
 const [user, setUser] = useState<User | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [authInitialized, setAuthInitialized] = useState(false);
 const [connectionStatus, setConnectionStatus] =
 useState<"checking" | "connected" | "error">("checking");

 const setUserWithTokenSync = useCallback((newUser: User | null) => {
 setUser(newUser);

 if (newUser) {
 localStorage.setItem("hirevify_user", JSON.stringify(newUser));
 localStorage.setItem("hirevify_access_token", newUser.accessToken || "");
 } else {
 localStorage.removeItem("hirevify_user");
 localStorage.removeItem("hirevify_access_token");
 }
 }, []);

 const loadUserFromSession = useCallback(async (session: Session) => {
 try {
 const authUser = session.user;

 const { data: profile, error } = await supabase.from("profiles").select("*").eq("auth_user_id", authUser.id).maybeSingle();

 if (error) {
 console.warn("Profile load failed:", error.message);
 }

 const loadedUser: User = {
 id: profile?.id || authUser.id,
 email: authUser.email || "",
 name: profile?.full_name || authUser.user_metadata?.name || "HireVify User",
 userType: mapDbRoleToUserType(profile?.role || authUser.user_metadata?.userType || "employee"),
 isEmailVerified:!!authUser.email_confirmed_at,
 profileComplete: true,
 createdAt: profile?.created_at || authUser.created_at || new Date().toISOString(),
 accessToken: session.access_token || "",
 };

 setUserWithTokenSync(loadedUser);
 } catch (error) {
 console.error("Failed to load user from session:", error);
 }
 }, [setUserWithTokenSync]);

 const initializeAuth = useCallback(async () => {
 try {
 setIsLoading(true);
 setConnectionStatus("checking");

 const { error } = await supabase.from("profiles").select("id").limit(1);

 if (error) {
 console.warn("Supabase connection check failed:", error.message);
 setConnectionStatus("error");
 } else {
 setConnectionStatus("connected");
 }

 const { data: sessionData } = await supabase.auth.getSession();

 if (sessionData.session?.user) {
 await loadUserFromSession(sessionData.session);
 }
 } catch (error) {
 console.error("Auth initialization failed:", error);
 setConnectionStatus("error");
 } finally {
 setIsLoading(false);
 setAuthInitialized(true);
 }
 }, [loadUserFromSession]);

 useEffect(() => {
 let active = true;

 queueMicrotask(() => {
 if (active) {
 void initializeAuth();
 }
 });

 const {
 data: { subscription },
 } = supabase.auth.onAuthStateChange(async (_event, session) => {
 if (!session?.user) {
 setUserWithTokenSync(null);
 return;
 }

 await loadUserFromSession(session);
 });

 return () => {
 active = false;
 subscription.unsubscribe();
 };
 }, [initializeAuth, loadUserFromSession, setUserWithTokenSync]);

 const signUp = async (
 email: string,
 password: string,
 name: string,
 userType: "recruiter" | "candidate"
 ) => {
 try {
 setIsLoading(true);

 const cleanEmail = email.toLowerCase().trim();

 if (!cleanEmail ||!password ||!name ||!userType) {
 throw new Error("All fields are required");
 }

 if (password.length < 8) {
 throw new Error("Password must be at least 8 characters long");
 }

 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 if (!emailRegex.test(cleanEmail)) {
 throw new Error("Please enter a valid email address");
 }

 const { data, error } = await supabase.auth.signUp({
 email: cleanEmail,
 password,
 options: {
 data: {
 name,
 userType,
 },
 },
 });

 if (error) {
 throw new Error(error.message);
 }

 if (!data.user) {
 throw new Error("Signup failed. Please try again.");
 }

 const dbRole = mapUserTypeToDbRole(userType);

const { data: profile, error: profileError } = await supabase.from("profiles").upsert(
 {
 auth_user_id: data.user.id,
 full_name: name,
 email: cleanEmail,
 role: dbRole,
 company_name: userType === "recruiter"? name: null,
 },
 {
 onConflict: "auth_user_id",
 }
 ).select("*").single();

if (profileError) {
 console.error("Profile insert failed:", profileError);
 const errorMessage = typeof profileError === 'object' && profileError!== null && 'message' in profileError? (profileError as any).message: String(profileError);
 throw new Error(`Profile creation failed: ${errorMessage}`);
}

 const session = data.session;

 const newUser: User = {
 id: profile?.id || data.user.id,
 email: cleanEmail,
 name,
 userType,
 isEmailVerified:!!data.user.email_confirmed_at,
 profileComplete: true,
 createdAt: profile?.created_at || data.user.created_at || new Date().toISOString(),
 accessToken: session?.access_token || "",
 };

 if (session?.access_token) {
 setUserWithTokenSync(newUser);
 }

 return {
 success: true,
 message: session? "Account created successfully! Welcome to HireVify.": "Account created. Please check your email to confirm your account.",
 user: newUser,
 };
 } catch (error) {
 console.error("Signup error:", error);
 return {
 success: false,
 message: error instanceof Error? error.message: "Signup failed",
 };
 } finally {
 setIsLoading(false);
 }
 };

 const signIn = async (email: string, password: string) => {
 try {
 setIsLoading(true);

 const cleanEmail = email.toLowerCase().trim();

 if (!cleanEmail ||!password) {
 throw new Error("Email and password are required");
 }

 const { data, error } = await supabase.auth.signInWithPassword({
 email: cleanEmail,
 password,
 });

 if (error) {
 throw new Error(error.message);
 }

 if (!data.session ||!data.user) {
 throw new Error("Login failed. Please try again.");
 }

 await loadUserFromSession(data.session);

 const storedUser = localStorage.getItem("hirevify_user");
 const loggedInUser = storedUser? (JSON.parse(storedUser) as User): undefined;

 return {
 success: true,
 message: "Successfully signed in! Welcome back.",
 user: loggedInUser,
 };
 } catch (error) {
 console.error("Signin error:", error);
 return {
 success: false,
 message: error instanceof Error? error.message: "Sign in failed. Please try again.",
 };
 } finally {
 setIsLoading(false);
 }
 };

 const signOut = async () => {
 try {
 await supabase.auth.signOut();
 setUserWithTokenSync(null);
 } catch (error) {
 console.error("Sign out error:", error);
 setUserWithTokenSync(null);
 toast.error("Error signing out, but session cleared");
 }
 };

 const accessToken = user?.accessToken || null;

 const getAccessToken = useCallback(async (): Promise<string | null> => {
 const { data, error } = await supabase.auth.getSession();

 if (error) {
 console.error("Failed to get access token:", error.message);
 return user?.accessToken || null;
 }

 return data.session?.access_token || user?.accessToken || null;
 }, [user?.accessToken]);
 return (
 <AuthContext.Provider
 value={{
 user,
 setUser: setUserWithTokenSync,
 accessToken,
 getAccessToken,
 isLoading,
 authInitialized,
 connectionStatus,
 signUp,
 signIn,
 signOut,
 }}
 >
 {children}
 </AuthContext.Provider>
 );
}

export function useAuth() {
 const context = useContext(AuthContext);

 if (context === undefined) {
 throw new Error("useAuth must be used within an AuthProvider");
 }

 return context;
}




