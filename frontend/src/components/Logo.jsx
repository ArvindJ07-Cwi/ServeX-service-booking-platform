import { Link } from 'react-router-dom';

const sizeMap = {
    small: { img: 'h-7 w-7', text: 'text-lg' },
    medium: { img: 'h-8 w-8', text: 'text-xl' },
    large: { img: 'h-10 w-10', text: 'text-2xl' },
};

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
                src="/images/ServexLOGO.png"
                alt="ServeX"
                className={`${img} object-contain`}
            />
            {showText && (
                <span
                    className={`font-semibold tracking-tight text-surface-900 ${text} ${
                        hideTextOnMobile ? 'hidden sm:inline' : ''
                    }`}
                >
                    Serve<span className="text-primary-600">X</span>
                </span>
            )}
        </Link>
    );
}
