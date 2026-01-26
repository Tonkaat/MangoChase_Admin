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
  Pin,
  PinOff,
  Check,
  Trash2,
  MessageCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Megaphone,
  Filter,
  ArrowUp,
  ArrowDown,
  Share2,
  Bookmark,
  Flag,
  Edit,
  Send,
  X,
  User,
  Award,
  Flame,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Calendar,
  ExternalLink,
  Store,
  TreePine,
  BarChart3,
  ShoppingBag,
  MessageSquare,
  ThumbsUp,
  Shield,
  Star,
  Activity,
} from 'lucide-react';

// Types
type PostCategory = 'experience' | 'disease_alert' | 'market_info' | 'general' | 'announcement';
type VerificationTier = 'basic' | 'verified' | 'trusted';
type SortOption = 'hot' | 'new' | 'top' | 'controversial';

interface CommunityPost {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerTier: VerificationTier;
  title: string;
  content: string;
  category: PostCategory;
  isPinned: boolean;
  isApproved: boolean;
  upvotes: number;
  downvotes: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
  userVote?: 'up' | 'down' | null;
}

interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userTier: VerificationTier;
  content: string;
  upvotes: number;
  downvotes: number;
  createdAt: Date;
  replies?: Comment[];
  userVote?: 'up' | 'down' | null;
}

interface FarmerProfile {
  id: string;
  farmId: string;
  name: string;
  email: string;
  phone?: string;
  location: string;
  verificationTier: VerificationTier;
  verificationStatus: string;
  verifiedAt?: Date;
  joinedAt: Date;
  bio?: string;
  farmName?: string;
  farmSize?: number;
  farmSizeUnit?: string;
  totalTrees?: number;
  mainVarieties?: string[];
  postsCount?: number;
  commentsCount?: number;
  helpfulVotes?: number;
  recentActivity?: Activity[];
}

interface Activity {
  id: string;
  type: 'post' | 'comment' | 'trade';
  title: string;
  date: Date;
}

const POST_CATEGORY_CONFIG = {
  experience: { label: 'Experience', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: User },
  disease_alert: { label: 'Disease Alert', color: 'bg-red-100 text-red-700 border-red-300', icon: AlertTriangle },
  market_info: { label: 'Market Info', color: 'bg-green-100 text-green-700 border-green-300', icon: TrendingUp },
  general: { label: 'Discussion', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: MessageCircle },
  announcement: { label: 'Announcement', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: Megaphone },
};

const VERIFICATION_TIER_CONFIG = {
  basic: { label: 'New Farmer', color: 'text-gray-600', icon: User, bgColor: 'bg-gray-100' },
  verified: { label: 'Verified Farmer', color: 'text-blue-600', icon: Check, bgColor: 'bg-blue-100' },
  trusted: { label: 'Trusted Expert', color: 'text-amber-600', icon: Award, bgColor: 'bg-amber-100' },
};

// Mock farmer profiles with farm data
const mockFarmerProfiles: Record<string, FarmerProfile> = {
  'farmer-1': {
    id: 'farmer-1',
    farmId: 'farm-1',
    name: 'Juan dela Cruz',
    email: 'juan.delacruz@email.com',
    phone: '0917-123-4567',
    location: 'Iba, Zambales',
    verificationTier: 'trusted',
    verificationStatus: 'approved',
    verifiedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    joinedAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
    bio: '15 years of mango farming experience. Specializing in Carabao variety with focus on organic methods. Happy to share knowledge with fellow farmers.',
    farmName: 'Dela Cruz Mango Farm',
    farmSize: 5.5,
    farmSizeUnit: 'hectares',
    totalTrees: 450,
    mainVarieties: ['Carabao', 'Apple Mango'],
    postsCount: 47,
    commentsCount: 234,
    helpfulVotes: 892,
    recentActivity: [
      { id: '1', type: 'post', title: 'Best practices for mango flowering season', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { id: '2', type: 'comment', title: 'Replied to "Organic pest control methods"', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { id: '3', type: 'trade', title: 'Posted surplus listing: 500kg Carabao mangoes', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    ],
  },
  'farmer-2': {
    id: 'farmer-2',
    farmId: 'farm-2',
    name: 'Sebastian Papillero',
    email: 'cunnys123@email.com',
    phone: '0969-234-5678',
    location: 'Davao City, Philippines',
    verificationTier: 'verified',
    verificationStatus: 'approved',
    verifiedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    joinedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    bio: 'I love cunnys',
    farmName: 'Papillero Farm',
    farmSize: 3.2,
    farmSizeUnit: 'hectares',
    totalTrees: 280,
    mainVarieties: ['Carabao'],
    postsCount: 23,
    commentsCount: 156,
    helpfulVotes: 445,
    recentActivity: [
      { id: '1', type: 'post', title: 'Anthracnose outbreak in Batangas region', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { id: '2', type: 'comment', title: 'Commented on disease prevention methods', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    ],
  },
  'farmer-3': {
    id: 'farmer-3',
    farmId: 'farm-3',
    name: 'Pedro Reyes',
    email: 'pedro.reyes@email.com',
    location: 'Divisoria, Manila',
    verificationTier: 'basic',
    verificationStatus: 'pending',
    joinedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    bio: 'Mango trader and small-scale farmer. Active in Manila markets.',
    farmSize: 0.5,
    farmSizeUnit: 'hectares',
    totalTrees: 35,
    mainVarieties: ['Carabao'],
    postsCount: 8,
    commentsCount: 24,
    helpfulVotes: 67,
  },
};

// Generate mock posts
const generateMockPosts = (): CommunityPost[] => [
  {
    id: '1',
    farmerId: 'farmer-1',
    farmerName: 'Juan dela Cruz',
    farmerTier: 'trusted',
    title: 'Best practices for mango flowering season - My 15 years of experience',
    content: 'After 15 years of farming, I\'ve learned that timing is everything during flowering season. Here are my top tips for maximizing fruit set:\n\n1. Monitor soil moisture carefully\n2. Apply potassium nitrate at the right time\n3. Watch for early pest signs\n\nWhat techniques work best for you?',
    category: 'experience',
    isPinned: true,
    isApproved: true,
    upvotes: 245,
    downvotes: 12,
    commentsCount: 47,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    userVote: null,
  },
  {
    id: '2',
    farmerId: 'farmer-2',
    farmerName: 'Sebastion Papillero',
    farmerTier: 'verified',
    title: '🚨 URGENT: Anthracnose outbreak spreading in Batangas region',
    content: 'Warning to all farmers in Batangas! We\'ve detected anthracnose in several farms across San Jose. The wet season has made it worse.\n\nSymptoms to watch for:\n- Black spots on fruits\n- Leaf blight\n- Premature fruit drop\n\nPlease check your trees immediately and report any findings!',
    category: 'disease_alert',
    isPinned: true,
    isApproved: true,
    upvotes: 428,
    downvotes: 5,
    commentsCount: 89,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    userVote: 'up',
  },
  {
    id: '3',
    farmerId: 'farmer-3',
    farmerName: 'Pedro Reyes',
    farmerTier: 'basic',
    title: 'Current mango prices in Manila markets (Updated today)',
    content: 'Just visited Divisoria market today. Here\'s what I found:\n\n🥭 Carabao mangoes: ₱80-95/kg\n🥭 Apple mangoes: ₱120-140/kg\n🥭 Pico mangoes: ₱55-70/kg\n\nPrices seem stable compared to last week. Anyone else seeing similar rates in other markets?',
    category: 'market_info',
    isPinned: false,
    isApproved: true,
    upvotes: 167,
    downvotes: 8,
    commentsCount: 34,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    userVote: null,
  },
];

const generateMockComments = (postId: string): Comment[] => [
  {
    id: 'c1',
    postId,
    userId: 'user1',
    userName: 'Carlos Mendoza',
    userTier: 'verified',
    content: 'This is really helpful! I\'ve been struggling with the timing. When exactly do you apply the potassium nitrate?',
    upvotes: 45,
    downvotes: 2,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    replies: [
      {
        id: 'c1-r1',
        postId,
        userId: 'farmer-1',
        userName: 'Juan dela Cruz',
        userTier: 'trusted',
        content: 'Good question! I apply it about 2-3 weeks before the expected flowering period. The key is to watch the weather - you want dry conditions.',
        upvotes: 67,
        downvotes: 1,
        createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
      }
    ]
  },
];

export default function FarmerProfileSystem() {
  const [posts, setPosts] = useState<CommunityPost[]>(generateMockPosts());
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerProfile | null>(null);
  const [viewFullProfile, setViewFullProfile] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<PostCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('hot');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'general' as PostCategory,
  });

  const filteredPosts = posts
    .filter((post) => {
      if (categoryFilter !== 'all' && post.category !== categoryFilter) return false;
      if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !post.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      switch (sortBy) {
        case 'hot':
          return (b.upvotes - b.downvotes + b.commentsCount * 2) - (a.upvotes - a.downvotes + a.commentsCount * 2);
        case 'new':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'top':
          return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
        case 'controversial':
          return Math.min(b.upvotes, b.downvotes) - Math.min(a.upvotes, a.downvotes);
        default:
          return 0;
      }
    });

  const handleVote = (postId: string, voteType: 'up' | 'down') => {
    setPosts(posts.map(post => {
      if (post.id !== postId) return post;
      
      const currentVote = post.userVote;
      let newUpvotes = post.upvotes;
      let newDownvotes = post.downvotes;
      let newUserVote: 'up' | 'down' | null = voteType;

      if (currentVote === voteType) {
        if (voteType === 'up') newUpvotes--;
        else newDownvotes--;
        newUserVote = null;
      } else if (currentVote) {
        if (currentVote === 'up') {
          newUpvotes--;
          newDownvotes++;
        } else {
          newDownvotes--;
          newUpvotes++;
        }
      } else {
        if (voteType === 'up') newUpvotes++;
        else newDownvotes++;
      }

      return { ...post, upvotes: newUpvotes, downvotes: newDownvotes, userVote: newUserVote };
    }));
  };

  const openPostDetail = (post: CommunityPost) => {
    setSelectedPost(post);
    setComments(generateMockComments(post.id));
  };

  const openFarmerProfile = (farmerId: string) => {
    const profile = mockFarmerProfiles[farmerId];
    if (profile) {
      setSelectedFarmer(profile);
    }
  };

  const openFullProfile = () => {
    setViewFullProfile(true);
    setSelectedFarmer(null);
  };

  const getTimeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Farmer Profile Quick View Modal
  const FarmerProfileModal = ({ farmer }: { farmer: FarmerProfile }) => {
    const tierConfig = VERIFICATION_TIER_CONFIG[farmer.verificationTier];
    const TierIcon = tierConfig.icon;

    return (
      <Dialog open={!!farmer} onOpenChange={() => setSelectedFarmer(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start gap-4">
              <div className={`w-20 h-20 rounded-full ${tierConfig.bgColor} flex items-center justify-center`}>
                <User className={`h-10 w-10 ${tierConfig.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <DialogTitle className="text-2xl">{farmer.name}</DialogTitle>
                  <Badge className={`${tierConfig.bgColor} ${tierConfig.color} border-0`}>
                    <TierIcon className="h-3 w-3 mr-1" />
                    {tierConfig.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {farmer.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {getTimeSince(farmer.joinedAt)}
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {farmer.bio && (
              <p className="text-gray-700">{farmer.bio}</p>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <MessageSquare className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                  <div className="text-2xl font-bold">{farmer.postsCount}</div>
                  <div className="text-xs text-gray-600">Posts</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <MessageCircle className="h-5 w-5 mx-auto mb-1 text-green-600" />
                  <div className="text-2xl font-bold">{farmer.commentsCount}</div>
                  <div className="text-xs text-gray-600">Comments</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <ThumbsUp className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                  <div className="text-2xl font-bold">{farmer.helpfulVotes}</div>
                  <div className="text-xs text-gray-600">Helpful Votes</div>
                </CardContent>
              </Card>
            </div>

            {/* Farm Info */}
            {farmer.farmName && (
              <Card className="border-green-200 bg-green-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    Farm Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Farm Name:</span>
                    <span className="font-medium">{farmer.farmName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium">{farmer.farmSize} {farmer.farmSizeUnit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Trees:</span>
                    <span className="font-medium">{farmer.totalTrees}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Main Varieties:</span>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {farmer.mainVarieties?.map((variety, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {variety}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Info */}
            {farmer.verificationTier !== 'basic' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {farmer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{farmer.email}</span>
                    </div>
                  )}
                  {farmer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{farmer.phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            {farmer.recentActivity && farmer.recentActivity.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent Activity
                </h4>
                <div className="space-y-2">
                  {farmer.recentActivity.map((activity) => (
                    <Card key={activity.id} className="bg-gray-50">
                      <CardContent className="py-3">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5">
                            {activity.type === 'post' && <MessageSquare className="h-4 w-4 text-blue-600" />}
                            {activity.type === 'comment' && <MessageCircle className="h-4 w-4 text-green-600" />}
                            {activity.type === 'trade' && <ShoppingBag className="h-4 w-4 text-purple-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{activity.title}</p>
                            <p className="text-xs text-gray-500">{getTimeSince(activity.date)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedFarmer(null)}>
              Close
            </Button>
            <Button onClick={openFullProfile} className="bg-blue-600 hover:bg-blue-700">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Full Profile Page
  const FullProfilePage = ({ farmer }: { farmer: FarmerProfile }) => {
    const tierConfig = VERIFICATION_TIER_CONFIG[farmer.verificationTier];
    const TierIcon = tierConfig.icon;
    const [activeTab, setActiveTab] = useState('overview');

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <Button 
              variant="ghost" 
              onClick={() => setViewFullProfile(false)}
              className="mb-4"
            >
              ← Back to Board
            </Button>
            
            <div className="flex items-start gap-6">
              <div className={`w-32 h-32 rounded-full ${tierConfig.bgColor} flex items-center justify-center`}>
                <User className={`h-16 w-16 ${tierConfig.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold">{farmer.name}</h1>
                  <Badge className={`${tierConfig.bgColor} ${tierConfig.color} border-0`}>
                    <TierIcon className="h-4 w-4 mr-1" />
                    {tierConfig.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-6 text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {farmer.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Joined {new Date(farmer.joinedAt).toLocaleDateString()}
                  </div>
                  {farmer.verifiedAt && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      Verified {new Date(farmer.verifiedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {farmer.bio && (
                  <p className="text-gray-700 text-lg mb-4">{farmer.bio}</p>
                )}
                
                {/* Stats Row */}
                <div className="flex gap-8 text-sm">
                  <div>
                    <span className="font-bold text-xl">{farmer.postsCount}</span>
                    <span className="text-gray-600 ml-1">Posts</span>
                  </div>
                  <div>
                    <span className="font-bold text-xl">{farmer.commentsCount}</span>
                    <span className="text-gray-600 ml-1">Comments</span>
                  </div>
                  <div>
                    <span className="font-bold text-xl">{farmer.helpfulVotes}</span>
                    <span className="text-gray-600 ml-1">Helpful Votes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="farm">
                <TreePine className="h-4 w-4 mr-2" />
                Farm Details
              </TabsTrigger>
              <TabsTrigger value="posts">
                <MessageSquare className="h-4 w-4 mr-2" />
                Posts & Activity
              </TabsTrigger>
              <TabsTrigger value="contact">
                <Mail className="h-4 w-4 mr-2" />
                Contact
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Contribution Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Star className="h-8 w-8 text-yellow-500" />
                      <div>
                        <div className="text-3xl font-bold">{farmer.helpfulVotes}</div>
                        <div className="text-xs text-gray-500">Total helpful votes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Total Posts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-8 w-8 text-blue-500" />
                      <div>
                        <div className="text-3xl font-bold">{farmer.postsCount}</div>
                        <div className="text-xs text-gray-500">Community posts</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-600">Engagement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-8 w-8 text-green-500" />
                      <div>
                        <div className="text-3xl font-bold">{farmer.commentsCount}</div>
                        <div className="text-xs text-gray-500">Comments made</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {farmer.recentActivity?.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                      <div className="mt-1">
                        {activity.type === 'post' && <MessageSquare className="h-5 w-5 text-blue-600" />}
                        {activity.type === 'comment' && <MessageCircle className="h-5 w-5 text-green-600" />}
                        {activity.type === 'trade' && <ShoppingBag className="h-5 w-5 text-purple-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-gray-500">{getTimeSince(activity.date)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="farm" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    {farmer.farmName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Farm Size</label>
                      <p className="text-2xl font-bold mt-1">{farmer.farmSize} {farmer.farmSizeUnit}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Total Trees</label>
                      <p className="text-2xl font-bold mt-1">{farmer.totalTrees}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-2">Main Varieties</label>
                    <div className="flex gap-2 flex-wrap">
                      {farmer.mainVarieties?.map((variety, i) => (
                        <Badge key={i} className="bg-green-100 text-green-700 border-green-300">
                          <TreePine className="h-3 w-3 mr-1" />
                          {variety}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Full Farm Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Farm Stats Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <TreePine className="h-10 w-10 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold">{farmer.totalTrees}</div>
                      <div className="text-sm text-gray-600">Active Trees</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <BarChart3 className="h-10 w-10 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold">~{Math.round(farmer.totalTrees! * 45)}kg</div>
                      <div className="text-sm text-gray-600">Est. Yearly Yield</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <ShoppingBag className="h-10 w-10 mx-auto mb-2 text-purple-600" />
                      <div className="text-2xl font-bold">5</div>
                      <div className="text-sm text-gray-600">Active Listings</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="posts">
              <Card>
                <CardHeader>
                  <CardTitle>All Posts by {farmer.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {posts
                      .filter(p => p.farmerId === farmer.id)
                      .map(post => {
                        const categoryConfig = POST_CATEGORY_CONFIG[post.category];
                        const CategoryIcon = categoryConfig.icon;
                        return (
                          <div key={post.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => openPostDetail(post)}>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className={`${categoryConfig.color} border`}>
                                <CategoryIcon className="h-3 w-3 mr-1" />
                                {categoryConfig.label}
                              </Badge>
                              <span className="text-sm text-gray-500">{getTimeSince(post.createdAt)}</span>
                            </div>
                            <h3 className="font-semibold mb-2">{post.title}</h3>
                            <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <ArrowUp className="h-4 w-4" />
                                {post.upvotes - post.downvotes}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-4 w-4" />
                                {post.commentsCount}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {farmer.verificationTier === 'basic' ? (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-600 mb-2">Contact information is only visible for verified farmers</p>
                      <Badge variant="outline" className="border-orange-400 text-orange-700">
                        Pending Verification
                      </Badge>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                        <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-gray-600">Email</div>
                          <div className="font-medium">{farmer.email}</div>
                        </div>
                      </div>
                      {farmer.phone && (
                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                          <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-gray-600">Phone</div>
                            <div className="font-medium">{farmer.phone}</div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-gray-600">Location</div>
                          <div className="font-medium">{farmer.location}</div>
                        </div>
                      </div>
                      <div className="pt-4 border-t">
                        <Button className="w-full">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send Message
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  };

  const PostCard = ({ post }: { post: CommunityPost }) => {
    const categoryConfig = POST_CATEGORY_CONFIG[post.category];
    const tierConfig = VERIFICATION_TIER_CONFIG[post.farmerTier];
    const CategoryIcon = categoryConfig.icon;
    const TierIcon = tierConfig.icon;
    const score = post.upvotes - post.downvotes;

    return (
      <Card className={`mb-3 overflow-hidden border hover:border-gray-400 transition-all ${
        post.isPinned ? 'border-green-400 bg-green-50/30' : ''
      } ${!post.isApproved ? 'border-orange-300 bg-orange-50/30' : ''}`}>
        <div className="flex">
          <div className="flex flex-col items-center bg-gray-50 p-2 w-16">
            <button
              onClick={() => handleVote(post.id, 'up')}
              className={`p-1 rounded hover:bg-gray-200 ${post.userVote === 'up' ? 'text-orange-600' : 'text-gray-400'}`}
            >
              <ArrowUp className="h-6 w-6" />
            </button>
            <span className={`font-bold text-sm my-1 ${score > 0 ? 'text-orange-600' : score < 0 ? 'text-blue-600' : 'text-gray-600'}`}>
              {score > 999 ? `${(score / 1000).toFixed(1)}k` : score}
            </span>
            <button
              onClick={() => handleVote(post.id, 'down')}
              className={`p-1 rounded hover:bg-gray-200 ${post.userVote === 'down' ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <ArrowDown className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 p-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap text-xs text-gray-600">
              <Badge variant="outline" className={`${categoryConfig.color} border`}>
                <CategoryIcon className="h-3 w-3 mr-1" />
                {categoryConfig.label}
              </Badge>
              
              {post.isPinned && (
                <Badge className="bg-green-600 text-white">
                  <Pin className="h-3 w-3 mr-1" />
                  Pinned
                </Badge>
              )}

              <div className="flex items-center gap-1">
                <span className="font-medium text-gray-900">r/MangoFarmers</span>
                <span>•</span>
                <span>Posted by</span>
                <button 
                  onClick={() => openFarmerProfile(post.farmerId)}
                  className="font-medium hover:underline text-blue-600"
                >
                {post.farmerName}
                </button>
                <TierIcon className={`h-3 w-3 ${tierConfig.color}`} />
                <span>•</span>
                <span>{getTimeSince(post.createdAt)}</span>
              </div>
            </div>

            <h2 
              onClick={() => openPostDetail(post)}
              className="text-lg font-semibold mb-2 hover:text-blue-600 cursor-pointer"
            >
              {post.title}
            </h2>

            <p className="text-sm text-gray-700 mb-3 line-clamp-3">
              {post.content}
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-600">
              <button 
                onClick={() => openPostDetail(post)}
                className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="font-medium">{post.commentsCount} Comments</span>
              </button>
              <button className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded">
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Main render
  if (viewFullProfile && selectedFarmer) {
    return <FullProfilePage farmer={selectedFarmer} />;
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">r/MangoFarmers</h1>
            <p className="text-gray-600">Community for mango farmers across the Philippines</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search r/MangoFarmers"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as PostCategory | 'all')}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(POST_CATEGORY_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)} className="w-full">
          <TabsList className="bg-white border">
            <TabsTrigger value="hot" className="flex items-center gap-1">
              <Flame className="h-4 w-4" />
              Hot
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              New
            </TabsTrigger>
            <TabsTrigger value="top" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Top
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-0">
        {filteredPosts.map((post) => <PostCard key={post.id} post={post} />)}
      </div>

      {selectedFarmer && <FarmerProfileModal farmer={selectedFarmer} />}
    </div>
  );
}