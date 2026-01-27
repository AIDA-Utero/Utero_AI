'use client';

import React from 'react';
import { Message } from '@/types';

interface ChatBubbleProps {
    messages: Message[];
    currentResponse?: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ messages, currentResponse }) => {
    // Get last few messages to display
    const displayMessages = messages.slice(-4);

    return (
        <div className="w-full max-w-lg mx-auto space-y-3">
            {displayMessages.map((message, index) => (
                <div
                    key={index}
                    className={`
            flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}
            animate-fadeIn
          `}
                >
                    <div
                        className={`
              max-w-[85%] px-4 py-3 rounded-2xl
              ${message.role === 'user'
                                ? 'bg-red-600 text-white rounded-br-none'
                                : 'bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-bl-none'
                            }
            `}
                    >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                </div>
            ))}

            {/* Current response being spoken */}
            {currentResponse && messages[messages.length - 1]?.content !== currentResponse && (
                <div className="flex justify-start animate-fadeIn">
                    <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-bl-none">
                        <p className="text-sm leading-relaxed">{currentResponse}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatBubble;
