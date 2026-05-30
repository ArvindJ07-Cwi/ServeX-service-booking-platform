import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Clock, ArrowRight } from 'lucide-react';
import ServiceDetailModal from './ServiceDetailModal';

export default function ServiceCard({ service }) {
    const { _id, name, description, price, category, rating, reviewCount, duration, image } = service;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <>
            <div
                onClick={() => navigate(`/services/${_id}`)}
                className="card-hover group cursor-pointer overflow-hidden"
            >
                {/* Image */}
                <div className="relative aspect-[16/10] overflow-hidden bg-surface-100">
                    {image ? (
                        <img
                            src={image}
                            alt={name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-surface-100 text-3xl font-bold text-surface-300">
                            {name?.charAt(0)}
                        </div>
                    )}
                    {category && (
                        <span className="absolute top-3 left-3 badge-primary text-[11px]">
                            {category}
                        </span>
                    )}
                </div>

                {/* Content */}
                <div className="p-4">
                    <h3 className="text-sm font-semibold text-surface-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                        {name}
                    </h3>
                    <p className="mt-1 text-xs text-surface-500 line-clamp-2 leading-relaxed">
                        {description}
                    </p>

                    {/* Meta */}
                    <div className="mt-3 flex items-center gap-3 text-xs text-surface-500">
                        {rating && (
                            <div className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                <span className="font-medium text-surface-700">{rating}</span>
                                {reviewCount > 0 && <span>({reviewCount})</span>}
                            </div>
                        )}
                        {duration && (
                            <div className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{duration}</span>
                            </div>
                        )}
                    </div>

                    {/* Price & CTA */}
                    <div className="mt-3 flex items-center justify-between border-t border-surface-100 pt-3">
                        <p className="text-sm font-semibold text-surface-900">
                            ₹{price} <span className="text-xs font-normal text-surface-400">onwards</span>
                        </p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsModalOpen(true);
                            }}
                            className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0 duration-200"
                        >
                            Book now
                            <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            <ServiceDetailModal
                service={service}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}

export function ServiceCardSkeleton() {
    return (
        <div className="card overflow-hidden">
            <div className="skeleton aspect-[16/10]" />
            <div className="p-4 space-y-3">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-1/2" />
                <div className="flex justify-between items-center pt-3 border-t border-surface-100">
                    <div className="skeleton h-5 w-16" />
                    <div className="skeleton h-4 w-20" />
                </div>
            </div>
        </div>
    );
}
