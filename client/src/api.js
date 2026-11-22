const configuredApiUrl = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? 'https://green-kabbar-ai.onrender.com' : '');
export const API_BASE_URL = configuredApiUrl.replace(/\/+$/, '');
export const tok=()=>localStorage.getItem('gk_token');

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = { Accept: 'application/json' };
  const token = tok();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    method,
    headers,
    body: form || (body ? JSON.stringify(body) : undefined),
  });
  const responseText = await response.text();
  let data = {};
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      if (response.ok) throw new Error('The server returned an invalid response.');
    }
  }
  if (!response.ok) {
    const message = typeof data.error === 'string'
      ? data.error
      : typeof data.error?.message === 'string'
        ? data.error.message
        : `Request failed (${response.status}).`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}
