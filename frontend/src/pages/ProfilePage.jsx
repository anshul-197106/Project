import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import GigCard from '../components/GigCard';
import StarRating from '../components/StarRating';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FaMapMarkerAlt, FaClock, FaGlobe, FaGraduationCap, FaBriefcase } from 'react-icons/fa';

export default function ProfilePage() {
    const { id } = useParams();
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [gigs, setGigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});

    const isOwnProfile = user && String(user.id) === String(id);

    useEffect(() => {
        setLoading(true);
        const fetchProfile = async () => {
            try {
                let profileRes;
                if (isOwnProfile) {
                    profileRes = await api.get('/auth/profile/');
                } else {
                    profileRes = await api.get(`/auth/profile/${id}/`);
                }
                setProfile(profileRes.data);
                setFormData(profileRes.data);

                // Fetch user's gigs
                const gigsRes = await api.get(`/gigs/?search=${profileRes.data.user?.username || ''}`);
                setGigs(gigsRes.data.results || gigsRes.data);
            } catch {
                toast.error('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id, isOwnProfile]);

    const handleSave = async () => {
        try {
            const res = await api.put('/auth/profile/', {
                full_name: formData.full_name,
                bio: formData.bio,
                skills: formData.skills,
                hourly_rate: formData.hourly_rate,
                location: formData.location,
                tagline: formData.tagline,
                languages: formData.languages,
                education: formData.education,
                experience_years: formData.experience_years,
                portfolio_url: formData.portfolio_url,
                phone: formData.phone,
            });
            setProfile(res.data);
            setEditing(false);
            toast.success('Profile updated!');
        } catch {
            toast.error('Failed to update profile');
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;
    if (!profile) return <div className="empty-state"><h3>Profile not found</h3></div>;

    const displayName = profile.full_name || profile.username || profile.user?.username || 'User';
    const initials = displayName.slice(0, 2).toUpperCase();

    return (
        <div className="container">
            <div className="profile-header">
                <div className="profile-avatar">{initials}</div>
                <div className="profile-info">
                    <h1>{displayName}</h1>
                    {profile.tagline && <div className="tagline">{profile.tagline}</div>}
                    {profile.bio && <div className="bio">{profile.bio}</div>}

                    <div className="profile-meta">
                        {profile.location && (
                            <span><FaMapMarkerAlt /> {profile.location}</span>
                        )}
                        {(profile.experience_years > 0) && (
                            <span><FaBriefcase /> {profile.experience_years} years experience</span>
                        )}
                        {profile.education && (
                            <span><FaGraduationCap /> {profile.education}</span>
                        )}
                        {profile.languages && (
                            <span><FaGlobe /> {profile.languages}</span>
                        )}
                        <span><FaClock /> Member since {new Date(profile.created_at || profile.user?.date_joined).toLocaleDateString()}</span>
                    </div>

                    {profile.skills && (
                        <div className="profile-skills">
                            {(profile.skills_list || profile.skills?.split(',')).map((skill, i) => (
                                <span key={i} className="skill-tag">{skill.trim()}</span>
                            ))}
                        </div>
                    )}

                    {/* Stats Row */}
                    <div style={{ display: 'flex', gap: '32px', marginTop: '20px', flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>
                                {profile.total_orders_completed || 0}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Orders Done</div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <StarRating rating={profile.average_rating || 0} size={16} />
                                <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{Number(profile.average_rating || 0).toFixed(1)}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rating</div>
                        </div>
                        {profile.hourly_rate > 0 && (
                            <div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                                    ${profile.hourly_rate}/hr
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hourly Rate</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Profile */}
            {isOwnProfile && (
                <div style={{ marginBottom: '40px' }}>
                    {!editing ? (
                        <button className="btn btn-secondary" onClick={() => setEditing(true)}>
                            ✏️ Edit Profile
                        </button>
                    ) : (
                        <div className="card" style={{ marginTop: '20px' }}>
                            <h2 style={{ marginBottom: '20px' }}>Edit Profile</h2>
                            <div className="form-row">
                                <div className="input-group">
                                    <label>Full Name</label>
                                    <input value={formData.full_name || ''} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>Tagline</label>
                                    <input value={formData.tagline || ''} onChange={e => setFormData({ ...formData, tagline: e.target.value })} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Bio</label>
                                <textarea value={formData.bio || ''} onChange={e => setFormData({ ...formData, bio: e.target.value })} />
                            </div>
                            <div className="form-row">
                                <div className="input-group">
                                    <label>Skills (comma-separated)</label>
                                    <input value={formData.skills || ''} onChange={e => setFormData({ ...formData, skills: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>Hourly Rate ($)</label>
                                    <input type="number" value={formData.hourly_rate || 0} onChange={e => setFormData({ ...formData, hourly_rate: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="input-group">
                                    <label>Location</label>
                                    <input value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>Languages</label>
                                    <input value={formData.languages || ''} onChange={e => setFormData({ ...formData, languages: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="input-group">
                                    <label>Education</label>
                                    <input value={formData.education || ''} onChange={e => setFormData({ ...formData, education: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>Experience (years)</label>
                                    <input type="number" value={formData.experience_years || 0} onChange={e => setFormData({ ...formData, experience_years: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
                                <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* User's Gigs */}
            <div className="dashboard-section">
                <h2>💼 {isOwnProfile ? 'My' : `${displayName}'s`} Gigs</h2>
                {gigs.length > 0 ? (
                    <div className="gigs-grid">
                        {gigs.map(gig => <GigCard key={gig.id} gig={gig} />)}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="icon">📭</div>
                        <h3>No gigs yet</h3>
                        {isOwnProfile && (
                            <Link to="/gigs/new" className="btn btn-primary" style={{ marginTop: '12px' }}>Create Your First Gig</Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
