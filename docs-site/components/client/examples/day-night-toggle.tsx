'use client'

import React, { useState } from 'react'
import { V0Badge } from '@/components/server/ui/v0-badge'

export default function DayNightToggle() {
  const [isNight, setIsNight] = useState(false)

  return (
    <div className="flex items-center justify-center p-6 relative">
      <V0Badge variant="floating" size="sm" />
      <button
        onClick={() => setIsNight(!isNight)}
        className={`
          relative w-20 h-10 rounded-full p-1
          transition-all duration-500 ease-in-out
          focus:outline-none focus:ring-4 focus:ring-opacity-50
          ${isNight 
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 focus:ring-purple-400' 
            : 'bg-gradient-to-r from-blue-400 to-cyan-400 focus:ring-blue-300'
          }
        `}
        aria-label={isNight ? 'Switch to day mode' : 'Switch to night mode'}
      >
        {/* Stars for night mode */}
        <div className={`
          absolute inset-0 rounded-full overflow-hidden
          transition-opacity duration-500
          ${isNight ? 'opacity-100' : 'opacity-0'}
        `}>
          <div className="absolute top-2 left-3 w-1 h-1 bg-white rounded-full animate-pulse" />
          <div className="absolute top-3 left-6 w-0.5 h-0.5 bg-white rounded-full animate-pulse delay-75" />
          <div className="absolute bottom-2 left-4 w-0.5 h-0.5 bg-white rounded-full animate-pulse delay-150" />
        </div>

        {/* Toggle handle */}
        <div className={`
          relative w-8 h-8 rounded-full
          bg-white shadow-lg
          transform transition-all duration-500 ease-in-out
          ${isNight ? 'translate-x-10' : 'translate-x-0'}
        `}>
          {/* Sun */}
          <div className={`
            absolute inset-0 flex items-center justify-center
            text-xl transition-all duration-500
            ${isNight ? 'opacity-0 rotate-180 scale-0' : 'opacity-100 rotate-0 scale-100'}
          `}>
            ☀️
          </div>
          
          {/* Moon */}
          <div className={`
            absolute inset-0 flex items-center justify-center
            text-xl transition-all duration-500
            ${isNight ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-180 scale-0'}
          `}>
            🌙
          </div>
        </div>

        {/* Clouds for day mode */}
        <div className={`
          absolute inset-0 rounded-full overflow-hidden pointer-events-none
          transition-opacity duration-500
          ${isNight ? 'opacity-0' : 'opacity-100'}
        `}>
          <div className="absolute top-2 right-3 w-3 h-2 bg-white bg-opacity-60 rounded-full" />
          <div className="absolute bottom-2 right-5 w-2 h-1.5 bg-white bg-opacity-40 rounded-full" />
        </div>
      </button>
      
      <span className="ml-3 text-sm font-medium text-gray-700">
        {isNight ? 'Night' : 'Day'} Mode
      </span>
    </div>
  )
}