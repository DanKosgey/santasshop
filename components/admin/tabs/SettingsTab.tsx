import React, { useState, useEffect } from 'react';
import { CommunityLink, SubscriptionPlan } from '../../../types';
import { useAdminPortal } from '../AdminPortalContext';
import { socialMediaService } from '../../../services/socialMediaService';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const SettingsTab: React.FC = () => {
  const { communityLinks, plans, loading, fetchCommunityLinks, fetchPlans } = useAdminPortal();
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingLink, setEditingLink] = useState<CommunityLink | null>(null);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  // Loading states
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [isUpdatingLink, setIsUpdatingLink] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

  // Form states
  const [linkFormData, setLinkFormData] = useState({
    platformName: '',
    platformKey: '',
    linkUrl: '',
    description: '',
    iconColor: '#000000',
    isActive: true,
    sortOrder: 0
  });

  const [planFormData, setPlanFormData] = useState({
    name: '',
    description: '',
    price: 0,
    interval: 'monthly' as 'one-time' | 'monthly' | 'yearly',
    features: '',
    isActive: true,
    sortOrder: 0
  });

  // Common social media platforms
  const COMMON_PLATFORMS = [
    { key: 'telegram', name: 'Telegram', color: '#229ED9', description: 'Join our main Telegram community for signals and discussions' },
    { key: 'whatsapp', name: 'WhatsApp', color: '#25D366', description: 'Connect with fellow traders on WhatsApp' },
    { key: 'discord', name: 'Discord', color: '#5865F2', description: 'Join our Discord server for community discussions' },
    { key: 'youtube', name: 'YouTube', color: '#FF0000', description: 'Watch our educational trading videos' },
    { key: 'instagram', name: 'Instagram', color: '#E1306C', description: 'Follow us on Instagram for behind the scenes content' },
    { key: 'twitter', name: 'Twitter', color: '#1DA1F2', description: 'Follow us on Twitter for market updates' },
    { key: 'tiktok', name: 'TikTok', color: '#000000', description: 'Follow us on TikTok for quick trading tips' },
    { key: 'facebook', name: 'Facebook', color: '#1877F2', description: 'Join our Facebook community' },
    { key: 'linkedin', name: 'LinkedIn', color: '#0A66C2', description: 'Connect with us on LinkedIn' },
    { key: 'reddit', name: 'Reddit', color: '#FF4500', description: 'Join our subreddit community' }
  ];

  useEffect(() => {
    // Data is already loaded in the context, but we can refresh it if needed
    fetchCommunityLinks();
    fetchPlans();
  }, [fetchCommunityLinks, fetchPlans]);

  const handleCreateCommunityLink = async (linkData: any) => {
    setIsCreatingLink(true);
    try {
      const newLink = await socialMediaService.createCommunityLink(linkData);
      if (newLink) {
        await fetchCommunityLinks(); // Refresh only the community links
        setShowLinkForm(false);
        alert('Community link created successfully.');
      } else {
        alert('Failed to create community link. Please try again.');
      }
    } catch (err: any) {
      console.error('Error creating community link:', err);
      if (err.code === '23505') {
        // Unique constraint violation
        alert('A community link with this platform key already exists. Please use a different platform key.');
      } else {
        alert('An error occurred while creating the community link: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleUpdateCommunityLink = async (id: string, updates: any) => {
    setIsUpdatingLink(true);
    try {
      const result = await socialMediaService.updateCommunityLink(id, updates);
      if (result) {
        await fetchCommunityLinks(); // Refresh only the community links
        setEditingLink(null);
        alert('Community link updated successfully.');
      } else {
        alert('Failed to update community link. Please try again.');
      }
    } catch (err: any) {
      console.error('Error updating community link:', err);
      if (err.code === '23505') {
        // Unique constraint violation
        alert('A community link with this platform key already exists. Please use a different platform key.');
      } else {
        alert('An error occurred while updating the community link: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setIsUpdatingLink(false);
    }
  };

  const handleDeleteCommunityLink = async (id: string, platformKey: string) => {
    try {
      const confirmed = window.confirm('Are you sure you want to delete this community link? This action cannot be undone.');
      if (confirmed) {
        console.log('Attempting to delete community link with ID:', id);
        const result = await socialMediaService.deleteCommunityLink(id);
        console.log('Delete result:', result);
        if (result) {
          await fetchCommunityLinks(); // Refresh only the community links
          alert('Community link deleted successfully.');
        } else {
          alert('Failed to delete community link. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('Error deleting community link:', err);
      alert('An error occurred while deleting the community link: ' + (err.message || 'Unknown error'));
    }
  };

  const handleCreatePlan = async (planData: any) => {
    setIsCreatingPlan(true);
    try {
      // Format features properly
      if (planData.features && typeof planData.features === 'string') {
        planData.features = planData.features.split('\n').filter((f: string) => f.trim());
      }
      
      const newPlan = await socialMediaService.createSubscriptionPlan(planData);
      if (newPlan) {
        await fetchPlans(); // Refresh only the subscription plans
        setShowPlanForm(false);
        alert('Subscription plan created successfully.');
      } else {
        alert('Failed to create subscription plan. Please try again.');
      }
    } catch (err) {
      console.error('Error creating subscription plan:', err);
      alert('An error occurred while creating the subscription plan.');
    } finally {
      setIsCreatingPlan(false);
    }
  };

  const handleUpdatePlan = async (id: string, updates: any) => {
    setIsUpdatingPlan(true);
    try {
      // Format features properly
      if (updates.features && typeof updates.features === 'string') {
        updates.features = updates.features.split('\n').filter((f: string) => f.trim());
      }
      
      const result = await socialMediaService.updateSubscriptionPlan(id, updates);
      if (result) {
        await fetchPlans(); // Refresh only the subscription plans
        setEditingPlan(null);
        alert('Subscription plan updated successfully.');
      } else {
        alert('Failed to update subscription plan. Please try again.');
      }
    } catch (err) {
      console.error('Error updating subscription plan:', err);
      alert('An error occurred while updating the subscription plan.');
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      const confirmed = window.confirm('Are you sure you want to delete this subscription plan? This action cannot be undone.');
      if (confirmed) {
        const result = await socialMediaService.deleteSubscriptionPlan(id);
        if (result) {
          await fetchPlans(); // Refresh only the subscription plans
          alert('Subscription plan deleted successfully.');
        } else {
          alert('Failed to delete subscription plan. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error deleting subscription plan:', err);
      alert('An error occurred while deleting the subscription plan.');
    }
  };

  // Handle form changes
  const handleLinkFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setLinkFormData(prev => ({ ...prev, [name]: val }));
  };

  // Handle platform selection
  const handlePlatformSelect = (platformKey: string) => {
    const platform = COMMON_PLATFORMS.find(p => p.key === platformKey);
    if (platform) {
      setLinkFormData(prev => ({
        ...prev,
        platformKey: platform.key,
        platformName: platform.name,
        iconColor: platform.color,
        description: platform.description
      }));
    }
  };

  const handlePlanFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setPlanFormData(prev => ({ ...prev, [name]: val }));
  };

  // Handle form submissions
  const handleLinkFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const linkData = {
        ...linkFormData
      };
      
      if (editingLink) {
        await handleUpdateCommunityLink(editingLink.id, linkData);
      } else {
        await handleCreateCommunityLink(linkData);
      }
      
      // Reset form
      setLinkFormData({
        platformName: '',
        platformKey: '',
        linkUrl: '',
        description: '',
        iconColor: '#000000',
        isActive: true,
        sortOrder: 0
      });
      setEditingLink(null);
      setShowLinkForm(false);
    } catch (err) {
      console.error('Error submitting link form:', err);
      alert('An error occurred while submitting the form.');
    }
  };

  const handlePlanFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const planData = {
        ...planFormData
      };
      
      if (editingPlan) {
        await handleUpdatePlan(editingPlan.id, planData);
      } else {
        await handleCreatePlan(planData);
      }
      
      // Reset form
      setPlanFormData({
        name: '',
        description: '',
        price: 0,
        interval: 'monthly',
        features: '',
        isActive: true,
        sortOrder: 0
      });
      setEditingPlan(null);
      setShowPlanForm(false);
    } catch (err) {
      console.error('Error submitting plan form:', err);
      alert('An error occurred while submitting the form.');
    }
  };

  // Set form data when editing
  useEffect(() => {
    if (editingLink) {
      setLinkFormData({
        platformName: editingLink.platformName || '',
        platformKey: editingLink.platformKey || '',
        linkUrl: editingLink.linkUrl || '',
        description: editingLink.description || '',
        iconColor: editingLink.iconColor || '#000000',
        isActive: editingLink.isActive ?? true,
        sortOrder: editingLink.sortOrder || 0
      });
    }
  }, [editingLink]);

  useEffect(() => {
    if (editingPlan) {
      setPlanFormData({
        name: editingPlan.name || '',
        description: editingPlan.description || '',
        price: editingPlan.price || 0,
        interval: editingPlan.interval || 'monthly',
        features: Array.isArray(editingPlan.features) ? editingPlan.features.join('\n') : '',
        isActive: editingPlan.isActive ?? true,
        sortOrder: editingPlan.sortOrder || 0
      });
    }
  }, [editingPlan]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-trade-neon"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Community Links Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-200">Community Links Management</h2>
          <button 
            onClick={() => {
              setEditingLink(null);
              setLinkFormData({
                platformName: '',
                platformKey: '',
                linkUrl: '',
                description: '',
                iconColor: '#000000',
                isActive: true,
                sortOrder: 0
              });
              setShowLinkForm(true);
            }} 
            className="flex items-center gap-2 px-5 py-3 bg-trade-neon text-black font-bold rounded-xl hover:bg-green-400 transition-colors"
          >
            <Plus className="h-5 w-5" /> New Link
          </button>
        </div>
        
        {/* Community Links Form Modal */}
        {showLinkForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {editingLink ? 'Edit Community Link' : 'Create New Community Link'}
                </h3>
                <button 
                  onClick={() => {
                    setShowLinkForm(false);
                    setEditingLink(null);
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              
              <form onSubmit={handleLinkFormSubmit} className="space-y-4">
                {!editingLink && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Select Platform</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {COMMON_PLATFORMS.map(platform => (
                        <button
                          key={platform.key}
                          type="button"
                          onClick={() => handlePlatformSelect(platform.key)}
                          className={`p-3 rounded-lg border text-xs flex flex-col items-center justify-center transition-colors ${
                            linkFormData.platformKey === platform.key
                              ? 'border-trade-neon bg-trade-neon/20'
                              : 'border-gray-600 bg-gray-700/50 hover:bg-gray-600/50'
                          }`}
                        >
                          <div 
                            className="w-6 h-6 rounded-full mb-1" 
                            style={{ backgroundColor: platform.color }}
                          ></div>
                          <span className="text-white truncate w-full">{platform.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Platform Name</label>
                    <input
                      type="text"
                      name="platformName"
                      value={linkFormData.platformName}
                      onChange={handleLinkFormChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-trade-neon"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Platform Key</label>
                    <input
                      type="text"
                      name="platformKey"
                      value={linkFormData.platformKey}
                      onChange={handleLinkFormChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-trade-neon"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Link URL</label>
                    <input
                      type="url"
                      name="linkUrl"
                      value={linkFormData.linkUrl}
                      onChange={handleLinkFormChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-trade-neon"
                      required
                      placeholder="https://example.com/community"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                      name="description"
                      value={linkFormData.description}
                      onChange={handleLinkFormChange}
                      rows={3}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-trade-neon"
                      placeholder="Describe this community platform..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Icon Color</label>
                    <input
                      type="color"
                      name="iconColor"
                      value={linkFormData.iconColor}
                      onChange={handleLinkFormChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-trade-neon"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Sort Order</label>
                    <input
                      type="number"
                      name="sortOrder"
                      value={linkFormData.sortOrder}
                      onChange={handleLinkFormChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-trade-neon"
                      min="0"
                    />
                  </div>
                  
                  <div className="flex items-center md:col-span-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={linkFormData.isActive}
                      onChange={handleLinkFormChange}
                      className="h-5 w-5 text-trade-neon rounded focus:ring-trade-neon"
                    />
                    <label className="ml-2 text-sm text-gray-300">Active (Visible to users)</label>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLinkForm(false);
                      setEditingLink(null);
                    }}
                    className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingLink || isUpdatingLink}
                    className="px-5 py-2.5 bg-trade-neon hover:bg-green-400 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingLink || isUpdatingLink ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      editingLink ? 'Update Link' : 'Create Link'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Community Links Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communityLinks.map(link => (
            <div 
              key={link.id} 
              className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3 flex-wrap">
                    <div className="w-6 h-6 rounded-full flex-shrink-0" style={{backgroundColor: link.iconColor}}></div>
                    <span className="truncate">{link.platformName}</span>
                  </h3>
                  <p className="text-gray-300 text-sm truncate max-w-xs mt-1">{link.linkUrl}</p>
                </div>
                <div className="flex gap-1 ml-2 flex-shrink-0">
                  <button 
                    onClick={() => {
                      console.log('Edit button clicked for link:', link);
                      setEditingLink(link);
                      setShowLinkForm(true);
                    }} 
                    className="p-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4 text-blue-400" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Delete button clicked for link:', link);
                      handleDeleteCommunityLink(link.id, link.platformKey);
                    }} 
                    className="p-2 bg-red-900/30 hover:bg-red-900/50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>
              <p className="text-gray-300 mb-4 text-sm line-clamp-3">{link.description}</p>
              <div className="flex items-center justify-between">
                <span className={`text-sm px-3 py-1 rounded-full ${link.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {link.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-sm text-gray-400">Order: {link.sortOrder}</span>
              </div>
            </div>
          ))}
          {!communityLinks.length && (
            <div className="col-span-full text-center py-16 bg-gray-800/50 border border-gray-700/50 border-dashed rounded-2xl">
              <p className="text-gray-400 text-lg">No community links created yet.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Subscription Plans Section */}
      <div className="space-y-6 pt-8 border-t border-gray-700/50">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-200">Subscription Plans Management</h2>
          <button 
            onClick={() => {
              setEditingPlan(null);
              setPlanFormData({
                name: '',
                description: '',
                price: 0,
                interval: 'monthly',
                features: '',
                isActive: true,
                sortOrder: 0
              });
              setShowPlanForm(true);
            }} 
            className="flex items-center gap-2 px-5 py-3 bg-trade-neon text-black font-bold rounded-xl hover:bg-green-400 transition-colors"
          >
            <Plus className="h-5 w-5" /> New Plan
          </button>
        </div>
        
        {/* Subscription Plan Form Modal */}
        {showPlanForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
                </h3>
                <button 
                  onClick={() => {
                    setShowPlanForm(false);
                    setEditingPlan(null);
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              
              <form onSubmit={handlePlanFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Plan Name</label>
                    <input
                      type="text"
                      name="name"
                      value={planFormData.name}
                      onChange={handlePlanFormChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-trade-neon"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Price ($)</label>
                    <input
                      type="number"
                      name="price"
                      value={planFormData.price}
                      onChange={handlePlanFormChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-trade-neon"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Interval</label>
                    <select
                      name="interval"
                      value={planFormData.interval}
                      onChange={handlePlanFormChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-trade-neon"
                    >
                      <option value="one-time">One Time</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Sort Order</label>
                    <input
                      type="number"
                      name="sortOrder"
                      value={planFormData.sortOrder}
                      onChange={handlePlanFormChange}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-trade-neon"
                      min="0"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                      name="description"
                      value={planFormData.description}
                      onChange={handlePlanFormChange}
                      rows={3}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-trade-neon"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Features (one per line)</label>
                    <textarea
                      name="features"
                      value={planFormData.features}
                      onChange={handlePlanFormChange}
                      rows={5}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-trade-neon"
                      placeholder="Enter one feature per line&#10;Example:&#10;- Access to premium content&#10;- Priority support&#10;- Advanced analytics"
                    />
                  </div>
                  
                  <div className="flex items-center md:col-span-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={planFormData.isActive}
                      onChange={handlePlanFormChange}
                      className="h-5 w-5 text-trade-neon rounded focus:ring-trade-neon"
                    />
                    <label className="ml-2 text-sm text-gray-300">Active</label>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlanForm(false);
                      setEditingPlan(null);
                    }}
                    className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingPlan || isUpdatingPlan}
                    className="px-5 py-2.5 bg-trade-neon hover:bg-green-400 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingPlan || isUpdatingPlan ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      editingPlan ? 'Update Plan' : 'Create Plan'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Subscription Plans Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.id} className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-gray-300 text-sm">${plan.price} / {plan.interval}</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setEditingPlan(plan);
                      setShowPlanForm(true);
                    }} 
                    className="p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl transition-colors"
                  >
                    <Edit2 className="h-5 w-5 text-blue-400" />
                  </button>
                  <button 
                    onClick={() => handleDeletePlan(plan.id)} 
                    className="p-3 bg-red-900/30 hover:bg-red-900/50 rounded-xl transition-colors"
                  >
                    <Trash2 className="h-5 w-5 text-red-400" />
                  </button>
                </div>
              </div>
              <p className="text-gray-300 mb-4 text-sm line-clamp-3">{plan.description}</p>
              {plan.features?.length > 0 && (
                <ul className="text-sm text-gray-300 mb-4 space-y-2">
                  {plan.features.slice(0, 3).map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-trade-neon">✓</span>{f}
                    </li>
                  ))}
                  {plan.features.length > 3 && (
                    <li className="text-gray-400">+ {plan.features.length - 3} more features</li>
                  )}
                </ul>
              )}
              <div className="flex items-center justify-between">
                <span className={`text-sm px-3 py-1 rounded-full ${plan.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-sm text-gray-400">Order: {plan.sortOrder}</span>
              </div>
            </div>
          ))}
          {!plans.length && (
            <div className="col-span-full text-center py-16 bg-gray-800/50 border border-gray-700/50 border-dashed rounded-2xl">
              <p className="text-gray-400 text-lg">No subscription plans created yet.</p>
            </div>
          )}
        </div>
      </div>
      {/* Loading Overlay */}
      {(isCreatingLink || isUpdatingLink || isCreatingPlan || isUpdatingPlan) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-8 flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-trade-neon"></div>
            <p className="text-white text-lg font-medium">Hang tight while we process your request...</p>
            <p className="text-gray-400 text-sm">This usually takes just a moment</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsTab;