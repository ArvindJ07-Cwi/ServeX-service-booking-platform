import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Send, Loader2, Info } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : 'http://localhost:5000';

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
            <h2 className="text-lg font-bold text-surface-900 mb-4 border-b border-surface-100 pb-2 flex items-center gap-2">
                Chat with {isAgent ? 'Customer' : 'Professional'}
                {!isChatActive && <span className="text-xs font-normal bg-surface-100 text-surface-600 px-2 py-0.5 rounded-full">Read-Only</span>}
            </h2>
            
            <div className="flex-1 overflow-y-auto mb-4 space-y-3 p-3 bg-surface-50 rounded-xl relative border border-surface-100">
                {loading ? (
                    <div className="absolute inset-0 flex justify-center items-center bg-surface-50/50">
                        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-surface-400 p-4 text-center">
                        <Info className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">No messages yet. {isChatActive && "Send a message to start!"}</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.sender_id === (user?._id || user?.id);
                        return (
                            <div key={index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                                <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                                    <span className={`text-[11px] px-1 mb-1 font-medium ${isMe ? 'text-primary-600' : 'text-surface-600'}`}>
                                        {isMe ? 'You' : `${msg.sender_name || 'User'} (${msg.sender_role === 'agent' ? 'Professional' : 'Customer'})`}
                                    </span>
                                    <div className={`rounded-2xl px-4 py-2 ${
                                        isMe 
                                            ? 'bg-primary-600 text-white rounded-br-sm shadow-sm' 
                                            : 'bg-white border border-surface-200 text-surface-800 rounded-bl-sm shadow-sm'
                                    }`}>
                                        <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                                        <p className={`text-[10px] mt-1.5 text-right font-medium ${isMe ? 'text-primary-200' : 'text-surface-400'}`}>
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

            {error && <p className="text-xs text-red-500 mb-2 px-1">{error}</p>}

            {isChatActive ? (
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="input-field flex-1"
                    />
                    <button 
                        type="submit" 
                        disabled={!newMessage.trim() || !socket} 
                        className="btn-primary w-12 flex items-center justify-center px-0 flex-shrink-0 disabled:opacity-50"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </form>
            ) : (
                <div className="bg-surface-100 text-surface-500 text-center py-3 text-sm rounded-lg flex items-center justify-center gap-2">
                    Chat is only available during the service
                </div>
            )}
        </div>
    );
}
