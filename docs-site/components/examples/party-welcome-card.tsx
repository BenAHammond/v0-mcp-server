"use client"

import { Sparkles, Heart } from "lucide-react"

export function PartyWelcomeCard() {
  return (
    <div className="flex items-center justify-center min-h-[400px] bg-pink-50 p-4 rounded-lg">
      <div className="w-full max-w-md bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl shadow-2xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Heart className="w-12 h-12 text-white fill-white" />
            <Sparkles className="w-6 h-6 text-pink-200 absolute -top-2 -right-2" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">Welcome to</h1>

        <h2 className="text-4xl font-extrabold text-white mb-6 tracking-wider">Tiffany's Party</h2>

        <div className="flex justify-center space-x-2 mb-4">
          <Sparkles className="w-5 h-5 text-pink-200" />
          <Sparkles className="w-4 h-4 text-pink-100" />
          <Sparkles className="w-5 h-5 text-pink-200" />
        </div>

        <p className="text-pink-100 text-lg font-medium">Let's celebrate in style!</p>
      </div>
    </div>
  )
}