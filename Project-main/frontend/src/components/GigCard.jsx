import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaHeart, FaRegHeart } from 'react-icons/fa';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function GigCard({ gig }) {
    const { user } = useAuth();
    const [isSaved, setIsSaved] = useState(gig.is_saved || false);
    const [loading, setLoading] = useState(false);

    const initials = gig.seller?.username?.slice(0, 2).toUpperCase() || '??';
    const categoryIcons = {
        'Web Development': '💻', 'Mobile Development': '📱', 'Graphic Design': '🎨',
        'Content Writing': '✍️', 'Video Editing': '🎬', 'Digital Marketing': '📈',
        'Data Science': '📊', 'UI/UX Design': '🖌️',
    };
    const icon = categoryIcons[gig.category_name] || '💼';

    const handleSave = async (e) => {
        e.preventDefault(); // Prevent navigating to detail page
        e.stopPropagation();
        if (!user) {
            toast.error('Please login to save gigs');
            return;
        }
        if (loading) return;

        setLoading(true);
        try {
            const res = await api.post(`/gigs/${gig.id}/save/`);
            setIsSaved(res.data.is_saved);
            toast.success(res.data.message);
        } catch (err) {
            toast.error('Failed to toggle save');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            {user && (
                <button
                    onClick={handleSave}
                    disabled={loading}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 10,
                        color: isSaved ? '#ff4757' : '#ced6e0',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                        transition: 'all 0.2s ease',
                    }}
                >
                    {isSaved ? <FaHeart size={16} /> : <FaRegHeart size={16} />}
                </button>
            )}
            <Link to={`/gigs/${gig.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>

                <div className="card gig-card">
                    <div className="gig-card-image">
                        {gig.image ? <img src={gig.image} alt={gig.title} /> : icon}
                    </div>
                    <div className="gig-card-body">
                        <div className="gig-card-seller">
                            <div className="avatar">{initials}</div>
                            <span className="seller-name">{gig.seller?.username}</span>
                        </div>
                        <h3>{gig.title}</h3>
                        <div className="gig-card-footer">
                            <div className="rating">
                                <FaStar /> {Number(gig.average_rating).toFixed(1)} ({gig.total_orders})
                            </div>
                            <div className="price">
                                ${gig.price} <span>starting</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}
