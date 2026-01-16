import Image from 'next/image';
import Link from 'next/link';

interface BrandLogoProps {
    className?: string;
    showText?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function BrandLogo({ className = '', showText = true, size = 'md' }: BrandLogoProps) {
    // Size mapping for branding elements
    const sizeMap = {
        sm: { h: 'h-6', text: 'text-base', imgSize: 24 },
        md: { h: 'h-8', text: 'text-lg md:text-xl', imgSize: 32 },
        lg: { h: 'h-10', text: 'text-xl md:text-2xl', imgSize: 40 },
        xl: { h: 'h-12', text: 'text-2xl md:text-3xl', imgSize: 48 },
    };

    const currentSize = sizeMap[size];

    return (
        <Link href="/" className={`flex items-center group transition-all duration-300 ${className}`}>
            {/* Logo Image: Only visible on Mobile (< md) */}
            <Image
                src="/daonview_logo.png"
                alt="DAONVIEW"
                width={currentSize.imgSize * 4}
                height={currentSize.imgSize * 4}
                className={`${currentSize.h} w-auto object-contain md:hidden transition-transform group-hover:scale-105`}
                priority
            />
            
            {/* Brand Text: Only visible on Desktop (>= md) */}
            {showText && (
                <span className={`hidden md:flex brand-text-base brand-text-gradient ${currentSize.text}`}>
                    DAONVIEW
                </span>
            )}
        </Link>
    );
}
