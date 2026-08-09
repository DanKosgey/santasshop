import React, { useEffect } from 'react';
import { useAdminPortal } from '../AdminPortalContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const AnalyticsTab: React.FC = () => {
  const { businessMetrics, courseEnrollmentData, fetchStudentPenaltiesData } = useAdminPortal();

  useEffect(() => {
    fetchStudentPenaltiesData();
  }, []);

  const formattedCourseData = (courseEnrollmentData || []).map(item => ({
    name: (item.name || 'Unknown').slice(0, 20),
    completion: item.count > 0 ? Math.round((item.completed / item.count) * 100) : 0,
  }));

  const PIE_COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];

  const tooltipStyle = {
    contentStyle: { backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, boxShadow: '0 4px 6px -1px rgba(15,23,42,0.06)' },
    itemStyle: { color: '#0F172A' },
    labelStyle: { color: '#64748B', fontWeight: 600 },
  };

  return (
    <div className="space-y-0 animate-slide-up">

      {/* Page Header */}
      <div className="page-header">
        <h2 className="section-title">Business Analytics</h2>
        <p className="section-desc">Comprehensive business metrics, course performance, and tier distribution.</p>
      </div>

      {/* Charts Grid */}
      <div className="page-section">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Course Completion Rates */}
          <div className="content-card p-6">
            <h3 className="section-title mb-6">Course Completion Rates</h3>
            <div className="h-72">
              {formattedCourseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={formattedCourseData}
                      dataKey="completion"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={100}
                      paddingAngle={3}
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {formattedCourseData.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  No course completion data available.
                </div>
              )}
            </div>
          </div>

          {/* Tier Distribution */}
          <div className="content-card p-6">
            <h3 className="section-title mb-6">Tier Distribution</h3>
            <div className="h-72">
              {(businessMetrics?.tierData || []).length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={businessMetrics.tierData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={100}
                      paddingAngle={4}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {(businessMetrics?.tierData || []).map((entry: any, i: number) => (
                        <Cell key={`cell-${i}`} fill={entry.color || PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  No tier distribution data available.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="h-10" />
    </div>
  );
};

export default AnalyticsTab;