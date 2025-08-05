import React from 'react'
import { cn } from '@/lib/utils'

interface V0BadgeProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'inline' | 'floating'
  className?: string
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5'
}

const V0Badge: React.FC<V0BadgeProps> = ({ 
  size = 'md', 
  variant = 'inline',
  className 
}) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium transition-all duration-200',
        'bg-gradient-to-r from-purple-600 to-blue-600 text-white',
        'hover:from-purple-700 hover:to-blue-700 hover:scale-105',
        'shadow-md hover:shadow-lg',
        sizeClasses[size],
        variant === 'floating' && 'absolute top-4 right-4 z-10',
        className
      )}
    >
      <svg
        className={cn(
          'fill-current',
          size === 'sm' && 'w-3 h-3',
          size === 'md' && 'w-4 h-4',
          size === 'lg' && 'w-5 h-5'
        )}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 2L2 7L12 12L22 7L12 2Z" opacity="0.3" />
        <path d="M2 17L12 22L22 17V7L12 12L2 7V17Z" />
      </svg>
      <span>Generated with v0</span>
    </div>
  )
}

export { V0Badge, type V0BadgeProps }