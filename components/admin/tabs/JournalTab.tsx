import React from 'react';
import { User } from '../../../types';
import AdminTradeJournal from '../../../components/AdminTradeJournal';

interface JournalTabProps {
  user: User;
}

const JournalTab: React.FC<JournalTabProps> = ({ user }) => {
  return <AdminTradeJournal />;
};

export default JournalTab;