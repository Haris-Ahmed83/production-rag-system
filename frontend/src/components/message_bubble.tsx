import ReactMarkdown from "react-markdown";

interface Source {
  source: string;
  page: string | null;
  chunk_id: string | null;
  reference: string;
}

interface MessageBubbleProps {
  text: string;
  isUser: boolean;
  sources?: Source[];
}

function MessageBubble({ text, isUser, sources }: MessageBubbleProps) {
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} message-enter`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-5 py-3 ${
          isUser
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-white border border-gray-200 rounded-bl-md shadow-sm"
        }`}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed">{text}</p>
        ) : (
          <>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>

            {sources && sources.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  Sources
                </p>
                {sources.map((source, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 rounded-lg p-2.5 mb-2 text-xs text-gray-600"
                  >
                    <p className="font-medium text-gray-800">
                      [{idx + 1}] {source.source}
                    </p>
                    {source.page && (
                      <p className="text-gray-500">Page: {source.page}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
