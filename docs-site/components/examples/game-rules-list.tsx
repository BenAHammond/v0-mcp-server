"use client"

import type React from "react"
import { Clock, Users, Smartphone, Trophy, Coffee, AlertCircle, Heart, Gamepad2 } from "lucide-react"

interface Rule {
  icon: React.ReactNode
  title: string
  description: string
  category: "timing" | "behavior" | "gameplay" | "food" | "general"
}

const rules: Rule[] = [
  {
    icon: <Clock className="w-5 h-5" />,
    title: "Arrive on Time",
    description: "Please arrive within 15 minutes of the scheduled start time. Late arrivals may miss the first game!",
    category: "timing",
  },
  {
    icon: <Smartphone className="w-5 h-5" />,
    title: "Phone-Free Gaming",
    description:
      "Keep phones on silent and avoid using them during active gameplay. We're here to connect with each other!",
    category: "behavior",
  },
  {
    icon: <Trophy className="w-5 h-5" />,
    title: "Good Sportsmanship",
    description: "Win graciously, lose with dignity. No table flipping, excessive gloating, or rage quitting allowed.",
    category: "behavior",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Include Everyone",
    description:
      "Make sure all players understand the rules before starting. Help newcomers feel welcome and included.",
    category: "behavior",
  },
  {
    icon: <Gamepad2 className="w-5 h-5" />,
    title: "Game Selection",
    description: "Games are chosen democratically. If there's a tie, we'll play both! Maximum game length is 2 hours.",
    category: "gameplay",
  },
  {
    icon: <AlertCircle className="w-5 h-5" />,
    title: "Rules Disputes",
    description: "Check the rulebook first. If still unclear, take a quick vote. The majority decision stands.",
    category: "gameplay",
  },
  {
    icon: <Coffee className="w-5 h-5" />,
    title: "Snacks & Drinks",
    description: "Everyone contributes something! Clean up spills immediately and keep food away from game components.",
    category: "food",
  },
  {
    icon: <Heart className="w-5 h-5" />,
    title: "Have Fun!",
    description: "Remember, the goal is to have a great time together. Laughter is encouraged and expected!",
    category: "general",
  },
]

const categoryColors = {
  timing: "bg-blue-100 text-blue-800 border-blue-200",
  behavior: "bg-green-100 text-green-800 border-green-200",
  gameplay: "bg-purple-100 text-purple-800 border-purple-200",
  food: "bg-orange-100 text-orange-800 border-orange-200",
  general: "bg-pink-100 text-pink-800 border-pink-200",
}

const categoryLabels = {
  timing: "Timing",
  behavior: "Behavior",
  gameplay: "Gameplay",
  food: "Food & Drinks",
  general: "General",
}

export function GameRulesList() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
        <h2 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Gamepad2 className="w-8 h-8 text-blue-600" />
          Game Night Rules
        </h2>
        <p className="text-lg text-gray-600 mt-2">Guidelines for an awesome evening of fun and friendship</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rules.map((rule, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-2 bg-blue-50 rounded-lg text-blue-600">{rule.icon}</div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg">{rule.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full border ${categoryColors[rule.category]}`}>
                    {categoryLabels[rule.category]}
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed">{rule.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold">Remember</h3>
          <div className="border-t pt-4">
            <p className="text-gray-600 max-w-2xl mx-auto">
              These rules exist to ensure everyone has a fantastic time. If you have suggestions for improvements or new
              rules, bring them up during our post-game discussion. Let's make every game night memorable! 🎲🎮
            </p>
            <div className="flex justify-center gap-2 text-2xl mt-4">🎯 🃏 🎲 🎮 🏆</div>
          </div>
        </div>
      </div>
    </div>
  )
}