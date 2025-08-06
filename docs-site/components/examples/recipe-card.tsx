import { Clock, Users, ChefHat } from "lucide-react"

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
}