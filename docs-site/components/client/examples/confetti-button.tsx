'use client'

import React, { useState, useRef } from 'react'
import { V0Badge } from '@/components/server/ui/v0-badge'

interface Particle {
  id: number
  color: string
  left: number
  delay: number
}

export default function ConfettiButton() {
  const [particles, setParticles] = useState<Particle[]>([])
  const particleCounterRef = useRef(0)

  const colors = ['bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500']

  const createConfetti = () => {
    const baseId = particleCounterRef.current
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: baseId + i,
      color: colors[i % colors.length], // Use deterministic color selection
      left: (i * 8.33) % 100, // Evenly distribute particles
      delay: i * 0.025 // Staggered delays
    }))
    
    particleCounterRef.current += 12
    setParticles(prev => [...prev, ...newParticles])
    
    // Clean up particles after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)))
    }, 1500)
  }

  return (
    <div className="relative inline-block p-4">
      <V0Badge variant="floating" size="sm" />
      <button
        onClick={createConfetti}
        className="
          px-6 py-3 rounded-full
          bg-gradient-to-r from-purple-500 to-pink-500
          text-white font-semibold
          transform transition-all duration-200
          hover:scale-105 hover:shadow-lg
          active:scale-95
          focus:outline-none focus:ring-4 focus:ring-purple-300
          hover:animate-wiggle
        "
      >
        Celebrate! 🎉
      </button>
      
      {/* Confetti particles */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        {particles.map(particle => (
          <div
            key={particle.id}
            className={`
              absolute w-2 h-2 rounded-full
              ${particle.color}
              animate-float-up-fade
            `}
            style={{
              left: `${particle.left}%`,
              bottom: '50%',
              animationDelay: `${particle.delay}s`,
              animation: 'floatUpFade 1.5s ease-out forwards'
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes floatUpFade {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) rotate(720deg);
            opacity: 0;
          }
        }
        
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg) scale(1.05); }
          25% { transform: rotate(3deg) scale(1.05); }
          50% { transform: rotate(-3deg) scale(1.05); }
          75% { transform: rotate(3deg) scale(1.05); }
        }
        
        .hover\\:animate-wiggle:hover {
          animation: wiggle 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}