import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    FaPaperPlane, FaImage, FaProjectDiagram, FaInfoCircle,
    FaUserCircle, FaCheckDouble, FaBriefcase, FaClock,
    FaDollarSign, FaExternalLinkAlt, FaRobot, FaSearch,
    FaChevronRight, FaPlus
} from 'react-icons/fa';

export default function MessagesPage() {
    const { user } = useAuth();
    const { conversationId } = useParams();
    const navigate = useNavigate();

    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const prevMessageCount = useRef(0);

    const activeConversation = conversations.find(c => c.id === parseInt(conversationId));

    // Fetch conversation list
    const fetchConversations = useCallback(async () => {
        try {
            const res = await api.get('/chat/conversations/');
            setConversations(res.data);
            setLoadingConversations(false);
        } catch (error) {
            console.error('Failed to load conversations', error);
            setLoadingConversations(false);
        }
    }, []);

    // Fetch messages for active conversation
    const fetchMessages = useCallback(async () => {
        if (!conversationId) return;
        try {
            const res = await api.get(`/chat/conversations/${conversationId}/messages/`);
            setMessages(res.data);

            // Mark as read
            await api.post(`/chat/conversations/${conversationId}/read/`);
        } catch (error) {
            console.error('Failed to load messages', error);
        }
    }, [conversationId]);

    // Initial load & Polling setup
    useEffect(() => {
        fetchConversations();
        const interval = setInterval(() => {
            fetchConversations();
            fetchMessages();
        }, 5000);

        return () => clearInterval(interval);
    }, [fetchConversations, fetchMessages]);

    // Notification Logic
    useEffect(() => {
        if (messages.length > prevMessageCount.current) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg && lastMsg.sender !== user?.id) {
                toast('New message received', {
                    icon: '💬',
                    style: {
                        borderRadius: '12px',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--accent-primary)',
                        boxShadow: 'var(--shadow-lg)'
                    },
                });
            }
        }
        prevMessageCount.current = messages.length;
    }, [messages, user?.id]);

    // Initial load for messages when conversation changes
    useEffect(() => {
        if (conversationId) {
            setLoadingMessages(true);
            fetchMessages().then(() => setLoadingMessages(false));
        } else {
            setMessages([]);
        }
    }, [conversationId, fetchMessages]);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachment) || !conversationId) return;

        setSending(true);
        const formData = new FormData();
        if (newMessage.trim()) formData.append('text', newMessage);
        if (attachment) formData.append('attachment', attachment);

        try {
            const res = await api.post(`/chat/conversations/${conversationId}/messages/`, formData);
            setMessages(prev => [...prev, res.data]);
            setNewMessage('');
            setAttachment(null);
        } catch {
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const getOtherParticipant = (participants) => {
        return participants?.find(p => p.id !== user?.id);
    };

    const templates = [
        "I'm interested in your project requirements.",
        "Could you provide a detailed timeline?",
        "What is the total budget for this scope?",
        "Can we hop on a quick call to discuss?",
        "I'll get back to you with a proposal soon."
    ];

    if (!user) return <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '20px' }}>Please login to view messages.</h2>
        <Link to="/login" className="btn btn-primary">Login Now</Link>
    </div>;

    const totalUnread = conversations.reduce((acc, c) => acc + c.unread_count, 0);

    return (
        <div className="container" style={{
            padding: '20px 0',
            height: 'calc(100vh - 80px)',
            overflow: 'hidden',
        }}>
            <div style={{
                display: 'flex',
                height: '100%',
                background: 'rgba(255, 255, 255, 0.01)',
                borderRadius: '24px',
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(20px)'
            }}>

                {/* 1. Conversations Sidebar */}
                <div style={{
                    width: '340px',
                    background: 'rgba(15, 15, 15, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRight: '1px solid var(--border-color)',
                }}>
                    <div style={{ padding: '30px 24px', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Messages
                            </h2>
                            {totalUnread > 0 && (
                                <span style={{ background: 'var(--accent-secondary)', color: '#fff', padding: '2px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '800', boxShadow: '0 0 10px var(--accent-secondary)' }}>
                                    {totalUnread} NEW
                                </span>
                            )}
                        </div>
                        <div style={{ position: 'relative' }}>
                            <FaSearch style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)' }} size={14} />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                style={{
                                    width: '100%',
                                    padding: '10px 10px 10px 40px',
                                    borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.85rem'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1, padding: '10px' }}>
                        {loadingConversations ? (
                            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <div className="spinner" style={{ margin: '0 auto 15px' }}></div>
                                <span>Loading Chats...</span>
                            </div>
                        ) : conversations.length === 0 ? (
                            <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <FaRobot size={50} style={{ marginBottom: '20px', opacity: 0.1 }} />
                                <p style={{ fontSize: '0.9rem' }}>No active conversations yet.</p>
                            </div>
                        ) : (
                            conversations.map(conv => {
                                const isActive = parseInt(conversationId) === conv.id;
                                const other = getOtherParticipant(conv.participants);
                                return (
                                    <div
                                        key={conv.id}
                                        onClick={() => navigate(`/messages/${conv.id}`)}
                                        style={{
                                            padding: '16px',
                                            cursor: 'pointer',
                                            borderRadius: '16px',
                                            marginBottom: '8px',
                                            background: isActive ? 'rgba(108, 99, 255, 0.15)' : 'transparent',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            display: 'flex',
                                            gap: '12px',
                                            alignItems: 'center',
                                            position: 'relative'
                                        }}
                                        onMouseOver={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                        onMouseOut={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '16px',
                                            background: 'var(--accent-gradient)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            fontWeight: '800',
                                            fontSize: '1.2rem',
                                            boxShadow: isActive ? '0 8px 15px rgba(108, 99, 255, 0.3)' : 'none'
                                        }}>
                                            {other?.username?.slice(0, 1).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: isActive ? '800' : '600', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                                    {other?.username}
                                                </span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                    {conv.last_message ? new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: isActive ? 'var(--text-primary)' : 'var(--text-muted)', opacity: isActive ? 1 : 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {conv.last_message?.text || (conv.last_message?.attachment ? 'Sent an image' : 'No messages yet')}
                                            </div>
                                        </div>
                                        {conv.unread_count > 0 && (
                                            <div style={{
                                                width: '10px',
                                                height: '10px',
                                                background: 'var(--accent-secondary)',
                                                borderRadius: '50%',
                                                position: 'absolute',
                                                right: '10px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                boxShadow: '0 0 8px var(--accent-secondary)'
                                            }}></div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 2. Main Chat Area */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'radial-gradient(circle at top right, rgba(108, 99, 255, 0.05) 0%, transparent 50%)',
                    position: 'relative'
                }}>
                    {!conversationId ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
                            <div style={{
                                width: '120px',
                                height: '120px',
                                background: 'rgba(108, 99, 255, 0.1)',
                                borderRadius: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '24px',
                                color: 'var(--accent-primary)'
                            }}>
                                <FaPaperPlane size={48} style={{ transform: 'rotate(-45deg)', marginLeft: '8px' }} />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '12px' }}>Welcome to Workspace</h2>
                            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', lineHeight: '1.6' }}>
                                Select a conversation to start collaborating with buyers and sellers on your projects.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div style={{
                                padding: '16px 30px',
                                borderBottom: '1px solid var(--border-color)',
                                background: 'rgba(255,255,255,0.02)',
                                backdropFilter: 'blur(10px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                        {getOtherParticipant(activeConversation?.participants)?.username?.slice(0, 1).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>{getOtherParticipant(activeConversation?.participants)?.username}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--success)' }}>
                                            <span style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%', boxShadow: '0 0 8px var(--success)' }}></span>
                                            Active and ready to collaborate
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="btn btn-secondary btn-sm" style={{ padding: '8px 12px', borderRadius: '10px' }}>
                                        <FaInfoCircle size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Message List */}
                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '30px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '24px'
                            }}>
                                {loadingMessages ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
                                        <div className="spinner"></div>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isMine = msg.sender === user?.id;
                                        const showDate = idx === 0 || new Date(messages[idx - 1].created_at).toDateString() !== new Date(msg.created_at).toDateString();

                                        return (
                                            <div key={msg.id}>
                                                {showDate && (
                                                    <div style={{ textAlign: 'center', margin: '30px 0 20px', position: 'relative' }}>
                                                        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', position: 'absolute', top: '50%', width: '100%', zIndex: 0 }} />
                                                        <span style={{ position: 'relative', zIndex: 1, background: 'var(--bg-primary)', padding: '4px 16px', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '700', borderRadius: '12px' }}>
                                                            {new Date(msg.created_at).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                )}
                                                <div style={{
                                                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: isMine ? 'flex-end' : 'flex-start',
                                                    marginLeft: isMine ? 'auto' : '0',
                                                    maxWidth: '75%'
                                                }}>
                                                    <div style={{
                                                        background: isMine ? 'var(--accent-gradient)' : 'var(--bg-card)',
                                                        color: isMine ? '#fff' : 'var(--text-primary)',
                                                        padding: '12px 20px',
                                                        borderRadius: isMine ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                                        boxShadow: isMine ? '0 10px 20px rgba(108, 99, 255, 0.2)' : '0 4px 15px rgba(0,0,0,0.1)',
                                                        position: 'relative',
                                                        border: isMine ? 'none' : '1px solid var(--border-color)'
                                                    }}>
                                                        {msg.attachment && (
                                                            <div style={{ marginBottom: '10px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                                <img src={msg.attachment} alt="attachment" style={{ maxWidth: '100%', maxHeight: '400px', display: 'block', cursor: 'pointer' }} onClick={() => window.open(msg.attachment, '_blank')} />
                                                            </div>
                                                        )}
                                                        {msg.text && <div style={{ fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{msg.text}</div>}
                                                    </div>
                                                    <div style={{
                                                        marginTop: '6px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        fontSize: '0.65rem',
                                                        color: 'var(--text-muted)',
                                                        fontWeight: '600'
                                                    }}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {isMine && (
                                                            <FaCheckDouble style={{ color: msg.is_read ? 'var(--accent-secondary)' : 'inherit' }} />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Template & Input Area */}
                            <div style={{ padding: '0 30px 24px' }}>
                                {/* Templates */}
                                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '10px 0', marginBottom: '10px', scrollbarWidth: 'none' }}>
                                    {templates.map((t, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setNewMessage(t)}
                                            style={{
                                                padding: '8px 16px',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '12px',
                                                color: 'var(--text-secondary)',
                                                fontSize: '0.75rem',
                                                whiteSpace: 'nowrap',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                                            onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>

                                {/* Chat Input Box */}
                                <div style={{
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '24px',
                                    padding: '12px',
                                    border: '1px solid var(--border-color)',
                                    boxShadow: 'var(--shadow-lg)'
                                }}>
                                    <form onSubmit={handleSendMessage} style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            style={{
                                                padding: '10px',
                                                background: attachment ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                                                borderRadius: '16px',
                                                color: attachment ? '#fff' : 'var(--text-muted)',
                                                border: 'none',
                                                transition: 'all 0.3s'
                                            }}
                                        >
                                            <FaImage size={20} />
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            style={{ display: 'none' }}
                                            accept="image/*"
                                            onChange={(e) => setAttachment(e.target.files[0])}
                                        />
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Write a message..."
                                            style={{
                                                flex: 1,
                                                background: 'transparent',
                                                border: 'none',
                                                color: 'var(--text-primary)',
                                                resize: 'none',
                                                padding: '10px 5px',
                                                minHeight: '44px',
                                                maxHeight: '150px',
                                                fontSize: '0.95rem',
                                                outline: 'none'
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage(e);
                                                }
                                            }}
                                        />
                                        <button
                                            type="submit"
                                            disabled={sending || (!newMessage.trim() && !attachment)}
                                            style={{
                                                width: '44px',
                                                height: '44px',
                                                borderRadius: '16px',
                                                background: (newMessage.trim() || attachment) ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.05)',
                                                color: '#fff',
                                                border: 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.3s',
                                                cursor: (newMessage.trim() || attachment) ? 'pointer' : 'default',
                                                opacity: sending ? 0.7 : 1
                                            }}
                                        >
                                            <FaPaperPlane size={18} />
                                        </button>
                                    </form>
                                    {attachment && (
                                        <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(108, 99, 255, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--accent-primary)' }}>
                                                <FaImage /> {attachment.name}
                                            </div>
                                            <button onClick={() => setAttachment(null)} style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: '1.2rem', fontWeight: 'bold' }}>&times;</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* 3. Right Project Sidepanel */}
                <div style={{
                    width: '300px',
                    background: 'rgba(15, 15, 15, 0.4)',
                    borderLeft: '1px solid var(--border-color)',
                    overflowY: 'auto',
                    display: conversationId ? 'block' : 'none'
                }}>
                    <div style={{ padding: '30px 24px' }}>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaProjectDiagram style={{ color: 'var(--accent-primary)' }} /> PROJECT DETAILS
                        </h4>

                        {!activeConversation?.gig_detail ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed var(--border-color)' }}>
                                <FaInfoCircle size={30} style={{ opacity: 0.2, marginBottom: '15px' }} />
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No gig linked to this conversation.</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ borderRadius: '20px', overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
                                    <div style={{ height: '150px', position: 'relative' }}>
                                        {activeConversation.gig_detail.image ? (
                                            <img src={activeConversation.gig_detail.image} alt="Gig" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <FaBriefcase size={40} style={{ opacity: 0.1 }} />
                                            </div>
                                        )}
                                        <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--accent-gradient)', color: '#fff', padding: '4px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '800' }}>
                                            ${activeConversation.gig_detail.price}
                                        </div>
                                    </div>
                                    <div style={{ padding: '20px' }}>
                                        <h5 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '15px' }}>{activeConversation.gig_detail.title}</h5>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                <FaClock style={{ color: 'var(--accent-secondary)' }} /> {activeConversation.gig_detail.delivery_days} Days
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                <FaBriefcase style={{ color: 'var(--accent-primary)' }} /> Gig ID: #{activeConversation.gig_detail.id}
                                            </div>
                                        </div>
                                        <Link to={`/gigs/${activeConversation.gig_detail.id}`} className="btn btn-secondary btn-sm" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            Go to Gig Page <FaExternalLinkAlt size={12} />
                                        </Link>
                                    </div>
                                </div>

                                <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '15px' }}>
                                    ATTACHMENTS ({messages.filter(m => m.attachment).length})
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                    {messages.filter(m => m.attachment).map((m, idx) => (
                                        <div key={idx} style={{ aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => window.open(m.attachment, '_blank')}>
                                            <img src={m.attachment} alt="shared" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    ))}
                                    {messages.filter(m => m.attachment).length === 0 && (
                                        <div style={{ gridColumn: 'span 3', padding: '30px 10px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                            No files shared yet.
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
