import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrashIcon } from '@radix-ui/react-icons';

interface StoredDecision {
  id: string;
  title: string;
  createdAt: string;
}

interface DecisionListProps {
  onSelectDecision: (id: string) => void;
}

export function DecisionList({ onSelectDecision }: DecisionListProps) {
  const [decisions, setDecisions] = useState<StoredDecision[]>([]);

  useEffect(() => {
    const storedDecisions = localStorage.getItem('decisions');
    if (storedDecisions) {
      setDecisions(JSON.parse(storedDecisions));
    }
  }, []);

  const removeDecision = (id: string) => {
    const updatedDecisions = decisions.filter(decision => decision.id !== id);
    setDecisions(updatedDecisions);
    localStorage.setItem('decisions', JSON.stringify(updatedDecisions));
  };

  const clearAllDecisions = () => {
    setDecisions([]);
    localStorage.removeItem('decisions');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Previous Decisions</h2>
        {decisions.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearAllDecisions}>Clear All</Button>
        )}
      </div>
      {decisions.map(decision => (
        <Card key={decision.id} className="cursor-pointer hover:bg-stone-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
            <div onClick={() => onSelectDecision(decision.id)}>
              <CardTitle className="text-lg font-bold mb-1">
                {decision.title}
              </CardTitle>
              <p className="text-xs text-stone-500">
                Created on {formatDate(decision.createdAt)}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeDecision(decision.id)}>
              <TrashIcon className="h-4 w-4" />
            </Button>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}