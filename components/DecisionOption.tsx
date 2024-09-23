import { useState } from "react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Pencil1Icon } from '@radix-ui/react-icons'
import { Option } from "@/lib/types"

type OptionProps = {
  option: Option
  userCount: number
  maxScore: number
  vetoEnabled: boolean
  onUpdateOptionText: (optionId: number, newText: string) => void
  onUpdateScore: (optionId: number, userIndex: number, score: number) => void
}

export function DecisionOption({ option, userCount, maxScore, vetoEnabled, onUpdateOptionText, onUpdateScore }: OptionProps) {
  const [editing, setEditing] = useState(false)
  const [editedText, setEditedText] = useState(option.text)

  const handleSave = () => {
    onUpdateOptionText(option.id, editedText)
    setEditing(false)
  }

  const calculateTotalResistance = (scores: number[]) => scores.reduce((a, b) => a + b, 0)

  return (
    <Card>
      <CardHeader>
        {editing ? (
          <div className="flex items-center space-x-2">
            <Input
              autoFocus
              type="text"
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            <Button onClick={handleSave}>Save</Button>
          </div>
        ) : (
          <CardTitle 
            onClick={() => setEditing(true)}
            className="group relative cursor-pointer"
          >
            {option.text}
            <Pencil1Icon className="inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
          </CardTitle>
        )}
      </CardHeader>
      <CardContent>
        {Array.from({ length: userCount }, (_, i) => (
          <div key={i} className="mb-4">
            <Label className="mb-2 block">
              User {i + 1} Resistance: {option.scores[i]}
              {vetoEnabled && option.scores[i] === maxScore && " (VETO)"}
            </Label>
            <Slider
              min={0}
              max={maxScore}
              step={1}
              value={[option.scores[i]]}
              onValueChange={(value) => onUpdateScore(option.id, i, value[0])}
            />
          </div>
        ))}
        <div className="font-bold mt-2">
          Total Resistance: {calculateTotalResistance(option.scores)}
        </div>
      </CardContent>
    </Card>
  )
}