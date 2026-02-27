import { Link } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';

export default function GigCard({ gig }) {
    const initials = gig.seller?.username?.slice(0, 2).toUpperCase() || '??';
    const categoryIcons = {
        'Web Development': '💻', 'Mobile Development': '📱', 'Graphic Design': '🎨',
        'Content Writing': '✍️', 'Video Editing': '🎬', 'Digital Marketing': '📈',
        'Data Science': '📊', 'UI/UX Design': '🖌️',
    };
    const icon = categoryIcons[gig.category_name] || '💼';

    return (
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
    );
}
