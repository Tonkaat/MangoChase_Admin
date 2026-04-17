import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { BoardStatsCards } from '@/components/board/BoardStatsCards';
import CommunityPostsTab from '@/components/board/CommunityPostsTab';
import TradeListingsTab  from '@/components/board/TradeListingsTab';
import { MarketPricesTab } from '@/components/board/MarketPricesTab';
// import { DiseaseAlertsTab } from '@/components/board/DiseaseAlertsTab';
// import { FarmerVerificationTab } from '@/components/board/FarmerVerificationTab';
import { useBoardStats } from '@/hooks/useBoard';
import {
  MessageSquare,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  UserCheck,
  MessageSquareMore,
} from 'lucide-react';

export default function FarmersBoard() {
  const { stats, loading: statsLoading } = useBoardStats();

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <MessageSquareMore className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Mango Board</h1>
            <p className="text-muted-foreground">
              Your hub for community, trade, and market insights
            </p>
          </div>
        </div>
      </header>

      {/* <BoardStatsCards stats={stats} loading={statsLoading} /> */}

      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:gap-1">
          <TabsTrigger value="posts" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Community</span>
          </TabsTrigger>
          <TabsTrigger value="listings" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Trade</span>
          </TabsTrigger>
          <TabsTrigger value="prices" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Prices</span>
          </TabsTrigger>
          {/* <TabsTrigger value="alerts" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="verification" className="gap-2">
            <UserCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Farmers</span>
          </TabsTrigger> */}
        </TabsList>

        <TabsContent value="posts">
          <CommunityPostsTab />
        </TabsContent>
        <TabsContent value="listings">
          <TradeListingsTab />
        </TabsContent>
        <TabsContent value="prices">
          <MarketPricesTab />
        </TabsContent>
        {/* <TabsContent value="alerts">
          <DiseaseAlertsTab />
        </TabsContent>
        <TabsContent value="verification">
          <FarmerVerificationTab />
        </TabsContent> */}
      </Tabs>
    </div>
  );
}
