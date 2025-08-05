'use client'

import React, { useState, useRef } from 'react'
import { V0Badge } from '@/components/server/ui/v0-badge'

const emojis = ['😊', '😍', '🎉', '🤔', '😢']

interface ReactionCount {
  [key: string]: number
}

export default function EmojiReactionPicker() {
  const [reactions, setReactions] = useState<ReactionCount>({})
  const [floatingOnes, setFloatingOnes] = useState<{ id: number; emoji: string }[]>([])
  const idCounterRef = useRef(0)

  const handleReaction = (emoji: string) => {
    setReactions(prev => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + 1
    }))

    const id = idCounterRef.current++
    setFloatingOnes(prev => [...prev, { id, emoji }])
    
    setTimeout(() => {
      setFloatingOnes(prev => prev.filter(item => item.id !== id))
    }, 1000)
  }

  return (
    <div className="flex justify-center items-center gap-2 p-4 relative">
      <V0Badge variant="floating" size="sm" />
      {emojis.map((emoji) => (
        <div key={emoji} className="relative">
          <button
            onClick={() => handleReaction(emoji)}
            className="
              text-3xl p-2 rounded-full
              transition-all duration-200
              hover:scale-125 hover:bg-gray-100
              active:scale-110
              focus:outline-none focus:ring-2 focus:ring-blue-400
            "
          >
            {emoji}
          </button>
          {reactions[emoji] > 0 && (
            <span className="
              absolute -bottom-1 -right-1
              bg-blue-500 text-white text-xs
              rounded-full w-5 h-5
              flex items-center justify-center
              font-semibold
            ">
              {reactions[emoji]}
            </span>
          )}
          {floatingOnes
            .filter(item => item.emoji === emoji)
            .map(item => (
              <span
                key={item.id}
                className="
                  absolute top-0 left-1/2 -translate-x-1/2
                  text-green-500 font-bold text-sm
                  animate-float-up pointer-events-none
                "
                style={{
                  animation: 'floatUp 1s ease-out forwards'
                }}
              >
                +1
              </span>
            ))}
        </div>
      ))}
      <style jsx>{`
        @keyframes floatUp {
          0% {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateX(-50%) translateY(-30px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}