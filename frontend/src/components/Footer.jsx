import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import Logo from './Logo';

const footerLinks = {
    Product: [
        { label: 'All Services', to: '/services' },
        { label: 'How it Works', to: '/about' },
        { label: 'Pricing', to: '/services' },
        { label: 'Become a Provider', to: '/register' },
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
        <footer className="bg-surface-900 border-t border-surface-800">
            <div className="section-container py-12 lg:py-16">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-4 lg:col-span-2">
                        <Logo size="medium" className="[&_span]:text-white [&_div]:bg-white/10 [&_div_span]:text-white" linkTo="/" />
                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-surface-400">
                            Your trusted platform for professional home services. Book verified experts for cleaning, repairs, beauty, and more.
                        </p>
                        <div className="mt-6 space-y-2">
                            <a href="mailto:support@servex.com" className="flex items-center gap-2.5 text-sm text-surface-400 hover:text-surface-200 transition-colors">
                                <Mail className="h-4 w-4 flex-shrink-0" />
                                support@servex.com
                            </a>
                            <a href="tel:+1234567890" className="flex items-center gap-2.5 text-sm text-surface-400 hover:text-surface-200 transition-colors">
                                <Phone className="h-4 w-4 flex-shrink-0" />
                                +1 (234) 567-890
                            </a>
                            <p className="flex items-center gap-2.5 text-sm text-surface-400">
                                <MapPin className="h-4 w-4 flex-shrink-0" />
                                San Francisco, CA
                            </p>
                        </div>
                    </div>

                    {/* Link Groups */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h4 className="text-sm font-semibold text-surface-200">{title}</h4>
                            <ul className="mt-4 space-y-2.5">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            to={link.to}
                                            className="text-sm text-surface-400 hover:text-surface-200 transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom */}
                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-surface-800 pt-8 sm:flex-row">
                    <p className="text-sm text-surface-500">
                        © {new Date().getFullYear()} ServeX. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <a href="#" className="text-sm text-surface-500 hover:text-surface-300 transition-colors">Privacy</a>
                        <a href="#" className="text-sm text-surface-500 hover:text-surface-300 transition-colors">Terms</a>
                        <a href="#" className="text-sm text-surface-500 hover:text-surface-300 transition-colors">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
