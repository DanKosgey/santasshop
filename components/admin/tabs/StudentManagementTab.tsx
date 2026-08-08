import React, { useState, useMemo } from 'react';
import { useAdminPortal } from '../AdminPortalContext';
import { fetchBotAssets, uploadBotAsset, deleteBotAsset } from '../../../services/adminService';
import { BotAsset, StudentProfile } from '../../../types';
import {
  Users, Search, Filter, Edit2, Trash2, Save, X, AlertTriangle, CheckCircle, Cpu as Bot, Lock, Clock, CheckCircle2, Sparkles
} from 'lucide-react';

const StudentManagementTab: React.FC = () => {
  const { students, trades, refreshData, updateStudentProfile, deleteStudentProfile } = useAdminPortal();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editedStudent, setEditedStudent] = useState<Partial<StudentProfile> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [assets, setAssets] = useState<BotAsset[]>([]);
  const [assetLoading, setAssetLoading] = useState(false);

  // Fetch bot assets on mount
  React.useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setAssetLoading(true);
      const data = await fetchBotAssets();
      setAssets(data);
    } finally {
      setAssetLoading(false);
    }
  };

  const handleUploadClick = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        setLoading(true);
        await uploadBotAsset(file, { name: file.name, type: 'mql5' });
        setSuccess('File uploaded successfully!');
        loadAssets();
      } catch (err) {
        setError('Upload failed. Storage bucket may not be ready.');
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  const handleDeleteAsset = async (id: string, url: string) => {
    if (!window.confirm('Delete this asset?')) return;
    try {
      setAssetLoading(true);
      await deleteBotAsset(id, url);
      setSuccess('Asset deleted.');
      loadAssets();
    } finally {
      setAssetLoading(false);
    }
  };

  // Enhance student data with trade information
  const enhancedStudents = useMemo(() => {
    return students.map(student => {
      // Find trades for this student
      const studentTrades = trades.filter(trade => trade.studentId === student.id);

      // Calculate additional trade stats
      const totalTrades = studentTrades.length;
      const wins = studentTrades.filter(t => t.status === 'win').length;
      const losses = studentTrades.filter(t => t.status === 'loss').length;
      const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
      const totalPnL = studentTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);

      return {
        ...student,
        stats: {
          ...student.stats,
          tradesCount: totalTrades,
          winRate,
          totalPnL
        },
        recentTrades: studentTrades.slice(0, 3) // Last 3 trades
      };
    });
  }, [students, trades]);

  // Transform StudentProfile data to match the table structure
  const tableData = enhancedStudents.map(student => ({
    id: student.id,
    name: student.name || 'Unknown',
    email: student.email || '',
    tier: student.tier || 'free',
    status: student.status || 'inactive',
    joinDate: student.joinedDate || '',
    trades: student.stats?.tradesCount || 0,
    winRate: `${student.stats?.winRate || 0}%`,
    totalPnL: student.stats?.totalPnL || 0,
    avgRiskReward: student.stats?.avgRiskReward || 0,
    recentTrades: student.recentTrades || [],
    botAccess: student.botAccess || false
  }));

  const filteredStudents = tableData.filter(student =>
    (student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.tier.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterTier === 'all' || student.tier === filterTier)
  );

  const handleEditClick = (student: any) => {
    setEditingStudentId(student.id);
    setEditedStudent({
      id: student.id,
      name: student.name,
      email: student.email,
      tier: student.tier,
      status: student.status,
      botAccess: student.botAccess
    });
  };

  const handleSaveEdit = async () => {
    if (!editedStudent || !editingStudentId) return;

    try {
      setLoading(true);
      setError(null);

      // Update the profile in the database
      await updateStudentProfile(editingStudentId, {
        name: editedStudent.name,
        email: editedStudent.email,
        tier: editedStudent.tier,
        botAccess: editedStudent.botAccess,
        // Sync purchase status: if granting access, mark as completed; if denying, mark as none (unless pending)
        botPurchaseStatus: editedStudent.botAccess ? 'completed' : 'none'
      });

      // Reset editing state
      setEditingStudentId(null);
      setEditedStudent(null);
      setSuccess('Student profile updated successfully!');

      // We do NOT refreshData() here because updateStudentProfile already 
      // performs an optimistic update, and a refresh might revert the UI
      // if the backend RPC hasn't been updated yet.

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating student profile:', err);
      // Provide more specific error messages
      if (err.message && err.message.includes('No profile found')) {
        setError('Student profile not found. The user may have been deleted.');
      } else if (err.code === '403' || (err.message && err.message.includes('permission'))) {
        setError('Permission denied. You may not have access to modify this profile.');
      } else {
        setError('Failed to update student profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${studentName}'s profile? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Delete the profile from the database
      await deleteStudentProfile(studentId);

      setSuccess('Student profile deleted successfully!');

      // Refresh the data
      await refreshData();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting student profile:', err);
      // Provide more specific error messages
      if (err.code === '403' || (err.message && err.message.includes('permission'))) {
        setError('Permission denied. You may not have access to delete this profile.');
      } else {
        setError('Failed to delete student profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickGrant = async (student: StudentProfile) => {
    try {
      setLoading(true);
      setError(null);

      const updates = {
        botAccess: true,
        botPurchaseStatus: 'completed' as const,
        // If they are free or pending, bump them to Foundation at least
        tier: (student.tier === 'free' || student.tier.includes('-pending')) ? 'foundation' : student.tier
      };

      await updateStudentProfile(student.id, updates);
      setSuccess(`Quick Granted bot access to ${student.name}!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Quick Grant error:', err);
      setError('Failed to perform Quick Grant.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingStudentId(null);
    setEditedStudent(null);
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'elite': return 'bg-purple-500/20 text-purple-400';
      case 'professional': return 'bg-blue-500/20 text-blue-400';
      case 'foundation': return 'bg-green-500/20 text-green-400';
      case 'free': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'at-risk': return 'bg-yellow-500/20 text-yellow-400';
      case 'inactive': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-trade-neon to-blue-400">Student Management</h2>
        <p className="text-gray-400">Manage student profiles, subscription tiers, and accounts</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <span className="text-green-400">{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <span className="text-red-400">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Student List Section */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-trade-neon focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            value={filterTier}
            onChange={e => setFilterTier(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-trade-neon outline-none"
          >
            <option value="all">All Tiers</option>
            <option value="elite">Elite</option>
            <option value="professional">Professional</option>
            <option value="foundation">Foundation</option>
            <option value="free">Free</option>
          </select>
        </div>

        <div className="overflow-x-auto no-scrollbar pb-4">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700/50">
                <th className="pb-4 font-medium">Student</th>
                <th className="pb-4 font-medium">Tier</th>
                <th className="pb-4 font-medium text-center">Bot Access</th>
                <th className="pb-4 font-medium">Status</th>
                <th className="pb-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-900/50 transition-colors">
                  {editingStudentId === student.id ? (
                    <>
                      <td className="py-4">
                        <input
                          type="text"
                          value={editedStudent?.name || ''}
                          onChange={(e) => setEditedStudent({ ...editedStudent, name: e.target.value })}
                          className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white"
                        />
                      </td>
                      <td className="py-4">
                        <select
                          value={editedStudent?.tier || student.tier}
                          onChange={(e) => setEditedStudent({ ...editedStudent, tier: e.target.value as any })}
                          className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white"
                        >
                          <option value="free">Free</option>
                          <option value="foundation">Foundation</option>
                          <option value="professional">Professional</option>
                          <option value="elite">Elite</option>
                        </select>
                      </td>
                      <td className="py-4 text-center">
                        <button
                          onClick={() => setEditedStudent({ ...editedStudent, botAccess: !editedStudent?.botAccess })}
                          className={`flex items-center gap-2 mx-auto px-3 py-1.5 rounded-lg border transition-all ${editedStudent?.botAccess
                            ? 'bg-trade-neon/20 border-trade-neon/50 text-trade-neon'
                            : 'bg-gray-800 border-gray-700 text-gray-500'
                            }`}
                        >
                          {editedStudent?.botAccess ? <CheckCircle2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            {editedStudent?.botAccess ? 'Granted' : 'Locked'}
                          </span>
                        </button>
                      </td>
                      <td className="py-4">
                        <span className={`text-xs font-bold uppercase px-3 py-1 rounded ${getStatusColor(student.status)}`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <button onClick={handleSaveEdit} className="p-2 bg-green-600 rounded-lg"><Save className="h-4 w-4" /></button>
                          <button onClick={handleCancelEdit} className="p-2 bg-gray-600 rounded-lg"><X className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-white">{student.name}</span>
                          <span className="text-xs text-gray-500">{student.email}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`text-xs font-bold uppercase px-3 py-1 rounded ${getTierColor(student.tier)}`}>
                          {student.tier}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        {student.botPurchaseStatus === 'pending' ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 animate-pulse">
                            <Clock className="h-3 w-3" />
                            <span className="text-[10px] font-black uppercase tracking-tighter">Pending</span>
                          </div>
                        ) : student.botAccess ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-trade-neon/10 border border-trade-neon/20 text-trade-neon">
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="text-[10px] font-black uppercase tracking-tighter">Granted</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-500">
                            <Lock className="h-3 w-3" />
                            <span className="text-[10px] font-black uppercase tracking-tighter">Locked</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4">
                        <span className={`text-xs font-bold uppercase px-3 py-1 rounded ${getStatusColor(student.status)}`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          {(!student.botAccess || student.botPurchaseStatus === 'pending') && (
                            <button
                              onClick={() => handleQuickGrant(student)}
                              title="Quick Grant Bot Access"
                              className="p-2 bg-trade-neon/20 hover:bg-trade-neon/30 text-trade-neon rounded-lg transition-colors border border-trade-neon/20"
                            >
                              <Sparkles className="h-4 w-4" />
                            </button>
                          )}
                          <button onClick={() => handleEditClick(student)} className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => handleDeleteStudent(student.id, student.name)} className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bot Assets Management Section */}
      <div className="mt-12 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Bot className="h-6 w-6 text-trade-neon" />
            Zeta Expert Management
          </h2>
          <p className="text-gray-400">Upload and distribute Zeta Expert bot files to authorized students</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Upload Card */}
          <div
            onClick={handleUploadClick}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-dashed border-gray-600 p-8 flex flex-col items-center justify-center text-center group hover:border-trade-neon/50 transition-colors cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-gray-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Bot className="h-8 w-8 text-trade-neon" />
            </div>
            <h3 className="font-bold text-white mb-2">Upload New Asset</h3>
            <p className="text-sm text-gray-500 mb-6">MQL5 files, manuals, or presets</p>
            <button className="px-6 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white font-bold hover:bg-gray-800 hover:border-trade-neon transition-all">
              Select File
            </button>
          </div>

          {/* Asset List */}
          <div className="md:col-span-2 space-y-4">
            {assetLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2].map(i => <div key={i} className="h-20 bg-gray-800/30 rounded-xl" />)}
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-10 bg-gray-800/20 rounded-xl border border-gray-700/30">
                <p className="text-gray-500 text-sm">No bot assets uploaded yet.</p>
              </div>
            ) : (
              assets.map((asset) => (
                <div key={asset.id} className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50 flex items-center justify-between group hover:border-gray-600 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-trade-neon/10 rounded-lg group-hover:bg-trade-neon/20 transition-colors">
                      <Bot className="h-6 w-6 text-trade-neon" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{asset.name}</h4>
                      <p className="text-xs text-gray-500">
                        {asset.version} • {asset.fileSize} • {new Date(asset.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteAsset(asset.id, asset.url)}
                      className="p-2 hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentManagementTab;