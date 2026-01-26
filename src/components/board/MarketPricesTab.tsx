import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMarketPrices } from '../../hooks/useBoard';
import { MarketPrice, MANGO_VARIETIES, REGIONS } from '../../types/board.types';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Check,
  Edit2,
  Plus,
  Filter,
  DollarSign,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export function MarketPricesTab() {
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [varietyFilter, setVarietyFilter] = useState<string>('all');
  const [editingPrice, setEditingPrice] = useState<MarketPrice | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form state for editing/adding
  const [formData, setFormData] = useState({
    priceMin: '',
    priceMax: '',
    priceAverage: '',
  });

  const { prices, loading, updatePrice, validatePrice, refetch } = useMarketPrices(
    regionFilter !== 'all' || varietyFilter !== 'all'
      ? {
          region: regionFilter !== 'all' ? regionFilter : undefined,
          variety: varietyFilter !== 'all' ? varietyFilter : undefined,
        }
      : undefined
  );

  const handleValidate = async (price: MarketPrice) => {
    await validatePrice(price.id);
    toast.success('Price validated');
  };

  const handleEdit = (price: MarketPrice) => {
    setEditingPrice(price);
    setFormData({
      priceMin: price.priceMin.toString(),
      priceMax: price.priceMax.toString(),
      priceAverage: price.priceAverage.toString(),
    });
  };

  const handleSaveEdit = async () => {
    if (!editingPrice) return;

    await updatePrice(editingPrice.id, {
      priceMin: parseFloat(formData.priceMin),
      priceMax: parseFloat(formData.priceMax),
      priceAverage: parseFloat(formData.priceAverage),
    });
    toast.success('Price updated');
    setEditingPrice(null);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-secondary" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendBadge = (trend: string, change: number) => {
    const color =
      trend === 'up'
        ? 'bg-secondary/20 text-secondary'
        : trend === 'down'
        ? 'bg-destructive/20 text-destructive'
        : 'bg-muted text-muted-foreground';

    return (
      <Badge className={color}>
        {getTrendIcon(trend)}
        <span className="ml-1">{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>
      </Badge>
    );
  };

  // Summary stats
  const averagePrices = prices.reduce((acc, p) => {
    if (!acc[p.variety]) {
      acc[p.variety] = { total: 0, count: 0 };
    }
    acc[p.variety].total += p.priceAverage;
    acc[p.variety].count++;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(averagePrices).slice(0, 4).map(([variety, data]) => (
          <Card key={variety} className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{variety}</p>
                  <p className="text-2xl font-bold">
                    ₱{(data.total / data.count).toFixed(0)}
                    <span className="text-sm font-normal text-muted-foreground">/kg</span>
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 p-2">
                  <DollarSign className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Actions */}
      <Card className="shadow-soft">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 gap-2">
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {REGIONS.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={varietyFilter} onValueChange={setVarietyFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Variety" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Varieties</SelectItem>
                  {MANGO_VARIETIES.map((variety) => (
                    <SelectItem key={variety} value={variety}>
                      {variety}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Price
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Market Price</DialogTitle>
                    <DialogDescription>
                      Add a new market price entry for a region and variety.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Region</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          {REGIONS.map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Variety</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select variety" />
                        </SelectTrigger>
                        <SelectContent>
                          {MANGO_VARIETIES.map((variety) => (
                            <SelectItem key={variety} value={variety}>
                              {variety}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="grid gap-2">
                        <Label>Min (₱)</Label>
                        <Input type="number" placeholder="0" />
                      </div>
                      <div className="grid gap-2">
                        <Label>Max (₱)</Label>
                        <Input type="number" placeholder="0" />
                      </div>
                      <div className="grid gap-2">
                        <Label>Avg (₱)</Label>
                        <Input type="number" placeholder="0" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      toast.success('Price added');
                      setIsAddDialogOpen(false);
                    }}>
                      Add Price
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prices Table */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Market Prices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Region</TableHead>
                  <TableHead>Variety</TableHead>
                  <TableHead className="text-right">Min</TableHead>
                  <TableHead className="text-right">Max</TableHead>
                  <TableHead className="text-right">Average</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prices.map((price) => (
                  <TableRow key={price.id}>
                    <TableCell className="font-medium">{price.region}</TableCell>
                    <TableCell>{price.variety}</TableCell>
                    <TableCell className="text-right">₱{price.priceMin}</TableCell>
                    <TableCell className="text-right">₱{price.priceMax}</TableCell>
                    <TableCell className="text-right font-semibold">₱{price.priceAverage}</TableCell>
                    <TableCell>{getTrendBadge(price.trend, price.percentageChange)}</TableCell>
                    <TableCell>
                      {price.validatedAt ? (
                        <Badge className="bg-secondary/20 text-secondary">
                          <Check className="mr-1 h-3 w-3" />
                          Validated
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <Clock className="mr-1 h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!price.validatedAt && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleValidate(price)}
                          >
                            <Check className="h-4 w-4 text-secondary" />
                          </Button>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(price)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Price</DialogTitle>
                              <DialogDescription>
                                Update the market price for {price.variety} in {price.region}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-3 gap-4 py-4">
                              <div className="grid gap-2">
                                <Label>Min (₱)</Label>
                                <Input
                                  type="number"
                                  value={formData.priceMin}
                                  onChange={(e) => setFormData({ ...formData, priceMin: e.target.value })}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label>Max (₱)</Label>
                                <Input
                                  type="number"
                                  value={formData.priceMax}
                                  onChange={(e) => setFormData({ ...formData, priceMax: e.target.value })}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label>Avg (₱)</Label>
                                <Input
                                  type="number"
                                  value={formData.priceAverage}
                                  onChange={(e) => setFormData({ ...formData, priceAverage: e.target.value })}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={handleSaveEdit}>Save Changes</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
