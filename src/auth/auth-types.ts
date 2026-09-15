export type UserRole = 
  | "CITIZEN"
  | "COORDINATOR"
  | "TEAM_MEMBER"
  | "RELIEF_STAFF"
  | "ADMIN";

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
}

export type AccessType = "PUBLIC" | "INTERNAL";

export interface WorkspaceAccess {
  route: string;
  role: UserRole;
  title: string;
  subtitle: string;
  accessType: AccessType;
}

export interface SessionState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  loading: boolean;
  status: "UNAUTHENTICATED" | "AUTHENTICATED" | "DEMO_MODE" | "EXPIRED";
}
