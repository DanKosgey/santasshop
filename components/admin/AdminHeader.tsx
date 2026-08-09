import React from 'react';
import { ShieldAlert } from 'lucide-react';

const AdminHeader: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 min-w-0">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight leading-tight">
          <span className="p-1.5 bg-blue-50 rounded-lg shrink-0">
            <ShieldAlert className="h-5 w-5 text-blue-600" />
          </span>
          Admin Portal
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-normal">
          Oversee students, risks, and business insights with precision.
        </p>
      </div>
    </div>
  );
};

export default AdminHeader;