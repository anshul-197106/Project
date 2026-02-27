import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    FaUsers, FaShoppingBag, FaChartLine, FaDollarSign,
    FaCheckCircle, FaClock, FaTruck, FaBan, FaSpinner,
    FaUserShield, FaStore, FaBoxOpen, FaSearch, FaFilter,
    FaFilePdf, FaGithub
} from 'react-icons/fa';

export default function AdminPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!user?.is_staff) {
            toast.error('Access denied. Admin privileges required.');
            navigate('/dashboard');
            return;
        }
        fetchAdminData();
    }, [user, navigate]);

    const fetchAdminData = async () => {
        try {
            const [statsRes, ordersRes, usersRes] = await Promise.all([
                api.get('/auth/admin/dashboard/'),
                api.get('/auth/admin/orders/'),
                api.get('/auth/admin/users/'),
            ]);
            setStats(statsRes.data);
            setOrders(ordersRes.data);
            setUsers(usersRes.data);
        } catch {
            toast.error('Failed to load admin data');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await api.patch('/auth/admin/orders/', {
                order_id: orderId,
                status: newStatus,
            });
            toast.success(`Order #${orderId} updated to ${newStatus}`);
            // Refresh orders
            const ordersRes = await api.get('/auth/admin/orders/');
            setOrders(ordersRes.data);
            // Refresh stats too
            const statsRes = await api.get('/auth/admin/dashboard/');
            setStats(statsRes.data);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update order');
        }
    };

    const statusColors = {
        payment_pending: { bg: 'rgba(255, 193, 7, 0.05)', color: '#e0a800', label: 'Awaiting Payment' },
        pending: { bg: 'rgba(255, 193, 7, 0.1)', color: '#ffc107', label: 'Pending' },
        in_progress: { bg: 'rgba(0, 123, 255, 0.1)', color: '#007bff', label: 'In Progress' },
        delivered: { bg: 'rgba(23, 162, 184, 0.1)', color: '#17a2b8', label: 'Delivered' },
        completed: { bg: 'rgba(40, 167, 69, 0.1)', color: '#28a745', label: 'Completed' },
        cancelled: { bg: 'rgba(220, 53, 69, 0.1)', color: '#dc3545', label: 'Cancelled' },
    };

    const filteredOrders = orders.filter(order => {
        const matchesStatus = !statusFilter || order.status === statusFilter;
        const matchesSearch = !searchQuery ||
            order.gig_detail?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.buyer_detail?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            String(order.id).includes(searchQuery);
        return matchesStatus && matchesSearch;
    });

    const filteredUsers = users.filter(u =>
        !searchQuery ||
        u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    // ===== STAT CARD COMPONENT =====
    const StatCard = ({ icon, label, value, color, subtext }) => (
        <div className="card" style={{
            padding: '24px', position: 'relative', overflow: 'hidden',
        }}>
            <div style={{
                position: 'absolute', top: '-20px', right: '-20px',
                width: '80px', height: '80px', borderRadius: '50%',
                background: `${color}15`, opacity: 0.5,
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 1 }}>
                <div style={{
                    width: '48px', height: '48px', borderRadius: '14px',
                    background: `${color}18`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: color, fontSize: '1.2rem',
                }}>
                    {icon}
                </div>
                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {label}
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '900', letterSpacing: '-0.5px' }}>
                        {value}
                    </div>
                    {subtext && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{subtext}</div>}
                </div>
            </div>
        </div>
    );

    // ===== TAB BUTTON =====
    const TabButton = ({ id, icon, label }) => (
        <button
            onClick={() => { setActiveTab(id); setSearchQuery(''); setStatusFilter(''); }}
            style={{
                padding: '10px 20px', borderRadius: '10px', border: 'none',
                background: activeTab === id ? 'var(--accent-gradient)' : 'transparent',
                color: activeTab === id ? '#fff' : 'var(--text-muted)',
                fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.3s ease',
            }}
        >
            {icon} {label}
        </button>
    );

    return (
        <div className="container fade-in" style={{ padding: '40px 20px', maxWidth: '1200px' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <FaUserShield style={{ fontSize: '1.8rem', color: 'var(--accent-primary)' }} />
                    <h1 style={{
                        fontSize: '2rem', fontWeight: '900', letterSpacing: '-1px',
                        background: 'var(--accent-gradient)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                        Admin Panel
                    </h1>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Platform management & oversight — full control over orders, users, and deals
                </p>
            </div>

            {/* Tab Navigation */}
            <div style={{
                display: 'flex', gap: '8px', marginBottom: '32px',
                background: 'rgba(255,255,255,0.02)', padding: '6px',
                borderRadius: '14px', border: '1px solid var(--border-color)',
                width: 'fit-content',
            }}>
                <TabButton id="overview" icon={<FaChartLine />} label="Overview" />
                <TabButton id="orders" icon={<FaShoppingBag />} label="Orders" />
                <TabButton id="users" icon={<FaUsers />} label="Users" />
            </div>

            {/* ===== OVERVIEW TAB ===== */}
            {activeTab === 'overview' && stats && (
                <div className="fade-in">
                    {/* Platform Stats */}
                    <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px' }}>📊 Platform Overview</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '36px' }}>
                        <StatCard icon={<FaUsers />} label="Total Users" value={stats.total_users} color="#6c63ff" subtext={`${stats.total_freelancers} freelancers`} />
                        <StatCard icon={<FaStore />} label="Total Gigs" value={stats.total_gigs} color="#17a2b8" subtext={`${stats.active_gigs} active`} />
                        <StatCard icon={<FaBoxOpen />} label="Total Orders" value={stats.total_orders} color="#ffc107" subtext={`${stats.pending_orders} pending`} />
                        <StatCard icon={<FaDollarSign />} label="Revenue" value={`$${stats.total_revenue.toFixed(2)}`} color="#28a745" subtext={`$${stats.total_platform_fees.toFixed(2)} platform fees`} />
                    </div>

                    {/* Order Status Breakdown */}
                    <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px' }}>📦 Order Status Breakdown</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '36px' }}>
                        <StatCard icon={<FaClock />} label="Pending" value={stats.pending_orders} color="#ffc107" />
                        <StatCard icon={<FaSpinner />} label="In Progress" value={stats.in_progress_orders} color="#007bff" />
                        <StatCard icon={<FaTruck />} label="Delivered" value={stats.delivered_orders} color="#17a2b8" />
                        <StatCard icon={<FaCheckCircle />} label="Completed" value={stats.completed_orders} color="#28a745" />
                        <StatCard icon={<FaBan />} label="Cancelled" value={stats.cancelled_orders} color="#dc3545" />
                    </div>

                    {/* Quick Actions */}
                    <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px' }}>⚡ Quick Actions</h2>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" onClick={() => setActiveTab('orders')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaShoppingBag /> Manage Orders
                        </button>
                        <button className="btn btn-secondary" onClick={() => setActiveTab('users')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaUsers /> View Users
                        </button>
                    </div>
                </div>
            )}

            {/* ===== ORDERS TAB ===== */}
            {activeTab === 'orders' && (
                <div className="fade-in">
                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                            <FaSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Search orders by ID, gig title, or buyer..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%', padding: '12px 14px 12px 40px', borderRadius: '12px',
                                    border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)', fontSize: '0.85rem',
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaFilter style={{ color: 'var(--text-muted)' }} />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{
                                    padding: '12px 16px', borderRadius: '12px',
                                    border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer',
                                }}
                            >
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="delivered">Delivered</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>

                    {/* Orders count */}
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
                        Showing {filteredOrders.length} of {orders.length} orders
                    </p>

                    {/* Orders Table */}
                    {filteredOrders.length > 0 ? (
                        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                                    <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                                        <tr>
                                            <th style={thStyle}>ORDER</th>
                                            <th style={thStyle}>GIG</th>
                                            <th style={thStyle}>BUYER</th>
                                            <th style={thStyle}>SELLER</th>
                                            <th style={thStyle}>AMOUNT</th>
                                            <th style={thStyle}>STATUS</th>
                                            <th style={thStyle}>FILES</th>
                                            <th style={{ ...thStyle, textAlign: 'right' }}>ADMIN ACTION</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.map(order => (
                                            <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                <td style={tdStyle}>
                                                    <span style={{ fontWeight: '800', color: 'var(--accent-primary)' }}>#{order.id}</span>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                        {new Date(order.created_at).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td style={tdStyle}>
                                                    <div style={{ fontWeight: '600', fontSize: '0.85rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {order.gig_detail?.title}
                                                    </div>
                                                </td>
                                                <td style={tdStyle}>
                                                    <span style={{ fontSize: '0.85rem' }}>@{order.buyer_detail?.username}</span>
                                                </td>
                                                <td style={tdStyle}>
                                                    <span style={{ fontSize: '0.85rem' }}>@{order.gig_detail?.seller?.username}</span>
                                                </td>
                                                <td style={tdStyle}>
                                                    <span style={{ fontWeight: '800', color: 'var(--accent-secondary)' }}>${order.amount}</span>
                                                </td>
                                                <td style={tdStyle}>
                                                    <span style={{
                                                        padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem',
                                                        fontWeight: '700',
                                                        background: (statusColors[order.status] || statusColors.pending).bg,
                                                        color: (statusColors[order.status] || statusColors.pending).color,
                                                    }}>
                                                        {(statusColors[order.status] || statusColors.pending).label}
                                                    </span>
                                                </td>
                                                <td style={tdStyle}>
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        {order.submission_file && (
                                                            <a href={order.submission_file} target="_blank" rel="noopener noreferrer" title="View PDF" style={{ color: '#e74c3c', fontSize: '1rem' }}>
                                                                <FaFilePdf />
                                                            </a>
                                                        )}
                                                        {order.github_link && (
                                                            <a href={order.github_link} target="_blank" rel="noopener noreferrer" title="View GitHub" style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>
                                                                <FaGithub />
                                                            </a>
                                                        )}
                                                        {!order.submission_file && !order.github_link && (
                                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ ...tdStyle, textAlign: 'right' }}>
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                                        style={{
                                                            padding: '6px 10px', borderRadius: '8px', fontSize: '0.75rem',
                                                            border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                                                            color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '600',
                                                        }}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="in_progress">In Progress</option>
                                                        <option value="delivered">Delivered</option>
                                                        <option value="completed">Completed</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '60px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '20px', border: '1px dashed var(--border-color)' }}>
                            <h3 style={{ color: 'var(--text-muted)' }}>No orders match your filters</h3>
                        </div>
                    )}
                </div>
            )}

            {/* ===== USERS TAB ===== */}
            {activeTab === 'users' && (
                <div className="fade-in">
                    {/* Search */}
                    <div style={{ position: 'relative', maxWidth: '400px', marginBottom: '24px' }}>
                        <FaSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 14px 12px 40px', borderRadius: '12px',
                                border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)', fontSize: '0.85rem',
                            }}
                        />
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
                        Showing {filteredUsers.length} of {users.length} users
                    </p>

                    {/* Users Table */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
                                    <tr>
                                        <th style={thStyle}>USER</th>
                                        <th style={thStyle}>EMAIL</th>
                                        <th style={thStyle}>ROLE</th>
                                        <th style={thStyle}>EARNINGS</th>
                                        <th style={thStyle}>ORDERS</th>
                                        <th style={thStyle}>JOINED</th>
                                        <th style={thStyle}>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(u => (
                                        <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{
                                                        width: '36px', height: '36px', borderRadius: '50%',
                                                        background: u.is_staff ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)' : 'var(--accent-gradient)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.8rem', fontWeight: 'bold', color: '#fff',
                                                    }}>
                                                        {u.is_staff ? <FaUserShield /> : u.username?.slice(0, 1).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>
                                                            {u.username}
                                                            {u.is_staff && <span style={{ marginLeft: '6px', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '6px', background: 'rgba(255, 107, 107, 0.15)', color: '#ff6b6b', fontWeight: '800' }}>ADMIN</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.email}</span>
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                    {u.is_freelancer && (
                                                        <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '700', background: 'rgba(108,99,255,0.12)', color: '#6c63ff' }}>Seller</span>
                                                    )}
                                                    {u.is_buyer && (
                                                        <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '700', background: 'rgba(40,167,69,0.12)', color: '#28a745' }}>Buyer</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ fontWeight: '700', color: 'var(--accent-secondary)' }}>${u.total_earnings?.toFixed(2)}</span>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ fontWeight: '600' }}>{u.total_orders_completed}</span>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(u.date_joined).toLocaleDateString()}</span>
                                            </td>
                                            <td style={tdStyle}>
                                                <span style={{
                                                    padding: '3px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: '700',
                                                    background: u.is_active ? 'rgba(40,167,69,0.1)' : 'rgba(220,53,69,0.1)',
                                                    color: u.is_active ? '#28a745' : '#dc3545',
                                                }}>
                                                    {u.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Table styles
const thStyle = { padding: '14px 16px', textAlign: 'left', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle = { padding: '16px', fontSize: '0.85rem' };
