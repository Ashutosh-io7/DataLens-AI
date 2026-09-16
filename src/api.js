// src/api.js
// Single source of truth for the backend API base URL.
// Set VITE_API_URL in your .env file to override for production.

export const API_BASE =
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export const endpoints = {
  datasets:        `${API_BASE}/api/datasets`,
  uploadDataset:   `${API_BASE}/api/datasets/upload`,
  getDataset:      (id) => `${API_BASE}/api/datasets/${id}`,
  queryDataset:    (id) => `${API_BASE}/api/datasets/${id}/query`,
};