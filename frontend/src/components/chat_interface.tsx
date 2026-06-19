import { useState, useRef, useEffect } from "react";
import MessageBubble from "./message_bubble";
import DocumentUploader from "./document_uploader";
import { askQuestion } from "../hooks/use_rag_api";

interface Message {
  text: string;
  isUser: boolean;
  sources?: Array<{
    source: string;
    page: string | null;
    chunk_id: string | null;
    reference: string;
  }>;
}

interface ChatInterfaceProps {
  token: string;
}

function ChatInterface({ token }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I am your knowledge assistant. Upload documents and ask me questions about them.",
      isUser: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { text: question, isUser: true }]);
    setLoading(true);

    try {
      const result = await askQuestion(question, token);

      setMessages((prev) => [
        ...prev,
        {
          text: result.answer,
          isUser: false,
          sources: result.sources,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          text: `Error: ${err.message}`,
          isUser: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showUpload ? "Close Upload" : "Upload Document"}
        </button>
      </div>

      {showUpload && (
        <div className="border-b border-gray-200 bg-gray-50">
          <DocumentUploader token={token} />
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, idx) => (
          <MessageBubble
            key={idx}
            text={msg.text}
            isUser={msg.isUser}
            sources={msg.sources}
          />
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-5 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="px-6 py-4 border-t border-gray-200 bg-white">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your documents..."
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatInterface;
