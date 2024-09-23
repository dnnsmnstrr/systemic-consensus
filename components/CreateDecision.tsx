import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type CreateDecisionProps = {
  onCreateDecision: (title: string) => void
}

export function CreateDecision({ onCreateDecision }: CreateDecisionProps) {
  const [newDecisionTitle, setNewDecisionTitle] = useState("")

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center mb-6">Create New Decision</h1>
      <Input
        type="text"
        value={newDecisionTitle}
        onChange={(e) => setNewDecisionTitle(e.target.value)}
        placeholder="Enter decision title"
      />
      <Button onClick={() => onCreateDecision(newDecisionTitle)}>Create Decision</Button>
    </div>
  )
}