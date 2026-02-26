import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import GigCard from '../components/GigCard';
import { HiOutlineSearch, HiOutlineLightningBolt } from 'react-icons/hi';

export default function LandingPage() {
    const [featuredGigs, setFeaturedGigs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [gigsRes, catsRes, freelancersRes] = await Promise.all([
                    api.get('/gigs/featured/'),
                    api.get('/gigs/categories/'),
                    api.get('/auth/freelancers/'),
                ]);
                setFeaturedGigs(gigsRes.data);
                setCategories(catsRes.data);

                // Calculate real stats from API data
                const allGigs = gigsRes.data;
                const freelancers = freelancersRes.data.results || freelancersRes.data;
                const totalGigs = catsRes.data.reduce((sum, cat) => sum + (cat.gig_count || 0), 0);
                const totalOrders = allGigs.reduce((sum, g) => sum + (g.total_orders || 0), 0);
                const avgRating = allGigs.length > 0
                    ? (allGigs.reduce((sum, g) => sum + parseFloat(g.average_rating || 0), 0) / allGigs.length).toFixed(1)
                    : '0.0';

                setStats({
                    freelancers: freelancers.length,
                    gigs: totalGigs,
                    orders: totalOrders,
                    rating: avgRating,
                });
            } catch (err) {
                console.error('Failed to load landing page data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div>
            {/* Hero */}
            <section className="hero">
                <div className="hero-content container">
                    <h1>
                        Find & Hire<br />
                        <span className="gradient-text">Top Skill Experts</span>
                    </h1>
                    <p>
                        Connect with skilled professionals worldwide. Get quality work done
                        fast — from web development to design, writing to marketing.
                    </p>
                    <div className="hero-buttons">
                        <Link to="/gigs" className="btn btn-primary btn-lg">
                            <HiOutlineSearch /> Browse Gigs
                        </Link>
                        <Link to="/signup" className="btn btn-secondary btn-lg">
                            <HiOutlineLightningBolt /> Start Selling
                        </Link>
                    </div>
                    {stats && (
                        <div className="hero-stats">
                            <div className="hero-stat">
                                <div className="stat-value">{stats.freelancers}</div>
                                <div className="stat-label">Active Freelancers</div>
                            </div>
                            <div className="hero-stat">
                                <div className="stat-value">{stats.gigs}</div>
                                <div className="stat-label">Gigs Available</div>
                            </div>
                            <div className="hero-stat">
                                <div className="stat-value">{stats.orders}</div>
                                <div className="stat-label">Orders Completed</div>
                            </div>
                            <div className="hero-stat">
                                <div className="stat-value">{stats.rating}★</div>
                                <div className="stat-label">Average Rating</div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Categories */}
            <section className="section">
                <div className="container">
                    <div className="section-header">
                        <h2>Popular Categories</h2>
                        <p>Browse freelance services by category</p>
                    </div>
                    {loading ? (
                        <div className="loading"><div className="spinner"></div></div>
                    ) : categories.length > 0 ? (
                        <div className="categories-grid">
                            {categories.map(cat => (
                                <Link to={`/gigs?category=${cat.id}`} key={cat.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="card category-card">
                                        <div className="icon">{cat.icon || '💼'}</div>
                                        <h3>{cat.name}</h3>
                                        <p>{cat.gig_count} gigs available</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="icon">📂</div>
                            <h3>No categories found</h3>
                            <p>The server might not be running. Start the backend first.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Featured Gigs */}
            <section className="section" style={{ background: 'var(--bg-secondary)' }}>
                <div className="container">
                    <div className="section-header">
                        <h2>Featured Gigs</h2>
                        <p>Top-rated services from our best freelancers</p>
                    </div>
                    {featuredGigs.length > 0 ? (
                        <>
                            <div className="gigs-grid">
                                {featuredGigs.map(gig => (
                                    <GigCard key={gig.id} gig={gig} />
                                ))}
                            </div>
                            <div style={{ textAlign: 'center', marginTop: '40px' }}>
                                <Link to="/gigs" className="btn btn-secondary">View All Gigs →</Link>
                            </div>
                        </>
                    ) : !loading ? (
                        <div className="empty-state">
                            <div className="icon">💼</div>
                            <h3>No gigs yet</h3>
                            <p>Be the first to create a gig!</p>
                        </div>
                    ) : null}
                </div>
            </section>

            {/* How It Works */}
            <section className="section">
                <div className="container">
                    <div className="section-header">
                        <h2>How It Works</h2>
                        <p>Get started in 3 simple steps</p>
                    </div>
                    <div className="steps-grid">
                        <div className="card step-card">
                            <div className="step-number">1</div>
                            <h3>Find a Service</h3>
                            <p>Browse gigs across categories. Use search and filters to find exactly what you need.</p>
                        </div>
                        <div className="card step-card">
                            <div className="step-number">2</div>
                            <h3>Place Your Order</h3>
                            <p>Describe your requirements and place your order. The freelancer will start working immediately.</p>
                        </div>
                        <div className="card step-card">
                            <div className="step-number">3</div>
                            <h3>Get Results</h3>
                            <p>Receive your deliverables, request revisions if needed, and leave a review.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="section" style={{ textAlign: 'center' }}>
                <div className="container">
                    <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '16px' }}>
                        Ready to Get Started?
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
                        Join freelancers and clients already using SkillBridge.
                    </p>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                        <Link to="/signup" className="btn btn-primary btn-lg">Create Free Account</Link>
                        <Link to="/gigs" className="btn btn-secondary btn-lg">Explore Gigs</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
