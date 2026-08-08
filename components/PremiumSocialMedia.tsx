import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, TrendingUp, BarChart3, Send, Heart, MessageSquare, 
  Plus, Image, Search, Filter, MoreHorizontal, User, Lock, Zap
} from 'lucide-react';
import { StudentProfile } from '../types';
import { SocialPost as ServiceSocialPost, SocialComment as ServiceSocialComment } from '../services/socialMediaService';
import { socialMediaService } from '../services/socialMediaService';

interface PremiumSocialMediaProps {
  currentUser: StudentProfile;
  subscriptionTier: 'free' | 'foundation' | 'professional' | 'elite';
}

const PremiumSocialMedia: React.FC<PremiumSocialMediaProps> = ({ 
  currentUser,
  subscriptionTier 
}) => {
  const [posts, setPosts] = useState<ServiceSocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'discussions' | 'analysis' | 'signals'>('all');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    content: '',
    postType: 'discussion' as 'discussion' | 'chart_analysis' | 'signal' | 'question',
    chartImageUrl: '',
    pair: '',
    signalType: 'buy' as 'buy' | 'sell' | 'hold',
    confidenceLevel: 5
  });
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, ServiceSocialComment[]>>({});

  // Check if user has premium access
  const hasPremiumAccess = subscriptionTier === 'professional' || subscriptionTier === 'elite';

  // Fetch posts on component mount
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const fetchedPosts = await socialMediaService.getPosts();
      setPosts(fetchedPosts);
      
      // Fetch comments for each post
      const commentsData: Record<string, ServiceSocialComment[]> = {};
      for (const post of fetchedPosts) {
        const postComments = await socialMediaService.getComments(post.id);
        commentsData[post.id] = postComments;
      }
      setComments(commentsData);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.content.trim()) return;
    
    try {
      const post = await socialMediaService.createPost({
        userId: currentUser.id,
        content: newPost.content,
        postType: newPost.postType,
        chartImageUrl: newPost.chartImageUrl || undefined,
        pair: newPost.pair || undefined,
        signalType: newPost.signalType,
        confidenceLevel: newPost.confidenceLevel
      });
      
      if (post) {
        // Add default values for missing properties
        const newPostWithDefaults = {
          ...post,
          userName: currentUser.name,
          userTier: subscriptionTier,
          likesCount: 0,
          commentsCount: 0,
          isLiked: false
        };
        
        setPosts([newPostWithDefaults, ...posts]);
        setNewPost({
          content: '',
          postType: 'discussion',
          chartImageUrl: '',
          pair: '',
          signalType: 'buy',
          confidenceLevel: 5
        });
        setShowCreatePost(false);
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post. Please try again.');
    }
  };

  const handleLikePost = async (postId: string) => {
    // Implementation for liking posts
    console.log('Like post:', postId);
  };

  const handleAddComment = async (postId: string, content: string) => {
    if (!content.trim()) return;
    
    try {
      // Create comment with additional user info for display
      const comment = await socialMediaService.createComment({
        postId,
        userId: currentUser.id,
        content
      });
      
      if (comment) {
        // Add user info to the comment for display
        const commentWithUserInfo = {
          ...comment,
          userName: currentUser.name,
          userTier: subscriptionTier
        };
        
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), commentWithUserInfo]
        }));
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment. Please try again.');
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'all') return true;
    if (activeTab === 'discussions') return post.postType === 'discussion' || post.postType === 'question';
    if (activeTab === 'analysis') return post.postType === 'chart_analysis';
    if (activeTab === 'signals') return post.postType === 'signal';
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-trade-neon"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
        <p className="text-red-200">{error}</p>
        <button 
          onClick={fetchPosts} 
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="text-white pb-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <MessageCircle className="h-6 w-6 md:h-8 md:w-8 text-trade-neon" /> 
            Premium Social Hub
          </h1>
          <p className="text-gray-400 mt-1">
            Connect with fellow traders, share insights, and get real-time signals
          </p>
        </div>
        
        {!hasPremiumAccess ? (
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-300 flex items-center gap-2">
              <Lock className="h-4 w-4" /> 
              Upgrade to Professional or Elite for full access
            </p>
          </div>
        ) : (
          <button
            onClick={() => setShowCreatePost(true)}
            className="flex items-center gap-2 px-4 py-2 bg-trade-neon text-black font-bold rounded-lg hover:bg-green-400 transition"
          >
            <Plus className="h-4 w-4" /> New Post
          </button>
        )}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            className="bg-trade-dark border border-gray-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-lg">Create New Post</h3>
              <button 
                onClick={() => setShowCreatePost(false)}
                className="text-gray-400 hover:text-white"
              >
                <MoreHorizontal className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex gap-2 border-b border-gray-700 pb-2">
                {(['discussion', 'chart_analysis', 'signal', 'question'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setNewPost({...newPost, postType: type})}
                    className={`px-3 py-1 text-xs rounded-full ${
                      newPost.postType === type 
                        ? 'bg-trade-neon text-black font-bold' 
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {type === 'discussion' && 'Discussion'}
                    {type === 'chart_analysis' && 'Chart Analysis'}
                    {type === 'signal' && 'Signal'}
                    {type === 'question' && 'Question'}
                  </button>
                ))}
              </div>
              
              <textarea
                value={newPost.content}
                onChange={e => setNewPost({...newPost, content: e.target.value})}
                placeholder="What would you like to share with the community?"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-trade-neon outline-none h-32 resize-none"
              />
              
              {newPost.postType === 'chart_analysis' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPost.chartImageUrl}
                      onChange={e => setNewPost({...newPost, chartImageUrl: e.target.value})}
                      placeholder="Chart image URL (optional)"
                      className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-white focus:border-trade-neon outline-none text-sm"
                    />
                    <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg">
                      <Image className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {newPost.postType === 'signal' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newPost.pair}
                      onChange={e => setNewPost({...newPost, pair: e.target.value})}
                      placeholder="Trading pair (e.g. EURUSD)"
                      className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-white focus:border-trade-neon outline-none text-sm"
                    />
                    <select
                      value={newPost.signalType}
                      onChange={e => setNewPost({...newPost, signalType: e.target.value as any})}
                      className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-white focus:border-trade-neon outline-none text-sm"
                    >
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                      <option value="hold">Hold</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Confidence Level</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={newPost.confidenceLevel}
                        onChange={e => setNewPost({...newPost, confidenceLevel: parseInt(e.target.value)})}
                        className="flex-1"
                      />
                      <span className="text-sm w-8">{newPost.confidenceLevel}/10</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setShowCreatePost(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                disabled={!newPost.content.trim()}
                className="px-4 py-2 bg-trade-neon text-black font-bold rounded-lg hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 min-h-[40px] bg-gray-900/50 p-2 rounded-lg border border-gray-700">
        {[
          { id: 'all', label: 'All Posts', icon: MessageCircle },
          { id: 'discussions', label: 'Discussions', icon: MessageSquare },
          { id: 'analysis', label: 'Chart Analysis', icon: BarChart3 },
          { id: 'signals', label: 'Signals', icon: TrendingUp },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-gray-700 text-white shadow-lg ring-1 ring-gray-600' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="h-4 w-4" /> 
              <span className={activeTab === tab.id ? "underline decoration-trade-neon decoration-2 underline-offset-4" : ""}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-400 mb-2">No posts yet</h3>
            <p className="text-gray-500">Be the first to share something with the community!</p>
          </div>
        ) : (
          filteredPosts.map(post => (
            <div key={post.id} className="bg-trade-dark border border-gray-700 rounded-xl p-5">
              {/* Post Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-trade-neon to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {post.userName ? post.userName.charAt(0) : 'U'}
                  </div>
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      {post.userName || 'Unknown User'}
                      {post.userTier !== 'free' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          post.userTier === 'professional' 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {post.userTier === 'professional' ? 'Pro' : 'Elite'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <button className="text-gray-500 hover:text-white">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>
              
              {/* Post Content */}
              <div className="mb-4">
                <p className="text-gray-200 whitespace-pre-wrap">{post.content}</p>
                
                {post.postType === 'chart_analysis' && post.chartImageUrl && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-gray-700">
                    <img 
                      src={post.chartImageUrl} 
                      alt="Chart analysis" 
                      className="w-full h-auto object-contain"
                    />
                  </div>
                )}
                
                {post.postType === 'signal' && (
                  <div className="mt-3 p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="font-bold">
                        {post.pair || 'Trading Pair'}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-bold ${
                        post.signalType === 'buy' 
                          ? 'bg-green-500/20 text-green-400' 
                          : post.signalType === 'sell' 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {post.signalType?.toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-400">Confidence:</span>
                      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-trade-neon rounded-full" 
                          style={{ width: `${(post.confidenceLevel || 0) * 10}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-400 w-8">
                        {post.confidenceLevel || 0}/10
                      </span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Post Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => handleLikePost(post.id)}
                    className={`flex items-center gap-1 text-sm ${
                      post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                    <span>{post.likesCount || 0}</span>
                  </button>
                  
                  <button 
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-white"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>{post.commentsCount || 0}</span>
                  </button>
                </div>
                
                <div className="text-xs px-2 py-1 bg-gray-800 rounded-full">
                  {post.postType === 'discussion' && 'Discussion'}
                  {post.postType === 'chart_analysis' && 'Chart Analysis'}
                  {post.postType === 'signal' && 'Signal'}
                  {post.postType === 'question' && 'Question'}
                </div>
              </div>
              
              {/* Comments Section */}
              {expandedComments[post.id] && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  {/* Add Comment */}
                  <div className="flex gap-2 mb-3">
                    <div className="h-8 w-8 bg-gradient-to-br from-trade-neon to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                    </div>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 text-white focus:border-trade-neon outline-none text-sm"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const target = e.target as HTMLInputElement;
                            handleAddComment(post.id, target.value);
                            target.value = '';
                          }
                        }}
                      />
                      <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg">
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Comments List */}
                  <div className="space-y-3">
                    {(comments[post.id] || []).map(comment => (
                      <div key={comment.id} className="flex gap-2">
                        <div className="h-8 w-8 bg-gradient-to-br from-trade-neon to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {comment.userName ? comment.userName.charAt(0) : 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="bg-gray-900/50 rounded-lg p-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-sm">{comment.userName || 'Unknown User'}</span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PremiumSocialMedia;