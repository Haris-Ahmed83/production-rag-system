import { useState } from "react";
import Sidebar from "./components/sidebar";
import ChatInterface from "./components/chat_interface";
import Dashboard from "./components/dashboard";

type Page = "chat" | "dashboard";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("chat");
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");

  if (!token) {
    return <LoginForm onLogin={handleLogin} />;
  }

  function handleLogin(newToken: string, user: string) {
    setToken(newToken);
    setUsername(user);
  }

  function handleLogout() {
    setToken(null);
    setUsername("");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        username={username}
        onLogout={handleLogout}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {currentPage === "chat" && <ChatInterface token={token} />}
        {currentPage === "dashboard" && <Dashboard token={token} />}
      </main>
    </div>
  );
}

function LoginForm({ onLogin }: { onLogin: (token: string, user: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || (isRegister ? "Registration failed" : "Login failed"));
      }

      if (isRegister) {
        setIsRegister(false);
        setError("Registration successful! Please sign in.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      onLogin(data.access_token, username);
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">RAG System</h1>
          <p className="text-gray-500">{isRegister ? "Create Account" : "Knowledge Assistant Login"}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <p className={`text-sm ${error.includes("successful") ? "text-green-500" : "text-red-500"}`}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Please wait..." : isRegister ? "Register" : "Sign In"}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-500">
          {isRegister ? "Already have an account? " : "Don't have an account? "}
          <button
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
            className="text-blue-600 hover:underline font-medium"
          >
            {isRegister ? "Sign In" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default App;
