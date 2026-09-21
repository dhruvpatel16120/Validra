import { AdminUser, UserRole, UserStatus } from "@/types/admin";
import { apiClient } from "@/services/api";

export interface BackendUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  badge_number?: string | null;
  jurisdiction?: string | null;
  created_at: string;
}

let MOCK_USERS: AdminUser[] = [
  {
    id: "usr-01",
    name: "Dhruv Patel",
    email: "admin@validra.gov.in",
    role: "admin",
    status: "active",
    createdAt: "2026-01-10",
    lastActive: "Just now",
    inspectionsCount: 142,
    jurisdiction: "National Oversight",
  },
  {
    id: "usr-02",
    name: "Rajesh Sharma",
    email: "rajesh.sharma@lm.gov.in",
    role: "inspector",
    status: "active",
    createdAt: "2026-02-15",
    lastActive: "15 mins ago",
    inspectionsCount: 342,
    jurisdiction: "Delhi NCR - Zone A",
  },
];

function mapBackendToAdminUser(u: BackendUser): AdminUser {
  let role: UserRole = "inspector";
  const r = (u.role || "").toLowerCase();
  if (r === "admin") role = "admin";
  else if (r === "supervisor") role = "supervisor";

  let status: UserStatus = u.is_active ? "active" : "inactive";
  if (!u.is_active && !u.is_verified) {
    status = "invited";
  }

  const createdDate = u.created_at
    ? typeof u.created_at === "string"
      ? u.created_at.slice(0, 10)
      : new Date(u.created_at).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return {
    id: u.id,
    name: u.full_name || u.email.split("@")[0],
    email: u.email,
    role,
    status,
    createdAt: createdDate,
    lastActive: u.is_active ? "Active" : "Pending Approval",
    inspectionsCount: 0,
    jurisdiction: u.jurisdiction || "—",
  };
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    const data = await apiClient.get<BackendUser[]>("/api/admin/users");
    if (Array.isArray(data) && data.length > 0) {
      return data.map(mapBackendToAdminUser);
    }
    return [...MOCK_USERS];
  } catch (err) {
    console.warn("Could not fetch users from backend, falling back to mock:", err);
    return [...MOCK_USERS];
  }
}

export async function getAdminUserById(id: string): Promise<AdminUser | null> {
  try {
    const data = await apiClient.get<BackendUser>(`/api/admin/users/${id}`);
    if (data?.id) {
      return mapBackendToAdminUser(data);
    }
  } catch {
    // Fall back to memory
  }
  const user = MOCK_USERS.find((u) => u.id === id);
  return user ? { ...user } : null;
}

export async function approveInspector(id: string): Promise<AdminUser> {
  try {
    const res = await apiClient.post<BackendUser>(`/api/admin/users/${id}/approve`);
    return mapBackendToAdminUser(res);
  } catch {
    // Fallback toggle
    return toggleUserStatus(id, "active");
  }
}

export async function updateUserRole(id: string, role: UserRole): Promise<AdminUser> {
  try {
    const res = await apiClient.patch<BackendUser>(`/api/admin/users/${id}`, { role });
    return mapBackendToAdminUser(res);
  } catch {
    const index = MOCK_USERS.findIndex((u) => u.id === id);
    if (index !== -1) {
      MOCK_USERS[index] = { ...MOCK_USERS[index], role };
      return { ...MOCK_USERS[index] };
    }
    throw new Error("User not found");
  }
}

export async function toggleUserStatus(id: string, status: UserStatus): Promise<AdminUser> {
  try {
    const res = await apiClient.patch<BackendUser>(`/api/admin/users/${id}`, {
      is_active: status === "active",
      is_verified: status === "active" ? true : undefined,
    });
    return mapBackendToAdminUser(res);
  } catch {
    const index = MOCK_USERS.findIndex((u) => u.id === id);
    if (index !== -1) {
      MOCK_USERS[index] = { ...MOCK_USERS[index], status };
      return { ...MOCK_USERS[index] };
    }
    throw new Error("User not found");
  }
}

export async function deleteUser(id: string): Promise<void> {
  try {
    await apiClient.delete(`/api/admin/users/${id}`);
  } catch {
    MOCK_USERS = MOCK_USERS.filter((u) => u.id !== id);
  }
}

export async function inviteInspector(data: {
  name: string;
  email: string;
  jurisdiction: string;
  role: UserRole;
  password?: string;
  badgeNumber?: string;
}): Promise<AdminUser> {
  try {
    const res = await apiClient.post<BackendUser>("/api/admin/users", {
      email: data.email,
      password: data.password || "ValidraPass2026!",
      full_name: data.name,
      role: data.role,
      badge_number: data.badgeNumber,
      jurisdiction: data.jurisdiction,
    });
    return mapBackendToAdminUser(res);
  } catch {
    const newUser: AdminUser = {
      id: `usr-0${MOCK_USERS.length + 1}`,
      name: data.name,
      email: data.email,
      jurisdiction: data.jurisdiction,
      role: data.role,
      status: "invited",
      createdAt: new Date().toISOString().split("T")[0],
      lastActive: "Invited",
      inspectionsCount: 0,
    };
    MOCK_USERS = [newUser, ...MOCK_USERS];
    return { ...newUser };
  }
}

export async function bulkUpdateUserStatus(ids: string[], status: UserStatus): Promise<void> {
  for (const id of ids) {
    try {
      await toggleUserStatus(id, status);
    } catch {
      // Continue next
    }
  }
}
