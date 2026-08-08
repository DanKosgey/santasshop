import React, { useState } from 'react';
import { Course, CourseModule } from '../../types';
import { 
  GitBranch, Clock, User, CheckCircle, 
  AlertCircle, Copy, Eye, Archive
} from 'lucide-react';

interface CourseVersioningProps {
  course: Course;
  modules: CourseModule[];
  versions: { id: string; title: string; version: number; createdAt: Date; isCurrent: boolean }[];
  onCreateVersion: (courseId: string) => void;
  onSwitchVersion: (courseId: string) => void;
}

const CourseVersioning: React.FC<CourseVersioningProps> = ({
  course,
  modules,
  versions,
  onCreateVersion,
  onSwitchVersion
}) => {
  const [showVersions, setShowVersions] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);

  // Handle creating a new version
  const handleCreateVersion = () => {
    setIsCreatingVersion(true);
    onCreateVersion(course.id);
  };

  // Handle switching to a different version
  const handleSwitchVersion = (versionId: string) => {
    onSwitchVersion(versionId);
    setShowVersions(false);
  };

  // Get the current version
  const currentVersion = versions.find(v => v.isCurrent);

  return (
    <div className="text-white">
      {/* Version Info Bar */}
      <div className="bg-trade-dark border border-gray-700 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <GitBranch className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">{course.title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Version {currentVersion?.version || 1}</span>
                <span>•</span>
                <span>{modules.length} modules</span>
                <span>•</span>
                <span>{course.level}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition"
            >
              <Clock className="h-4 w-4" /> 
              {showVersions ? 'Hide Versions' : 'Show Versions'}
            </button>
            <button
              onClick={handleCreateVersion}
              disabled={isCreatingVersion}
              className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition ${
                isCreatingVersion
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              <Copy className="h-4 w-4" /> 
              {isCreatingVersion ? 'Creating...' : 'New Version'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Versions List */}
      {showVersions && (
        <div className="bg-trade-dark border border-gray-700 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <GitBranch className="h-5 w-5" /> Course Versions
          </h3>
          
          {versions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No versions found for this course.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <div 
                  key={version.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    version.isCurrent
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800/20 hover:bg-gray-800/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      version.isCurrent
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-gray-700 text-gray-400'
                    }`}>
                      <GitBranch className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">Version {version.version}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" /> 
                          {version.createdAt.toLocaleDateString()}
                        </span>
                        {version.isCurrent && (
                          <span className="flex items-center gap-1 text-green-400">
                            <CheckCircle className="h-4 w-4" /> Current
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {!version.isCurrent && (
                      <button
                        onClick={() => handleSwitchVersion(version.id)}
                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold text-sm flex items-center gap-1 transition"
                      >
                        <Eye className="h-4 w-4" /> Switch
                      </button>
                    )}
                    <button
                      onClick={() => alert('Version comparison is not yet implemented')}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold text-sm flex items-center gap-1 transition"
                    >
                      <Archive className="h-4 w-4" /> Compare
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Version Creation Status */}
      {isCreatingVersion && (
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-bold text-blue-400">Creating New Version</div>
              <div className="text-sm text-blue-300">
                A new version of "{course.title}" is being created. This may take a few moments...
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Version Guidelines */}
      <div className="bg-trade-dark border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Course Versioning Guidelines</h3>
        <ul className="space-y-3 text-gray-400 text-sm">
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-trade-accent rounded-full mt-2 flex-shrink-0"></div>
            <span>Each new version creates a complete copy of the course and all its modules</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-trade-accent rounded-full mt-2 flex-shrink-0"></div>
            <span>Students enrolled in previous versions will continue with their current version</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-trade-accent rounded-full mt-2 flex-shrink-0"></div>
            <span>New enrollments will automatically use the latest version</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-trade-accent rounded-full mt-2 flex-shrink-0"></div>
            <span>You can switch between versions to compare content and make updates</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-trade-accent rounded-full mt-2 flex-shrink-0"></div>
            <span>Version history is preserved indefinitely for auditing and rollback purposes</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CourseVersioning;