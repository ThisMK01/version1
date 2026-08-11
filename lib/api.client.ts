const API_URL =process.env.NEXT_PUBLIC_API_URL ;

async function apiFetch(
  path: string,
  options: RequestInit = {}
) {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  return fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...(options.headers || {}),
    },
  });
}

export const apiClient = {
  auth: {
    steamLogin() {
      window.location.href = "/api/auth/steam";
    },

    discordConnect() {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const targetUrl = token
        ? `${apiUrl}/auth/discord/connect?token=${encodeURIComponent(token)}`
        : `${apiUrl}/auth/discord/connect`;
      window.location.href = targetUrl;
    },

    async me() {
      return apiFetch("/auth/me");
    },

    async logout() {
      return apiFetch("/auth/logout", { method: "POST" });
    },
  },

  events: {
    async getAll() {
      return apiFetch("/events");
    },

    async getById(id: string) {
      return apiFetch(`/events/${id}`);
    },

    async create(data: unknown) {
      return apiFetch("/events", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async update(id: string, data: unknown) {
      return apiFetch(`/events/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
  },

  acc: {
    async getCars() {
      return apiFetch("/api/acc/cars");
    },
  },
};