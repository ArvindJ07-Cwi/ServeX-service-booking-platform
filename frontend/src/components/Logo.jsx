import { Link } from 'react-router-dom';
import servxLogo from '../assets/servx-logo.jpg';

// Size presets: width of the logo image itself
const sizeMap = {
    small: { img: 32, text: 'text-xl' },
    medium: { img: 40, text: 'text-2xl' },
    large: { img: 56, text: 'text-3xl' },
};

/**
 * Reusable Logo component for ServeX.
 *
 * Props:
 *  - size: 'small' | 'medium' | 'large'  (default: 'small')
 *  - showText: boolean — show "ServeX" wordmark next to logo (default: true)
 *  - className: extra class override on the wrapper
 *  - linkTo: path to navigate on click (default: '/')
 *  - hideTextOnMobile: hides the wordmark on small screens (default: true for small size)
 */
export default function Logo({
    size = 'small',
    showText = true,
    className = '',
    linkTo = '/',
    hideTextOnMobile = size === 'small',
}) {
    const { img, text } = sizeMap[size] || sizeMap.small;

    return (
        <Link
            to={linkTo}
            className={`inline-flex items-center gap-2 group flex-shrink-0 ${className}`}
            aria-label="ServeX Home"
        >
            <img
                src={servxLogo}
                alt="ServeX Logo"
                width={img}
                height={img}
                className="object-contain transition-transform group-hover:scale-105"
                style={{ width: img, height: img }}
                loading="eager"
                decoding="async"
            />
            {showText && (
                <span
                    className={`font-bold tracking-tight text-surface-900 ${text} ${
                        hideTextOnMobile ? 'hidden sm:inline' : ''
                    }`}
                >
                    Serve<span className="text-primary-600">X</span>
                </span>
            )}
        </Link>
    );
}
