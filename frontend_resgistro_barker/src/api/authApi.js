const API_URL = import.meta.env.VITE_API_AUTH // URL del backend

export const loginUser = async (email, password) => {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });


  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Error en el login");
  return data;
};

export const registerUser = async (adminName, email, password) => {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ adminName, email, password }),
  });

  const data = await response.json();

  if (!response.ok) throw new Error(data.message || "Error en el registro");
  return data;
};
