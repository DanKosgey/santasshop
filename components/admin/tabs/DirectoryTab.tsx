import React, { useState, useMemo } from 'react';
import { useAdminPortal } from '../AdminPortalContext';
import { StudentProfile } from '../../../types';

const DirectoryTab: React.FC = () => {
  const { students, trades } = useAdminPortal();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'at-risk' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
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
    recentTrades: student.recentTrades || []
  }));

  const filteredStudents = tableData.filter(student => 
    (student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.tier.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filter === 'all' || student.status === filter)
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'at risk': return 'bg-yellow-500/20 text-yellow-400';
      case 'inactive': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'elite': return 'bg-purple-500/20 text-purple-400';
      case 'professional': return 'bg-blue-500/20 text-blue-400';
      case 'foundation': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-trade-neon to-blue-400">Student Directory</h2>
        <p className="text-gray-400">Manage and view all students</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search students by name, email, or tier..."
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-trade-neon focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value as 'all' | 'active' | 'at-risk' | 'inactive')} 
            className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-trade-neon outline-none"
          >
            <option value="all">All Students</option>
            <option value="active">Active</option>
            <option value="at-risk">At-Risk</option>
            <option value="inactive">Inactive</option>
          </select>
          <div className="flex bg-gray-900 rounded-xl border border-gray-700">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`px-4 py-3 rounded-l-xl ${viewMode === 'grid' ? 'bg-trade-neon text-black' : 'text-gray-400 hover:bg-gray-800'}`}
            >
              Grid
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`px-4 py-3 rounded-r-xl ${viewMode === 'list' ? 'bg-trade-neon text-black' : 'text-gray-400 hover:bg-gray-800'}`}
            >
              List
            </button>
          </div>
        </div>

        {/* Students View */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStudents.map(student => (
              <div key={student.id} className="group bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-trade-neon rounded-2xl p-6 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-xl ${student.status === 'at-risk' ? 'bg-red-500/30 text-red-400' : student.tier === 'elite' ? 'bg-purple-600/30 text-purple-400' : 'bg-trade-neon/30 text-trade-neon'}`}>
                      {student.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{student.name || 'Unknown'}</h4>
                      <span className={`text-xs px-3 py-1 rounded-full uppercase font-bold ${getTierColor(student.tier).replace('text-', 'text-').replace('bg-', 'bg-')}`}>
                        {student.tier}
                      </span>
                    </div>
                  </div>
                  {student.status === 'at-risk' && (
                    <svg className="h-6 w-6 text-red-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="bg-gray-900/50 p-3 rounded-xl">
                    <span className="block text-xs text-gray-400">Win Rate</span>
                    <span className={`font-bold ${(parseFloat(student.winRate) || 0) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                      {student.winRate}
                    </span>
                  </div>
                  <div className="bg-gray-900/50 p-3 rounded-xl">
                    <span className="block text-xs text-gray-400">P&L</span>
                    <span className={`font-bold ${(student.totalPnL || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${(student.totalPnL || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-4 border-t border-gray-700/30">
                  <span className="text-gray-400">Joined {new Date(student.joinDate).toLocaleDateString()}</span>
                  <span className="text-trade-neon group-hover:underline flex items-center gap-1">
                    View Profile
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-700/50">
                  <th className="pb-4 font-medium">Student</th>
                  <th className="pb-4 font-medium">Tier</th>
                  <th className="pb-4 font-medium">Status</th>
                  <th className="pb-4 font-medium">Join Date</th>
                  <th className="pb-4 font-medium">Trades</th>
                  <th className="pb-4 font-medium">Win Rate</th>
                  <th className="pb-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-900/50 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${student.tier === 'elite' ? 'bg-purple-600/30' : 'bg-gray-700/50'}`}>
                          {student.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-bold text-white">{student.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-400">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`text-xs font-bold uppercase px-3 py-1 rounded ${getTierColor(student.tier).replace('text-', 'text-').replace('bg-', 'bg-')}`}>
                        {student.tier}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`text-xs font-bold uppercase px-3 py-1 rounded ${getStatusColor(student.status).replace('text-', 'text-').replace('bg-', 'bg-')}`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="py-4 text-gray-400">{new Date(student.joinDate).toLocaleDateString()}</td>
                    <td className="py-4 text-white">{student.trades}</td>
                    <td className="py-4 text-white">{student.winRate}</td>
                    <td className="py-4">
                      <button className="px-4 py-2 bg-trade-neon text-black rounded-xl font-bold hover:bg-green-400 transition-colors">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No students found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectoryTab;