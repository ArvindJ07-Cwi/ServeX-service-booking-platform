import {
    Droplets,
    Zap,
    PaintBucket,
    Wrench,
    Scissors,
    Sparkles,
    Truck,
    Shield,
    Home,
    Bug,
    WashingMachine,
    Hammer,
} from 'lucide-react';

const defaultCategories = [
    { id: 1, name: 'Cleaning', icon: Sparkles, color: 'bg-blue-50 text-blue-600' },
    { id: 2, name: 'Plumbing', icon: Droplets, color: 'bg-cyan-50 text-cyan-600' },
    { id: 3, name: 'Electrical', icon: Zap, color: 'bg-amber-50 text-amber-600' },
    { id: 4, name: 'Painting', icon: PaintBucket, color: 'bg-purple-50 text-purple-600' },
    { id: 5, name: 'Repairs', icon: Wrench, color: 'bg-orange-50 text-orange-600' },
    { id: 6, name: 'Salon', icon: Scissors, color: 'bg-pink-50 text-pink-600' },
    { id: 7, name: 'Moving', icon: Truck, color: 'bg-emerald-50 text-emerald-600' },
    { id: 8, name: 'Security', icon: Shield, color: 'bg-red-50 text-red-600' },
    { id: 9, name: 'Home Care', icon: Home, color: 'bg-teal-50 text-teal-600' },
    { id: 10, name: 'Pest Control', icon: Bug, color: 'bg-lime-50 text-lime-600' },
    { id: 11, name: 'Appliance', icon: WashingMachine, color: 'bg-indigo-50 text-indigo-600' },
    { id: 12, name: 'Carpentry', icon: Hammer, color: 'bg-yellow-50 text-yellow-700' },
];

export default function CategoryGrid({ categories, onCategoryClick }) {
    const items = categories?.length ? categories : defaultCategories;

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 stagger-children">
            {items.map((cat) => {
                const Icon = cat.icon || Wrench;
                return (
                    <button
                        key={cat.id || cat._id || cat.name}
                        onClick={() => onCategoryClick?.(cat)}
                        className="group flex flex-col items-center gap-2.5 rounded-2xl border border-surface-100 bg-white p-4 sm:p-5 transition-all duration-200 hover:border-primary-200 hover:shadow-lg hover:-translate-y-0.5"
                        id={`category-${cat.name?.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${cat.color || 'bg-primary-50 text-primary-600'} transition-transform duration-200 group-hover:scale-110`}>
                            <Icon className="h-6 w-6" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-surface-700 text-center leading-tight">
                            {cat.name}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
