"use client"

import React from 'react'
import { ExampleWrapper } from '@/components/examples/example-wrapper'
import { PartyWelcomeCard } from '@/components/examples/party-welcome-card'
import { OceanInfoCard } from '@/components/examples/ocean-info-card'
import { GameRulesList } from '@/components/examples/game-rules-list'
import { RecipeCard } from '@/components/examples/recipe-card'
import { ContactForm } from '@/components/examples/contact-form'
import { examplePrompts } from '@/data/example-prompts'
import { componentCode } from '@/data/component-code'

export function ExamplesGallery() {
  // Map component imports to their IDs
  const componentMap = {
    'party-welcome': PartyWelcomeCard,
    'ocean-info': OceanInfoCard,
    'game-rules': GameRulesList,
    'recipe-card': RecipeCard,
    'contact-form': ContactForm
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {examplePrompts.map((example) => {
        const Component = componentMap[example.id as keyof typeof componentMap]
        
        return (
          <ExampleWrapper
            key={example.id}
            title={example.title}
            prompt={example.prompt}
            code={componentCode[example.id as keyof typeof componentCode]}
          >
            <Component />
          </ExampleWrapper>
        )
      })}
    </div>
  )
}