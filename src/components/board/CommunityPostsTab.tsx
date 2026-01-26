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
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  MoreVertical,
  Pin,
  PinOff,
  Check,
  Trash2,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Clock,
  AlertTriangle,
  TrendingUp,
  FileText,
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
  Calendar,
} from 'lucide-react';

// Mock data types
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

const POST_CATEGORY_CONFIG = {
  experience: { label: 'Experience', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: User },
  disease_alert: { label: 'Disease Alert', color: 'bg-red-100 text-red-700 border-red-300', icon: AlertTriangle },
  market_info: { label: 'Market Info', color: 'bg-green-100 text-green-700 border-green-300', icon: TrendingUp },
  general: { label: 'Discussion', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: MessageCircle },
  announcement: { label: 'Announcement', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: Megaphone },
};

const VERIFICATION_TIER_CONFIG = {
  basic: { label: 'New Farmer', color: 'text-gray-600', icon: User },
  verified: { label: 'Verified', color: 'text-blue-600', icon: Check },
  trusted: { label: 'Trusted', color: 'text-amber-600', icon: Award },
};

// Mock posts
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
    farmerName: 'Maria Santos',
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
  {
    id: '4',
    farmerId: 'admin-1',
    farmerName: 'MangoChase Admin',
    farmerTier: 'trusted',
    title: '📢 New fertilizer subsidy program for registered farmers',
    content: 'Great news everyone! The Department of Agriculture has announced a new fertilizer subsidy program.\n\n✅ All verified farmers can apply starting next week\n✅ Up to 50% subsidy on organic fertilizers\n✅ Application forms available at local DA offices\n\nWe\'ll share more details as they become available. Stay tuned!',
    category: 'announcement',
    isPinned: true,
    isApproved: true,
    upvotes: 892,
    downvotes: 15,
    commentsCount: 156,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    userVote: 'up',
  },
  {
    id: '5',
    farmerId: 'farmer-4',
    farmerName: 'Ana Gonzales',
    farmerTier: 'verified',
    title: 'Has anyone tried neem oil for mango hoppers?',
    content: 'I\'m looking to switch to organic pest control methods. Has anyone had success using neem oil against mango hoppers?\n\nI\'ve heard mixed reviews and would love to hear from someone with first-hand experience before investing in it.',
    category: 'general',
    isPinned: false,
    isApproved: true,
    upvotes: 78,
    downvotes: 3,
    commentsCount: 42,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    userVote: null,
  },
  {
    id: '6',
    farmerId: 'farmer-5',
    farmerName: 'Roberto Lim',
    farmerTier: 'basic',
    title: 'Powdery mildew spreading in our barangay - need advice',
    content: 'Several trees in our area showing white powder on leaves. This is my first time dealing with this.\n\nIs this powdery mildew? What should I do? Any affordable treatments?',
    category: 'disease_alert',
    isPinned: false,
    isApproved: false,
    upvotes: 23,
    downvotes: 1,
    commentsCount: 8,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    userVote: null,
  },
];

// Mock comments
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
  {
    id: 'c2',
    postId,
    userId: 'user2',
    userName: 'Elena Ramos',
    userTier: 'basic',
    content: 'Thanks for sharing your experience! This is exactly what newcomers like me need.',
    upvotes: 28,
    downvotes: 0,
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
  },
];

export default function RedditStyleBoard() {
  const [posts, setPosts] = useState<CommunityPost[]>(generateMockPosts());
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<PostCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('hot');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Create post state
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
        // Remove vote
        if (voteType === 'up') newUpvotes--;
        else newDownvotes--;
        newUserVote = null;
      } else if (currentVote) {
        // Change vote
        if (currentVote === 'up') {
          newUpvotes--;
          newDownvotes++;
        } else {
          newDownvotes--;
          newUpvotes++;
        }
      } else {
        // New vote
        if (voteType === 'up') newUpvotes++;
        else newDownvotes++;
      }

      return { ...post, upvotes: newUpvotes, downvotes: newDownvotes, userVote: newUserVote };
    }));
  };

  const handleCommentVote = (commentId: string, voteType: 'up' | 'down') => {
    setComments(comments.map(comment => {
      if (comment.id !== commentId) return comment;
      
      const currentVote = comment.userVote;
      let newUpvotes = comment.upvotes;
      let newDownvotes = comment.downvotes;
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

      return { ...comment, upvotes: newUpvotes, downvotes: newDownvotes, userVote: newUserVote };
    }));
  };

  const openPostDetail = (post: CommunityPost) => {
    setSelectedPost(post);
    setComments(generateMockComments(post.id));
  };

  const handleCreatePost = () => {
    const post: CommunityPost = {
      id: Date.now().toString(),
      farmerId: 'current-user',
      farmerName: 'You',
      farmerTier: 'verified',
      title: newPost.title,
      content: newPost.content,
      category: newPost.category,
      isPinned: false,
      isApproved: false,
      upvotes: 1,
      downvotes: 0,
      commentsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      userVote: 'up',
    };
    setPosts([post, ...posts]);
    setNewPost({ title: '', content: '', category: 'general' });
    setShowCreatePost(false);
  };

  const handleAddComment = () => {
    if (!selectedPost || !newComment.trim()) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      postId: selectedPost.id,
      userId: 'current-user',
      userName: 'You',
      userTier: 'verified',
      content: newComment,
      upvotes: 1,
      downvotes: 0,
      createdAt: new Date(),
      userVote: 'up',
    };
    setComments([comment, ...comments]);
    setNewComment('');
    setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, commentsCount: p.commentsCount + 1 } : p));
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
          {/* Vote Section */}
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

          {/* Content Section */}
          <div className="flex-1 p-4">
            {/* Header */}
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
              
              {!post.isApproved && (
                <Badge variant="outline" className="border-orange-400 text-orange-700">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              )}

              <div className="flex items-center gap-1">
                <span className="font-medium text-gray-900">r/MangoFarmers</span>
                <span>•</span>
                <span>Posted by</span>
                <span className="font-medium hover:underline cursor-pointer">u/{post.farmerName}</span>
                <TierIcon className={`h-3 w-3 ${tierConfig.color}`} />
                <span>•</span>
                <span>{getTimeSince(post.createdAt)}</span>
              </div>
            </div>

            {/* Title */}
            <h2 
              onClick={() => openPostDetail(post)}
              className="text-lg font-semibold mb-2 hover:text-blue-600 cursor-pointer"
            >
              {post.title}
            </h2>

            {/* Content Preview */}
            <p className="text-sm text-gray-700 mb-3 line-clamp-3">
              {post.content}
            </p>

            {/* Actions */}
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
              <button className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded">
                <Bookmark className="h-4 w-4" />
                <span>Save</span>
              </button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded ml-auto">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!post.isApproved && (
                    <DropdownMenuItem>
                      <Check className="mr-2 h-4 w-4 text-green-600" />
                      Approve Post
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    {post.isPinned ? (
                      <><PinOff className="mr-2 h-4 w-4" /> Unpin</>
                    ) : (
                      <><Pin className="mr-2 h-4 w-4" /> Pin</>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Flag className="mr-2 h-4 w-4" />
                    Report
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const CommentCard = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const tierConfig = VERIFICATION_TIER_CONFIG[comment.userTier];
    const TierIcon = tierConfig.icon;
    const score = comment.upvotes - comment.downvotes;

    return (
      <div className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
        <div className="flex gap-2 mb-3">
          {/* Vote buttons */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => handleCommentVote(comment.id, 'up')}
              className={`p-0.5 rounded hover:bg-gray-100 ${comment.userVote === 'up' ? 'text-orange-600' : 'text-gray-400'}`}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <span className={`text-xs font-bold ${score > 0 ? 'text-orange-600' : score < 0 ? 'text-blue-600' : 'text-gray-600'}`}>
              {score}
            </span>
            <button
              onClick={() => handleCommentVote(comment.id, 'down')}
              className={`p-0.5 rounded hover:bg-gray-100 ${comment.userVote === 'down' ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>

          {/* Comment content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 text-xs">
              <span className="font-medium hover:underline cursor-pointer">u/{comment.userName}</span>
              <TierIcon className={`h-3 w-3 ${tierConfig.color}`} />
              <span className="text-gray-500">•</span>
              <span className="text-gray-500">{getTimeSince(comment.createdAt)}</span>
            </div>
            <p className="text-sm mb-2">{comment.content}</p>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <button 
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="hover:bg-gray-100 px-2 py-0.5 rounded font-medium"
              >
                Reply
              </button>
              <button className="hover:bg-gray-100 px-2 py-0.5 rounded">Share</button>
              <button className="hover:bg-gray-100 px-2 py-0.5 rounded">Report</button>
            </div>

            {/* Reply box */}
            {replyingTo === comment.id && (
              <div className="mt-3 flex gap-2">
                <Textarea
                  placeholder="What are your thoughts?"
                  className="text-sm"
                  rows={3}
                />
                <div className="flex flex-col gap-1">
                  <Button size="sm" className="h-8">
                    <Send className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8"
                    onClick={() => setReplyingTo(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Nested replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 space-y-3">
                {comment.replies.map(reply => (
                  <CommentCard key={reply.id} comment={reply} isReply={true} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">r/MangoFarmers</h1>
            <p className="text-gray-600">Community for mango farmers across the Philippines</p>
          </div>
          <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Edit className="mr-2 h-4 w-4" />
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create a post</DialogTitle>
                <DialogDescription>Share your knowledge with the community</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={newPost.category} onValueChange={(v) => setNewPost({ ...newPost, category: v as PostCategory })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(POST_CATEGORY_CONFIG).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Title"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                />
                <Textarea
                  placeholder="Text (optional)"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  rows={8}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreatePost(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreatePost}
                  disabled={!newPost.title.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Post
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
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

        {/* Sort Tabs */}
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
            <TabsTrigger value="controversial" className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Controversial
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Posts List */}
      <div className="space-y-0">
        {filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageCircle className="mb-4 h-12 w-12 text-gray-300" />
              <p className="text-lg font-medium text-gray-600">No posts found</p>
              <p className="text-sm text-gray-500">Try adjusting your filters or create a new post</p>
            </CardContent>
          </Card>
        ) : (
          filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>

      {/* Post Detail Dialog */}
      <Dialog open={selectedPost !== null} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedPost && (
            <div>
              {/* Post Header */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3 text-xs text-gray-600">
                  <Badge variant="outline" className={`${POST_CATEGORY_CONFIG[selectedPost.category].color} border`}>
                    {(() => {
                      const Icon = POST_CATEGORY_CONFIG[selectedPost.category].icon;
                      return <Icon className="h-3 w-3 mr-1" />;
                    })()}
                    {POST_CATEGORY_CONFIG[selectedPost.category].label}
                  </Badge>
                  
                  {selectedPost.isPinned && (
                    <Badge className="bg-green-600 text-white">
                      <Pin className="h-3 w-3 mr-1" />
                      Pinned
                    </Badge>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <span className="font-medium hover:underline cursor-pointer">u/{selectedPost.farmerName}</span>
                    {(() => {
                      const TierIcon = VERIFICATION_TIER_CONFIG[selectedPost.farmerTier].icon;
                      return <TierIcon className={`h-3 w-3 ${VERIFICATION_TIER_CONFIG[selectedPost.farmerTier].color}`} />;
                    })()}
                    <span>•</span>
                    <span>{getTimeSince(selectedPost.createdAt)}</span>
                  </div>
                </div>

                <h1 className="text-2xl font-bold mb-3">{selectedPost.title}</h1>
                <p className="text-gray-700 whitespace-pre-wrap mb-4">{selectedPost.content}</p>

                {/* Post Actions */}
                <div className="flex items-center gap-4 pb-4 border-b">
                  <div className="flex items-center bg-gray-100 rounded-full">
                    <button
                      onClick={() => handleVote(selectedPost.id, 'up')}
                      className={`p-2 rounded-l-full hover:bg-gray-200 ${selectedPost.userVote === 'up' ? 'text-orange-600' : 'text-gray-400'}`}
                    >
                      <ArrowUp className="h-5 w-5" />
                    </button>
                    <span className={`px-3 font-bold text-sm ${(selectedPost.upvotes - selectedPost.downvotes) > 0 ? 'text-orange-600' : (selectedPost.upvotes - selectedPost.downvotes) < 0 ? 'text-blue-600' : 'text-gray-600'}`}>
                      {selectedPost.upvotes - selectedPost.downvotes}
                    </span>
                    <button
                      onClick={() => handleVote(selectedPost.id, 'down')}
                      className={`p-2 rounded-r-full hover:bg-gray-200 ${selectedPost.userVote === 'down' ? 'text-blue-600' : 'text-gray-400'}`}
                    >
                      <ArrowDown className="h-5 w-5" />
                    </button>
                  </div>

                  <button className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded text-sm">
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                  <button className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded text-sm">
                    <Bookmark className="h-4 w-4" />
                    Save
                  </button>
                </div>
              </div>

              {/* Comment Input */}
              <div className="mb-6">
                <div className="text-sm text-gray-600 mb-2">
                  Comment as <span className="text-blue-600 font-medium">You</span>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="What are your thoughts?"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={4}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="bg-blue-600 hover:bg-blue-700 h-fit"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Comments Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">
                    {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
                  </h3>
                  <Select defaultValue="best">
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="best">Best</SelectItem>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="old">Old</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No comments yet</p>
                      <p className="text-sm">Be the first to share what you think!</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <CommentCard key={comment.id} comment={comment} />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}