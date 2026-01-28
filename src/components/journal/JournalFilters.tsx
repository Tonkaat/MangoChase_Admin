import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, RefreshCw } from 'lucide-react';
import type { JournalEntryType } from '@/types/journal.types';

interface JournalFiltersProps {
  typeFilter: JournalEntryType | 'all';
  onTypeChange: (type: JournalEntryType | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  onAddEntry: () => void;
  loading: boolean;
}

export function JournalFilters({
  typeFilter,
  onTypeChange,
  searchQuery,
  onSearchChange,
  onRefresh,
  onAddEntry,
  loading,
}: JournalFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search journal entries..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={typeFilter} onValueChange={(v) => onTypeChange(v as JournalEntryType | 'all')}>
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Entries</SelectItem>
          <SelectItem value="disease_detection">Disease Detection</SelectItem>
          <SelectItem value="activity">Activities</SelectItem>
          <SelectItem value="note">Notes</SelectItem>
          <SelectItem value="milestone">Milestones</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
        <Button onClick={onAddEntry} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Entry</span>
        </Button>
      </div>
    </div>
  );
}
