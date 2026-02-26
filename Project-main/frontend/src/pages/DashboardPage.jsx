import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import GigCard from '../components/GigCard';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    FaShoppingBag, FaStore, FaChartLine, FaBoxOpen,
    FaStar, FaClock, FaCheckCircle, FaWallet,
    FaPlus, FaCreditCard, FaRocket
} from 'react-icons/fa';

export default function DashboardPage() {
    const { user, updateUser } = useAuth();
    const [stats, setStats] = useState(null);
    const [myGigs, setMyGigs] = useState([]);
    const [orders, setOrders] = useState([]); // Orders as seller
    const [purchases, setPurchases] = useState([]); // Orders as buyer
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(user?.is_freelancer ? 'seller' : 'buyer');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, gigsRes, sellerOrdersRes, buyerOrdersRes, profileRes] = await Promise.all([
                    api.get('/auth/dashboard/'),
                    api.get('/gigs/my-gigs/'),
                    api.get('/orders/?role=seller'),
                    api.get('/orders/?role=buyer'),
                    api.get('/auth/profile/'),
                ]);
                setStats(statsRes.data);
                setMyGigs(gigsRes.data.results || gigsRes.data);
                setOrders(sellerOrdersRes.data.results || sellerOrdersRes.data);
                setPurchases(buyerOrdersRes.data.results || buyerOrdersRes.data);

                // Sync user role
                if (profileRes.data.user) {
                    updateUser(profileRes.data.user);
                }
            } catch {
                toast.error('Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [updateUser]);

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await api.patch(`/orders/${orderId}/status/`, { status: newStatus });
            toast.success(`Order ${newStatus.replace('_', ' ')}!`);
            // Refresh logic
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
        pending: { bg: 'rgba(255, 193, 7, 0.1)', color: '#ffc107', label: 'Pending' },
        in_progress: { bg: 'rgba(0, 123, 255, 0.1)', color: '#007bff', label: 'In Progress' },
        delivered: { bg: 'rgba(23, 162, 184, 0.1)', color: '#17a2b8', label: 'Delivered' },
        completed: { bg: 'rgba(40, 167, 69, 0.1)', color: '#28a745', label: 'Completed' },
        cancelled: { bg: 'rgba(220, 53, 69, 0.1)', color: '#dc3545', label: 'Cancelled' },
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    const SellerDashboard = () => (
        <div className="fade-in">
            {/* Seller Stats */}
            <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '100px', opacity: 0.05 }}><FaWallet /></div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Earnings</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '900', margin: '10px 0', color: 'var(--accent-primary)' }}>${stats?.total_earnings?.toLocaleString()}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>+12% from last month</div>
                </div>
                <div className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '100px', opacity: 0.05 }}><FaBoxOpen /></div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Orders</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '900', margin: '10px 0' }}>{stats?.active_orders + stats?.pending_orders}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stats?.pending_orders} pending approval</div>
                </div>
                <div className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '100px', opacity: 0.05 }}><FaStar /></div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Average Rating</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '900', margin: '10px 0' }}>{stats?.average_rating} <span style={{ fontSize: '1rem', color: '#ffc107' }}>★</span></div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From {stats?.completed_orders} reviews</div>
                </div>
            </div>

            {/* Orders Section */}
            <div style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaClock style={{ color: 'var(--accent-secondary)' }} /> Pending Your Action
                </h2>
                {orders.filter(o => ['pending', 'in_progress'].includes(o.status)).length > 0 ? (
                    <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                                <tr>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>PROJECT</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>BUYER</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>DUE DATE</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>AMOUNT</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>STATUS</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.filter(o => ['pending', 'in_progress'].includes(o.status)).map(order => (
                                    <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{order.gig_detail?.title}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Order ID: #{order.id}</div>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>{order.buyer_detail?.username?.slice(0, 1).toUpperCase()}</div>
                                                <span style={{ fontSize: '0.85rem' }}>{order.buyer_detail?.username}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px', fontSize: '0.85rem' }}>Next 3 Days</td>
                                        <td style={{ padding: '20px 24px', fontWeight: '800', color: 'var(--accent-secondary)' }}>${order.amount}</td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', background: statusColors[order.status].bg, color: statusColors[order.status].color }}>
                                                {statusColors[order.status].label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                            {order.status === 'pending' && (
                                                <button className="btn btn-primary btn-sm" onClick={() => updateOrderStatus(order.id, 'in_progress')}>Start Project</button>
                                            )}
                                            {order.status === 'in_progress' && (
                                                <button className="btn btn-primary btn-sm" onClick={() => updateOrderStatus(order.id, 'delivered')}>Deliver Now</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ padding: '60px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '20px', border: '1px dashed var(--border-color)' }}>
                        <div style={{ fontSize: '3rem', opacity: 0.2, marginBottom: '20px' }}>✨</div>
                        <h3 style={{ color: 'var(--text-muted)' }}>All caught up!</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>You don't have any active orders to handle right now.</p>
                    </div>
                )}
            </div>

            {/* My Gigs Section */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>💼 My Service Catalog</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Link to="/stripe-connect" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaCreditCard /> Payout Settings
                        </Link>
                        <Link to="/gigs/new" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaPlus /> Post a Gig
                        </Link>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                    {myGigs.map(gig => <GigCard key={gig.id} gig={gig} />)}
                    {myGigs.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', padding: '80px', textAlign: 'center' }}>
                            <h3>Ready to start selling?</h3>
                            <Link to="/gigs/new" className="btn btn-primary" style={{ marginTop: '20px' }}>Create Your First Gig</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const BuyerDashboard = () => (
        <div className="fade-in">
            {/* Buyer Stats */}
            <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '100px', opacity: 0.05 }}><FaShoppingBag /></div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Investments</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '900', margin: '10px 0', color: 'var(--accent-secondary)' }}>${stats?.total_spent?.toLocaleString() || '0'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Across {stats?.my_purchases} orders</div>
                </div>
                <div className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '100px', opacity: 0.05 }}><FaRocket /></div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Projects</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '900', margin: '10px 0' }}>{stats?.buyer_active_orders || '0'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Track development progress</div>
                </div>
                <div className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '100px', opacity: 0.05 }}><FaCheckCircle /></div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Success Rate</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '900', margin: '10px 0' }}>100%</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>All projects delivered</div>
                </div>
            </div>

            {/* Purchases Section */}
            <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaChartLine style={{ color: 'var(--accent-primary)' }} /> My Active Purchases
                </h2>
                {purchases.length > 0 ? (
                    <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                                <tr>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>GIG SERVICE</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>SELLER</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>SECURE PAYMENT</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-muted)' }}>STATUS</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchases.map(order => (
                                    <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                        <td style={{ padding: '20px 24px' }}>
                                            <Link to={`/gigs/${order.gig_detail?.id}`} style={{ fontWeight: '700', fontSize: '0.9rem', color: 'inherit' }}>
                                                {order.gig_detail?.title}
                                            </Link>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Invoice ID: SB-{order.id}</div>
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(45deg, #FF6B6B, #FFD93D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>{order.gig_detail?.seller?.username?.slice(0, 1).toUpperCase()}</div>
                                                <span style={{ fontSize: '0.85rem' }}>{order.gig_detail?.seller?.username}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px', fontWeight: '800', color: 'var(--success)' }}>${order.amount}</td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', background: statusColors[order.status].bg, color: statusColors[order.status].color }}>
                                                {statusColors[order.status].label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                            <Link to="/messages" className="btn btn-secondary btn-sm" style={{ marginRight: '8px' }}>Chat</Link>
                                            {order.status === 'delivered' && (
                                                <button className="btn btn-primary btn-sm" onClick={() => updateOrderStatus(order.id, 'completed')}>Accept Delivery</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ padding: '80px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '1px dashed var(--border-color)' }}>
                        <div style={{ fontSize: '3rem', opacity: 0.2, marginBottom: '20px' }}>🛒</div>
                        <h3>No active projects</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Looking for talent? Start exploring thousands of professional gigs.</p>
                        <Link to="/gigs" className="btn btn-primary">Browse Services</Link>
                    </div>
                )}
            </div>

            {/* Become a Freelancer Prompt */}
            {!user?.is_freelancer && (
                <div style={{
                    marginTop: '60px',
                    padding: '40px',
                    borderRadius: '24px',
                    background: 'var(--accent-gradient)',
                    color: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 20px 40px rgba(108, 99, 255, 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', fontSize: '150px', opacity: 0.1 }}><FaRocket /></div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '10px' }}>Ready to monetize your skills?</h2>
                        <p style={{ opacity: 0.9, maxWidth: '500px' }}>Join our growing community of freelancers. Create your first gig and start earning in minutes.</p>
                    </div>
                    <Link to="/gigs/new" className="btn" style={{ background: '#fff', color: 'var(--accent-primary)', fontWeight: '800', padding: '12px 30px', borderRadius: '12px', position: 'relative', zIndex: 1 }}>
                        Become a Freelancer
                    </Link>
                </div>
            )}
        </div>
    );

    return (
        <div className="container" style={{ padding: '40px 20px', maxWidth: '1200px' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '2.4rem', fontWeight: '900', letterSpacing: '-1.5px', marginBottom: '8px' }}>
                        Hello, <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.username}</span>!
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Welcome to your workspace command center.</p>
                </div>

                {/* Switcher */}
                {user?.is_freelancer && (
                    <div style={{ background: 'var(--bg-secondary)', padding: '6px', borderRadius: '16px', display: 'flex', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
                        <button
                            onClick={() => setActiveTab('buyer')}
                            style={{
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '12px',
                                background: activeTab === 'buyer' ? 'var(--accent-primary)' : 'transparent',
                                color: activeTab === 'buyer' ? '#fff' : 'var(--text-muted)',
                                fontWeight: '700',
                                fontSize: '0.85rem',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <FaShoppingBag /> Buying
                        </button>
                        <button
                            onClick={() => setActiveTab('seller')}
                            style={{
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '12px',
                                background: activeTab === 'seller' ? 'var(--accent-primary)' : 'transparent',
                                color: activeTab === 'seller' ? '#fff' : 'var(--text-muted)',
                                fontWeight: '700',
                                fontSize: '0.85rem',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <FaStore /> Selling
                        </button>
                    </div>
                )}
            </div>

            {/* Dashboard Content */}
            {activeTab === 'seller' ? <SellerDashboard /> : <BuyerDashboard />}
        </div>
    );
}
