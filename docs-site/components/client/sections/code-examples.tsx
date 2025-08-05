"use client"

import { CodeViewer } from "@/components/client/widgets/code-viewer"

interface CodeExampleProps {
  title: string
  code: string
  language?: string
}

export function CodeExample({ title, code, language = "typescript" }: CodeExampleProps) {
  return <CodeViewer code={code} language={language} title={title} />
}