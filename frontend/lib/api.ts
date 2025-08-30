// frontend/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = {
  register: async (
    email: string,
    password: string,
    full_name: string,
    age: number,
    gender: string
  ) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name, age, gender }), // Include new fields
    });
    return res;
  },
  login: (email: string, password: string) =>
    fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }), // Correct format for login
    }),
  uploadPdf: (file: File, token: string) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${API_URL}/upload/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  },
};
