import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  MoreVertical,
  Check,
  Trash2,
  MapPin,
  Phone,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Filter,
  Package,
  Calendar,
  Plus,
  Edit,
  X,
  Upload,
  Image as ImageIcon,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Award,
  Mail,
} from 'lucide-react';

type ListingType = 'surplus' | 'shortage' | 'selling' | 'buying';
type VerificationTier = 'basic' | 'verified' | 'trusted';
type ListingStatus = 'active' | 'pending' | 'completed' | 'expired';

interface TradeListing {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerTier: VerificationTier;
  type: ListingType;
  variety: string;
  quantity: number;
  unit: string;
  pricePerUnit?: number;
  description: string;
  location: string;
  contactInfo: string;
  email?: string;
  images?: string[];
  status: ListingStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  views?: number;
}

const LISTING_TYPE_CONFIG = {
  surplus: { 
    label: 'Surplus', 
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    description: 'Extra produce available for sale',
    icon: TrendingUp 
  },
  shortage: { 
    label: 'Shortage', 
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    description: 'Looking for produce to buy',
    icon: TrendingDown 
  },
  selling: { 
    label: 'Selling', 
    color: 'bg-green-100 text-green-700 border-green-300',
    description: 'Regular produce for sale',
    icon: DollarSign 
  },
  buying: { 
    label: 'Buying', 
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    description: 'Looking to purchase produce',
    icon: ShoppingCart 
  },
};

const VERIFICATION_TIER_CONFIG = {
  basic: { label: 'New Farmer', color: 'text-gray-600', icon: User },
  verified: { label: 'Verified', color: 'text-blue-600', icon: CheckCircle2 },
  trusted: { label: 'Trusted', color: 'text-amber-600', icon: Award },
};

const MANGO_VARIETIES = [
  'Carabao',
  'Apple Mango',
  'Pico',
  'Indian Mango',
  'Green Mango',
  'Other'
];

// Mock data
const generateMockListings = (): TradeListing[] => [
  {
    id: '1',
    farmerId: 'farmer-1',
    farmerName: 'Juan dela Cruz',
    farmerTier: 'trusted',
    type: 'surplus',
    variety: 'Carabao',
    quantity: 500,
    unit: 'kg',
    pricePerUnit: 85,
    description: 'Grade A Carabao mangoes from our farm in Zambales. Harvested this week, perfect ripeness for export or local distribution. Organic certified.',
    location: 'Iba, Zambales',
    contactInfo: '0917-123-4567',
    email: 'juan@email.com',
    images: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=400', 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400'],
    status: 'active',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    views: 234,
  },
  {
    id: '2',
    farmerId: 'farmer-2',
    farmerName: 'Maria Santos',
    farmerTier: 'verified',
    type: 'selling',
    variety: 'Apple Mango',
    quantity: 200,
    unit: 'kg',
    pricePerUnit: 130,
    description: 'Premium Apple Mangoes, export quality. Sweet and juicy. Can negotiate for bulk orders over 100kg.',
    location: 'San Jose, Batangas',
    contactInfo: '0918-234-5678',
    email: 'maria@email.com',
    images: ['https://images.unsplash.com/photo-1591206369811-4eeb2f18ecf5?w=400'],
    status: 'active',
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    views: 156,
  },
  {
    id: '3',
    farmerId: 'farmer-6',
    farmerName: 'Carlos Mendoza',
    farmerTier: 'verified',
    type: 'buying',
    variety: 'Carabao',
    quantity: 1000,
    unit: 'kg',
    description: 'Looking for Grade A Carabao mangoes for export to Japan. Must meet export standards. Willing to pay premium prices for quality produce.',
    location: 'Manila',
    contactInfo: '0919-567-8901',
    email: 'carlos@export.com',
    status: 'active',
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    views: 89,
  },
  {
    id: '4',
    farmerId: 'farmer-7',
    farmerName: 'Elena Ramos',
    farmerTier: 'basic',
    type: 'shortage',
    variety: 'Pico',
    quantity: 300,
    unit: 'kg',
    description: 'Our harvest was affected by recent typhoon. Need Pico mangoes urgently to fulfill existing orders. Please contact ASAP.',
    location: 'Dagupan, Pangasinan',
    contactInfo: '0920-345-6789',
    status: 'pending',
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    views: 45,
  },
];

export default function TradeListingsMarketplace() {
  const [listings, setListings] = useState<TradeListing[]>(generateMockListings());
  const [selectedListing, setSelectedListing] = useState<TradeListing | null>(null);
  const [typeFilter, setTypeFilter] = useState<ListingType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingListing, setEditingListing] = useState<TradeListing | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Form state
  const [formData, setFormData] = useState({
    type: 'selling' as ListingType,
    variety: '',
    quantity: '',
    unit: 'kg',
    pricePerUnit: '',
    description: '',
    location: '',
    contactInfo: '',
    email: '',
    expiryDays: '7',
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const filteredListings = listings
    .filter((listing) => {
      if (typeFilter !== 'all' && listing.type !== typeFilter) return false;
      if (statusFilter !== 'all' && listing.status !== statusFilter) return false;
      if (searchQuery && 
          !listing.variety.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !listing.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !listing.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !listing.location.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setUploadedImages([...uploadedImages, ...newImages].slice(0, 5)); // Max 5 images
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handleCreateListing = () => {
    const newListing: TradeListing = {
      id: Date.now().toString(),
      farmerId: 'current-user',
      farmerName: 'You (Admin)',
      farmerTier: 'trusted',
      type: formData.type,
      variety: formData.variety,
      quantity: parseInt(formData.quantity),
      unit: formData.unit,
      pricePerUnit: formData.pricePerUnit ? parseFloat(formData.pricePerUnit) : undefined,
      description: formData.description,
      location: formData.location,
      contactInfo: formData.contactInfo,
      email: formData.email || undefined,
      images: uploadedImages.length > 0 ? uploadedImages : undefined,
      status: 'active',
      expiresAt: new Date(Date.now() + parseInt(formData.expiryDays) * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
      views: 0,
    };
    
    setListings([newListing, ...listings]);
    resetForm();
    setShowCreateDialog(false);
  };

  const handleEditListing = () => {
    if (!editingListing) return;
    
    setListings(listings.map(listing => 
      listing.id === editingListing.id 
        ? {
            ...listing,
            type: formData.type,
            variety: formData.variety,
            quantity: parseInt(formData.quantity),
            unit: formData.unit,
            pricePerUnit: formData.pricePerUnit ? parseFloat(formData.pricePerUnit) : undefined,
            description: formData.description,
            location: formData.location,
            contactInfo: formData.contactInfo,
            email: formData.email || undefined,
            images: uploadedImages.length > 0 ? uploadedImages : undefined,
            updatedAt: new Date(),
          }
        : listing
    ));
    
    resetForm();
    setShowEditDialog(false);
    setEditingListing(null);
  };

  const openEditDialog = (listing: TradeListing) => {
    setEditingListing(listing);
    setFormData({
      type: listing.type,
      variety: listing.variety,
      quantity: listing.quantity.toString(),
      unit: listing.unit,
      pricePerUnit: listing.pricePerUnit?.toString() || '',
      description: listing.description,
      location: listing.location,
      contactInfo: listing.contactInfo,
      email: listing.email || '',
      expiryDays: '7',
    });
    setUploadedImages(listing.images || []);
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'selling',
      variety: '',
      quantity: '',
      unit: 'kg',
      pricePerUnit: '',
      description: '',
      location: '',
      contactInfo: '',
      email: '',
      expiryDays: '7',
    });
    setUploadedImages([]);
  };

  const handleApproveListing = (id: string) => {
    setListings(listings.map(listing => 
      listing.id === id ? { ...listing, status: 'active' as ListingStatus } : listing
    ));
  };

  const handleDeleteListing = (id: string) => {
    setListings(listings.filter(listing => listing.id !== id));
    if (selectedListing?.id === id) setSelectedListing(null);
  };

  const getStatusBadge = (status: ListingStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600 text-white"><CheckCircle2 className="mr-1 h-3 w-3" />Active</Badge>;
      case 'pending':
        return <Badge className="bg-orange-500 text-white"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'completed':
        return <Badge variant="secondary"><Check className="mr-1 h-3 w-3" />Completed</Badge>;
      case 'expired':
        return <Badge variant="outline" className="text-gray-500"><AlertCircle className="mr-1 h-3 w-3" />Expired</Badge>;
    }
  };

  const getDaysLeft = (expiresAt: Date) => {
    const days = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Expired';
    if (days === 0) return 'Expires today';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  };

  const ListingCard = ({ listing }: { listing: TradeListing }) => {
    const typeConfig = LISTING_TYPE_CONFIG[listing.type];
    const tierConfig = VERIFICATION_TIER_CONFIG[listing.farmerTier];
    const TypeIcon = typeConfig.icon;
    const TierIcon = tierConfig.icon;

    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
        <div onClick={() => setSelectedListing(listing)}>
          {/* Image Section */}
          <div className="relative h-48 bg-gradient-to-br from-green-100 to-yellow-50 overflow-hidden">
            {listing.images && listing.images.length > 0 ? (
              <img 
                src={listing.images[0]} 
                alt={listing.variety}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Package className="h-16 w-16 text-gray-300" />
              </div>
            )}
            <div className="absolute top-3 left-3">
              <Badge className={typeConfig.color}>
                <TypeIcon className="mr-1 h-3 w-3" />
                {typeConfig.label}
              </Badge>
            </div>
            <div className="absolute top-3 right-3">
              {getStatusBadge(listing.status)}
            </div>
            {listing.images && listing.images.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/60 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                {listing.images.length}
              </div>
            )}
          </div>

          {/* Content Section */}
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Title & Price */}
              <div>
                <h3 className="font-bold text-lg text-gray-900">{listing.variety}</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-green-600">
                    {listing.quantity.toLocaleString()} {listing.unit}
                  </span>
                  {listing.pricePerUnit && (
                    <span className="text-sm text-gray-600">
                      @ ₱{listing.pricePerUnit.toLocaleString()}/{listing.unit}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 line-clamp-2">
                {listing.description}
              </p>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{listing.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>{getDaysLeft(listing.expiresAt)}</span>
                </div>
                {listing.views !== undefined && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Eye className="h-4 w-4 flex-shrink-0" />
                    <span>{listing.views} views</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{listing.farmerName}</span>
                  <TierIcon className={`h-4 w-4 ${tierConfig.color}`} />
                </div>
              </div>
            </div>
          </CardContent>
        </div>

        {/* Action Menu */}
        <div className="px-4 pb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full" size="sm">
                <MoreVertical className="h-4 w-4 mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {listing.status === 'pending' && (
                <>
                  <DropdownMenuItem onClick={() => handleApproveListing(listing.id)}>
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                    Approve Listing
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => openEditDialog(listing)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Listing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedListing(listing)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDeleteListing(listing.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Listing
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>
    );
  };

  const ListingForm = ({ mode }: { mode: 'create' | 'edit' }) => (
    <div className="space-y-4">
      {/* Type Selection */}
      <div>
        <label className="text-sm font-medium mb-2 block">Listing Type *</label>
        <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as ListingType })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(LISTING_TYPE_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{config.label}</div>
                      <div className="text-xs text-gray-500">{config.description}</div>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Variety */}
      <div>
        <label className="text-sm font-medium mb-2 block">Mango Variety *</label>
        <Select value={formData.variety} onValueChange={(v) => setFormData({ ...formData, variety: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select variety" />
          </SelectTrigger>
          <SelectContent>
            {MANGO_VARIETIES.map((variety) => (
              <SelectItem key={variety} value={variety}>{variety}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quantity & Unit */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Quantity *</label>
          <Input
            type="number"
            placeholder="500"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Unit *</label>
          <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kg">Kilograms (kg)</SelectItem>
              <SelectItem value="boxes">Boxes</SelectItem>
              <SelectItem value="pieces">Pieces</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          Price per {formData.unit} {(formData.type === 'buying' || formData.type === 'selling') ? '*' : '(Optional)'}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
          <Input
            type="number"
            placeholder="85.00"
            value={formData.pricePerUnit}
            onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
            className="pl-8"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-sm font-medium mb-2 block">Description *</label>
        <Textarea
          placeholder="Provide details about the mangoes, quality, harvesting date, certifications, etc."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
        />
      </div>

      {/* Location */}
      <div>
        <label className="text-sm font-medium mb-2 block">Location *</label>
        <Input
          placeholder="e.g., Iba, Zambales"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        />
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Contact Number *</label>
          <Input
            placeholder="0917-123-4567"
            value={formData.contactInfo}
            onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Email (Optional)</label>
          <Input
            type="email"
            placeholder="farmer@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </div>

      {/* Images */}
      <div>
        <label className="text-sm font-medium mb-2 block">Images (Max 5)</label>
        <div className="space-y-3">
          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-5 gap-2">
              {uploadedImages.map((img, index) => (
                <div key={index} className="relative group">
                  <img src={img} alt={`Upload ${index + 1}`} className="w-full h-20 object-cover rounded border" />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {uploadedImages.length < 5 && (
            <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-green-500 transition-colors">
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Click to upload images</span>
              <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB each</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      {/* Expiry */}
      <div>
        <label className="text-sm font-medium mb-2 block">Listing Duration</label>
        <Select value={formData.expiryDays} onValueChange={(v) => setFormData({ ...formData, expiryDays: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 days</SelectItem>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="14">14 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trade Listings</h1>
          <p className="text-gray-600 mt-1">Buy, sell, and trade mangoes with other farmers</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Listing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Listing</DialogTitle>
              <DialogDescription>
                Post a new trade listing for the community
              </DialogDescription>
            </DialogHeader>
            <ListingForm mode="create" />
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateListing}
                disabled={!formData.variety || !formData.quantity || !formData.description || !formData.location || !formData.contactInfo}
                className="bg-green-600 hover:bg-green-700"
              >
                Create Listing
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by variety, location, farmer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ListingType | 'all')}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(LISTING_TYPE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'pending')}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Listings</p>
                <p className="text-2xl font-bold">{listings.length}</p>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {listings.filter(l => l.status === 'active').length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  {listings.filter(l => l.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold">
                  {listings.reduce((acc, l) => acc + (l.views || 0), 0)}
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="mb-4 h-16 w-16 text-gray-300" />
            <p className="text-lg font-medium text-gray-600">No listings found</p>
            <p className="text-sm text-gray-500 mb-4">Try adjusting your filters or create a new listing</p>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Create First Listing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {/* Listing Detail Dialog */}
      <Dialog open={selectedListing !== null} onOpenChange={() => setSelectedListing(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedListing && (
            <div>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={LISTING_TYPE_CONFIG[selectedListing.type].color}>
                        {(() => {
                          const Icon = LISTING_TYPE_CONFIG[selectedListing.type].icon;
                          return <Icon className="h-3 w-3 mr-1" />;
                        })()}
                        {LISTING_TYPE_CONFIG[selectedListing.type].label}
                      </Badge>
                      {getStatusBadge(selectedListing.status)}
                    </div>
                    <DialogTitle className="text-3xl">{selectedListing.variety}</DialogTitle>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {/* Images Gallery */}
                {selectedListing.images && selectedListing.images.length > 0 && (
                  <div className="space-y-3">
                    <img 
                      src={selectedListing.images[0]} 
                      alt={selectedListing.variety}
                      className="w-full h-80 object-cover rounded-lg"
                    />
                    {selectedListing.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {selectedListing.images.slice(1).map((img, index) => (
                          <img 
                            key={index}
                            src={img} 
                            alt={`${selectedListing.variety} ${index + 2}`}
                            className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Price & Quantity */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Quantity Available</p>
                      <p className="text-4xl font-bold text-green-600">
                        {selectedListing.quantity.toLocaleString()} {selectedListing.unit}
                      </p>
                    </div>
                    {selectedListing.pricePerUnit && (
                      <div className="text-right">
                        <p className="text-sm text-gray-600 mb-1">Price per {selectedListing.unit}</p>
                        <p className="text-3xl font-bold text-gray-900">
                          ₱{selectedListing.pricePerUnit.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedListing.pricePerUnit && (
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Value</span>
                        <span className="text-2xl font-bold text-green-600">
                          ₱{(selectedListing.quantity * selectedListing.pricePerUnit).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedListing.description}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Location & Contact</h3>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Location</p>
                          <p className="font-medium">{selectedListing.location}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Contact Number</p>
                          <p className="font-medium">{selectedListing.contactInfo}</p>
                        </div>
                      </div>
                      {selectedListing.email && (
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium">{selectedListing.email}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Listing Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Posted by</p>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{selectedListing.farmerName}</p>
                            {(() => {
                              const TierIcon = VERIFICATION_TIER_CONFIG[selectedListing.farmerTier].icon;
                              return <TierIcon className={`h-4 w-4 ${VERIFICATION_TIER_CONFIG[selectedListing.farmerTier].color}`} />;
                            })()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Expires</p>
                          <p className="font-medium">{getDaysLeft(selectedListing.expiresAt)}</p>
                        </div>
                      </div>
                      {selectedListing.views !== undefined && (
                        <div className="flex items-start gap-3">
                          <Eye className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-600">Views</p>
                            <p className="font-medium">{selectedListing.views} views</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  {selectedListing.status === 'pending' && (
                    <Button 
                      onClick={() => {
                        handleApproveListing(selectedListing.id);
                        setSelectedListing({ ...selectedListing, status: 'active' });
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve Listing
                    </Button>
                  )}
                  <Button 
                    onClick={() => {
                      openEditDialog(selectedListing);
                      setSelectedListing(null);
                    }}
                    variant="outline"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    onClick={() => {
                      handleDeleteListing(selectedListing.id);
                    }}
                    variant="destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Listing</DialogTitle>
            <DialogDescription>
              Update the listing information
            </DialogDescription>
          </DialogHeader>
          <ListingForm mode="edit" />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditDialog(false); setEditingListing(null); resetForm(); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditListing}
              disabled={!formData.variety || !formData.quantity || !formData.description || !formData.location || !formData.contactInfo}
              className="bg-green-600 hover:bg-green-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}