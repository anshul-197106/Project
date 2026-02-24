import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineLightningBolt } from 'react-icons/hi';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-brand">
                    <HiOutlineLightningBolt style={{ color: '#6c63ff', fontSize: '1.6rem' }} />
                    <span>SkillBridge</span>
                </Link>
                <div className="navbar-links">
                    <Link to="/gigs">Browse Gigs</Link>
                    {user ? (
                        <>
                            <Link to="/dashboard">Dashboard</Link>
                            <Link to="/gigs/new">Post a Gig</Link>
                            <Link to={`/profile/${user.id}`}>Profile</Link>
                            <button onClick={handleLogout}>Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">Login</Link>
                            <Link to="/signup" className="btn btn-primary btn-sm">Sign Up Free</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
