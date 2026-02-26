import { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';

export default function PaymentSuccessPage() {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        // Here we could optionally make an API call to proactively trigger verification
        // But the webhook handles the actual order completion securely.
    }, [sessionId]);

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="card" style={{ textAlign: 'center', maxWidth: '500px', padding: '40px' }}>
                <FaCheckCircle style={{ fontSize: '4rem', color: 'var(--success)', marginBottom: '20px' }} />
                <h1 style={{ marginBottom: '16px' }}>Payment Successful!</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                    Your payment was securely processed. The seller has been notified and the funds are held securely until the work is delivered.
                </p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
                    <Link to="/gigs" className="btn btn-secondary">Browse More Gigs</Link>
                </div>
            </div>
        </div>
    );
}
