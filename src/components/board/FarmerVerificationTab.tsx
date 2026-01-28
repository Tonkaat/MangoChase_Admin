import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useFarmerVerification } from '@/hooks/useBoard';
import { FarmerProfile, VERIFICATION_TIER_CONFIG, VerificationTier } from '@/types/board.types';
import {
  Search,
  Filter,
  UserCheck,
  UserX,
  Shield,
  Star,
  Clock,
  Mail,
  Phone,
  MapPin,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export function FarmerVerificationTab() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<VerificationTier | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerProfile | null>(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [selectedTier, setSelectedTier] = useState<VerificationTier>('verified');
  const [suspendReason, setSuspendReason] = useState('');

  const { farmers, loading, verifyFarmer, suspendFarmer, reactivateFarmer, refetch } = useFarmerVerification(
    statusFilter !== 'all' || tierFilter !== 'all'
      ? {
          verificationStatus: statusFilter !== 'all' ? statusFilter : undefined,
          tier: tierFilter !== 'all' ? tierFilter : undefined,
        }
      : undefined
  );

  const filteredFarmers = farmers.filter((farmer) =>
    farmer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    farmer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    farmer.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVerify = async () => {
    if (!selectedFarmer) return;
    await verifyFarmer(selectedFarmer.id, selectedTier, verifyNotes);
    toast.success(`${selectedFarmer.name} verified as ${VERIFICATION_TIER_CONFIG[selectedTier].label}`);
    setVerifyDialogOpen(false);
    setSelectedFarmer(null);
    setVerifyNotes('');
  };

  const handleSuspend = async () => {
    if (!selectedFarmer || !suspendReason.trim()) return;
    await suspendFarmer(selectedFarmer.id, suspendReason);
    toast.success(`${selectedFarmer.name}'s account suspended`);
    setSuspendDialogOpen(false);
    setSelectedFarmer(null);
    setSuspendReason('');
  };

  const handleReactivate = async (farmer: FarmerProfile) => {
    await reactivateFarmer(farmer.id);
    toast.success(`${farmer.name}'s account reactivated`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-secondary/20 text-secondary"><CheckCircle className="mr-1 h-3 w-3" />Verified</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-orange-400 text-orange-600"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="border-destructive text-destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
      case 'suspended':
        return <Badge className="bg-destructive/20 text-destructive"><UserX className="mr-1 h-3 w-3" />Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTierBadge = (tier: VerificationTier) => {
    const config = VERIFICATION_TIER_CONFIG[tier];
    const Icon = tier === 'trusted' ? Star : tier === 'verified' ? Shield : Users;
    return (
      <Badge className={config.color}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Stats
  const pendingCount = farmers.filter((f) => f.verificationStatus === 'pending').length;
  const verifiedCount = farmers.filter((f) => f.verificationStatus === 'approved').length;
  const suspendedCount = farmers.filter((f) => f.verificationStatus === 'suspended').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{farmers.length}</p>
                <p className="text-sm text-muted-foreground">Total Farmers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-300 bg-orange-50/50 shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-100 p-2">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-secondary/10 p-2">
                <UserCheck className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{verifiedCount}</p>
                <p className="text-sm text-muted-foreground">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-destructive/10 p-2">
                <UserX className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{suspendedCount}</p>
                <p className="text-sm text-muted-foreground">Suspended</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-soft">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search farmers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as VerificationTier | 'all')}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="trusted">Trusted</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Farmers Table */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Farmer Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredFarmers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-medium text-muted-foreground">No farmers found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFarmers.map((farmer) => (
                  <TableRow key={farmer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{farmer.name}</p>
                        <p className="text-sm text-muted-foreground">{farmer.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {farmer.location}
                      </div>
                    </TableCell>
                    <TableCell>{getTierBadge(farmer.verificationTier)}</TableCell>
                    <TableCell>{getStatusBadge(farmer.verificationStatus)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(farmer.createdAt, { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelectedFarmer(farmer)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {farmer.verificationStatus === 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-secondary hover:text-secondary"
                            onClick={() => {
                              setSelectedFarmer(farmer);
                              setVerifyDialogOpen(true);
                            }}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                        {farmer.verificationStatus === 'suspended' ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-secondary hover:text-secondary"
                            onClick={() => handleReactivate(farmer)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        ) : farmer.verificationStatus !== 'pending' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              setSelectedFarmer(farmer);
                              setSuspendDialogOpen(true);
                            }}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Farmer Details Dialog */}
      <Dialog open={!!selectedFarmer && !verifyDialogOpen && !suspendDialogOpen} onOpenChange={() => setSelectedFarmer(null)}>
        <DialogContent>
          {selectedFarmer && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedFarmer.name}</DialogTitle>
                <DialogDescription>
                  Farmer profile and verification details
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {getTierBadge(selectedFarmer.verificationTier)}
                  {getStatusBadge(selectedFarmer.verificationStatus)}
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {selectedFarmer.email}
                  </div>
                  {selectedFarmer.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {selectedFarmer.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {selectedFarmer.location}
                  </div>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium">Tier Privileges</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {VERIFICATION_TIER_CONFIG[selectedFarmer.verificationTier].privileges.map((p, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-secondary" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                {selectedFarmer.verificationNotes && (
                  <div>
                    <p className="text-sm font-medium">Notes</p>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedFarmer.verificationNotes}</p>
                  </div>
                )}
                {selectedFarmer.verifiedAt && (
                  <p className="text-sm text-muted-foreground">
                    Verified on {format(selectedFarmer.verifiedAt, 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Farmer</DialogTitle>
            <DialogDescription>
              Approve {selectedFarmer?.name}'s verification and assign a tier level.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Verification Tier</Label>
              <Select value={selectedTier} onValueChange={(v) => setSelectedTier(v as VerificationTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verified">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Verified
                    </div>
                  </SelectItem>
                  <SelectItem value="trusted">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Trusted
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {VERIFICATION_TIER_CONFIG[selectedTier].description}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Add any verification notes..."
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerify}>
              <UserCheck className="mr-2 h-4 w-4" />
              Verify Farmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Account</DialogTitle>
            <DialogDescription>
              Suspend {selectedFarmer?.name}'s account. They will lose access to verified features.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for suspension</Label>
              <Textarea
                placeholder="Provide a reason for the suspension..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSuspend} disabled={!suspendReason.trim()}>
              <UserX className="mr-2 h-4 w-4" />
              Suspend Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
