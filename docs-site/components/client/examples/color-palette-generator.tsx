'use client'

import React, { useState } from 'react'
import { FiRefreshCw, FiCopy, FiCheck } from 'react-icons/fi'
import { V0Badge } from '@/components/server/ui/v0-badge'

// Predefined pastel color palettes to avoid hydration issues
const pastelPalettes = [
  ['#FFE5E5', '#FFE5F1', '#F0E5FF', '#E5F1FF', '#E5FFE5'],
  ['#FFF0E5', '#E5F5FF', '#F5E5FF', '#E5FFF0', '#FFE5F5'],
  ['#F0F8E5', '#E5F0FF', '#FFE5F0', '#F5FFE5', '#E5F8FF'],
  ['#E8F5E8', '#F5E8F5', '#E8E8F5', '#F5F5E8', '#E8F5F5'],
  ['#FDF2E9', '#E9F7EF', '#EBF3FD', '#F4ECF7', '#FDEAA7']
]

let currentPaletteIndex = 0

function getNextPalette(): string[] {
  const palette = pastelPalettes[currentPaletteIndex]
  currentPaletteIndex = (currentPaletteIndex + 1) % pastelPalettes.length
  return palette
}

export default function ColorPaletteGenerator() {
  const [colors, setColors] = useState<string[]>(pastelPalettes[0])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const regenerateColors = () => {
    setColors(getNextPalette())
  }

  const copyToClipboard = (color: string, index: number) => {
    navigator.clipboard.writeText(color)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }


  return (
    <div className="p-4 max-w-md mx-auto relative">
      <V0Badge variant="floating" size="sm" />
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Pastel Palette</h3>
        <button
          onClick={regenerateColors}
          className="
            p-2 rounded-full bg-gray-100 hover:bg-gray-200
            transition-all duration-200 hover:rotate-180
            focus:outline-none focus:ring-2 focus:ring-blue-400
          "
          aria-label="Generate new colors"
        >
          <FiRefreshCw className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-2">
        {colors.map((color, index) => (
          <div
            key={index}
            className="group relative flex-1"
          >
            <div
              className="
                h-16 rounded-lg shadow-sm
                transition-all duration-200
                group-hover:shadow-md group-hover:scale-105
                cursor-pointer
              "
              style={{ backgroundColor: color }}
              onClick={() => copyToClipboard(color, index)}
            />
            <div className="
              absolute inset-0 rounded-lg
              bg-black bg-opacity-75 text-white
              flex flex-col items-center justify-center
              opacity-0 group-hover:opacity-100
              transition-opacity duration-200
              cursor-pointer text-xs
            ">
              <span className="font-mono mb-1">{color}</span>
              {copiedIndex === index ? (
                <FiCheck className="w-3 h-3" />
              ) : (
                <FiCopy className="w-3 h-3" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}