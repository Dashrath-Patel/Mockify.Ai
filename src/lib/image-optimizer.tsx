/**
 * Optimized Image Component
 * Wrapper around next/image with best practices and automatic optimization
 */

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  aspectRatio?: string;
  containerClassName?: string;
  showLoader?: boolean;
}

/**
 * Optimized Image with automatic lazy loading, blur placeholder, and error handling
 */
export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/placeholder.svg',
  className,
  containerClassName,
  aspectRatio,
  showLoader = true,
  priority = false,
  quality = 85,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
    setImgSrc(fallbackSrc);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div 
      className={cn('relative overflow-hidden', containerClassName)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {showLoader && isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
      )}
      
      <Image
        src={imgSrc}
        alt={alt}
        className={cn(
          'object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          hasError && 'opacity-50',
          className
        )}
        onError={handleError}
        onLoad={handleLoad}
        quality={quality}
        priority={priority}
        // Automatic format optimization (WebP/AVIF)
        // Automatic lazy loading unless priority is true
        loading={priority ? undefined : 'lazy'}
        // Blur placeholder for better UX
        placeholder="blur"
        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAwIiBoZWlnaHQ9IjQ3NSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4="
        {...props}
      />
    </div>
  );
}

/**
 * Avatar Image with automatic optimization
 */
export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className,
  fallbackSrc = '/avatar-placeholder.svg',
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  fallbackSrc?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      fallbackSrc={fallbackSrc}
      className={cn('rounded-full', className)}
      priority={false}
    />
  );
}

/**
 * Logo Image with priority loading
 */
export function OptimizedLogo({
  src,
  alt,
  width,
  height,
  className,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={true} // Logo should load immediately
      quality={100} // High quality for branding
    />
  );
}

/**
 * Background Image with low priority
 */
export function OptimizedBackgroundImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      className={cn('object-cover', className)}
      priority={false}
      quality={75} // Lower quality for backgrounds
      sizes="100vw"
    />
  );
}

/**
 * Responsive Image with automatic srcset
 */
export function ResponsiveImage({
  src,
  alt,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  className,
  ...props
}: OptimizedImageProps & { sizes?: string }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      sizes={sizes}
      className={className}
      {...props}
    />
  );
}
