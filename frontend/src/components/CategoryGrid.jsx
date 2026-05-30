import { Droplets, Zap, PaintBucket, Wrench, Scissors, Sparkles, Truck, Shield, Home, Bug, WashingMachine, Hammer } from 'lucide-react';

const defaultCategories = [
    { name: 'Cleaning', icon: Droplets, color: 'bg-blue-50 text-blue-600' },
    { name: 'Plumbing', icon: Wrench, color: 'bg-cyan-50 text-cyan-600' },
    { name: 'Electrical', icon: Zap, color: 'bg-amber-50 text-amber-600' },
    { name: 'Painting', icon: PaintBucket, color: 'bg-purple-50 text-purple-600' },
    { name: 'Repairs', icon: Wrench, color: 'bg-orange-50 text-orange-600' },
    { name: 'Salon', icon: Scissors, color: 'bg-pink-50 text-pink-600' },
    { name: 'Moving', icon: Truck, color: 'bg-emerald-50 text-emerald-600' },
    { name: 'Security', icon: Shield, color: 'bg-red-50 text-red-600' },
    { name: 'Home Care', icon: Home, color: 'bg-teal-50 text-teal-600' },
    { name: 'Pest Control', icon: Bug, color: 'bg-lime-50 text-lime-700' },
    { name: 'Appliance', icon: WashingMachine, color: 'bg-indigo-50 text-indigo-600' },
    { name: 'Carpentry', icon: Hammer, color: 'bg-yellow-50 text-yellow-700' },
];

export default function CategoryGrid({ categories, onCategoryClick }) {
    const items = categories || defaultCategories;

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
            {items.map((cat) => {
                const Icon = cat.icon || Sparkles;
                const colorClass = cat.color || 'bg-surface-100 text-surface-600';

                return (
                    <button
                        key={cat.name}
                        onClick={() => onCategoryClick?.(cat)}
                        className="group flex flex-col items-center gap-2.5 rounded-xl border border-surface-200 bg-white p-4 sm:p-5 transition-all duration-200 hover:border-primary-200 hover:shadow-sm"
                    >
                        <div className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg ${colorClass} transition-transform duration-200 group-hover:scale-105`}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-surface-700 group-hover:text-surface-900 transition-colors">
                            {cat.name}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
