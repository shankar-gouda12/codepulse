const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface StudentInfo {
  id: number;
  usn: string;
  name: string | null;
  department: string;
  year: number;
  dob: string;
  needs_name?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: "STUDENT" | "PLACEMENT_HEAD";
  username: string;
  student?: StudentInfo;
}

export interface LeetCodeRecentProblem {
  title: string;
  external_id: string;
  url?: string;
  solved_date?: string;
}

export interface LeetCodeStats {
  connected: boolean;
  username?: string;
  profile_url?: string;
  avatar_url?: string;
  ranking?: number;
  verified?: boolean;
  last_synced_at?: string;
  sync_status?: string;
  sync_error?: string;
  total_problems?: number;
  easy?: number;
  medium?: number;
  hard?: number;
  active_days?: number;
  current_streak?: number;
  longest_streak?: number;
  last_active?: string;
  submission_calendar?: string; // JSON string "{timestamp: count}"
  recent_problems?: LeetCodeRecentProblem[];
}

export interface RankedStudent {
  rank: number;
  id: number;
  usn: string;
  name: string;
  year: number;
  department: string;
  leetcode_connected: boolean;
  username: string | null;
  avatar_url: string | null;
  global_ranking: number | null;
  total_problems: number | null;
  easy: number | null;
  medium: number | null;
  hard: number | null;
  active_days: number | null;
  current_streak: number | null;
  longest_streak: number | null;
  last_active: string | null;
  last_synced_at: string | null;
  sync_status: string | null;
}

export interface StudentDetailResponse {
  student: {
    id: number;
    usn: string;
    name: string;
    department: string;
    year: number;
    dob: string | null;
  };
  leetcode: LeetCodeStats;
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("dsatm_auth_token");
}

export function saveAuth(data: AuthResponse) {
  if (typeof window === "undefined") return;
  localStorage.setItem("dsatm_auth_token", data.access_token);
  localStorage.setItem("dsatm_user_role", data.role);
  localStorage.setItem("dsatm_username", data.username);
  if (data.student) {
    localStorage.setItem("dsatm_student_info", JSON.stringify(data.student));
  }
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("dsatm_auth_token");
  localStorage.removeItem("dsatm_user_role");
  localStorage.removeItem("dsatm_username");
  localStorage.removeItem("dsatm_student_info");
}

export function getAuthRole(): "STUDENT" | "PLACEMENT_HEAD" | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("dsatm_user_role") as any;
}

export function getStoredStudent(): StudentInfo | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("dsatm_student_info");
  return raw ? JSON.parse(raw) : null;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    (headers as any)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = "An error occurred";
    try {
      const err = await res.json();
      errorMsg = err.detail || JSON.stringify(err);
    } catch {
      errorMsg = res.statusText;
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Auth
  async studentLogin(usn: string, dob: string): Promise<AuthResponse> {
    const data = await request<AuthResponse>("/api/auth/student/login", {
      method: "POST",
      body: JSON.stringify({ usn, dob }),
    });
    saveAuth(data);
    return data;
  },

  async placementLogin(username: string, password: string): Promise<AuthResponse> {
    const data = await request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    saveAuth(data);
    return data;
  },

  async getMe(): Promise<{ username: string; role: string; student?: StudentInfo }> {
    return request("/api/auth/me");
  },

  // Student Actions
  async updateStudentProfile(name: string | null): Promise<StudentInfo> {
    const updated = await request<StudentInfo>("/api/students/me", {
      method: "PUT",
      body: JSON.stringify({ name: name !== null ? name : "" }),
    });
    const current = getStoredStudent();
    if (current) {
      localStorage.setItem("dsatm_student_info", JSON.stringify({ ...current, ...updated, needs_name: !updated.name }));
    }
    return updated;
  },

  async getMyLeetCode(): Promise<LeetCodeStats> {
    return request<LeetCodeStats>("/api/students/me/leetcode");
  },

  async connectLeetCode(username: string): Promise<{ message: string; username: string; stats?: LeetCodeStats }> {
    return request("/api/leetcode/connect", {
      method: "POST",
      body: JSON.stringify({ username }),
    });
  },

  async syncLeetCode(): Promise<{ message: string; stats?: LeetCodeStats }> {
    return request("/api/leetcode/sync", {
      method: "POST",
    });
  },

  async disconnectLeetCode(): Promise<{ message: string }> {
    return request("/api/leetcode/disconnect", {
      method: "DELETE",
    });
  },

  // Placement Actions
  async getPlacementStudents(params: {
    search?: string;
    sort_by?: string;
    dept?: string;
    min_solved?: number;
    connected_only?: boolean;
  } = {}): Promise<RankedStudent[]> {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.sort_by) query.set("sort_by", params.sort_by);
    if (params.dept) query.set("dept", params.dept);
    if (params.min_solved !== undefined && params.min_solved !== null) {
      query.set("min_solved", params.min_solved.toString());
    }
    if (params.connected_only) query.set("connected_only", "true");

    const qs = query.toString();
    return request<RankedStudent[]>(`/api/placement/students${qs ? `?${qs}` : ""}`);
  },

  async getStudentDetails(studentId: number): Promise<StudentDetailResponse> {
    return request<StudentDetailResponse>(`/api/placement/students/${studentId}`);
  },

  getReportDownloadUrl(type: "csv" | "excel" | "pdf", params: {
    search?: string;
    sort_by?: string;
    dept?: string;
    min_solved?: number;
    connected_only?: boolean;
  } = {}): string {
    const token = getStoredToken();
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.sort_by) query.set("sort_by", params.sort_by);
    if (params.dept) query.set("dept", params.dept);
    if (params.min_solved !== undefined && params.min_solved !== null) {
      query.set("min_solved", params.min_solved.toString());
    }
    if (params.connected_only) query.set("connected_only", "true");

    return `${API_BASE}/api/placement/reports/${type}?${query.toString()}`;
  },

  async downloadReportBlob(type: "csv" | "excel" | "pdf", params: any = {}): Promise<Blob> {
    const token = getStoredToken();
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.sort_by) query.set("sort_by", params.sort_by);
    if (params.dept) query.set("dept", params.dept);
    if (params.min_solved !== undefined && params.min_solved !== null) {
      query.set("min_solved", params.min_solved.toString());
    }
    if (params.connected_only) query.set("connected_only", "true");

    const res = await fetch(`${API_BASE}/api/placement/reports/${type}?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Report download failed with status ${res.status}`);
    }

    return res.blob();
  }
};

