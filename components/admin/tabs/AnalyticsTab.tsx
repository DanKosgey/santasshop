import React, { useEffect } from 'react';
import { useAdminPortal } from '../AdminPortalContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { DollarSign, Users, TrendingUp, BarChart2, AlertTriangle } from 'lucide-react';

const AnalyticsTab: React.FC = () => {
  const { businessMetrics, courseEnrollmentData, fetchStudentPenaltiesData } = useAdminPortal();
  
  // Fetch student penalties data when component mounts
  useEffect(() => {
    fetchStudentPenaltiesData();
  }, []);
  
  // Format data for charts
  const formattedCourseData = (courseEnrollmentData || []).map(item => ({
    name: (item.name || 'Unknown').slice(0, 20),
    completion: item.count > 0 ? Math.round((item.completed / item.count) * 100) : 0
  }));
  
  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-trade-neon to-blue-400">Business Analytics</h2>
        <p className="text-gray-400">Comprehensive business metrics and analytics</p>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 shadow-xl">
          <h3 className="font-bold text-xl mb-6 text-gray-200">Course Completion Rates</h3>
          <div className="h-72">
            {formattedCourseData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={formattedCourseData} dataKey="completion" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#3b82f6" label={({ name, value }) => `${name}: ${value}%`} />
                  <Tooltip contentStyle={{backgroundColor: '#1f2937', border: '1px solid #475569', borderRadius: '8px'}} />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-white font-bold">
                    Completion
                  </text>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No completion data</div>
            )}
          </div>
        </div>
        <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50 shadow-xl">
          <h3 className="font-bold text-xl mb-6 text-gray-200">Tier Distribution</h3>
          <div className="h-72">
            {(businessMetrics?.tierData || []).length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={businessMetrics.tierData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} label={({ name, value }) => `${name}: ${value}`}>
                    {(businessMetrics?.tierData || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{backgroundColor: '#1f2937', border: '1px solid #475569', borderRadius: '8px'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No tier data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;