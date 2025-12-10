import React from "react";

const ChatSidebar = ({
    conversations,
    activeConversationId,
    onSelectConversation,
    onNewConversation,
    isOpen,
    onToggle
}) => {

    const groupConversationsByDate = (conversations) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastMonth = new Date(today);
        lastMonth.setDate(lastMonth.getDate() - 30);
    
        const groups = {
          today: [],
          yesterday: [],
          lastWeek: [],
          lastMonth: [],
          older: []
        };
    
        conversations.forEach(conv => {
          // Parse the id (YYYY-MM-DD) to create a reliable date
          const dateStr = conv.id; // Use the id which is already in YYYY-MM-DD format
          const [year, month, day] = dateStr.split('-').map(Number);
          const convDate = new Date(year, month - 1, day); // month is 0-indexed
          const convDay = new Date(convDate.getFullYear(), convDate.getMonth(), convDate.getDate());
    
          if (convDay.getTime() === today.getTime()) {
            groups.today.push(conv);
          } else if (convDay.getTime() === yesterday.getTime()) {
            groups.yesterday.push(conv);
          } else if (convDate >= lastWeek) {
            groups.lastWeek.push(conv);
          } else if (convDate >= lastMonth) {
            groups.lastMonth.push(conv);
          } else {
            groups.older.push(conv);
          }
        });
    
        return groups;
    };

    const groupedConversations = groupConversationsByDate(conversations);

    const ConversationGroup = ({ title, conversations }) => {
        if (conversations.length === 0) return null;

        return (
            <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4">
                    {title}
                </h3>
                <div className="space-y-1">
                    {conversations.map((conv) => (
                        <button
                            key={conv.id}
                            onClick={() => onSelectConversation(conv.id)}
                            className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                                activeConversationId === conv.id ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {conv.preview || 'New conversation'}
                                    </p>
                                    <p className="text-xs opacity-75 mt-1">
                                        {new Date(conv.date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <span className="text-xs opacity-60 ml-2">
                                    {conv.messageCount} msgs
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        )
    };

    return (
        <>
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={onToggle}
                />
            )}
            <div 
                className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-80 bg-white border-r border-gray-200
                transform transition-transform duration-300 ease-in-out lg:transform-none
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
                flex flex-col
                `}
            >
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-gray-800">Chat History</h2>
                        <button onClick={onToggle} className="lg:hidden text-gray-500 hover:text-gray-700">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <button onClick={onNewConversation} className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Conversation
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                    {conversations.length === 0 ? (
                        <div className="px-4 text-center text-gray-500 mt-8">
                            <p className="text-sm">No conversations yet.</p>
                            <p className="text-xs mt-2">Start chatting with your AI coach!</p>
                        </div>
                    ) : (
                        <>
                            <ConversationGroup title="Today" conversations={groupedConversations.today} />
                            <ConversationGroup title="Yesterday" conversations={groupedConversations.yesterday} />
                            <ConversationGroup title="Last 7 Days" conversations={groupedConversations.lastWeek} />
                            <ConversationGroup title="Last 30 Days" conversations={groupedConversations.lastMonth} />
                            <ConversationGroup title="Older" conversations={groupedConversations.older} />
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <p className="text-xs text-gray-600 text-center">
                        Your conversations are private and secure
                    </p>
                </div>
            </div>
        </>
    );
};

export default ChatSidebar;