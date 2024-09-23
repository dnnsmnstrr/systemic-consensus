import { useState } from "react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Pencil1Icon, TrashIcon } from '@radix-ui/react-icons'
import { Option } from "@/lib/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type OptionProps = {
  option: Option
  userCount: number
  maxScore: number
  vetoEnabled: boolean
  onUpdateOptionText: (optionId: number, newText: string) => void
  onUpdateScore: (optionId: number, userIndex: number, score: number) => void
  onDeleteOption: (optionId: number) => void
}

export function DecisionOption({ option, userCount, maxScore, vetoEnabled, onUpdateOptionText, onUpdateScore, onDeleteOption }: OptionProps) {
  const [editing, setEditing] = useState(false)
  const [editedText, setEditedText] = useState(option.text)
  const [showDeleteButton, setShowDeleteButton] = useState(false)

  const handleSave = () => {
    onUpdateOptionText(option.id, editedText)
    setEditing(false)
  }

  const calculateTotalResistance = (scores: number[]) => scores.reduce((a, b) => a + b, 0)

  return (
    <Card
      onMouseEnter={() => setShowDeleteButton(true)}
      onMouseLeave={() => setShowDeleteButton(false)}
      className={"border rounded-lg p-4" + (vetoEnabled && option.scores.some(score => score === maxScore) ? " border-red-500" : "")}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          {editing ? (
            <div className="flex-grow flex items-center space-x-2">
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
              className="flex-grow cursor-pointer group"
            >
              {option.text}
              <Pencil1Icon className="inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardTitle>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                className={`ml-2 transition-opacity duration-300 ${showDeleteButton ? 'opacity-100' : 'opacity-0'}`}
              >
                <TrashIcon className="text-red-500" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the option.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDeleteOption(option.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-y-2">
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
        </div>
        <div className="font-bold mt-2">
          Total Resistance: {calculateTotalResistance(option.scores)}
        </div>
      </CardContent>
    </Card>
  )
}