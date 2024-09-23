"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { supabase } from "../lib/supabase"
import { Pencil1Icon } from '@radix-ui/react-icons'
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CreateDecision } from "@/components/CreateDecision"
import { DecisionOption } from "@/components/DecisionOption"
import { Decision } from "@/lib/types"

export function SystemicConsensusComponent() {
  const [decision, setDecision] = useState<Decision | null>(null)
  const [newOption, setNewOption] = useState("")
  const [decisionId, setDecisionId] = useState<string | null>(null)
  const [newDecisionTitle, setNewDecisionTitle] = useState("")
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingOptionId, setEditingOptionId] = useState<number | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true) // Start with loading true
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkForDecisionId = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const id = urlParams.get("id")
      if (id) {
        setDecisionId(id)
        await fetchDecision(id)
      } else {
        setLoading(false) // No ID, so we're done loading
      }
    }

    checkForDecisionId()
  }, [])

  useEffect(() => {
    if (decisionId) {
      const channel = supabase
        .channel(`decision:${decisionId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "decisions" }, handleDecisionChange)
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [decisionId])

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [editingTitle])

  const fetchDecision = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("decisions")
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error

      setDecision(data)
    } catch (error) {
      console.error("Error fetching decision:", error)
      setError("Failed to load the decision. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const handleDecisionChange = (payload: any) => {
    console.log("Decision changed:", payload)
    setDecision(payload.new)
  }

  const createNewDecision = async () => {
    try {
      const { data, error } = await supabase
        .from("decisions")
        .insert({ 
          title: newDecisionTitle, 
          options: [], 
          user_count: 1, 
          max_score: 10, 
          veto_enabled: false 
        })
        .select()

      if (error) throw error

      setDecisionId(data[0].id)
      setDecision(data[0])
      window.history.pushState({}, "", `?id=${data[0].id}`)
    } catch (error) {
      console.error("Error creating new decision:", error)
      setError("Failed to create a new decision. Please try again.")
    }
  }

  const addOption = async () => {
    if (newOption.trim() && decision) {
      const updatedOptions = [
        ...decision.options,
        { id: Date.now(), text: newOption, scores: Array(decision.user_count).fill(0) }
      ]
      await updateDecision({ options: updatedOptions })
      setNewOption("")
    }
  }

  const updateScore = async (optionId: number, userIndex: number, score: number) => {
    if (decision) {
      const updatedOptions = decision.options.map(option =>
        option.id === optionId
          ? { ...option, scores: option.scores.map((s, i) => i === userIndex ? score : s) }
          : option
      )
      await updateDecision({ options: updatedOptions })
    }
  }

  const updateuser_count = async (newCount: number) => {
    if (decision) {
      const updatedOptions = decision.options.map(option => ({
        ...option,
        scores: Array(newCount).fill(0).map((_, i) => option.scores[i] || 0)
      }))
      await updateDecision({ options: updatedOptions, user_count: newCount })
    }
  }

  const updatemax_score = async (newmax_score: number) => {
    if (decision) {
      const updatedOptions = decision.options.map(option => ({
        ...option,
        scores: option.scores.map(score => Math.min(score, newmax_score))
      }))
      await updateDecision({ options: updatedOptions, max_score: newmax_score })
    }
  }

  const toggleVeto = async () => {
    if (decision) {
      await updateDecision({ veto_enabled: !decision.veto_enabled })
    }
  }

  const updateDecision = async (updates: Partial<Decision>) => {
    try {
      const { error } = await supabase
        .from("decisions")
        .update(updates)
        .eq("id", decisionId)

      if (error) throw error
    } catch (error) {
      console.error("Error updating decision:", error)
      setError("Failed to update the decision. Please try again.")
    }
  }

  const calculateTotalResistance = (scores: number[]) => scores.reduce((a, b) => a + b, 0)

  const winningOption = decision && decision.options.length > 0
    ? decision.options.reduce((min, option) =>
        calculateTotalResistance(option.scores) < calculateTotalResistance(min.scores) ? option : min
      )
    : null

  const updateDecisionTitle = async (newTitle: string) => {
    if (decision) {
      await updateDecision({ title: newTitle })
      setEditingTitle(false)
    }
  }

  const updateOptionText = async (optionId: number, newText: string) => {
    if (decision) {
      const updatedOptions = decision.options.map(option =>
        option.id === optionId ? { ...option, text: newText } : option
      )
      await updateDecision({ options: updatedOptions })
      setEditingOptionId(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <Skeleton className="h-12 w-3/4 mx-auto mb-6" /> {/* Title skeleton */}
        <div className="flex items-center space-x-4 mb-6">
          <Skeleton className="h-10 w-20" /> {/* User count skeleton */}
          <Skeleton className="h-10 w-20" /> {/* Max score skeleton */}
          <Skeleton className="h-6 w-24" /> {/* Veto toggle skeleton */}
        </div>
        <Skeleton className="h-10 w-full mb-6" /> {/* Add option input skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => ( // Assuming 3 options for skeleton
            <div key={i} className="border rounded-lg p-4">
              <Skeleton className="h-6 w-3/4 mb-4" /> {/* Option title skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!decision && !decisionId) {
    return <CreateDecision onCreateDecision={createNewDecision} />
  }

  return (
    <>
      <div className="container mx-auto p-4 space-y-6">
        {editingTitle ? (
          <div className="flex items-center space-x-2">
            <Input
              ref={titleInputRef}
              autoFocus
              type="text"
              value={decision.title}
              onChange={(e) => setDecision({ ...decision, title: e.target.value })}
              onBlur={() => updateDecisionTitle(decision.title)}
              onKeyPress={(e) => e.key === "Enter" && updateDecisionTitle(decision.title)}
              className="text-2xl font-bold text-center"
            />
            <Button onClick={() => updateDecisionTitle(decision.title)}>Save</Button>
          </div>
        ) : (
          <h1 className="text-2xl font-bold text-center mb-6 group relative cursor-pointer" onClick={() => setEditingTitle(true)}>
            {decision.title}
            <Pencil1Icon className="inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
          </h1>
        )}
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              min="1"
              value={decision.user_count}
              onChange={(e) => updateuser_count(parseInt(e.target.value))}
              className="w-20"
            />
            <Label htmlFor="user-count">Number of Users</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              min="1"
              value={decision.max_score}
              onChange={(e) => updatemax_score(parseInt(e.target.value))}
              className="w-20"
            />
            <Label htmlFor="max-score">Max Score</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={decision.veto_enabled}
              onCheckedChange={toggleVeto}
              id="veto-toggle"
            />
            <Label htmlFor="veto-toggle">Enable Veto</Label>
          </div>
        </div>

        <div className="flex space-x-2">
          <Input
            type="text"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            placeholder="Enter a new option"
            onKeyDown={(e) => e.key === "Enter" && addOption()}
          />
          <Button onClick={addOption}>Add Option</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {decision.options.map(option => (
            <DecisionOption
              key={option.id}
              option={option}
              userCount={decision.user_count}
              maxScore={decision.max_score}
              vetoEnabled={decision.veto_enabled}
              onUpdateOptionText={updateOptionText}
              onUpdateScore={updateScore}
            />
          ))}
        </div>

        {winningOption && (
          <Card className="mt-6 bg-green-100">
            <CardHeader>
              <CardTitle>Winning Option</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-bold">{winningOption.text}</p>
              <p>Total Resistance: {calculateTotalResistance(winningOption.scores)}</p>
            </CardContent>
          </Card>
        )}

        <div className="mt-6">
          <p>Share this link with others to collaborate:</p>
          <Input
            type="text"
            value={`${window.location.origin}?id=${decisionId}`}
            readOnly
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
        </div>
      </div>
    </>
  )
}