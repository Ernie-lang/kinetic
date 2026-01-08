import { useState, useEffect, useRef, act } from 'react';
import { chatAPI } from '../services/api';
import { useUserStore } from '../store/userStore';
import ChatSidebar from '../components/ChatSidebar';

export default function Chat() {
    const { user } = useUserStore();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [remaining, setRemaining] = useState(30);
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const messageEndRef = useRef(null);

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (user?.id) {
            loadChatData();
        }
    }, [user]);

    const loadChatData = async () => {
        try {

            const [historyRes, usageRes] = await Promise.all([
                chatAPI.getHistory(user.id),
                chatAPI.getUsage(user.id),
            ]);
            
            const chatHistory = Array.isArray(historyRes.data) ? historyRes.data : [];

            
            // Group messages by date to create conversations
            const conversationMap = {};
            chatHistory.forEach(msg => {
                const msgDate = new Date(msg.created_at);
                const dateKey = msgDate.toISOString().split('T')[0]; // YYYY-MM-DD

                if (!conversationMap[dateKey]) {
                    conversationMap[dateKey] = {
                        id: dateKey,
                        date: msgDate,
                        messages: [],
                        messageCount: 0,
                        preview: ''
                    };
                }

                conversationMap[dateKey].messages.push(msg);
                conversationMap[dateKey].messageCount++;

                // Use first user message as preview
                if(msg.role === 'user' && !conversationMap[dateKey].preview) {
                    conversationMap[dateKey].preview = msg.content.substring(0, 50) +
                    (msg.content.length > 50 ? '...' : '');
                }
            });

            const conversationsList = Object.values(conversationMap).sort((a, b) => b.date - a.date);
            setConversations(conversationsList);

            // Set most recent conversation as active
            if (conversationsList.length > 0 && !activeConversationId) {
                const mostRecent = conversationsList[0];
                setActiveConversationId(mostRecent.id);
                setMessages(mostRecent.messages);
            } else if (chatHistory.length > 0 && !activeConversationId) {
                setMessages(chatHistory);
            }

            setRemaining(usageRes.data.remaining_messages);
        } catch (error) {
            console.error('Error loading chat:', error);
            setMessages([]);
        }
    };

    const loadConversations = async () => {
        try {
            const historyRes = await chatAPI.getHistory(user.id);
            const chatHistory = Array.isArray(historyRes.data) ? historyRes.data : [];
            
            // Group messages by date to create conversations
            const conversationMap = {};
            chatHistory.forEach(msg => {
                const msgDate = new Date(msg.created_at);
                const dateKey = msgDate.toISOString().split('T')[0];
                
                if (!conversationMap[dateKey]) {
                    conversationMap[dateKey] = {
                        id: dateKey,
                        date: msgDate,
                        messages: [],
                        messageCount: 0,
                        preview: ''
                    };
                }
                
                conversationMap[dateKey].messages.push(msg);
                conversationMap[dateKey].messageCount++;
                
                if (msg.role === 'user' && !conversationMap[dateKey].preview) {
                    conversationMap[dateKey].preview = msg.content.substring(0, 50) + 
                        (msg.content.length > 50 ? '...' : '');
                }
            });
    
            const conversationsList = Object.values(conversationMap).sort((a, b) => b.date - a.date);
            setConversations(conversationsList);
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    };

    const handleSelectConversation = (conversationId) => {
        const conversation = conversations.find(conv => conv.id === conversationId);
        if (conversation) {
            setActiveConversationId(conversationId);
            setMessages(conversation.messages);
            setSidebarOpen(false);
        }
    };

    const handleNewConversation = () => {
        setActiveConversationId(null);
        setMessages([]);
        setInput('');
        setSidebarOpen(false);
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setLoading(true);

        // Add user message to display immediately
        const newUserMsg = { role: 'user', content: userMessage, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, newUserMsg]);

        try {
            const response = await chatAPI.sendMessage(user.id, userMessage);

            // Add AI response
            const aiMsg = {
                role: 'assistant',
                content: response.data.response,
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, aiMsg]);

            const newRemaining = response.data.remaining_messages;
            setRemaining(newRemaining);

            // Reload conversations to update sidebar
            loadConversations();
        } catch (error) {
            console.error('Error sending message:', error);
            // Show error message
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date().toISOString()
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-600">Please connect your Strava account to use the chat.</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <ChatSidebar
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={handleSelectConversation}
                onNewConversation={handleNewConversation}
                isOpen={sidebarOpen}
                onToggle={toggleSidebar}
            />

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between max-w-4xl mx-auto">
                        <div className="flex items-center gap-3">
                            {/* Mobile Menu Button */}
                            <button
                                onClick={toggleSidebar}
                                className="lg:hidden text-gray-600 hover:text-gray-900"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>

                            <div>
                                <h1 className="text-xl font-bold text-gray-800">AI Coach</h1>
                                <p className="text-sm text-gray-600">
                                    {activeConversationId 
                                        ? `Conversation from ${new Date(activeConversationId).toLocaleDateString()}` 
                                        : 'New conversation'}
                                </p>
                            </div>
                        </div>

                        {/* Message Counter */}
                        <div className="bg-blue-50 px-3 py-1 rounded-full">
                            <p className="text-sm text-blue-600 font-medium">
                                {remaining} messages left today
                            </p>
                        </div>
                    </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="max-w-4xl mx-auto space-y-4">
                        {messages.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Start a conversation</h3>
                                <p className="text-gray-600 mb-6">Ask your AI coach anything about your training!</p>
                            </div>
                        ) : (
                            messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] p-4 rounded-lg ${
                                            msg.role === 'user'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white text-gray-800 border border-gray-200'
                                        }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        {msg.timestamp && (
                                            <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                        <p className="text-sm text-gray-600 ml-2">AI is thinking...</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messageEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="bg-white border-t border-gray-200 p-4">
                    <div className="max-w-4xl mx-auto flex gap-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask your coach anything..."
                            disabled={loading || remaining === 0}
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                            rows="3"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || loading || remaining === 0}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {loading ? 'Sending...' : 'Send'}
                        </button>
                    </div>

                    {remaining === 0 && (
                        <p className="text-center text-sm text-red-600 mt-2">
                            Daily message limit reached. Try again tomorrow!
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}