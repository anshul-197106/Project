import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import StarRating from '../components/StarRating';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FaClock, FaSyncAlt, FaShoppingCart, FaStar } from 'react-icons/fa';

export default function GigDetailPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [gig, setGig] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ordering, setOrdering] = useState(false);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.get(`/gigs/${id}/`),
            api.get(`/reviews/?gig=${id}`),
        ])
            .then(([gigRes, reviewRes]) => {
                setGig(gigRes.data);
                setReviews(reviewRes.data.results || reviewRes.data);
            })
            .catch(() => toast.error('Failed to load gig'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleOrder = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        setOrdering(true);
        try {
            await api.post('/orders/', { gig: gig.id, requirements: '' });
            toast.success('Order placed successfully!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.gig?.[0] || 'Failed to place order');
        } finally {
            setOrdering(false);
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;
    if (!gig) return <div className="empty-state"><h3>Gig not found</h3></div>;

    const categoryIcons = {
        'Web Development': '💻', 'Mobile Development': '📱', 'Graphic Design': '🎨',
        'Content Writing': '✍️', 'Video Editing': '🎬', 'Digital Marketing': '📈',
        'Data Science': '📊', 'UI/UX Design': '🖌️',
    };
    const icon = categoryIcons[gig.category_name] || '💼';
    const sellerInitials = gig.seller?.username?.slice(0, 2).toUpperCase() || '??';

    return (
        <div className="container">
            <div className="gig-detail">
                <div className="gig-detail-main">
                    <div style={{ marginBottom: '8px' }}>
                        <Link to="/gigs" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            ← Back to Gigs
                        </Link>
                    </div>
                    <h1>{gig.title}</h1>

                    <div className="gig-detail-image">
                        {gig.image ? <img src={gig.image} alt={gig.title} /> : icon}
                    </div>

                    <div className="gig-detail-seller">
                        <div className="avatar-lg">{sellerInitials}</div>
                        <div>
                            <Link to={`/profile/${gig.seller?.id}`}
                                style={{ fontWeight: 600, fontSize: '1.05rem' }}>
                                {gig.seller_profile?.full_name || gig.seller?.username}
                            </Link>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <StarRating rating={gig.seller_profile?.average_rating || 0} size={14} />
                                <span>{gig.seller_profile?.average_rating || 0} ({gig.seller_profile?.total_orders_completed || 0} orders)</span>
                            </div>
                            {gig.seller_profile?.tagline && (
                                <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', marginTop: '4px' }}>
                                    {gig.seller_profile.tagline}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="gig-detail-description">
                        <h2>About This Gig</h2>
                        <p>{gig.description}</p>
                        {gig.tags && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                                {gig.tags_list?.map((tag, i) => (
                                    <span key={i} className="skill-tag">{tag}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Reviews Section */}
                    <div className="gig-detail-description">
                        <h2>Reviews ({reviews.length})</h2>
                        {reviews.length > 0 ? (
                            <div className="reviews-list">
                                {reviews.map(review => (
                                    <div key={review.id} className="card review-card">
                                        <div className="review-header">
                                            <div className="review-author">
                                                <div className="avatar">
                                                    {review.reviewer_detail?.username?.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <strong>{review.reviewer_detail?.username}</strong>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        {new Date(review.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <StarRating rating={review.rating} size={14} />
                                        </div>
                                        <p>{review.comment}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)' }}>No reviews yet</p>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="gig-sidebar">
                    <div className="card">
                        <div className="price-display">${gig.price}</div>
                        <ul className="features">
                            <li><FaClock /> {gig.delivery_days} day{gig.delivery_days > 1 ? 's' : ''} delivery</li>
                            <li><FaSyncAlt /> {gig.revisions} revision{gig.revisions > 1 ? 's' : ''} included</li>
                            <li><FaShoppingCart /> {gig.total_orders} orders completed</li>
                            <li><FaStar style={{ color: '#ffc107' }} /> {Number(gig.average_rating).toFixed(1)} rating</li>
                        </ul>
                        {user?.id !== gig.seller?.id ? (
                            <button
                                className="btn btn-primary"
                                onClick={handleOrder}
                                disabled={ordering}
                            >
                                {ordering ? 'Placing Order...' : `Order Now — $${gig.price}`}
                            </button>
                        ) : (
                            <Link to={`/gigs/${gig.id}/edit`} className="btn btn-secondary" style={{ width: '100%', textAlign: 'center' }}>
                                Edit This Gig
                            </Link>
                        )}
                        <Link
                            to={`/profile/${gig.seller?.id}`}
                            className="btn btn-secondary"
                            style={{ marginTop: '8px', width: '100%', textAlign: 'center' }}
                        >
                            View Seller Profile
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
