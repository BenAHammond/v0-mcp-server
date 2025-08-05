'use client'

import React from 'react'
import { 
  FaHeart, 
  FaStar, 
  FaMusic, 
  FaSun, 
  FaMoon, 
  FaFeather, 
  FaGem, 
  FaLeaf, 
  FaSnowflake 
} from 'react-icons/fa'
import { V0Badge } from '@/components/server/ui/v0-badge'

const icons = [
  { Icon: FaHeart, gradient: 'from-red-400 to-pink-600' },
  { Icon: FaStar, gradient: 'from-yellow-400 to-orange-600' },
  { Icon: FaMusic, gradient: 'from-green-400 to-emerald-600' },
  { Icon: FaSun, gradient: 'from-amber-400 to-yellow-600' },
  { Icon: FaMoon, gradient: 'from-indigo-400 to-purple-600' },
  { Icon: FaFeather, gradient: 'from-cyan-400 to-blue-600' },
  { Icon: FaGem, gradient: 'from-purple-400 to-pink-600' },
  { Icon: FaLeaf, gradient: 'from-lime-400 to-green-600' },
  { Icon: FaSnowflake, gradient: 'from-blue-400 to-cyan-600' }
]

export default function RainbowIconGrid() {
  return (
    <div className="grid grid-cols-3 gap-2 p-4 max-w-xs mx-auto relative">
      <V0Badge variant="floating" size="sm" />
      {icons.map((item, index) => {
        const { Icon, gradient } = item
        return (
          <div
            key={index}
            className={`
              relative overflow-hidden rounded-lg shadow-md
              bg-gradient-to-br ${gradient}
              w-20 h-20 flex items-center justify-center
              transform transition-all duration-300
              hover:scale-110 hover:shadow-lg hover:-translate-y-1
              cursor-pointer
            `}
          >
            <Icon className="text-white text-2xl" />
            <div className="absolute inset-0 bg-white opacity-0 hover:opacity-20 transition-opacity duration-300" />
          </div>
        )
      })}
    </div>
  )
}