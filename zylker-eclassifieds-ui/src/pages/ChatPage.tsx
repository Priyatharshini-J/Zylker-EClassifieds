import { useState } from "react";
import { FaPaperPlane } from "react-icons/fa";

const ChatPage = () => {
  const [botMessage, setBotMessages] = useState([
    { id: 1, text: "Hello! How can we help you today?", isUser: false },
  ]);
  const [chatMessage, setChatMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    setBotMessages((prev) => [
      ...prev,
      { id: Date.now(), text: chatMessage, isUser: true },
    ]);
    setChatMessage("");

    // Simulate response
    setTimeout(() => {
      setBotMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "Thanks for your message! Our team will get back to you soon.",
          isUser: false,
        },
      ]);
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-8">Chat with Us</h2>

      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="h-96 overflow-y-auto mb-4 space-y-4">
          {botMessage.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.isUser ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.isUser
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border border-gray-300 p-2 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
          >
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
