// src/components/setup/FarmCodeDialog.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, CheckCircle, Info } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface FarmCodeDialogProps {
  isOpen: boolean;
  farmCode: string;
  farmName: string;
  treesCreated: number;
  onClose: () => void;
}

export function FarmCodeDialog({ 
  isOpen, 
  farmCode, 
  farmName, 
  treesCreated,
  onClose 
}: FarmCodeDialogProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(farmCode);
      setCopied(true);
      toast.success("Farm code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy code");
    }
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-2xl">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Farm Created Successfully!
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-4">
              <p className="text-base">
                <span className="font-semibold">{farmName}</span> has been created with{" "}
                <span className="font-semibold">{treesCreated} trees</span>.
              </p>

              <div className="border-t pt-4">
                <p className="font-semibold text-foreground mb-2">Your Farm Code:</p>
                <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <div className="p-6 flex items-center justify-between">
                    <div className="font-mono text-3xl font-bold tracking-[0.3em] text-green-700 dark:text-green-400">
                      {farmCode}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyToClipboard}
                      className="ml-4"
                      title="Copy farm code"
                    >
                      {copied ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </Card>
              </div>

              <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Share with your team:</strong> Team members can use this code in the mobile app 
                  to join your farm and access all farm data.
                </AlertDescription>
              </Alert>

              <p className="text-xs text-muted-foreground">
                You can also find this code later in Settings → Farm Details.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose} className="w-full">
            Continue to Dashboard
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}