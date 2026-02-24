import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import GigCard from '../components/GigCard';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [myGigs, setMyGigs] = useState([]);
    const [orders, setOrders] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, gigsRes, sellerOrdersRes, buyerOrdersRes] = await Promise.all([
                    api.get('/auth/dashboard/'),
                    api.get('/gigs/my-gigs/'),
                    api.get('/orders/?role=seller'),
                    api.get('/orders/?role=buyer'),
                ]);
                setStats(statsRes.data);
                setMyGigs(gigsRes.data.results || gigsRes.data);
                setOrders(sellerOrdersRes.data.results || sellerOrdersRes.data);
                setPurchases(buyerOrdersRes.data.results || buyerOrdersRes.data);
            } catch {
                toast.error('Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await api.patch(`/orders/${orderId}/status/`, { status: newStatus });
            toast.success(`Order ${newStatus}!`);
            // Refresh orders
            const [sellerRes, buyerRes] = await Promise.all([
                api.get('/orders/?role=seller'),
                api.get('/orders/?role=buyer'),
            ]);
            setOrders(sellerRes.data.results || sellerRes.data);
            setPurchases(buyerRes.data.results || buyerRes.data);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update order');
        }
    };

    const statusColors = {
        pending: 'badge-warning',
        in_progress: 'badge-info',
        delivered: 'badge-info',
        completed: 'badge-success',
        cancelled: 'badge-error',
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div className="container" style={{ padding: '40px 24px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
                Welcome back, <span style={{ color: 'var(--accent-primary)' }}>{user?.username}</span>! 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                Here's your dashboard overview
            </p>

            {/* Stats */}
            {stats && (
                <div className="dashboard-stats">
                    <div className="card stat-card">
                        <div className="stat-icon">💰</div>
                        <div className="stat-number">${stats.total_earnings.toLocaleString()}</div>
                        <div className="stat-label">Total Earnings</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-icon">📦</div>
                        <div className="stat-number">{stats.completed_orders}</div>
                        <div className="stat-label">Completed Orders</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-icon">💼</div>
                        <div className="stat-number">{stats.active_gigs}</div>
                        <div className="stat-label">Active Gigs</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-icon">⭐</div>
                        <div className="stat-number">{stats.average_rating}</div>
                        <div className="stat-label">Avg Rating</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-icon">🕒</div>
                        <div className="stat-number">{stats.pending_orders}</div>
                        <div className="stat-label">Pending Orders</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-icon">🔄</div>
                        <div className="stat-number">{stats.active_orders}</div>
                        <div className="stat-label">In Progress</div>
                    </div>
                </div>
            )}

            {/* My Gigs */}
            {user?.is_freelancer && (
                <div className="dashboard-section">
                    <h2>
                        💼 My Gigs
                        <Link to="/gigs/new" className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}>
                            + Create New Gig
                        </Link>
                    </h2>
                    {myGigs.length > 0 ? (
                        <div className="gigs-grid">
                            {myGigs.map(gig => <GigCard key={gig.id} gig={gig} />)}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="icon">💼</div>
                            <h3>No gigs yet</h3>
                            <p>Start selling your skills by creating your first gig</p>
                            <Link to="/gigs/new" className="btn btn-primary" style={{ marginTop: '16px' }}>Create Gig</Link>
                        </div>
                    )}
                </div>
            )}

            {/* Seller Orders */}
            {orders.length > 0 && (
                <div className="dashboard-section">
                    <h2>📥 Orders Received</h2>
                    <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Gig</th>
                                    <th>Buyer</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id}>
                                        <td>#{order.id}</td>
                                        <td>{order.gig_detail?.title?.slice(0, 35)}...</td>
                                        <td>{order.buyer_detail?.username}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--accent-secondary)' }}>${order.amount}</td>
                                        <td><span className={`badge ${statusColors[order.status]}`}>{order.status}</span></td>
                                        <td>
                                            {order.status === 'pending' && (
                                                <button className="btn btn-sm btn-primary" onClick={() => updateOrderStatus(order.id, 'in_progress')}>
                                                    Accept
                                                </button>
                                            )}
                                            {order.status === 'in_progress' && (
                                                <button className="btn btn-sm btn-primary" onClick={() => updateOrderStatus(order.id, 'delivered')}>
                                                    Deliver
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Buyer Orders */}
            {purchases.length > 0 && (
                <div className="dashboard-section">
                    <h2>🛒 My Purchases</h2>
                    <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Gig</th>
                                    <th>Seller</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchases.map(order => (
                                    <tr key={order.id}>
                                        <td>#{order.id}</td>
                                        <td>
                                            <Link to={`/gigs/${order.gig_detail?.id}`}>
                                                {order.gig_detail?.title?.slice(0, 35)}...
                                            </Link>
                                        </td>
                                        <td>{order.gig_detail?.seller?.username}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--accent-secondary)' }}>${order.amount}</td>
                                        <td><span className={`badge ${statusColors[order.status]}`}>{order.status}</span></td>
                                        <td>
                                            {order.status === 'delivered' && (
                                                <button className="btn btn-sm btn-primary" onClick={() => updateOrderStatus(order.id, 'completed')}>
                                                    Complete
                                                </button>
                                            )}
                                            {order.status === 'pending' && (
                                                <button className="btn btn-sm btn-danger" onClick={() => updateOrderStatus(order.id, 'cancelled')}>
                                                    Cancel
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
