import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    FaCreditCard, FaLock, FaShieldAlt, FaClock,
    FaSyncAlt, FaStar, FaCheckCircle, FaArrowLeft
} from 'react-icons/fa';

export default function CheckoutPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [gig, setGig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [orderResult, setOrderResult] = useState(null);
    const [requirements, setRequirements] = useState('');

    // Card form state (visual only — simulated)
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardFocused, setCardFocused] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        api.get(`/gigs/${id}/`)
            .then(res => {
                setGig(res.data);
                if (res.data.seller?.id === user?.id) {
                    toast.error("You can't order your own gig");
                    navigate(`/gigs/${id}`);
                }
            })
            .catch(() => {
                toast.error('Failed to load gig');
                navigate('/gigs');
            })
            .finally(() => setLoading(false));
    }, [id, user, navigate]);

    const formatCardNumber = (value) => {
        const clean = value.replace(/\D/g, '').slice(0, 16);
        return clean.replace(/(.{4})/g, '$1 ').trim();
    };

    const formatExpiry = (value) => {
        const clean = value.replace(/\D/g, '').slice(0, 4);
        if (clean.length >= 3) return clean.slice(0, 2) + '/' + clean.slice(2);
        return clean;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        const cleanCard = cardNumber.replace(/\s/g, '');
        if (cleanCard.length < 13) {
            toast.error('Please enter a valid card number');
            return;
        }
        if (!cardName.trim()) {
            toast.error('Please enter the cardholder name');
            return;
        }
        if (expiry.length < 5) {
            toast.error('Please enter a valid expiry date');
            return;
        }
        if (cvv.length < 3) {
            toast.error('Please enter a valid CVV');
            return;
        }

        setProcessing(true);

        // Simulate payment processing delay for realism
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            const res = await api.post('/orders/direct-order/', {
                gig_id: gig.id,
                requirements,
            });
            setOrderResult(res.data);
            setSuccess(true);
            toast.success('Payment successful!');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Payment failed. Please try again.');
            setProcessing(false);
        }
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>;
    }

    if (!gig) {
        return <div className="empty-state"><h3>Gig not found</h3></div>;
    }

    // ===== SUCCESS STATE =====
    if (success && orderResult) {
        return (
            <div className="container" style={{ padding: '60px 20px', maxWidth: '600px' }}>
                <div className="card fade-in" style={{
                    padding: '50px 40px',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Animated background glow */}
                    <div style={{
                        position: 'absolute', top: '-50%', left: '-50%', right: '-50%', bottom: '-50%',
                        background: 'radial-gradient(circle at center, rgba(40, 167, 69, 0.08) 0%, transparent 70%)',
                        animation: 'pulse 3s ease-in-out infinite',
                        pointerEvents: 'none',
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, #28a745, #20c997)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px', boxShadow: '0 10px 30px rgba(40, 167, 69, 0.3)',
                            animation: 'scaleIn 0.5s ease-out',
                        }}>
                            <FaCheckCircle style={{ fontSize: '2.2rem', color: '#fff' }} />
                        </div>

                        <h1 style={{
                            fontSize: '1.8rem', fontWeight: '900',
                            background: 'linear-gradient(135deg, #28a745, #20c997)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            marginBottom: '12px',
                        }}>
                            Payment Successful!
                        </h1>

                        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                            Your order has been placed successfully. The seller has been notified
                            and will start working on your project soon.
                        </p>

                        {/* Order Details Card */}
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '16px',
                            padding: '24px',
                            border: '1px solid var(--border-color)',
                            textAlign: 'left',
                            marginBottom: '32px',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Order ID</span>
                                <span style={{ fontWeight: '800', color: 'var(--accent-primary)' }}>
                                    #SB-{orderResult.order_id}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Service</span>
                                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{orderResult.gig_title}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Seller</span>
                                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>@{orderResult.seller}</span>
                            </div>
                            <div style={{
                                height: '1px', background: 'var(--border-color)', margin: '16px 0',
                            }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: '700' }}>Total Paid</span>
                                <span style={{
                                    fontWeight: '900', fontSize: '1.2rem',
                                    color: 'var(--accent-secondary)',
                                }}>
                                    ${orderResult.amount}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <Link to="/dashboard" className="btn btn-primary" style={{
                                padding: '12px 28px', fontWeight: '700',
                            }}>
                                Go to Dashboard
                            </Link>
                            <Link to="/gigs" className="btn btn-secondary" style={{
                                padding: '12px 28px', fontWeight: '700',
                            }}>
                                Browse More
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ===== PROCESSING STATE =====
    if (processing) {
        return (
            <div className="container" style={{
                padding: '60px 20px', maxWidth: '500px',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                minHeight: '60vh',
            }}>
                <div className="card" style={{ padding: '60px 40px', textAlign: 'center', width: '100%' }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '50%',
                        border: '3px solid var(--border-color)',
                        borderTopColor: 'var(--accent-primary)',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 24px',
                    }} />
                    <h2 style={{ marginBottom: '12px', fontWeight: '800' }}>Processing Payment...</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Securely processing your payment. Please don't close this page.
                    </p>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '8px', marginTop: '24px', color: 'var(--text-muted)', fontSize: '0.8rem',
                    }}>
                        <FaLock style={{ color: 'var(--success)' }} />
                        <span>256-bit SSL Encryption</span>
                    </div>
                </div>
            </div>
        );
    }

    // Platform fee
    const platformFee = (gig.price * 0.1).toFixed(2);
    const totalAmount = Number(gig.price).toFixed(2);

    // ===== CHECKOUT FORM =====
    return (
        <div className="container" style={{ padding: '40px 20px', maxWidth: '1000px' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <Link to={`/gigs/${gig.id}`} style={{
                    fontSize: '0.85rem', color: 'var(--text-muted)',
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    textDecoration: 'none', marginBottom: '12px',
                }}>
                    <FaArrowLeft /> Back to Gig
                </Link>
                <h1 style={{
                    fontSize: '2rem', fontWeight: '900', letterSpacing: '-1px',
                    background: 'var(--accent-gradient)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                    Secure Checkout
                </h1>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px',
                }}>
                    <FaShieldAlt style={{ color: 'var(--success)' }} />
                    <span>Your payment information is encrypted and secure</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>
                {/* LEFT — Payment Form */}
                <div>
                    <form onSubmit={handleSubmit}>
                        {/* Card Preview */}
                        <div style={{
                            background: 'linear-gradient(135deg, #1a1a3e, #2d1b69, #1a3a5c)',
                            borderRadius: '20px',
                            padding: '28px 32px',
                            marginBottom: '28px',
                            position: 'relative',
                            overflow: 'hidden',
                            minHeight: '200px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                        }}>
                            {/* Card background pattern */}
                            <div style={{
                                position: 'absolute', top: '-40px', right: '-40px',
                                width: '200px', height: '200px', borderRadius: '50%',
                                background: 'rgba(108, 99, 255, 0.15)',
                            }} />
                            <div style={{
                                position: 'absolute', bottom: '-60px', left: '-20px',
                                width: '160px', height: '160px', borderRadius: '50%',
                                background: 'rgba(255, 107, 107, 0.1)',
                            }} />

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                                    <div style={{
                                        width: '50px', height: '35px', borderRadius: '6px',
                                        background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                                        opacity: 0.9,
                                    }} />
                                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                                        SkillBridge Pay
                                    </div>
                                </div>

                                <div style={{
                                    fontSize: '1.3rem', fontWeight: '500', letterSpacing: '3px',
                                    color: '#fff', marginBottom: '24px', fontFamily: 'monospace',
                                }}>
                                    {cardNumber || '•••• •••• •••• ••••'}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <div>
                                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            Card Holder
                                        </div>
                                        <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '500', marginTop: '4px' }}>
                                            {cardName || 'YOUR NAME'}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            Expires
                                        </div>
                                        <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '500', marginTop: '4px' }}>
                                            {expiry || 'MM/YY'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card Form Fields */}
                        <div className="card" style={{ padding: '28px', marginBottom: '20px' }}>
                            <h3 style={{
                                fontSize: '1.1rem', fontWeight: '800', marginBottom: '20px',
                                display: 'flex', alignItems: 'center', gap: '10px',
                            }}>
                                <FaCreditCard style={{ color: 'var(--accent-primary)' }} />
                                Payment Details
                            </h3>

                            <div className="input-group" style={{ marginBottom: '16px' }}>
                                <label>Card Number</label>
                                <input
                                    type="text"
                                    placeholder="1234 5678 9012 3456"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                    onFocus={() => setCardFocused('number')}
                                    onBlur={() => setCardFocused(null)}
                                    maxLength={19}
                                    required
                                    style={{
                                        borderColor: cardFocused === 'number' ? 'var(--accent-primary)' : undefined,
                                        boxShadow: cardFocused === 'number' ? '0 0 0 3px rgba(108, 99, 255, 0.15)' : undefined,
                                    }}
                                />
                            </div>

                            <div className="input-group" style={{ marginBottom: '16px' }}>
                                <label>Cardholder Name</label>
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    value={cardName}
                                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                                    onFocus={() => setCardFocused('name')}
                                    onBlur={() => setCardFocused(null)}
                                    required
                                    style={{
                                        borderColor: cardFocused === 'name' ? 'var(--accent-primary)' : undefined,
                                        boxShadow: cardFocused === 'name' ? '0 0 0 3px rgba(108, 99, 255, 0.15)' : undefined,
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="input-group">
                                    <label>Expiry Date</label>
                                    <input
                                        type="text"
                                        placeholder="MM/YY"
                                        value={expiry}
                                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                        onFocus={() => setCardFocused('expiry')}
                                        onBlur={() => setCardFocused(null)}
                                        maxLength={5}
                                        required
                                        style={{
                                            borderColor: cardFocused === 'expiry' ? 'var(--accent-primary)' : undefined,
                                            boxShadow: cardFocused === 'expiry' ? '0 0 0 3px rgba(108, 99, 255, 0.15)' : undefined,
                                        }}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>CVV</label>
                                    <input
                                        type="password"
                                        placeholder="•••"
                                        value={cvv}
                                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        onFocus={() => setCardFocused('cvv')}
                                        onBlur={() => setCardFocused(null)}
                                        maxLength={4}
                                        required
                                        style={{
                                            borderColor: cardFocused === 'cvv' ? 'var(--accent-primary)' : undefined,
                                            boxShadow: cardFocused === 'cvv' ? '0 0 0 3px rgba(108, 99, 255, 0.15)' : undefined,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Requirements */}
                        <div className="card" style={{ padding: '28px', marginBottom: '20px' }}>
                            <h3 style={{
                                fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px',
                            }}>
                                📋 Project Requirements <span style={{ fontSize: '0.75rem', fontWeight: '400', color: 'var(--text-muted)' }}>(optional)</span>
                            </h3>
                            <textarea
                                placeholder="Describe what you need from this service... (e.g., specific features, colors, deadline preferences)"
                                value={requirements}
                                onChange={(e) => setRequirements(e.target.value)}
                                rows={4}
                                style={{
                                    width: '100%', padding: '14px', borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                                    fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit',
                                }}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{
                                width: '100%', padding: '16px', fontSize: '1.05rem',
                                fontWeight: '800', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', gap: '10px',
                                background: 'linear-gradient(135deg, #6c63ff, #5a52d5)',
                                boxShadow: '0 8px 24px rgba(108, 99, 255, 0.35)',
                            }}
                        >
                            <FaLock style={{ fontSize: '0.9rem' }} />
                            Pay ${totalAmount}
                        </button>

                        {/* Trust badges */}
                        <div style={{
                            display: 'flex', justifyContent: 'center', gap: '24px',
                            marginTop: '20px', paddingTop: '20px',
                            borderTop: '1px solid var(--border-color)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                <FaShieldAlt style={{ color: 'var(--success)' }} /> SSL Secure
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                <FaLock style={{ color: 'var(--accent-primary)' }} /> Encrypted
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                <FaCheckCircle style={{ color: 'var(--accent-secondary)' }} /> Buyer Protected
                            </div>
                        </div>
                    </form>
                </div>

                {/* RIGHT — Order Summary Sidebar */}
                <div style={{ position: 'sticky', top: '100px' }}>
                    <div className="card" style={{ padding: '28px' }}>
                        <h3 style={{
                            fontWeight: '800', marginBottom: '20px',
                            textTransform: 'uppercase', letterSpacing: '1px',
                            color: 'var(--text-muted)', fontSize: '0.75rem',
                        }}>
                            Order Summary
                        </h3>

                        {/* Gig Info */}
                        <div style={{
                            display: 'flex', gap: '14px', marginBottom: '20px',
                            paddingBottom: '20px', borderBottom: '1px solid var(--border-color)',
                        }}>
                            {gig.image ? (
                                <img src={gig.image} alt={gig.title} style={{
                                    width: '70px', height: '70px', borderRadius: '12px',
                                    objectFit: 'cover',
                                }} />
                            ) : (
                                <div style={{
                                    width: '70px', height: '70px', borderRadius: '12px',
                                    background: 'var(--accent-gradient)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                                }}>
                                    💼
                                </div>
                            )}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '700', fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '4px' }}>
                                    {gig.title}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    by @{gig.seller?.username}
                                </div>
                            </div>
                        </div>

                        {/* Features */}
                        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                marginBottom: '10px', fontSize: '0.85rem',
                            }}>
                                <FaClock style={{ color: 'var(--accent-primary)', fontSize: '0.8rem' }} />
                                <span>{gig.delivery_days} day{gig.delivery_days > 1 ? 's' : ''} delivery</span>
                            </div>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                marginBottom: '10px', fontSize: '0.85rem',
                            }}>
                                <FaSyncAlt style={{ color: 'var(--accent-primary)', fontSize: '0.8rem' }} />
                                <span>{gig.revisions} revision{gig.revisions > 1 ? 's' : ''}</span>
                            </div>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                fontSize: '0.85rem',
                            }}>
                                <FaStar style={{ color: '#ffc107', fontSize: '0.8rem' }} />
                                <span>{Number(gig.average_rating).toFixed(1)} rating</span>
                            </div>
                        </div>

                        {/* Price Breakdown */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                marginBottom: '10px', fontSize: '0.9rem',
                            }}>
                                <span style={{ color: 'var(--text-muted)' }}>Service Price</span>
                                <span style={{ fontWeight: '600' }}>${totalAmount}</span>
                            </div>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                marginBottom: '10px', fontSize: '0.9rem',
                            }}>
                                <span style={{ color: 'var(--text-muted)' }}>Service Fee</span>
                                <span style={{ fontWeight: '600' }}>${platformFee}</span>
                            </div>
                        </div>

                        {/* Total */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            padding: '16px 0',
                            borderTop: '2px solid var(--border-color)',
                        }}>
                            <span style={{ fontWeight: '800', fontSize: '1rem' }}>Total</span>
                            <span style={{
                                fontWeight: '900', fontSize: '1.4rem',
                                background: 'var(--accent-gradient)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            }}>
                                ${totalAmount}
                            </span>
                        </div>

                        {/* Guarantee Badge */}
                        <div style={{
                            marginTop: '20px', padding: '16px',
                            background: 'rgba(40, 167, 69, 0.06)',
                            borderRadius: '12px', border: '1px solid rgba(40, 167, 69, 0.15)',
                            display: 'flex', alignItems: 'center', gap: '12px',
                        }}>
                            <FaShieldAlt style={{ color: 'var(--success)', fontSize: '1.2rem', flexShrink: 0 }} />
                            <div>
                                <div style={{ fontWeight: '700', fontSize: '0.8rem', marginBottom: '2px' }}>
                                    Buyer Protection
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                    Full refund if work isn't delivered as described
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes scaleIn {
                    from { transform: scale(0); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.5; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.05); }
                }
                @media (max-width: 768px) {
                    .container > div[style*="grid-template-columns"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
