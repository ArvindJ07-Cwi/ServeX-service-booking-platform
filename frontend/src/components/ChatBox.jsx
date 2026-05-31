import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Send, Loader2, MessageSquare, Lock } from 'lucide-react';

// Socket.io needs direct connection to backend (can't go through Vercel proxy)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
    || (import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : null)
    || (typeof window !== 'undefined' && window.location.protocol === 'https:'
        ? 'https://servex-service-booking-platform.onrender.com'
        : 'http://localhost:5000');

export default function ChatBox({ bookingId, status, isAgent }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);

    const isChatActive = ['accepted', 'in_progress'].includes(status);

    useEffect(() => {
        let isMounted = true;

        const loadMessages = async () => {
            try {
                setLoading(true);
                const res = await chatAPI.getMessages(bookingId);
                if (isMounted) setMessages(res.data);
            } catch (err) {
                console.error('Failed to load messages', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        if (bookingId) {
            loadMessages();
        }

        return () => { isMounted = false; };
    }, [bookingId]);

    useEffect(() => {
        if (!isChatActive) return;

        const token = sessionStorage.getItem('servx_token') || localStorage.getItem('servx_token');
        if (!token) {
            setError('Authentication token not found');
            return;
        }

        const newSocket = io(SOCKET_URL, {
            auth: { token }
        });

        newSocket.on('connect', () => {
            newSocket.emit('join_room', { bookingId });
            setError(null); // Clear errors on successful connect
        });

        newSocket.on('receive_message', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        newSocket.on('error', (err) => {
            setError(err);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [bookingId, isChatActive]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        socket.emit('send_message', {
            bookingId,
            message: newMessage.trim()
        });

        setNewMessage('');
    };

    return (
        <div className="card flex flex-col h-[500px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-200 pb-3 mb-4">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-surface-500" />
                    <h2 className="text-sm font-semibold text-surface-900">
                        Chat with {isAgent ? 'Customer' : 'Professional'}
                    </h2>
                </div>
                {!isChatActive && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-surface-100 text-surface-500 px-2 py-1 rounded-md">
                        <Lock className="h-3 w-3" />
                        Read-only
                    </span>
                )}
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-3 px-1 relative">
                {loading ? (
                    <div className="absolute inset-0 flex justify-center items-center">
                        <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-surface-400 text-center p-4">
                        <MessageSquare className="h-8 w-8 mb-2 text-surface-200" />
                        <p className="text-sm text-surface-500">No messages yet.</p>
                        {isChatActive && <p className="text-xs text-surface-400 mt-1">Send a message to start the conversation.</p>}
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.sender_id === (user?._id || user?.id);
                        return (
                            <div key={index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                    <span className={`text-[11px] px-1 mb-1 font-medium ${isMe ? 'text-primary-600' : 'text-surface-500'}`}>
                                        {isMe ? 'You' : `${msg.sender_name || 'User'} (${msg.sender_role === 'agent' ? 'Professional' : 'Customer'})`}
                                    </span>
                                    <div className={`rounded-2xl px-4 py-2.5 ${
                                        isMe
                                            ? 'bg-primary-600 text-white rounded-br-md'
                                            : 'bg-surface-100 border border-surface-200 text-surface-900 rounded-bl-md'
                                    }`}>
                                        <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                        <p className={`text-[10px] mt-1.5 text-right ${isMe ? 'text-primary-200' : 'text-surface-400'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Error */}
            {error && <p className="text-xs text-red-500 mb-2 px-1">{error}</p>}

            {/* Input area */}
            {isChatActive ? (
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t border-surface-200 pt-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message…"
                        className="input-field flex-1"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || !socket}
                        className="btn-primary h-10 w-10 flex items-center justify-center p-0 flex-shrink-0 disabled:opacity-50"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </form>
            ) : (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-surface-200 bg-surface-50 py-3 text-sm text-surface-500">
                    <Lock className="h-3.5 w-3.5" />
                    Chat is only available during the service
                </div>
            )}
        </div>
    );
}
