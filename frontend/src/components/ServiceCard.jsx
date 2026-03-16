import { Link } from 'react-router-dom';
import { Star, Clock, ArrowRight } from 'lucide-react';

export default function ServiceCard({ service }) {
    const {
        _id,
        name = 'Service Name',
        description = 'Professional service for your needs',
        price = 0,
        category = 'General',
        rating = 0,
        reviewCount = 0,
        duration = '1 hr',
        image,
    } = service || {};

    return (
        <Link
            to={`/services/${_id}`}
            className="card-hover group block overflow-hidden"
            id={`service-card-${_id}`}
        >
            {/* Image */}
            <div className="relative -mx-6 -mt-6 mb-4 aspect-[16/10] overflow-hidden bg-surface-100">
                {image ? (
                    <img
                        src={image}
                        alt={name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                        <div className="text-4xl font-bold text-primary-300">
                            {name.charAt(0)}
                        </div>
                    </div>
                )}
                <div className="absolute top-3 left-3">
                    <span className="badge-primary backdrop-blur-sm">{category}</span>
                </div>
            </div>

            {/* Content */}
            <div>
                <h3 className="text-base font-semibold text-surface-900 group-hover:text-primary-600 transition-colors line-clamp-1">
                    {name}
                </h3>
                <p className="mt-1 text-sm text-surface-500 line-clamp-2 leading-relaxed">
                    {description}
                </p>

                {/* Meta */}
                <div className="mt-3 flex items-center gap-3 text-xs text-surface-400">
                    {rating > 0 && (
                        <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-medium text-surface-700">{rating.toFixed(1)}</span>
                            <span>({reviewCount})</span>
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {duration}
                    </span>
                </div>

                {/* Price + CTA */}
                <div className="mt-4 flex items-center justify-between border-t border-surface-100 pt-3">
                    <div>
                        <span className="text-lg font-bold text-surface-900">₹{price}</span>
                        <span className="text-xs text-surface-400 ml-1">onwards</span>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-medium text-primary-600 opacity-0 translate-x-[-4px] transition-all group-hover:opacity-100 group-hover:translate-x-0">
                        Book now <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                </div>
            </div>
        </Link>
    );
}

// Skeleton variant
export function ServiceCardSkeleton() {
    return (
        <div className="card">
            <div className="-mx-6 -mt-6 mb-4 aspect-[16/10] skeleton" />
            <div className="h-4 w-3/4 skeleton mb-2" />
            <div className="h-3 w-full skeleton mb-1" />
            <div className="h-3 w-2/3 skeleton mb-4" />
            <div className="flex justify-between border-t border-surface-100 pt-3">
                <div className="h-5 w-16 skeleton" />
                <div className="h-4 w-12 skeleton" />
            </div>
        </div>
    );
}
