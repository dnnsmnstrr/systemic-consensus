import { Popover, PopoverTrigger, PopoverContent } from '@radix-ui/react-popover';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GearIcon } from '@radix-ui/react-icons';

interface SettingsPopoverProps {
  userCount: number;
  maxScore: number;
  vetoEnabled: boolean;
  onUpdateUserCount: (newCount: number) => void;
  onUpdateMaxScore: (newMaxScore: number) => void;
  onToggleVeto: () => void;
}

export function SettingsPopover({
  userCount,
  maxScore,
  vetoEnabled,
  onUpdateUserCount,
  onUpdateMaxScore,
  onToggleVeto
}: SettingsPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          <GearIcon className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent alignOffset={0} collisionPadding={16} align="end" className="p-4 bg-white rounded-md shadow-md z-50">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              min="1"
              value={userCount}
              onChange={(e) => onUpdateUserCount(parseInt(e.target.value))}
              className="w-20"
            />
            <Label htmlFor="user-count">Number of Users</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              min="0"
              step="5"
              value={maxScore}
              onChange={(e) => e.target.value !== '' ? onUpdateMaxScore(parseInt(e.target.value)) : null}
              className="w-20"
            />
            <Label htmlFor="max-score">Max Score</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={vetoEnabled}
              onCheckedChange={onToggleVeto}
              id="veto-toggle"
            />
            <Label htmlFor="veto-toggle">Enable Veto</Label>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}