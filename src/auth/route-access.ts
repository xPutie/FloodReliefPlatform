import type { WorkspaceAccess } from "./auth-types";

export const WORKSPACE_ROUTES: Record<string, WorkspaceAccess> = {
  "/": {
    route: "/",
    role: "CITIZEN",
    title: "Người dân",
    subtitle: "Yêu cầu & theo dõi cứu hộ",
    accessType: "PUBLIC",
  },
  "/dieu-phoi": {
    route: "/dieu-phoi",
    role: "COORDINATOR",
    title: "Điều phối",
    subtitle: "Xác minh & phân công cứu hộ",
    accessType: "INTERNAL",
  },
  "/doi-cuu-ho": {
    route: "/doi-cuu-ho",
    role: "TEAM_MEMBER",
    title: "Đội cứu hộ",
    subtitle: "Thực thi nhiệm vụ cứu hộ",
    accessType: "INTERNAL",
  },
  "/cuu-tro": {
    route: "/cuu-tro",
    role: "RELIEF_STAFF",
    title: "Cứu trợ",
    subtitle: "Nhu cầu & nguồn lực cứu trợ",
    accessType: "INTERNAL",
  },
  "/quan-tri": {
    route: "/quan-tri",
    role: "ADMIN",
    title: "Quản trị",
    subtitle: "Giám sát & chỉ huy hệ thống",
    accessType: "INTERNAL",
  },
};

export function getWorkspaceRoleInfo(pathname: string): WorkspaceAccess {
  const rootAccess = WORKSPACE_ROUTES["/"];
  if (pathname === "/" && rootAccess) return rootAccess;
  
  for (const key of Object.keys(WORKSPACE_ROUTES)) {
    if (key !== "/" && pathname.startsWith(key)) {
      const match = WORKSPACE_ROUTES[key];
      if (match) return match;
    }
  }

  return (
    rootAccess || {
      route: "/",
      role: "CITIZEN",
      title: "Người dân",
      subtitle: "Yêu cầu & theo dõi cứu hộ",
      accessType: "PUBLIC",
    }
  );
}

export function isPublicRoute(pathname: string): boolean {
  return getWorkspaceRoleInfo(pathname).accessType === "PUBLIC";
}

export function isInternalWorkspace(pathname: string): boolean {
  return getWorkspaceRoleInfo(pathname).accessType === "INTERNAL";
}
