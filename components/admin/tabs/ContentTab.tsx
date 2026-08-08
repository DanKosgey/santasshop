import React from 'react';
import { User, CourseModule } from '../../../types';
import CourseManagementSystem from '../../../components/enhanced/CourseManagementSystem';

interface ContentTabProps {
  user: User;
  courses: CourseModule[];
}

const ContentTab: React.FC<ContentTabProps> = ({ user, courses }) => {
  return (
    <CourseManagementSystem
      currentUser={{
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        tier: user.subscriptionTier || 'foundation',
        joinedDate: new Date().toISOString(),
        stats: {
          winRate: 0,
          totalPnL: 0,
          tradesCount: 0,
          avgRiskReward: 0,
          currentDrawdown: 0
        },
        recentTrades: [],
        status: 'active'
      }}
      isAdmin={true}
    />
  );
};

export default ContentTab;