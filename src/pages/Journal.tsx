import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useJournal } from '@/hooks/useJournal';
import { JournalFilters } from '@/components/journal/JournalFilters';
import { JournalEntryCard } from '@/components/journal/JournalEntryCard';
import { AddJournalEntryDialog } from '@/components/journal/AddJournalEntryDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, AlertTriangle, Activity, FileText, Trophy } from 'lucide-react';
import type { JournalEntryType } from '@/types/journal.types';

export default function Journal() {
  const [typeFilter, setTypeFilter] = useState<JournalEntryType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { loading, entries, addEntry, togglePin, deleteEntry, refetch } = useJournal();

  const filteredEntries = useMemo(() => {
    let result = entries;

    if (typeFilter !== 'all') {
      result = result.filter((e) => e.type === typeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query) ||
          e.userName.toLowerCase().includes(query)
      );
    }

    // Sort: pinned first, then by date
    return result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.date.getTime() - a.date.getTime();
    });
  }, [entries, typeFilter, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: entries.length,
      diseases: entries.filter((e) => e.type === 'disease_detection').length,
      activities: entries.filter((e) => e.type === 'activity').length,
      notes: entries.filter((e) => e.type === 'note').length,
      milestones: entries.filter((e) => e.type === 'milestone').length,
    };
  }, [entries]);

  const handleTogglePin = async (id: string) => {
    await togglePin(id);
    toast.success('Entry updated');
  };

  const handleDelete = async (id: string) => {
    await deleteEntry(id);
    toast.success('Entry deleted');
  };

  const handleAddEntry = async (entry: Parameters<typeof addEntry>[0]) => {
    await addEntry(entry);
    toast.success('Entry added to journal');
  };

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Farm Journal</h1>
            <p className="text-muted-foreground">
              Seb's Diary
            </p>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="shadow-soft">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-destructive/10 p-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.diseases}</div>
              <div className="text-xs text-muted-foreground">Disease Alerts</div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.activities}</div>
              <div className="text-xs text-muted-foreground">Activities</div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-secondary/10 p-2">
              <FileText className="h-4 w-4 text-secondary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.notes}</div>
              <div className="text-xs text-muted-foreground">Notes</div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-yellow-500/10 p-2">
              <Trophy className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.milestones}</div>
              <div className="text-xs text-muted-foreground">Milestones</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <JournalFilters
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={refetch}
        onAddEntry={() => setAddDialogOpen(true)}
        loading={loading}
      />

      {/* Journal Entries */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="shadow-soft">
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-1">No entries found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start documenting your farm activities'}
            </p>
            <button
              onClick={() => setAddDialogOpen(true)}
              className="text-primary hover:underline text-sm font-medium"
            >
              Add your first entry →
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <JournalEntryCard
              key={entry.id}
              entry={entry}
              onTogglePin={handleTogglePin}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add Entry Dialog */}
      <AddJournalEntryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAddEntry}
      />
    </div>
  );
}
