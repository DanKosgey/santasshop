import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu as Bot, Check, X, Clock, Search, ShieldCheck, AlertCircle } from 'lucide-react';
import { StudentProfile } from '../../../types';
import { fetchAllStudents, updateStudentProfile } from '../../../services/adminService';

const BotInquiriesTab: React.FC = () => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => { loadInquiries(); }, []);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      const allStudents = await fetchAllStudents();
      setStudents(allStudents.filter(s => s.botPurchaseStatus === 'pending'));
    } catch (error) {
      console.error('Error loading inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (studentId: string) => {
    try {
      setProcessingId(studentId);
      await updateStudentProfile(studentId, { botAccess: true, botPurchaseStatus: 'completed' });
      setStudents(prev => prev.filter(s => s.id !== studentId));
    } catch (error) {
      console.error('Error approving inquiry:', error);
      alert('Failed to approve access.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (studentId: string) => {
    try {
      if (!confirm('Are you sure you want to decline this inquiry?')) return;
      setProcessingId(studentId);
      await updateStudentProfile(studentId, { botPurchaseStatus: 'none' });
      setStudents(prev => prev.filter(s => s.id !== studentId));
    } catch (error) {
      console.error('Error declining inquiry:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTierBadge = (tier: string) => {
    switch ((tier || '').toLowerCase()) {
      case 'elite':        return 'badge badge-purple';
      case 'professional': return 'badge badge-primary';
      default:             return 'badge badge-gray';
    }
  };

  return (
    <div className="space-y-0 animate-slide-up">

      {/* Page Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="section-title flex items-center gap-2.5">
              <span className="p-1.5 bg-blue-50 rounded-lg shrink-0">
                <Bot className="h-5 w-5 text-blue-600" />
              </span>
              Zeta Expert Inquiries
            </h2>
            <p className="section-desc">Manage and approve Zeta Expert Bot access requests.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search students…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="input pl-9 w-56"
              />
            </div>
            <button onClick={loadInquiries} className="btn btn-secondary" title="Refresh">
              <Clock className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="page-section">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="content-card p-12 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-slate-100 mb-4">
              <ShieldCheck className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Pending Inquiries</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              All bot purchase requests have been processed. New ones will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {filteredStudents.map(student => (
                <motion.div
                  key={student.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="stat-card"
                >
                  {/* Student Info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 rounded-full bg-blue-50 flex items-center justify-center text-base font-bold text-blue-600 shrink-0">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{student.name}</p>
                        <p className="text-xs text-slate-400 truncate" title={student.email}>{student.email}</p>
                      </div>
                    </div>
                    <span className={getTierBadge(student.tier)}>{student.tier}</span>
                  </div>

                  {/* Details */}
                  <div className="mt-4 space-y-0 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between py-2 border-b border-slate-50 text-sm">
                      <span className="text-slate-500">Requested Bot</span>
                      <span className="font-semibold text-slate-800 italic">Zeta Expert</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-50 text-sm">
                      <span className="text-slate-500">Price</span>
                      <span className="font-bold text-emerald-600">$299.00</span>
                    </div>
                    <div className="flex items-center justify-between py-2 text-sm">
                      <span className="text-slate-500">Requested On</span>
                      <span className="text-slate-700">{new Date(student.joinedDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-5">
                    <button
                      onClick={() => handleApprove(student.id)}
                      disabled={processingId === student.id}
                      className="btn btn-success flex-1 disabled:opacity-50"
                    >
                      {processingId === student.id ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <><Check className="h-4 w-4" /> Approve</>
                      )}
                    </button>
                    <button
                      onClick={() => handleDecline(student.id)}
                      disabled={processingId === student.id}
                      className="btn btn-danger disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Admin Notice */}
      <div className="page-section">
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">
            <span className="font-semibold">Admin Notice:</span> Before approving, please verify the payment receipt in the business bank account or crypto wallet. Once approved, the student will immediately gain access to the bot download page and installation guide.
          </p>
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
};

export default BotInquiriesTab;
