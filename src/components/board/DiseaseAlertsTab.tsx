// import { useState } from 'react';
// import { Card, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Input } from '@/components/ui/input';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { Skeleton } from '@/components/ui/skeleton';
// import { useDiseaseAlerts } from '@/hooks/useBoard';
// import {
//   DiseaseAlert,
//   DISEASE_TYPE_CONFIG,
//   SEVERITY_CONFIG,
//   REGIONS,
//   AlertSeverity,
// } from '@/types/board.types';
// import {
//   Search,
//   MoreVertical,
//   Pin,
//   PinOff,
//   Check,
//   AlertTriangle,
//   Clock,
//   MapPin,
//   Filter,
//   Bug,
//   Eye,
// } from 'lucide-react';
// import { formatDistanceToNow } from 'date-fns';
// import { toast } from 'sonner';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog';

// export function DiseaseAlertsTab() {
//   const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
//   const [regionFilter, setRegionFilter] = useState<string>('all');
//   const [approvalFilter, setApprovalFilter] = useState<'all' | 'pending' | 'approved'>('all');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedAlert, setSelectedAlert] = useState<DiseaseAlert | null>(null);

//   const { alerts, loading, approveAlert, pinAlert } = useDiseaseAlerts(
//     severityFilter !== 'all' || regionFilter !== 'all' || approvalFilter !== 'all'
//       ? {
//           severity: severityFilter !== 'all' ? severityFilter : undefined,
//           region: regionFilter !== 'all' ? regionFilter : undefined,
//           approved: approvalFilter === 'pending' ? false : approvalFilter === 'approved' ? true : undefined,
//         }
//       : undefined
//   );

//   const filteredAlerts = alerts.filter((alert) =>
//     alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     alert.affectedArea.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const handleApprove = async (alert: DiseaseAlert) => {
//     await approveAlert(alert.id);
//     toast.success('Alert approved and published');
//   };

//   const handlePin = async (alert: DiseaseAlert) => {
//     await pinAlert(alert.id, !alert.isPinned);
//     toast.success(alert.isPinned ? 'Alert unpinned' : 'Alert pinned');
//   };

//   // Stats
//   const criticalCount = alerts.filter((a) => a.severity === 'critical' && a.isApproved).length;
//   const highCount = alerts.filter((a) => a.severity === 'high' && a.isApproved).length;
//   const pendingCount = alerts.filter((a) => !a.isApproved).length;

//   return (
//     <div className="space-y-6">
//       {/* Alert Summary */}
//       <div className="grid gap-4 sm:grid-cols-3">
//         <Card className="border-destructive/50 bg-destructive/5 shadow-soft">
//           <CardContent className="p-4">
//             <div className="flex items-center gap-3">
//               <div className="rounded-lg bg-destructive/20 p-2">
//                 <AlertTriangle className="h-5 w-5 text-destructive" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">{criticalCount}</p>
//                 <p className="text-sm text-muted-foreground">Critical Alerts</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//         <Card className="border-orange-300 bg-orange-50/50 shadow-soft">
//           <CardContent className="p-4">
//             <div className="flex items-center gap-3">
//               <div className="rounded-lg bg-orange-100 p-2">
//                 <Bug className="h-5 w-5 text-orange-600" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">{highCount}</p>
//                 <p className="text-sm text-muted-foreground">High Priority</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//         <Card className="shadow-soft">
//           <CardContent className="p-4">
//             <div className="flex items-center gap-3">
//               <div className="rounded-lg bg-muted p-2">
//                 <Clock className="h-5 w-5 text-muted-foreground" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">{pendingCount}</p>
//                 <p className="text-sm text-muted-foreground">Pending Review</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Filters */}
//       <Card className="shadow-soft">
//         <CardContent className="p-4">
//           <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//               <Input
//                 placeholder="Search alerts..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="pl-10"
//               />
//             </div>
//             <div className="flex flex-wrap gap-2">
//               <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as AlertSeverity | 'all')}>
//                 <SelectTrigger className="w-[130px]">
//                   <Filter className="mr-2 h-4 w-4" />
//                   <SelectValue placeholder="Severity" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Severity</SelectItem>
//                   <SelectItem value="critical">Critical</SelectItem>
//                   <SelectItem value="high">High</SelectItem>
//                   <SelectItem value="medium">Medium</SelectItem>
//                   <SelectItem value="low">Low</SelectItem>
//                 </SelectContent>
//               </Select>
//               <Select value={regionFilter} onValueChange={setRegionFilter}>
//                 <SelectTrigger className="w-[160px]">
//                   <SelectValue placeholder="Region" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Regions</SelectItem>
//                   {REGIONS.map((region) => (
//                     <SelectItem key={region} value={region}>
//                       {region}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//               <Select value={approvalFilter} onValueChange={(v) => setApprovalFilter(v as 'all' | 'pending' | 'approved')}>
//                 <SelectTrigger className="w-[130px]">
//                   <SelectValue placeholder="Status" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Status</SelectItem>
//                   <SelectItem value="pending">Pending</SelectItem>
//                   <SelectItem value="approved">Approved</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Alerts List */}
//       {loading ? (
//         <div className="space-y-4">
//           {[...Array(3)].map((_, i) => (
//             <Card key={i} className="shadow-soft">
//               <CardContent className="p-6">
//                 <Skeleton className="mb-4 h-6 w-3/4" />
//                 <Skeleton className="mb-2 h-4 w-full" />
//                 <Skeleton className="h-4 w-2/3" />
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       ) : filteredAlerts.length === 0 ? (
//         <Card className="shadow-soft">
//           <CardContent className="flex flex-col items-center justify-center py-12">
//             <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground/50" />
//             <p className="text-lg font-medium text-muted-foreground">No alerts found</p>
//             <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="space-y-4">
//           {filteredAlerts.map((alert) => {
//             const diseaseConfig = DISEASE_TYPE_CONFIG[alert.diseaseType];
//             const severityConfig = SEVERITY_CONFIG[alert.severity];

//             return (
//               <Card
//                 key={alert.id}
//                 className={`shadow-soft transition-all hover:shadow-pop ${
//                   alert.isPinned ? 'border-primary/50 bg-primary/5' : ''
//                 } ${!alert.isApproved ? 'border-orange-300 bg-orange-50/50' : ''} ${
//                   alert.severity === 'critical' ? 'border-destructive/50' : ''
//                 }`}
//               >
//                 <CardContent className="p-6">
//                   <div className="flex items-start justify-between gap-4">
//                     <div className="flex-1 space-y-3">
//                       {/* Header */}
//                       <div className="flex flex-wrap items-center gap-2">
//                         {alert.isPinned && (
//                           <Badge variant="secondary" className="gap-1">
//                             <Pin className="h-3 w-3" />
//                             Pinned
//                           </Badge>
//                         )}
//                         <Badge className={`${severityConfig.bgColor} ${severityConfig.color}`}>
//                           {severityConfig.label}
//                         </Badge>
//                         <Badge variant="outline">{diseaseConfig.label}</Badge>
//                         {!alert.isApproved && (
//                           <Badge variant="outline" className="border-orange-400 text-orange-600">
//                             <Clock className="mr-1 h-3 w-3" />
//                             Pending Review
//                           </Badge>
//                         )}
//                       </div>

//                       {/* Title & Content */}
//                       <div>
//                         <h3 className="text-lg font-semibold">{alert.title}</h3>
//                         <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
//                           {alert.description}
//                         </p>
//                       </div>

//                       {/* Symptoms */}
//                       <div className="flex flex-wrap gap-1">
//                         {alert.symptoms.slice(0, 3).map((symptom, i) => (
//                           <Badge key={i} variant="outline" className="text-xs">
//                             {symptom}
//                           </Badge>
//                         ))}
//                         {alert.symptoms.length > 3 && (
//                           <Badge variant="outline" className="text-xs">
//                             +{alert.symptoms.length - 3} more
//                           </Badge>
//                         )}
//                       </div>

//                       {/* Meta */}
//                       <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
//                         <div className="flex items-center gap-1">
//                           <MapPin className="h-3.5 w-3.5" />
//                           {alert.affectedArea}, {alert.region}
//                         </div>
//                         <div className="flex items-center gap-1">
//                           <Clock className="h-3.5 w-3.5" />
//                           {formatDistanceToNow(alert.createdAt, { addSuffix: true })}
//                         </div>
//                         <span>Reported by {alert.farmerName}</span>
//                       </div>
//                     </div>

//                     {/* Actions */}
//                     <DropdownMenu>
//                       <DropdownMenuTrigger asChild>
//                         <Button variant="ghost" size="icon">
//                           <MoreVertical className="h-4 w-4" />
//                         </Button>
//                       </DropdownMenuTrigger>
//                       <DropdownMenuContent align="end">
//                         <DropdownMenuItem onClick={() => setSelectedAlert(alert)}>
//                           <Eye className="mr-2 h-4 w-4" />
//                           View Details
//                         </DropdownMenuItem>
//                         {!alert.isApproved && (
//                           <DropdownMenuItem onClick={() => handleApprove(alert)}>
//                             <Check className="mr-2 h-4 w-4 text-secondary" />
//                             Approve & Publish
//                           </DropdownMenuItem>
//                         )}
//                         <DropdownMenuItem onClick={() => handlePin(alert)}>
//                           {alert.isPinned ? (
//                             <>
//                               <PinOff className="mr-2 h-4 w-4" />
//                               Unpin Alert
//                             </>
//                           ) : (
//                             <>
//                               <Pin className="mr-2 h-4 w-4" />
//                               Pin Alert
//                             </>
//                           )}
//                         </DropdownMenuItem>
//                       </DropdownMenuContent>
//                     </DropdownMenu>
//                   </div>
//                 </CardContent>
//               </Card>
//             );
//           })}
//         </div>
//       )}

//       {/* Alert Details Dialog */}
//       <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
//         <DialogContent className="max-w-2xl">
//           {selectedAlert && (
//             <>
//               <DialogHeader>
//                 <div className="flex items-center gap-2">
//                   <Badge className={`${SEVERITY_CONFIG[selectedAlert.severity].bgColor} ${SEVERITY_CONFIG[selectedAlert.severity].color}`}>
//                     {SEVERITY_CONFIG[selectedAlert.severity].label}
//                   </Badge>
//                   <Badge variant="outline">{DISEASE_TYPE_CONFIG[selectedAlert.diseaseType].label}</Badge>
//                 </div>
//                 <DialogTitle className="mt-2">{selectedAlert.title}</DialogTitle>
//                 <DialogDescription>
//                   Reported by {selectedAlert.farmerName} • {formatDistanceToNow(selectedAlert.createdAt, { addSuffix: true })}
//                 </DialogDescription>
//               </DialogHeader>
//               <div className="space-y-4">
//                 <div>
//                   <h4 className="mb-2 font-semibold">Description</h4>
//                   <p className="text-sm text-muted-foreground">{selectedAlert.description}</p>
//                 </div>
//                 <div>
//                   <h4 className="mb-2 font-semibold">Symptoms Observed</h4>
//                   <div className="flex flex-wrap gap-2">
//                     {selectedAlert.symptoms.map((symptom, i) => (
//                       <Badge key={i} variant="outline">
//                         {symptom}
//                       </Badge>
//                     ))}
//                   </div>
//                 </div>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <h4 className="mb-1 text-sm font-semibold">Affected Area</h4>
//                     <p className="text-sm text-muted-foreground">{selectedAlert.affectedArea}</p>
//                   </div>
//                   <div>
//                     <h4 className="mb-1 text-sm font-semibold">Region</h4>
//                     <p className="text-sm text-muted-foreground">{selectedAlert.region}</p>
//                   </div>
//                 </div>
//                 <div className="flex gap-2 pt-4">
//                   {!selectedAlert.isApproved && (
//                     <Button onClick={() => {
//                       handleApprove(selectedAlert);
//                       setSelectedAlert(null);
//                     }}>
//                       <Check className="mr-2 h-4 w-4" />
//                       Approve & Publish
//                     </Button>
//                   )}
//                   <Button
//                     variant="outline"
//                     onClick={() => {
//                       handlePin(selectedAlert);
//                       setSelectedAlert(null);
//                     }}
//                   >
//                     {selectedAlert.isPinned ? (
//                       <>
//                         <PinOff className="mr-2 h-4 w-4" />
//                         Unpin
//                       </>
//                     ) : (
//                       <>
//                         <Pin className="mr-2 h-4 w-4" />
//                         Pin to Top
//                       </>
//                     )}
//                   </Button>
//                 </div>
//               </div>
//             </>
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }
