// src/providers/scan-notification-provider.tsx
//
// Mount this provider inside your existing farm-provider so it has access
// to the resolved farmId. It starts the real-time scan listener and shows
// an in-app toast whenever a new scan notification is written.
//
// Usage (in App.tsx or wherever your providers live):
//
//   <FarmProvider>
//     <ScanNotificationProvider>
//       {children}
//     </ScanNotificationProvider>
//   </FarmProvider>

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { firebaseService } from '@/services/firebase';
import { initScanNotificationListener } from '@/services/firebase/scanNotificationService';

interface Props {
  children: React.ReactNode;
}

export function ScanNotificationProvider({ children }: Props) {
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let mounted = true;

    async function start() {
      try {
        // Resolve the farmId the same way the rest of the app does
        let farmId = await firebaseService.getCurrentUserFarmId?.();
        if (!farmId) {
          const user = firebaseService.getCurrentUser?.();
          if (user) {
            const farms = await firebaseService.getUserFarms?.(user.uid);
            if (farms?.length) farmId = farms[0].farmId;
          }
        }

        if (!mounted || !farmId) return;

        // Start listener; show a toast for every new scan alert
        unsubRef.current = initScanNotificationListener(
          farmId,
          (notificationId, disease, treeName) => {
            const isHealthy = disease.toLowerCase() === 'healthy';

            if (isHealthy) {
              toast.success(`Healthy scan — ${treeName}`, {
                description: 'No disease detected.',
                icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
                duration: 4000,
              });
            } else {
              toast.error(`Disease detected: ${disease}`, {
                description: `On ${treeName}. Check the Disease Scan Records.`,
                icon: <AlertTriangle className="h-4 w-4 text-destructive" />,
                action: {
                  label: 'View',
                  onClick: () => {
                    window.location.href = '/disease-scan-records';
                  },
                },
                duration: 8000,
              });
            }
          },
        );
      } catch (err) {
        console.error('ScanNotificationProvider: failed to start listener', err);
      }
    }

    start();

    return () => {
      mounted = false;
      unsubRef.current?.();
    };
  }, []);

  return <>{children}</>;
}