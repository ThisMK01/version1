const API_URL =process.env.NEXT_PUBLIC_API_URL ;

async function apiFetch(
  path: string,
  options: RequestInit = {}
) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

export const apiClient = {
  auth: {
    steamLogin() {
      window.location.href = "/api/auth/steam";
    },

    async me() {
      return apiFetch("/auth/me");
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