import { Waves, Fish, Thermometer, Globe } from 'lucide-react'

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
}