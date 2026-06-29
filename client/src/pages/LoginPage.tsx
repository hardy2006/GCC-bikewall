import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [realName, setRealName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        if (!username || !password) { setError("请填写用户名和密码"); setLoading(false); return; }
        await register({ username, password, role: "customer", phone: phone || undefined, realName: realName || undefined });
      } else {
        await login(username, password);
      }
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "操作失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2">🚲</h1>
          <h2 className="text-2xl font-bold text-gray-800">GCC广商单车墙</h2>
          <p className="text-gray-500 mt-1">{isRegister ? "注册新账号" : "登录到系统"}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="请输入用户名" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="请输入密码（至少6位）" required />
            </div>
            {isRegister && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">真实姓名（可选）</label>
                  <input type="text" value={realName} onChange={(e) => setRealName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="请输入真实姓名" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">手机号（可选）</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="请输入手机号" />
                </div>
              </>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-md transition">
              {loading ? "处理中..." : isRegister ? "注册" : "登录"}
            </button>
          </form>
          <div className="mt-4 text-center">
            <button onClick={() => setIsRegister(!isRegister)} className="text-sm text-blue-600 hover:text-blue-800">
              {isRegister ? "已有账号？去登录" : "没有账号？去注册"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}