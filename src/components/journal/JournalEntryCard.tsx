import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertTriangle,
  Activity,
  FileText,
  Trophy,
  Pin,
  PinOff,
  MoreVertical,
  Trash2,
  Leaf,
  CheckCircle,
  Clock,
  MapPin,
} from 'lucide-react';
import type { JournalEntry } from '@/types/journal.types';

interface JournalEntryCardProps {
  entry: JournalEntry;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
}

const typeConfig = {
  disease_detection: {
    icon: AlertTriangle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    label: 'Disease Detection',
  },
  activity: {
    icon: Activity,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    label: 'Activity',
  },
  note: {
    icon: FileText,
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
    label: 'Note',
  },
  milestone: {
    icon: Trophy,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500/10',
    label: 'Milestone',
  },
};

const severityColors = {
  low: 'bg-green-500/10 text-green-700 border-green-200',
  medium: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  high: 'bg-orange-500/10 text-orange-700 border-orange-200',
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusConfig = {
  detected: { icon: AlertTriangle, label: 'Detected', color: 'text-destructive' },
  treated: { icon: Clock, label: 'Under Treatment', color: 'text-yellow-600' },
  resolved: { icon: CheckCircle, label: 'Resolved', color: 'text-green-600' },
};

export function JournalEntryCard({ entry, onTogglePin, onDelete }: JournalEntryCardProps) {
  const config = typeConfig[entry.type];
  const Icon = config.icon;

  return (
    <Card className={`shadow-soft transition-all hover:shadow-md ${entry.isPinned ? 'ring-2 ring-primary/20' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`rounded-lg p-2 ${config.bgColor}`}>
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base leading-tight">{entry.title}</h3>
                {entry.isPinned && <Pin className="h-3.5 w-3.5 text-primary" />}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span>{entry.userName}</span>
                <span>•</span>
                <span title={format(entry.date, 'PPpp')}>
                  {formatDistanceToNow(entry.date, { addSuffix: true })}
                </span>
                {entry.farmName && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {entry.farmName}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onTogglePin(entry.id)}>
                {entry.isPinned ? (
                  <>
                    <PinOff className="h-4 w-4 mr-2" />
                    Unpin
                  </>
                ) : (
                  <>
                    <Pin className="h-4 w-4 mr-2" />
                    Pin Entry
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(entry.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        <p className="text-sm text-muted-foreground">{entry.description}</p>

        {/* Disease Detection Details */}
        {entry.type === 'disease_detection' && entry.diseaseInfo && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={severityColors[entry.diseaseInfo.severity]}>
                {entry.diseaseInfo.severity.toUpperCase()} Severity
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Leaf className="h-3 w-3" />
                {entry.diseaseInfo.diseaseName}
              </Badge>
              {(() => {
                const StatusIcon = statusConfig[entry.diseaseInfo.status].icon;
                return (
                  <span className={`flex items-center gap-1 text-xs ${statusConfig[entry.diseaseInfo.status].color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {statusConfig[entry.diseaseInfo.status].label}
                  </span>
                );
              })()}
            </div>

            {/* Leaf Images */}
            {entry.diseaseInfo.leafImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {entry.diseaseInfo.leafImages.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={img}
                      alt={`Leaf sample ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {entry.diseaseInfo.recommendations && entry.diseaseInfo.recommendations.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">RECOMMENDATIONS</h4>
                <ul className="space-y-1">
                  {entry.diseaseInfo.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Note Content */}
        {entry.type === 'note' && entry.noteContent && (
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm whitespace-pre-wrap">{entry.noteContent}</p>
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {entry.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activity Type Badge */}
        {entry.type === 'activity' && entry.activityType && (
          <Badge variant="outline" className="capitalize">
            {entry.activityType.replace('_', ' ')}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
