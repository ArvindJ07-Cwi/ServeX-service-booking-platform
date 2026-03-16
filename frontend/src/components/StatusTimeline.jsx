import { Check, Circle, Loader2 } from 'lucide-react';

const defaultSteps = [
    { key: 'pending', label: 'Booking Placed' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'accepted', label: 'Agent Assigned' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
];

const statusOrder = ['pending', 'confirmed', 'accepted', 'in_progress', 'completed'];

export default function StatusTimeline({ currentStatus = 'pending', steps = defaultSteps }) {
    const currentIndex = statusOrder.indexOf(currentStatus);
    const isCancelled = currentStatus === 'cancelled';

    if (isCancelled) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2 text-danger-500">
                    <Circle className="h-5 w-5 fill-danger-500" />
                    <span className="text-sm font-medium">Booking Cancelled</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-0">
            {steps.map((step, index) => {
                const isCompleted = index <= currentIndex;
                const isCurrent = index === currentIndex;
                const isLast = index === steps.length - 1;

                return (
                    <div key={step.key} className="flex gap-3">
                        {/* Indicator */}
                        <div className="flex flex-col items-center">
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${isCompleted
                                        ? 'border-primary-600 bg-primary-600 text-white'
                                        : isCurrent
                                            ? 'border-primary-600 bg-white text-primary-600'
                                            : 'border-surface-300 bg-white text-surface-300'
                                    }`}
                            >
                                {isCompleted && !isCurrent ? (
                                    <Check className="h-4 w-4" />
                                ) : isCurrent ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Circle className="h-3 w-3" />
                                )}
                            </div>
                            {!isLast && (
                                <div
                                    className={`w-0.5 flex-1 min-h-[24px] transition-colors duration-300 ${isCompleted && index < currentIndex
                                            ? 'bg-primary-600'
                                            : 'bg-surface-200'
                                        }`}
                                />
                            )}
                        </div>

                        {/* Label */}
                        <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                            <p
                                className={`text-sm font-medium transition-colors ${isCompleted
                                        ? 'text-surface-900'
                                        : 'text-surface-400'
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
    );
}
