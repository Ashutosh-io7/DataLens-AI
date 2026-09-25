// src/api.js
// Single source of truth for the backend API base URL.
// Set VITE_API_URL in your .env file to override for production.

export const API_BASE =
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export const endpoints = {
  datasets:          `${API_BASE}/api/datasets`,
  uploadDataset:     `${API_BASE}/api/datasets/upload`,
  getDataset:        (id) => `${API_BASE}/api/datasets/${id}`,
  queryDataset:      (id) => `${API_BASE}/api/datasets/${id}/query`,
  deleteDataset:     (id) => `${API_BASE}/api/datasets/${id}`,
  health:            `${API_BASE}/api/datasets/health`,  
  charts:            `${API_BASE}/api/datasets/charts`,
  getConversation:   (id) => `${API_BASE}/api/datasets/${id}/conversation`,
  clearConversation: (id) => `${API_BASE}/api/datasets/${id}/conversation`,
  signup:            `${API_BASE}/api/auth/signup`,
  login:             `${API_BASE}/api/auth/login`,
  me:                `${API_BASE}/api/auth/me`,
};