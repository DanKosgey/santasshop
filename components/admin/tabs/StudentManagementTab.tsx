import React, { useState, useMemo } from 'react';
import { useAdminPortal } from '../AdminPortalContext';
import { fetchBotAssets, uploadBotAsset, deleteBotAsset } from '../../../services/adminService';
import { BotAsset, StudentProfile } from '../../../types';
import {
  Users, Search, Filter, Edit2, Trash2, Save, X, AlertTriangle, CheckCircle, Cpu as Bot, Lock, Clock, CheckCircle2, Sparkles, Upload
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

  React.useEffect(() => { loadAssets(); }, []);

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
      setSuccess('Asset deleted successfully!');
      loadAssets();
    } catch (err) {
      setError('Failed to delete asset.');
    } finally {
      setAssetLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student =>
      (student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterTier === 'all' || student.tier === filterTier)
    );
  }, [students, searchTerm, filterTier]);

  const handleEditClick = (student: StudentProfile) => {
    setEditingStudentId(student.id);
    setEditedStudent({ ...student });
  };

  const handleSaveEdit = async () => {
    if (!editingStudentId || !editedStudent) return;

    try {
      setLoading(true);
      setError(null);
      await updateStudentProfile(editingStudentId, editedStudent);
      setEditingStudentId(null);
      setEditedStudent(null);
      setSuccess('Student profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating student profile:', err);
      if (err.message && err.message.includes('No profile found')) {
        setError('Student profile not found.');
      } else {
        setError('Failed to update student profile.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${studentName}'s profile?`)) return;

    try {
      setLoading(true);
      setError(null);
      await deleteStudentProfile(studentId);
      setSuccess('Student profile deleted successfully!');
      await refreshData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error deleting student profile:', err);
      setError('Failed to delete student profile.');
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

  const getTierBadge = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'elite':        return 'badge badge-purple';
      case 'professional': return 'badge badge-primary';
      case 'foundation':   return 'badge badge-success';
      default:             return 'badge badge-gray';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':   return 'badge badge-success';
      case 'at-risk':  return 'badge badge-danger';
      case 'inactive': return 'badge badge-gray';
      default:         return 'badge badge-gray';
    }
  };

  return (
    <div className="space-y-0 animate-slide-up">

      {/* Page Header */}
      <div className="page-header">
        <h2 className="section-title">Student Management</h2>
        <p className="section-desc">Manage student profiles, subscription tiers, and bot permissions.</p>
      </div>

      {/* Alerts */}
      {success && (
        <div className="p-4 mb-6 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium text-emerald-800">{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <span className="text-sm font-medium text-red-800 flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Student List Section */}
      <div className="page-section">
        <div className="content-card">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search students…"
                  className="input pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <select
              value={filterTier}
              onChange={e => setFilterTier(e.target.value)}
              className="input sm:w-40"
            >
              <option value="all">All Tiers</option>
              <option value="elite">Elite</option>
              <option value="professional">Professional</option>
              <option value="foundation">Foundation</option>
              <option value="free">Free</option>
            </select>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Tier</th>
                  <th className="text-center">Bot Access</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    {editingStudentId === student.id ? (
                      <>
                        <td>
                          <input
                            type="text"
                            value={editedStudent?.name || ''}
                            onChange={(e) => setEditedStudent({ ...editedStudent, name: e.target.value })}
                            className="input text-sm"
                          />
                        </td>
                        <td>
                          <select
                            value={editedStudent?.tier || student.tier}
                            onChange={(e) => setEditedStudent({ ...editedStudent, tier: e.target.value as any })}
                            className="input text-sm"
                          >
                            <option value="free">Free</option>
                            <option value="foundation">Foundation</option>
                            <option value="professional">Professional</option>
                            <option value="elite">Elite</option>
                          </select>
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => setEditedStudent({ ...editedStudent, botAccess: !editedStudent?.botAccess })}
                            className={`btn btn-sm ${editedStudent?.botAccess ? 'btn-success' : 'btn-secondary'}`}
                          >
                            {editedStudent?.botAccess ? <CheckCircle2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                            <span>{editedStudent?.botAccess ? 'Granted' : 'Locked'}</span>
                          </button>
                        </td>
                        <td><span className={getStatusBadge(student.status)}>{student.status}</span></td>
                        <td>
                          <div className="flex gap-2">
                            <button onClick={handleSaveEdit} className="btn btn-sm btn-success"><Save className="h-4 w-4" /></button>
                            <button onClick={handleCancelEdit} className="btn btn-sm btn-secondary"><X className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ maxWidth: 220 }}>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate">{student.name}</p>
                              <p className="text-xs text-slate-400 truncate">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td><span className={getTierBadge(student.tier)}>{student.tier}</span></td>
                        <td className="text-center">
                          {student.botPurchaseStatus === 'pending' ? (
                            <span className="badge badge-warning">
                              <Clock className="h-3 w-3" /> Pending
                            </span>
                          ) : student.botAccess ? (
                            <span className="badge badge-success">
                              <CheckCircle2 className="h-3 w-3" /> Granted
                            </span>
                          ) : (
                            <span className="badge badge-gray">
                              <Lock className="h-3 w-3" /> Locked
                            </span>
                          )}
                        </td>
                        <td><span className={getStatusBadge(student.status)}>{student.status}</span></td>
                        <td>
                          <div className="flex gap-2">
                            {(!student.botAccess || student.botPurchaseStatus === 'pending') && (
                              <button
                                onClick={() => handleQuickGrant(student)}
                                title="Quick Grant Bot Access"
                                className="btn btn-sm btn-secondary text-blue-600 hover:bg-blue-50"
                              >
                                <Sparkles className="h-4 w-4" />
                              </button>
                            )}
                            <button onClick={() => handleEditClick(student)} className="btn btn-sm btn-secondary"><Edit2 className="h-4 w-4" /></button>
                            <button onClick={() => handleDeleteStudent(student.id, student.name)} className="btn btn-sm btn-danger"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">
              No students found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* Bot Assets Section */}
      <div className="page-section">
        <div className="section-header">
          <h3 className="section-title flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            Zeta Expert Management
          </h3>
          <p className="section-desc">Upload and distribute Zeta Expert bot files to authorized students.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Upload Card */}
          <div
            onClick={handleUploadClick}
            className="content-card p-6 flex flex-col items-center justify-center text-center cursor-pointer border-dashed border-2 border-slate-300 hover:border-blue-500 transition-colors"
          >
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-3 text-blue-600">
              <Upload className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-slate-800 mb-1">Upload New Asset</h4>
            <p className="text-xs text-slate-400 mb-4">MQL5 files, manuals, or presets</p>
            <button className="btn btn-sm btn-primary">Select File</button>
          </div>

          {/* Asset List */}
          <div className="md:col-span-2 space-y-3">
            {assetLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
              </div>
            ) : assets.length === 0 ? (
              <div className="content-card text-center py-10 text-slate-400 text-sm">
                No bot assets uploaded yet.
              </div>
            ) : (
              assets.map((asset) => (
                <div key={asset.id} className="content-card p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-800 text-sm truncate">{asset.name}</h4>
                      <p className="text-xs text-slate-400 truncate">
                        {asset.version} &bull; {asset.fileSize} &bull; {new Date(asset.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteAsset(asset.id, asset.url)}
                    className="btn btn-sm btn-ghost text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
};

export default StudentManagementTab;