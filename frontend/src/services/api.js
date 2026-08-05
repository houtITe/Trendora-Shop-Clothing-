// Thin wrapper around fetch() for talking to the Trendora backend.
//
// - Base URL is '/api' — Vite's dev proxy (see vite.config.js) forwards
//   that to http://localhost:5000, so no CORS setup is needed in dev.
// - credentials: 'include' is required on every call so the browser sends
//   the httpOnly accessToken/refreshToken cookies the backend sets on
//   login/register (see backend/src/controllers/authController.js).
// - The backend always responds with { success, message, data } or
//   { success, message, errors }. We unwrap that here so callers just get
//   back `data` (or a thrown Error with a readable message) instead of
//   having to check response.ok / .success everywhere by hand.

const BASE_URL = '/api';

class ApiRequestError extends Error {
  constructor(message, { status, errors } = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.errors = errors;
  }
}

async function request(path, { method = 'GET', body, headers } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include', // send/receive the httpOnly auth cookies
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // 204 No Content or an empty body — nothing to parse.
  const text = await res.text();
  const payload = text ? JSON.parse(text) : {};

  if (!res.ok || payload.success === false) {
    const message =
      payload.message ||
      payload.errors?.[0]?.msg ||
      `Request failed with status ${res.status}`;
    throw new ApiRequestError(message, { status: res.status, errors: payload.errors });
  }

  return payload.data;
}

async function requestForm(path, { method = 'POST', formData } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    // Deliberately no Content-Type header — the browser sets
    // "multipart/form-data; boundary=..." itself, which fetch can only do
    // correctly if we don't set Content-Type manually.
    body: formData,
  });

  const text = await res.text();
  const payload = text ? JSON.parse(text) : {};

  if (!res.ok || payload.success === false) {
    const message =
      payload.message ||
      payload.errors?.[0]?.msg ||
      `Request failed with status ${res.status}`;
    throw new ApiRequestError(message, { status: res.status, errors: payload.errors });
  }

  return payload.data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
  postForm: (path, formData) => requestForm(path, { method: 'POST', formData }),
  putForm: (path, formData) => requestForm(path, { method: 'PUT', formData }),
};

export { ApiRequestError };
