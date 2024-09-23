import { useState, KeyboardEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type CreateDecisionProps = {
  onCreateDecision: (title: string) => void
}

export function CreateDecision({ onCreateDecision }: CreateDecisionProps) {
  const [newDecisionTitle, setNewDecisionTitle] = useState("")

  const handleCreateDecision = () => {
    if (newDecisionTitle.trim()) {
      onCreateDecision(newDecisionTitle)
      setNewDecisionTitle("")
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newDecisionTitle.trim()) {
      e.preventDefault()
      handleCreateDecision()
    }
  }

  return (
    <div className="container mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center mb-6">Create New Decision</h1>
      
      <div className="flex space-x-2">
        <Input
          autoFocus
          type="text"
          value={newDecisionTitle}
          onChange={(e) => setNewDecisionTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter decision title"
        />
        <Button onClick={handleCreateDecision}>Create Decision</Button>
      </div>
    </div>
  )
}