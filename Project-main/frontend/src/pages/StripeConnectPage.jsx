import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function StripeConnectPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [accountId, setAccountId] = useState('');

    const handleConnect = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // For testing: simulating Stripe connection locally
            await api.put('/auth/profile/', {
                stripe_account_id: accountId
            });
            toast.success('Stripe Account Connected!');
            // Reload user context or redirect
            window.location.href = '/dashboard';
        } catch (err) {
            toast.error('Failed to connect account.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ padding: '60px 24px', maxWidth: '600px', textAlign: 'center' }}>
            <div className="card" style={{ padding: '40px' }}>
                <h1 style={{ marginBottom: '16px' }}>Connect with Stripe</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                    To receive payouts for your gigs, you need to connect a Stripe account. For this testing phase, simply enter any mock connected account ID below.
                </p>

                <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="input-group" style={{ textAlign: 'left' }}>
                        <label>Stripe Connected Account ID (e.g., acct_12345)</label>
                        <input
                            type="text"
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            placeholder="acct_..."
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '12px' }}>
                        {loading ? 'Connecting...' : 'Connect Account'}
                    </button>
                </form>
            </div>
        </div>
    );
}
