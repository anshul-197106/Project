import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import GigCard from '../components/GigCard';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function SavedGigsPage() {
    const { user } = useAuth();
    const [gigs, setGigs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSavedGigs = async () => {
            try {
                const res = await api.get('/gigs/saved/');
                setGigs(res.data.results || res.data);
            } catch (err) {
                toast.error('Failed to load saved gigs');
            } finally {
                setLoading(false);
            }
        };
        fetchSavedGigs();
    }, []);

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div className="container" style={{ padding: '40px 24px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
                ❤️ Saved Gigs
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                Here are the gigs you have bookmarked for later.
            </p>

            {gigs.length > 0 ? (
                <div className="gigs-grid">
                    {gigs.map(gig => <GigCard key={gig.id} gig={gig} />)}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="icon">🤍</div>
                    <h3>No saved gigs</h3>
                    <p>You haven't saved any gigs yet. Browse the marketplace and click the heart icon to save.</p>
                    <Link to="/gigs" className="btn btn-primary" style={{ marginTop: '16px' }}>Browse Gigs</Link>
                </div>
            )}
        </div>
    );
}
