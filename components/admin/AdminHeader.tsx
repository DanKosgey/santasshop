import React from 'react';
import { ShieldAlert } from 'lucide-react';

const AdminHeader: React.FC = () => {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 animate-fade-in">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-trade-neon to-blue-400">
          <ShieldAlert className="h-8 w-8 text-trade-neon animate-pulse" /> Admin Portal
        </h1>
        <p className="text-gray-300 mt-2 text-base">Oversee students, risks, and business insights with precision.</p>
      </div>
    </div>
  );
};

export default AdminHeader;