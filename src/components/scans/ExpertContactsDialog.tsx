import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Phone, Mail } from "lucide-react";

export interface ExpertContact {
  name: string;
  role: string;
  phone?: string;
  email?: string;
}

// TODO: replace with a Firestore `experts` collection if admins need to manage this
export const EXPERT_CONTACTS: ExpertContact[] = [
  { name: "Dr. Example Name", role: "Plant Pathologist", phone: "+63 900 000 0000", email: "expert@example.com" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ExpertContactsDialog({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Contact an Expert</DialogTitle>
          <DialogDescription>
            Reach out to verify this low-confidence detection, then mark it as verified.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3">
          {EXPERT_CONTACTS.map((c) => (
            <li key={c.name} className="rounded-lg border p-3">
              <p className="text-sm font-semibold text-foreground">{c.name}</p>
              <p className="mb-2 text-xs text-muted-foreground">{c.role}</p>
              <div className="flex flex-wrap gap-3 text-sm">
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                    <Phone className="h-4 w-4" /> {c.phone}
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                    <Mail className="h-4 w-4" /> {c.email}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}