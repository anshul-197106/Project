import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">
                <div className="footer-brand">
                    <h3>⚡ SkillBridge</h3>
                    <p>
                        The modern freelancing platform connecting talented professionals
                        with clients worldwide. Find the perfect freelancer or showcase your skills.
                    </p>
                </div>
                <div className="footer-section">
                    <h4>Platform</h4>
                    <Link to="/gigs">Browse Gigs</Link>
                    <Link to="/signup">Become a Freelancer</Link>
                    <Link to="/gigs">Categories</Link>
                </div>
                <div className="footer-section">
                    <h4>Company</h4>
                    <a href="#">About Us</a>
                    <a href="#">Careers</a>
                    <a href="#">Blog</a>
                </div>
                <div className="footer-section">
                    <h4>Support</h4>
                    <a href="#">Help Center</a>
                    <a href="#">Contact Us</a>
                    <a href="#">Terms of Service</a>
                </div>
            </div>
            <div className="footer-bottom">
                &copy; 2026 SkillBridge. All rights reserved. | Built with Django &amp; React
            </div>
        </footer>
    );
}
