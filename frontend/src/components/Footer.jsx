import { Link } from 'react-router-dom';
import { Wrench, Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react';

const footerLinks = {
    Product: [
        { label: 'Services', to: '/services' },
        { label: 'How it Works', to: '/about' },
        { label: 'Pricing', to: '/services' },
        { label: 'Become an Agent', to: '/register' },
    ],
    Company: [
        { label: 'About Us', to: '/about' },
        { label: 'Careers', to: '/about' },
        { label: 'Blog', to: '/about' },
        { label: 'Press', to: '/about' },
    ],
    Support: [
        { label: 'Help Center', to: '/about' },
        { label: 'Contact Us', to: '/about' },
        { label: 'Privacy Policy', to: '/about' },
        { label: 'Terms of Service', to: '/about' },
    ],
};

export default function Footer() {
    return (
        <footer className="border-t border-surface-200 bg-surface-950">
            <div className="section-container py-16">
                <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <Link to="/" className="inline-flex items-center gap-2 group">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600">
                                <Wrench className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white tracking-tight">
                                Serve<span className="text-primary-400">X</span>
                            </span>
                        </Link>
                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-surface-400">
                            Your trusted marketplace for local services. Book verified professionals
                            for home cleaning, repairs, beauty, and more — in just a few taps.
                        </p>
                        <div className="mt-6 space-y-2.5">
                            <a href="mailto:support@servex.com" className="flex items-center gap-2 text-sm text-surface-400 hover:text-white transition-colors">
                                <Mail className="h-4 w-4" />
                                support@servex.com
                            </a>
                            <a href="tel:+1234567890" className="flex items-center gap-2 text-sm text-surface-400 hover:text-white transition-colors">
                                <Phone className="h-4 w-4" />
                                +1 (234) 567-890
                            </a>
                            <p className="flex items-center gap-2 text-sm text-surface-400">
                                <MapPin className="h-4 w-4" />
                                San Francisco, CA
                            </p>
                        </div>
                    </div>

                    {/* Link Groups */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h4 className="text-sm font-semibold text-white">{title}</h4>
                            <ul className="mt-4 space-y-2.5">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            to={link.to}
                                            className="group flex items-center gap-1 text-sm text-surface-400 hover:text-white transition-colors"
                                        >
                                            {link.label}
                                            <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0 transition-all group-hover:opacity-100 group-hover:translate-y-0" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom */}
                <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-surface-800 pt-8 sm:flex-row">
                    <p className="text-sm text-surface-500">
                        © {new Date().getFullYear()} ServeX. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <a href="#" className="text-sm text-surface-500 hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="text-sm text-surface-500 hover:text-white transition-colors">Terms</a>
                        <a href="#" className="text-sm text-surface-500 hover:text-white transition-colors">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
