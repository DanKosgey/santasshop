import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Cpu as Bot,
    Check,
    X,
    Clock,
    Search,
    Filter,
    ExternalLink,
    ShieldCheck,
    AlertCircle
} from 'lucide-react';
import { StudentProfile } from '../../../types';
import { fetchAllStudents, updateStudentProfile } from '../../../services/adminService';

const BotInquiriesTab: React.FC = () => {
    const [students, setStudents] = useState<StudentProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        loadInquiries();
    }, []);

    const loadInquiries = async () => {
        try {
            setLoading(true);
            const allStudents = await fetchAllStudents();
            // Filter for pending inquiries
            const pending = allStudents.filter(s => s.botPurchaseStatus === 'pending');
            setStudents(pending);
        } catch (error) {
            console.error('Error loading inquiries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (studentId: string) => {
        try {
            setProcessingId(studentId);
            await updateStudentProfile(studentId, {
                botAccess: true,
                botPurchaseStatus: 'completed'
            });
            // Remove from list
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
            await updateStudentProfile(studentId, {
                botPurchaseStatus: 'none'
            });
            // Remove from list
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-3">
                        <Bot className="h-7 w-7 text-brand-primary" />
                        Zeta Expert Inquiries
                    </h2>
                    <p className="text-slate-400">Manage and approve Zeta Expert Bot access requests</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none w-64"
                        />
                    </div>
                    <button
                        onClick={loadInquiries}
                        className="p-2 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition"
                    >
                        <Clock className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-primary" />
                </div>
            ) : filteredStudents.length === 0 ? (
                <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-12 text-center">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-slate-700 mb-4">
                        <ShieldCheck className="h-8 w-8 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No Pending Inquiries</h3>
                    <p className="text-slate-400 mx-auto max-w-sm">
                        All bot purchase requests have been processed. New ones will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filteredStudents.map((student) => (
                            <motion.div
                                key={student.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-brand-primary/50 transition-colors shadow-lg"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-xl bg-slate-700 flex items-center justify-center font-black text-xl text-brand-primary">
                                            {student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{student.name}</div>
                                            <div className="text-xs text-slate-500">{student.email}</div>
                                        </div>
                                    </div>
                                    <div className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${student.tier === 'elite' ? 'bg-violet-500/20 text-violet-400' :
                                        student.tier === 'professional' ? 'bg-brand-primary/20 text-brand-primary' :
                                            'bg-slate-700 text-slate-400'
                                        }`}>
                                        {student.tier}
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center justify-between text-xs py-2 border-b border-slate-700/50">
                                        <span className="text-slate-500">Requested Bot</span>
                                        <span className="text-white font-bold italic">Zeta Expert</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs py-2 border-b border-slate-700/50">
                                        <span className="text-slate-500">Price</span>
                                        <span className="text-green-400 font-bold">$299.00</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs py-2">
                                        <span className="text-slate-500">Requested On</span>
                                        <span className="text-white">{new Date(student.joinedDate).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleApprove(student.id)}
                                        disabled={processingId === student.id}
                                        className="flex-1 py-2.5 bg-brand-primary text-slate-900 font-black rounded-xl hover:bg-green-400 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {processingId === student.id ? '...' : (
                                            <>
                                                <Check className="h-4 w-4" /> APPROVE
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDecline(student.id)}
                                        disabled={processingId === student.id}
                                        className="p-2.5 bg-slate-700 text-white font-black rounded-xl hover:bg-red-500 transition disabled:opacity-50"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Verification Notice */}
            <div className="flex items-start gap-3 p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-2xl">
                <AlertCircle className="h-5 w-5 text-brand-primary flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-400 leading-relaxed">
                    <span className="text-brand-primary font-bold">Admin Notice:</span> Before approving, please verify the payment receipt in the business bank account or crypto wallet. Once approved, the student will immediately gain access to the bot download page and installation guide.
                </div>
            </div>
        </div>
    );
};

export default BotInquiriesTab;
