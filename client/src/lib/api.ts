// VITE_API_BASE_URL 在 .env 中配置
// 生产环境: VITE_API_BASE_URL=https://your-backend.railway.app/api
// 开发环境: VITE_API_BASE_URL=/api（通过 Vite proxy 转发）
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  };

  // 只有带 body 的请求才设 Content-Type（避免 OPTIONS 预检请求）
  if (fetchOptions.body) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
      // 添加请求超时和重试机制
      signal: AbortSignal.timeout(10000) // 10秒超时
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接');
    }
    throw new Error(`网络错误：无法连接到服务器 — ${err.message}`);
  }

  // 先检查响应状态，再尝试解析 JSON
  let data: any;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `服务器返回了非 JSON 响应 (HTTP ${response.status})。` +
      `请检查后端是否正常运行，或 Railway 环境变量 PORT 是否已设为 8080。`
    );
  }

  if (!response.ok) {
    throw new Error(data.error || `请求失败 (${response.status})`);
  }

  return data;
}

// 带 token 的请求（自动从 localStorage 获取）
export function authFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  return apiFetch<T>(endpoint, { ...options, token: token || undefined });
}
