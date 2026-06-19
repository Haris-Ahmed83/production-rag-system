type Page = "chat" | "dashboard";

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  username: string;
  onLogout: () => void;
}

function Sidebar({ currentPage, onPageChange, username, onLogout }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-5 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900">RAG System</h1>
        <p className="text-xs text-gray-500 mt-1">Knowledge Assistant</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={() => onPageChange("chat")}
          className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            currentPage === "chat"
              ? "bg-blue-50 text-blue-700"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          Chat
        </button>

        <button
          onClick={() => onPageChange("dashboard")}
          className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            currentPage === "dashboard"
              ? "bg-blue-50 text-blue-700"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          Dashboard
        </button>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-2">{username}</p>
        <button
          onClick={onLogout}
          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
