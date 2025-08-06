export const componentCode = {
  'party-welcome': `"use client"

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
}`,
  'ocean-info': `import { Waves, Fish, Thermometer, Globe } from 'lucide-react'

export function OceanInfoCard() {
  const oceanFacts = [
    {
      icon: <Globe className="h-5 w-5 text-blue-600" />,
      title: "Coverage",
      value: "71%",
      description: "of Earth's surface"
    },
    {
      icon: <Waves className="h-5 w-5 text-cyan-600" />,
      title: "Average Depth",
      value: "3,688m",
      description: "12,100 feet deep"
    },
    {
      icon: <Fish className="h-5 w-5 text-teal-600" />,
      title: "Species",
      value: "230,000+",
      description: "known marine species"
    },
    {
      icon: <Thermometer className="h-5 w-5 text-blue-500" />,
      title: "Temperature",
      value: "2-30°C",
      description: "varies by depth & location"
    }
  ]

  return (
    <div className="w-full max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 shadow-lg">
      <div className="text-center p-6 pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Waves className="h-8 w-8 text-blue-600" />
          <h2 className="text-3xl font-bold text-blue-900">The Ocean</h2>
        </div>
        <p className="text-lg text-blue-700">
          Earth's vast marine ecosystem covering most of our planet
        </p>
      </div>
      
      <div className="p-6 pt-0 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {oceanFacts.map((fact, index) => (
            <div key={index} className="bg-white/70 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-3 mb-2">
                {fact.icon}
                <h3 className="font-semibold text-blue-900">{fact.title}</h3>
              </div>
              <div className="text-2xl font-bold text-blue-800 mb-1">{fact.value}</div>
              <div className="text-sm text-blue-600">{fact.description}</div>
            </div>
          ))}
        </div>

        <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Waves className="h-5 w-5" />
            Ocean Zones
          </h3>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              Sunlight Zone (0-200m)
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-blue-200 text-blue-900">
              Twilight Zone (200-1000m)
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-blue-300 text-blue-900">
              Midnight Zone (1000-4000m)
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-blue-400 text-white">
              Abyssal Zone (4000-6000m)
            </span>
            <span className="px-3 py-1 rounded-full text-sm bg-blue-500 text-white">
              Hadal Zone (6000m+)
            </span>
          </div>
        </div>

        <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2">Did You Know?</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• The ocean produces over 50% of the world's oxygen</li>
            <li>• Less than 5% of the ocean has been explored by humans</li>
            <li>• The ocean contains 99% of Earth's living space</li>
            <li>• The deepest point is the Mariana Trench at 11,034 meters</li>
          </ul>
        </div>
      </div>
    </div>
  )
}`,
  'game-rules': `"use client"

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
                  <span className={\`text-xs px-2 py-1 rounded-full border \${categoryColors[rule.category]}\`}>
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
}`,
  'recipe-card': `import { Clock, Users, ChefHat } from "lucide-react"

interface RecipeCardProps {
  title?: string
  prepTime?: number
  cookTime?: number
  servings?: number
  difficulty?: "Easy" | "Medium" | "Hard"
  ingredients?: string[]
  instructions?: string[]
}

export function RecipeCard({
  title = "Classic Grilled Cheese Sandwich",
  prepTime = 5,
  cookTime = 8,
  servings = 2,
  difficulty = "Easy",
  ingredients = [
    "4 slices of bread (white, sourdough, or whole wheat)",
    "4 slices of cheese (cheddar, American, or Swiss)",
    "2 tablespoons butter, softened",
    "Optional: 1 slice tomato per sandwich",
    "Optional: 2 slices bacon, cooked",
  ],
  instructions = [
    "Heat a large skillet or griddle over medium-low heat.",
    "Butter one side of each bread slice generously.",
    "Place bread butter-side down in the skillet.",
    "Add cheese slices on top of 2 bread slices in the pan.",
    "Add optional tomato or bacon if desired.",
    "Top with remaining bread slices, butter-side up.",
    "Cook for 3-4 minutes until golden brown on the bottom.",
    "Carefully flip and cook another 3-4 minutes until golden and cheese is melted.",
    "Remove from heat and let cool for 1 minute before cutting.",
    "Cut diagonally and serve immediately while hot.",
  ],
}: RecipeCardProps) {
  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg border">
      <div className="p-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <ChefHat className="w-3 h-3 mr-1" />
            {difficulty}
          </span>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Prep: {prepTime} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Cook: {cookTime} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>Serves: {servings}</span>
          </div>
        </div>
      </div>

      <div className="p-6 pt-0 space-y-6">
        {/* Recipe Image Placeholder */}
        <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-lg flex items-center justify-center">
          <div className="text-6xl">🧀</div>
        </div>

        {/* Ingredients Section */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Ingredients</h3>
          <ul className="space-y-2">
            {ingredients.map((ingredient, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                <span className="text-gray-700">{ingredient}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t pt-6">
          {/* Instructions Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Instructions</h3>
            <ol className="space-y-3">
              {instructions.map((instruction, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white text-sm font-medium rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 leading-relaxed">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">💡 Pro Tips</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Use room temperature butter for easier spreading</li>
            <li>• Keep heat at medium-low to prevent burning</li>
            <li>• Cover with a lid for extra melty cheese</li>
          </ul>
        </div>
      </div>
    </div>
  )
}`,
  'contact-form': `"use client"

import type React from "react"
import { useState } from "react"
import { Phone, Mail, MapPin, Wrench } from "lucide-react"

interface FormData {
  name: string
  phone: string
  email: string
  address: string
  serviceType: string
  urgency: string
  contactMethod: string
  message: string
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    address: "",
    serviceType: "",
    urgency: "",
    contactMethod: "phone",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
    // Handle form submission here
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-[600px] bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Wrench className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">AquaFix Plumbing</h1>
          </div>
          <p className="text-gray-600">Professional plumbing services you can trust</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg">
          <div className="bg-blue-600 text-white rounded-t-lg p-4">
            <h2 className="text-2xl font-semibold">Request Service</h2>
            <p className="text-blue-100 text-sm mt-1">
              Fill out the form below and we'll get back to you within 2 hours
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="John Smith"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Service Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      id="address"
                      type="text"
                      placeholder="123 Main St, City, State"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="service-type" className="block text-sm font-medium text-gray-700">
                    Type of Service *
                  </label>
                  <select
                    id="service-type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.serviceType}
                    onChange={(e) => handleInputChange("serviceType", e.target.value)}
                    required
                  >
                    <option value="">Select service type</option>
                    <option value="drain-cleaning">Drain Cleaning</option>
                    <option value="leak-repair">Leak Repair</option>
                    <option value="toilet-repair">Toilet Repair</option>
                    <option value="faucet-repair">Faucet Repair</option>
                    <option value="water-heater">Water Heater Service</option>
                    <option value="pipe-repair">Pipe Repair</option>
                    <option value="installation">New Installation</option>
                    <option value="emergency">Emergency Service</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="urgency" className="block text-sm font-medium text-gray-700">
                    Urgency Level *
                  </label>
                  <select
                    id="urgency"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.urgency}
                    onChange={(e) => handleInputChange("urgency", e.target.value)}
                    required
                  >
                    <option value="">Select urgency</option>
                    <option value="emergency">Emergency (Same Day)</option>
                    <option value="urgent">Urgent (Within 24 hours)</option>
                    <option value="normal">Normal (Within 2-3 days)</option>
                    <option value="flexible">Flexible (Within a week)</option>
                  </select>
                </div>
              </div>

              {/* Preferred Contact Method */}
              <div className="space-y-3">
                <span className="block text-sm font-medium text-gray-700">
                  Preferred Contact Method *
                </span>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="contactMethod"
                      value="phone"
                      checked={formData.contactMethod === "phone"}
                      onChange={(e) => handleInputChange("contactMethod", e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">Phone Call</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="contactMethod"
                      value="text"
                      checked={formData.contactMethod === "text"}
                      onChange={(e) => handleInputChange("contactMethod", e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">Text Message</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="contactMethod"
                      value="email"
                      checked={formData.contactMethod === "email"}
                      onChange={(e) => handleInputChange("contactMethod", e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">Email</span>
                  </label>
                </div>
              </div>

              {/* Additional Details */}
              <div className="space-y-2">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Describe the Problem
                </label>
                <textarea
                  id="message"
                  rows={4}
                  placeholder="Please describe the plumbing issue in detail. Include any relevant information such as when the problem started, what you've tried, and any other symptoms you've noticed."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition duration-200"
                >
                  Request Service Call
                </button>
                <p className="text-sm text-gray-500 text-center mt-2">
                  We'll contact you within 2 hours during business hours
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Contact Info Footer */}
        <div className="mt-6 text-center">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Need Immediate Help?</h3>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>Emergency: (555) 911-PIPE</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>info@aquafixplumbing.com</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Licensed • Insured • 24/7 Emergency Service Available</p>
          </div>
        </div>
      </div>
    </div>
  )
}`
}