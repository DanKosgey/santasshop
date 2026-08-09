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
      <div className="py-20 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-0 animate-slide-up">
      {/* Page Header */}
      <div className="page-header">
        <h2 className="section-title">Platform Settings</h2>
        <p className="section-desc">Manage community social links and platform subscription pricing plans.</p>
      </div>

      {/* Community Links Section */}
      <div className="page-section">
        <div className="section-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="section-title">Community Links Management</h3>
            <p className="section-desc">Configure social links visible to students.</p>
          </div>
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
            className="btn btn-primary shrink-0"
          >
            <Plus className="h-4 w-4" /> New Link
          </button>
        </div>

        {/* Community Links Form Modal */}
        {showLinkForm && (
          <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
            <div className="modal-panel p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingLink ? 'Edit Community Link' : 'Create New Community Link'}
                </h3>
                <button
                  onClick={() => {
                    setShowLinkForm(false);
                    setEditingLink(null);
                  }}
                  className="btn btn-sm btn-ghost"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleLinkFormSubmit} className="space-y-4">
                {!editingLink && (
                  <div className="mb-4">
                    <label className="input-label">Select Platform Preset</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {COMMON_PLATFORMS.map(platform => (
                        <button
                          key={platform.key}
                          type="button"
                          onClick={() => handlePlatformSelect(platform.key)}
                          className={`p-2.5 rounded-lg border text-xs flex flex-col items-center justify-center transition-colors ${
                            linkFormData.platformKey === platform.key
                              ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div
                            className="w-5 h-5 rounded-full mb-1"
                            style={{ backgroundColor: platform.color }}
                          ></div>
                          <span className="truncate w-full text-center">{platform.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Platform Name</label>
                    <input
                      type="text"
                      name="platformName"
                      value={linkFormData.platformName}
                      onChange={handleLinkFormChange}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="input-label">Platform Key</label>
                    <input
                      type="text"
                      name="platformKey"
                      value={linkFormData.platformKey}
                      onChange={handleLinkFormChange}
                      className="input"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="input-label">Link URL</label>
                    <input
                      type="url"
                      name="linkUrl"
                      value={linkFormData.linkUrl}
                      onChange={handleLinkFormChange}
                      className="input"
                      required
                      placeholder="https://example.com/community"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="input-label">Description</label>
                    <textarea
                      name="description"
                      value={linkFormData.description}
                      onChange={handleLinkFormChange}
                      rows={3}
                      className="input"
                      placeholder="Describe this community platform..."
                    />
                  </div>

                  <div>
                    <label className="input-label">Icon Color</label>
                    <input
                      type="color"
                      name="iconColor"
                      value={linkFormData.iconColor}
                      onChange={handleLinkFormChange}
                      className="input h-10 p-1 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="input-label">Sort Order</label>
                    <input
                      type="number"
                      name="sortOrder"
                      value={linkFormData.sortOrder}
                      onChange={handleLinkFormChange}
                      className="input"
                      min="0"
                    />
                  </div>

                  <div className="flex items-center md:col-span-2 mt-2">
                    <input
                      type="checkbox"
                      id="isActiveLink"
                      name="isActive"
                      checked={linkFormData.isActive}
                      onChange={handleLinkFormChange}
                      className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <label htmlFor="isActiveLink" className="ml-2 text-sm text-slate-700 font-medium">Active (Visible to users)</label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLinkForm(false);
                      setEditingLink(null);
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingLink || isUpdatingLink}
                    className="btn btn-primary disabled:opacity-50"
                  >
                    {isCreatingLink || isUpdatingLink ? 'Processing...' : (editingLink ? 'Update Link' : 'Create Link')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Community Links Display Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {communityLinks.map(link => (
            <div
              key={link.id}
              className="content-card p-5 flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: link.iconColor }}></div>
                    <h4 className="font-bold text-slate-900 text-base truncate">{link.platformName}</h4>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingLink(link);
                        setShowLinkForm(true);
                      }}
                      className="btn btn-sm btn-ghost p-1.5"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4 text-blue-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCommunityLink(link.id, link.platformKey);
                      }}
                      className="btn btn-sm btn-ghost p-1.5 text-red-500 hover:text-red-700"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-blue-600 truncate mb-2">{link.linkUrl}</p>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{link.description}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className={link.isActive ? 'badge badge-success' : 'badge badge-danger'}>
                  {link.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-slate-400 font-medium">Sort Order: {link.sortOrder}</span>
              </div>
            </div>
          ))}
          {!communityLinks.length && (
            <div className="col-span-full content-card text-center py-12 text-slate-400 text-sm border-dashed">
              No community links created yet.
            </div>
          )}
        </div>
      </div>

      {/* Subscription Plans Section */}
      <div className="page-section">
        <div className="section-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="section-title">Subscription Tiers & Plans</h3>
            <p className="section-desc">Manage platform membership pricing and feature tiers.</p>
          </div>
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
            className="btn btn-primary shrink-0"
          >
            <Plus className="h-4 w-4" /> New Plan
          </button>
        </div>

        {/* Plan Form Modal */}
        {showPlanForm && (
          <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
            <div className="modal-panel p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
                </h3>
                <button
                  onClick={() => {
                    setShowPlanForm(false);
                    setEditingPlan(null);
                  }}
                  className="btn btn-sm btn-ghost"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handlePlanFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Plan Name</label>
                    <input
                      type="text"
                      name="name"
                      value={planFormData.name}
                      onChange={handlePlanFormChange}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="input-label">Price ($)</label>
                    <input
                      type="number"
                      name="price"
                      value={planFormData.price}
                      onChange={handlePlanFormChange}
                      className="input"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="input-label">Interval</label>
                    <select
                      name="interval"
                      value={planFormData.interval}
                      onChange={handlePlanFormChange}
                      className="input"
                    >
                      <option value="one-time">One Time</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label className="input-label">Sort Order</label>
                    <input
                      type="number"
                      name="sortOrder"
                      value={planFormData.sortOrder}
                      onChange={handlePlanFormChange}
                      className="input"
                      min="0"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="input-label">Description</label>
                    <textarea
                      name="description"
                      value={planFormData.description}
                      onChange={handlePlanFormChange}
                      rows={3}
                      className="input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="input-label">Features (one per line)</label>
                    <textarea
                      name="features"
                      value={planFormData.features}
                      onChange={handlePlanFormChange}
                      rows={4}
                      className="input"
                      placeholder="Access to courses&#10;Community chat&#10;Trade alerts"
                    />
                  </div>

                  <div className="flex items-center md:col-span-2 mt-2">
                    <input
                      type="checkbox"
                      id="isActivePlan"
                      name="isActive"
                      checked={planFormData.isActive}
                      onChange={handlePlanFormChange}
                      className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <label htmlFor="isActivePlan" className="ml-2 text-sm text-slate-700 font-medium">Active (Available for purchase)</label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlanForm(false);
                      setEditingPlan(null);
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingPlan || isUpdatingPlan}
                    className="btn btn-primary disabled:opacity-50"
                  >
                    {isCreatingPlan || isUpdatingPlan ? 'Processing...' : (editingPlan ? 'Update Plan' : 'Create Plan')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Subscription Plans Display Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div key={plan.id} className="content-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">{plan.name}</h4>
                    <p className="text-base font-extrabold text-blue-600 tabular-nums">${plan.price} <span className="text-xs text-slate-400 font-normal">/ {plan.interval}</span></p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingPlan(plan);
                        setShowPlanForm(true);
                      }}
                      className="btn btn-sm btn-ghost p-1.5"
                    >
                      <Edit2 className="h-4 w-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="btn btn-sm btn-ghost p-1.5 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{plan.description}</p>
                {plan.features?.length > 0 && (
                  <ul className="text-xs text-slate-600 mb-4 space-y-1.5">
                    {plan.features.slice(0, 3).map((f, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="text-emerald-500 font-bold">✓</span> {f}
                      </li>
                    ))}
                    {plan.features.length > 3 && (
                      <li className="text-slate-400 font-medium">+ {plan.features.length - 3} more features</li>
                    )}
                  </ul>
                )}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className={plan.isActive ? 'badge badge-success' : 'badge badge-danger'}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-slate-400 font-medium">Sort Order: {plan.sortOrder}</span>
              </div>
            </div>
          ))}
          {!plans.length && (
            <div className="col-span-full content-card text-center py-12 text-slate-400 text-sm border-dashed">
              No subscription plans created yet.
            </div>
          )}
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
};

export default SettingsTab;