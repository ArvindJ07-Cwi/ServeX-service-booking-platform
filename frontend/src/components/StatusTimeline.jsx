import { Check, Circle, Loader2, X } from 'lucide-react';

const defaultSteps = [
    { key: 'pending', label: 'Booking Placed' },
    { key: 'assigned', label: 'Agent Matched' },
    { key: 'accepted', label: 'Agent Accepted' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
];

const statusOrder = ['pending', 'assigned', 'accepted', 'in_progress', 'completed'];

export default function StatusTimeline({ currentStatus = 'pending', steps = defaultSteps }) {
    const currentIndex = statusOrder.indexOf(currentStatus);
    const isCancelled = currentStatus === 'cancelled';

    if (isCancelled) {
        return (
            <div className="rounded-xl border border-danger-100 bg-danger-50 p-4">
                <div className="flex items-center gap-2 text-danger-600">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-danger-500 text-white">
                        <X className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-medium">Booking Cancelled</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Horizontal timeline for md+ screens */}
            <div className="hidden md:block">
                <div className="flex items-start justify-between">
                    {steps.map((step, index) => {
                        const isCompleted = index < currentIndex;
                        const isCurrent = index === currentIndex;
                        const isLast = index === steps.length - 1;

                        return (
                            <div key={step.key} className="flex flex-1 items-start">
                                <div className="flex flex-col items-center w-full">
                                    {/* Row: indicator + connector line */}
                                    <div className="flex items-center w-full">
                                        {/* Left connector */}
                                        {index > 0 && (
                                            <div
                                                className={`h-0.5 flex-1 transition-colors duration-300 ${
                                                    isCompleted || isCurrent ? 'bg-primary-600' : 'bg-surface-200'
                                                }`}
                                            />
                                        )}

                                        {/* Circle indicator */}
                                        <div
                                            className={`relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                                isCompleted
                                                    ? 'border-primary-600 bg-primary-600 text-white'
                                                    : isCurrent
                                                        ? 'border-primary-600 bg-white text-primary-600 ring-4 ring-primary-50'
                                                        : 'border-surface-300 bg-white text-surface-300'
                                            }`}
                                        >
                                            {isCompleted ? (
                                                <Check className="h-4 w-4" />
                                            ) : isCurrent ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Circle className="h-3 w-3" />
                                            )}
                                        </div>

                                        {/* Right connector */}
                                        {!isLast && (
                                            <div
                                                className={`h-0.5 flex-1 transition-colors duration-300 ${
                                                    isCompleted ? 'bg-primary-600' : 'bg-surface-200'
                                                }`}
                                            />
                                        )}
                                    </div>

                                    {/* Label */}
                                    <p
                                        className={`mt-2 text-xs font-medium text-center transition-colors ${
                                            isCompleted || isCurrent ? 'text-surface-900' : 'text-surface-400'
                                        }`}
                                    >
                                        {step.label}
                                    </p>
                                    {isCurrent && (
                                        <p className="text-[10px] text-primary-600 mt-0.5 font-medium">Current</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Vertical timeline for mobile */}
            <div className="md:hidden space-y-0">
                {steps.map((step, index) => {
                    const isCompleted = index <= currentIndex;
                    const isCurrent = index === currentIndex;
                    const isLast = index === steps.length - 1;

                    return (
                        <div key={step.key} className="flex gap-3">
                            {/* Indicator */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                        isCompleted
                                            ? 'border-primary-600 bg-primary-600 text-white'
                                            : isCurrent
                                                ? 'border-primary-600 bg-white text-primary-600'
                                                : 'border-surface-300 bg-white text-surface-300'
                                    }`}
                                >
                                    {isCompleted && !isCurrent ? (
                                        <Check className="h-3.5 w-3.5" />
                                    ) : isCurrent ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Circle className="h-2.5 w-2.5" />
                                    )}
                                </div>
                                {!isLast && (
                                    <div
                                        className={`w-0.5 flex-1 min-h-[20px] transition-colors duration-300 ${
                                            isCompleted && index < currentIndex ? 'bg-primary-600' : 'bg-surface-200'
                                        }`}
                                    />
                                )}
                            </div>

                            {/* Label */}
                            <div className={`pb-5 ${isLast ? 'pb-0' : ''}`}>
                                <p
                                    className={`text-sm font-medium transition-colors ${
                                        isCompleted ? 'text-surface-900' : 'text-surface-400'
                                    }`}
                                >
                                    {step.label}
                                </p>
                                {isCurrent && (
                                    <p className="text-xs text-primary-600 mt-0.5">Current status</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
