"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { supabase } from "../lib/supabase"

type Option = {
  id: number
  text: string
  scores: number[]
}

type Decision = {
  id: string
  title: string
  options: Option[]
  user_count: number
  max_score: number
  veto_enabled: boolean
}

export function SystemicConsensusComponent() {
  const [decision, setDecision] = useState<Decision | null>(null)
  const [newOption, setNewOption] = useState("")
  const [decisionId, setDecisionId] = useState("")
  const [newDecisionTitle, setNewDecisionTitle] = useState("")

  useEffect(() => {
    const decisionId = new URLSearchParams(window.location.search).get("id")
    if (decisionId) {
      setDecisionId(decisionId)
      fetchDecision(decisionId)
    }
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

  const fetchDecision = async (id: string) => {
    const { data, error } = await supabase
      .from("decisions")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching decision:", error)
    } else {
      setDecision(data)
    }
  }

  const handleDecisionChange = (payload: any) => {
    console.log("Decision changed:", payload)
    setDecision(payload.new)
  }

  const createNewDecision = async () => {
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

    if (error) {
      console.error("Error creating new decision:", error)
    } else {
      setDecisionId(data[0].id)
      setDecision(data[0])
      window.history.pushState({}, "", `?id=${data[0].id}`)
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
    const { error } = await supabase
      .from("decisions")
      .update(updates)
      .eq("id", decisionId)

    if (error) {
      console.error("Error updating decision:", error)
    }
  }

  const calculateTotalResistance = (scores: number[]) => scores.reduce((a, b) => a + b, 0)

  const winningOption = decision && decision.options.length > 0
    ? decision.options.reduce((min, option) =>
        calculateTotalResistance(option.scores) < calculateTotalResistance(min.scores) ? option : min
      )
    : null

  if (!decision) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <h1 className="text-2xl font-bold text-center mb-6">Create New Decision</h1>
        <Input
          type="text"
          value={newDecisionTitle}
          onChange={(e) => setNewDecisionTitle(e.target.value)}
          placeholder="Enter decision title"
        />
        <Button onClick={createNewDecision}>Create Decision</Button>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center mb-6">{decision.title}</h1>
      
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
          onKeyPress={(e) => e.key === "Enter" && addOption()}
        />
        <Button onClick={addOption}>Add Option</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {decision.options.map(option => (
          <Card key={option.id}>
            <CardHeader>
              <CardTitle>{option.text}</CardTitle>
            </CardHeader>
            <CardContent>
              {Array.from({ length: decision.user_count }, (_, i) => (
                <div key={i} className="mb-4">
                  <Label className="mb-2 block">
                    User {i + 1} Resistance: {option.scores[i]}
                    {decision.veto_enabled && option.scores[i] === decision.max_score && " (VETO)"}
                  </Label>
                  <Slider
                    min={0}
                    max={decision.max_score}
                    step={1}
                    value={[option.scores[i]]}
                    onValueChange={(value) => updateScore(option.id, i, value[0])}
                  />
                </div>
              ))}
              <div className="font-bold mt-2">
                Total Resistance: {calculateTotalResistance(option.scores)}
              </div>
            </CardContent>
          </Card>
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