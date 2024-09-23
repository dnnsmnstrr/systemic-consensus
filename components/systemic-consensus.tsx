"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "../lib/supabase"
import { HomeIcon, Pencil1Icon, ClipboardIcon, CheckIcon } from '@radix-ui/react-icons'
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CreateDecision } from "@/components/CreateDecision"
import { DecisionOption } from "@/components/DecisionOption"
import { DecisionList } from "@/components/DecisionList"
import { SettingsPopover } from "@/components/SettingsPopover"
import { Decision } from "@/lib/types"

export function SystemicConsensusComponent() {
  const [decision, setDecision] = useState<Decision | null>(null)
  const [newOption, setNewOption] = useState("")
  const [decisionId, setDecisionId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true) // Start with loading true
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  const storeDecisionInLocalStorage = (id: string, title: string) => {
    const storedDecisions = localStorage.getItem('decisions');
    let decisions = storedDecisions ? JSON.parse(storedDecisions) : [];
    decisions = decisions.filter((d: { id: string }) => d.id !== id);
    decisions.unshift({ id, title, createdAt: new Date().toISOString() });
    localStorage.setItem('decisions', JSON.stringify(decisions));
  };

  useEffect(() => {
    const checkForDecisionId = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get("id");
      if (id && id !== decisionId) {
        setDecisionId(id);
        await fetchDecision(id);
      } else if (!id) {
        setDecision(null);
        setDecisionId(null);
        setLoading(false);
      }
    };

    checkForDecisionId();

    window.addEventListener('popstate', checkForDecisionId);

    return () => {
      window.removeEventListener('popstate', checkForDecisionId);
    };
  }, [decisionId]);

  useEffect(() => {
    if (decisionId) {
      const channel = supabase
        .channel(`decision:${decisionId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "decisions" }, (payload) => setDecision(payload.new as Decision))
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
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("decisions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setDecision(data);
    } catch (error) {
      console.error("Error fetching decision:", error);
      setError("Failed to load the decision. Please try again later.");
      setDecision(null);
    } finally {
      setLoading(false);
    }
  }

  const createNewDecision = async (title: string) => {
    try {
      const { data, error } = await supabase
        .from("decisions")
        .insert({ 
          title, 
          options: [], 
          user_count: process.env.NEXT_DEFAULT_USER_COUNT || 1, 
          max_score: process.env.NEXT_DEFAULT_MAX_SCORE || 10, 
          veto_enabled: false 
        })
        .select()

      if (error) throw error

      setDecisionId(data[0].id)
      setDecision(data[0])
      window.history.pushState({}, "", `?id=${data[0].id}`)
      storeDecisionInLocalStorage(data[0].id, title)
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

  const updateMaxScore = async (newmax_score: number) => {
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
      storeDecisionInLocalStorage(decision.id, newTitle)
      setEditingTitle(false)
    }
  }

  const updateOptionText = async (optionId: number, newText: string) => {
    if (decision) {
      const updatedOptions = decision.options.map(option =>
        option.id === optionId ? { ...option, text: newText } : option
      )
      await updateDecision({ options: updatedOptions })
    }
  }

  const deleteOption = async (optionId: number) => {
    if (decision) {
      const updatedOptions = decision.options.filter(option => option.id !== optionId);
      await updateDecision({ options: updatedOptions });
    }
  }

  const handleSelectDecision = (id: string) => {
    window.history.pushState({}, "", `?id=${id}`);
    setDecisionId(id);
    fetchDecision(id);
  };

  const copyToClipboard = async () => {
    const shareLink = `${window.location.origin}?id=${decisionId}`
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000) // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const HomeButton = () => {
    return (
      <Button onClick={handleClearDecision} className="w-36">
        <HomeIcon className="mr-2" /> DecisionMaker
      </Button>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <HomeButton />
          <Skeleton className="h-10 w-full" /> {/* Title skeleton */}
          <Skeleton className="h-10 w-36" /> {/* Settings skeleton */}
        </div>
        <Skeleton className="h-10 w-full my-6" /> {/* Add option input skeleton */}
        {decisionId && (
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
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <HomeButton />
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!decision && !decisionId) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex space-x-2 w-full">
          <HomeButton />
          <CreateDecision onCreateDecision={createNewDecision} />
        </div>
        <DecisionList onSelectDecision={handleSelectDecision} />
      </div>
    );
  }

  function handleClearDecision(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
    event.preventDefault();
    setDecision(null);
    setDecisionId(null);
    setNewOption("");
    setEditingTitle(false);
    setError(null);
    
    // Clear the URL parameter
    const newUrl = window.location.pathname;
    window.history.pushState({}, '', newUrl);
  }

  return (
    <>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between space-x-4">
          <HomeButton />
          {editingTitle ? (
            <div className="flex items-center space-x-2 w-full">
              <Input
                ref={titleInputRef}
                autoFocus
                type="text"
                value={decision?.title}
                onChange={(e) => setDecision({ ...decision, id: decision?.id || decisionId || "", title: e.target.value || "", options: decision?.options || [], user_count: decision?.user_count || 1, max_score: decision?.max_score || 10, veto_enabled: decision?.veto_enabled || false })}
                onBlur={() => updateDecisionTitle(decision?.title || "")}
                onKeyPress={(e) => e.key === "Enter" && updateDecisionTitle(decision?.title || "")}
                className="text-2xl font-bold text-center w-full"
              />
              <Button onClick={() => updateDecisionTitle(decision?.title || "")}>Save</Button>
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-center group relative cursor-pointer w-full whitespace-nowrap text-ellipsis overflow-hidden" onClick={() => setEditingTitle(true)}>
              {decision?.title || "Decision Title"}
              <Pencil1Icon className="inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h1>
          )}
          <div className="flex justify-end w-36">
            <SettingsPopover
              userCount={decision?.user_count || 1}
              maxScore={decision?.max_score || 10}
              vetoEnabled={decision?.veto_enabled || false}
              onUpdateUserCount={updateuser_count}
              onUpdateMaxScore={updateMaxScore}
              onToggleVeto={toggleVeto}
            />
          </div>
        </div>

        <div className="flex space-x-2">
          <Input
            autoFocus
            type="text"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            placeholder="Enter a new option"
            onKeyDown={(e) => e.key === "Enter" && addOption()}
          />
          <Button onClick={addOption}>Add Option</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {decision?.options.map(option => (
            <DecisionOption
              key={option.id}
              option={option}
              userCount={decision?.user_count || 1}
              maxScore={decision?.max_score || 10}
              vetoEnabled={decision?.veto_enabled || false}
              onUpdateOptionText={updateOptionText}
              onUpdateScore={updateScore}
              onDeleteOption={deleteOption}
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

          <Alert className="mx-auto max-w-[530px] px-4 py-4">
            <p className="text-center">Share this link with others to collaborate:</p>
            <div className="flex items-center justify-center mt-2">
              <Input
                type="text"
                value={`${window.location.origin}?id=${decisionId}`}
                readOnly
                className="mr-2 max-w-[490px]"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
              >
                {copySuccess ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <ClipboardIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </Alert>
      </div>
    </>
  )
}
