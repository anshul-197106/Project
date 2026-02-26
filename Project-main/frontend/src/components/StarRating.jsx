import { FaStar } from 'react-icons/fa';

export default function StarRating({ rating, size = 16 }) {
    return (
        <div style={{ display: 'flex', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                    key={star}
                    size={size}
                    color={star <= Math.round(rating) ? '#ffc107' : '#2a2a3e'}
                />
            ))}
        </div>
    );
}
