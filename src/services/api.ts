import type { PortfolioData } from '../types/portfolio';
import { fallbackData } from '../data/fallback';

const API_URL = import.meta.env.VITE_GAS_API_URL?.trim();

async function callApi<T>(
  action: string,
  payload: Record<string, unknown> = {},
  token = '',
): Promise<T> {
  if (!API_URL) throw new Error('API is not configured');

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, payload, token }),
  });
  const result = await response.json();

  if (!result.ok) throw new Error(result.error || 'Request failed');
  return result.data as T;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(new Error('Unable to read the selected file'));
    reader.readAsDataURL(file);
  });
}

export async function getPortfolio(): Promise<PortfolioData> {
  try {
    return await callApi<PortfolioData>('getPortfolio');
  } catch {
    return fallbackData;
  }
}

export const adminApi = {
  login: (username: string, password: string) =>
    callApi<{ token: string; expiresAt: string }>('login', { username, password }),
  logout: (token: string) => callApi('logout', {}, token),
  dashboard: (token: string) => callApi('getDashboard', {}, token),
  list: <T>(module: string, token: string) =>
    callApi<T[]>('adminList', { module }, token),
  save: <T>(module: string, record: T, token: string) =>
    callApi<T>('adminSave', { module, record }, token),
  remove: (module: string, id: string, token: string) =>
    callApi('adminDelete', { module, id }, token),
  changePassword: (currentPassword: string, newPassword: string, token: string) =>
    callApi('changePassword', { currentPassword, newPassword }, token),
  uploadDocument: async (file: File, kind: string, token: string) => {
    const base64 = await readFileAsBase64(file);
    return callApi<Record<string, unknown>>(
      'uploadDocument',
      { name: file.name, kind, mimeType: file.type, base64 },
      token,
    );
  },
};
