import { useState, KeyboardEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlusIcon } from '@radix-ui/react-icons'

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
    <div className="flex space-x-2 w-full">
      <Input
        autoFocus
        type="text"
        value={newDecisionTitle}
        onChange={(e) => setNewDecisionTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter decision title"
      />
      <Button onClick={handleCreateDecision}>
        <PlusIcon className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:block">New Decision</span>
      </Button>
    </div>
  )
}