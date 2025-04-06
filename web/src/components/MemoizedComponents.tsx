/**
 * MemoizedComponents - Optimized React components using memoization
 * 
 * This file contains memoized versions of commonly used components to prevent
 * unnecessary re-renders and improve performance.
 */

import React, { memo, useMemo, useCallback } from 'react';

// Types for common components
interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  children: React.ReactNode;
}

interface CardProps {
  title?: string;
  subtitle?: string;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: () => void;
}

interface ListItemProps {
  primary: string;
  secondary?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  active?: boolean;
  disabled?: boolean;
}

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  fallback?: string;
}

// Helper function to generate class names
const classNames = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

// Memoized Button component
export const Button = memo(({
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  type = 'button',
  className = '',
  children,
}: ButtonProps) => {
  // Memoize the click handler
  const handleClick = useCallback(() => {
    if (onClick && !disabled) {
      onClick();
    }
  }, [onClick, disabled]);

  // Memoize the class name
  const buttonClassName = useMemo(() => {
    return classNames(
      'btn',
      `btn-${variant}`,
      `btn-${size}`,
      fullWidth && 'btn-full-width',
      disabled && 'btn-disabled',
      className
    );
  }, [variant, size, fullWidth, disabled, className]);

  return (
    <button
      type={type}
      className={buttonClassName}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

// Memoized Card component
export const Card = memo(({
  title,
  subtitle,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  children,
  footer,
  onClick,
}: CardProps) => {
  // Memoize the click handler
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    }
  }, [onClick]);

  // Memoize the class names
  const cardClassName = useMemo(() => {
    return classNames('card', className, onClick && 'card-clickable');
  }, [className, onClick]);

  const headerClass = useMemo(() => {
    return classNames('card-header', headerClassName);
  }, [headerClassName]);

  const bodyClass = useMemo(() => {
    return classNames('card-body', bodyClassName);
  }, [bodyClassName]);

  const footerClass = useMemo(() => {
    return classNames('card-footer', footerClassName);
  }, [footerClassName]);

  return (
    <div className={cardClassName} onClick={onClick ? handleClick : undefined}>
      {(title || subtitle) && (
        <div className={headerClass}>
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <h4 className="card-subtitle">{subtitle}</h4>}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
      {footer && <div className={footerClass}>{footer}</div>}
    </div>
  );
});

Card.displayName = 'Card';

// Memoized ListItem component
export const ListItem = memo(({
  primary,
  secondary,
  icon,
  onClick,
  className = '',
  active = false,
  disabled = false,
}: ListItemProps) => {
  // Memoize the click handler
  const handleClick = useCallback(() => {
    if (onClick && !disabled) {
      onClick();
    }
  }, [onClick, disabled]);

  // Memoize the class name
  const itemClassName = useMemo(() => {
    return classNames(
      'list-item',
      active && 'list-item-active',
      disabled && 'list-item-disabled',
      onClick && 'list-item-clickable',
      className
    );
  }, [active, disabled, onClick, className]);

  return (
    <div className={itemClassName} onClick={onClick && !disabled ? handleClick : undefined}>
      {icon && <div className="list-item-icon">{icon}</div>}
      <div className="list-item-content">
        <div className="list-item-primary">{primary}</div>
        {secondary && <div className="list-item-secondary">{secondary}</div>}
      </div>
    </div>
  );
});

ListItem.displayName = 'ListItem';

// Memoized Badge component
export const Badge = memo(({
  label,
  variant = 'primary',
  size = 'medium',
  className = '',
}: BadgeProps) => {
  // Memoize the class name
  const badgeClassName = useMemo(() => {
    return classNames(
      'badge',
      `badge-${variant}`,
      `badge-${size}`,
      className
    );
  }, [variant, size, className]);

  return <span className={badgeClassName}>{label}</span>;
});

Badge.displayName = 'Badge';

// Memoized Avatar component
export const Avatar = memo(({
  src,
  alt = '',
  size = 'medium',
  className = '',
  fallback,
}: AvatarProps) => {
  // Memoize the class name
  const avatarClassName = useMemo(() => {
    return classNames(
      'avatar',
      `avatar-${size}`,
      className
    );
  }, [size, className]);

  // Generate fallback content if no image
  const fallbackContent = useMemo(() => {
    if (fallback) return fallback;
    if (alt) return alt.charAt(0).toUpperCase();
    return '?';
  }, [fallback, alt]);

  return (
    <div className={avatarClassName}>
      {src ? (
        <img src={src} alt={alt} className="avatar-img" />
      ) : (
        <div className="avatar-fallback">{fallbackContent}</div>
      )}
    </div>
  );
});

Avatar.displayName = 'Avatar';

// Export a function to create memoized components
export function createMemoizedComponent<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
): React.MemoExoticComponent<React.ComponentType<P>> {
  const MemoizedComponent = memo(Component, propsAreEqual);
  MemoizedComponent.displayName = `Memoized${Component.displayName || Component.name || 'Component'}`;
  return MemoizedComponent;
}

// Export all components
export default {
  Button,
  Card,
  ListItem,
  Badge,
  Avatar,
  createMemoizedComponent,
};