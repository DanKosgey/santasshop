import React, { useState } from 'react';
import { Course, CourseModule, CourseCategory } from '../../types';
import { 
  Download, Upload, FileJson, BookOpen, Layers, 
  Tag, Save, X, AlertCircle, CheckCircle
} from 'lucide-react';

interface CourseExportImportProps {
  courses: Course[];
  modules: CourseModule[];
  categories: CourseCategory[];
  onImportCourses: (data: { courses: Course[], modules: CourseModule[], categories: CourseCategory[] }) => void;
}

const CourseExportImport: React.FC<CourseExportImportProps> = ({
  courses,
  modules,
  categories,
  onImportCourses
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  // Handle export
  const handleExport = () => {
    const exportData = {
      courses: courses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        level: course.level,
        duration: course.duration,
        thumbnail: course.thumbnail,
        instructor: course.instructor,
        categoryId: course.categoryId,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt
      })),
      modules: modules.map(module => ({
        id: module.id,
        courseId: module.courseId,
        title: module.title,
        description: module.description,
        duration: module.duration,
        level: module.level,
        content: module.content,
        contentType: module.contentType,
        order: module.order,
        createdAt: module.createdAt,
        updatedAt: module.updatedAt
      })),
      categories: categories.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color
      }))
    };

    if (exportFormat === 'json') {
      // JSON export
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `course-data-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } else {
      // CSV export (simplified)
      alert('CSV export is not yet implemented. Please use JSON format for now.');
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
      setImportStatus('idle');
      setImportMessage('');
    }
  };

  // Handle import
  const handleImport = () => {
    if (!importFile) {
      setImportStatus('error');
      setImportMessage('Please select a file to import.');
      return;
    }

    setImportStatus('processing');
    setImportMessage('Processing import...');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);
        
        // Validate data structure
        if (!parsedData.courses || !parsedData.modules || !parsedData.categories) {
          throw new Error('Invalid data structure in imported file.');
        }
        
        // Process and validate courses
        const importedCourses: Course[] = parsedData.courses.map((course: any) => ({
          id: course.id,
          title: course.title,
          description: course.description,
          level: course.level,
          modules: [], // Will be populated separately
          duration: course.duration,
          thumbnail: course.thumbnail,
          instructor: course.instructor,
          categoryId: course.categoryId,
          createdAt: new Date(course.createdAt),
          updatedAt: new Date(course.updatedAt)
        }));
        
        // Process and validate modules
        const importedModules: CourseModule[] = parsedData.modules.map((module: any) => ({
          id: module.id,
          courseId: module.courseId,
          title: module.title,
          description: module.description,
          duration: module.duration,
          level: module.level,
          completed: false,
          locked: false,
          content: module.content,
          contentType: module.contentType,
          order: module.order,
          createdAt: module.createdAt ? new Date(module.createdAt) : undefined,
          updatedAt: module.updatedAt ? new Date(module.updatedAt) : undefined
        }));
        
        // Process and validate categories
        const importedCategories: CourseCategory[] = parsedData.categories.map((category: any) => ({
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color
        }));
        
        // Call import handler
        onImportCourses({
          courses: importedCourses,
          modules: importedModules,
          categories: importedCategories
        });
        
        setImportStatus('success');
        setImportMessage(`Successfully imported ${importedCourses.length} courses, ${importedModules.length} modules, and ${importedCategories.length} categories.`);
      } catch (error) {
        setImportStatus('error');
        setImportMessage(`Error importing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
    reader.onerror = () => {
      setImportStatus('error');
      setImportMessage('Error reading file. Please try again.');
    };
    
    reader.readAsText(importFile);
  };

  // Handle cancel import
  const handleCancelImport = () => {
    setIsImporting(false);
    setImportFile(null);
    setImportStatus('idle');
    setImportMessage('');
  };

  return (
    <div className="text-white pb-10">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileJson className="h-8 w-8 text-trade-accent" />
            Course Data Export/Import
          </h1>
          <p className="text-gray-400 mt-1">Export and import course data for backup or migration.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Export Section */}
        <div className="bg-trade-dark border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Download className="h-5 w-5" /> Export Course Data
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Export Format</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setExportFormat('json')}
                  className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
                    exportFormat === 'json'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <FileJson className="h-4 w-4" /> JSON
                </button>
                <button
                  onClick={() => setExportFormat('csv')}
                  className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
                    exportFormat === 'csv'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <FileJson className="h-4 w-4" /> CSV
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-800/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{courses.length}</div>
                <div className="text-xs text-gray-400">Courses</div>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{modules.length}</div>
                <div className="text-xs text-gray-400">Modules</div>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{categories.length}</div>
                <div className="text-xs text-gray-400">Categories</div>
              </div>
            </div>
            
            <button
              onClick={handleExport}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition"
            >
              <Download className="h-5 w-5" /> Export Data
            </button>
          </div>
        </div>
        
        {/* Import Section */}
        <div className="bg-trade-dark border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5" /> Import Course Data
          </h2>
          
          <div className="space-y-6">
            {!isImporting ? (
              <div className="text-center py-8">
                <Upload className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Import course data from a JSON file</p>
                <button
                  onClick={() => setIsImporting(true)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold"
                >
                  Select File to Import
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-700 border-dashed rounded-lg cursor-pointer bg-gray-800/30 hover:bg-gray-800/50 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileJson className="h-8 w-8 text-gray-500 mb-2" />
                      <p className="text-sm text-gray-400">
                        {importFile ? importFile.name : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-gray-500">JSON files only</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".json"
                      onChange={handleFileSelect}
                    />
                  </label>
                </div>
                
                {importStatus !== 'idle' && (
                  <div className={`p-4 rounded-lg flex items-start gap-3 ${
                    importStatus === 'success' ? 'bg-green-500/20 text-green-400' :
                    importStatus === 'error' ? 'bg-red-500/20 text-red-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {importStatus === 'processing' && <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />}
                    {importStatus === 'success' && <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />}
                    {importStatus === 'error' && <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />}
                    <div>
                      <div className="font-bold">
                        {importStatus === 'processing' ? 'Processing' :
                         importStatus === 'success' ? 'Success' :
                         'Error'}
                      </div>
                      <div className="text-sm">{importMessage}</div>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelImport}
                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!importFile || importStatus === 'processing'}
                    className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition ${
                      !importFile || importStatus === 'processing'
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-500 text-white'
                    }`}
                  >
                    <Upload className="h-5 w-5" /> Import Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Import Guidelines */}
      <div className="bg-trade-dark border border-gray-700 rounded-xl p-6 mt-8">
        <h3 className="text-lg font-bold text-white mb-4">Import Guidelines</h3>
        <ul className="space-y-2 text-gray-400 text-sm">
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-trade-accent rounded-full mt-2 flex-shrink-0"></div>
            <span>Only JSON files exported from this system are supported</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-trade-accent rounded-full mt-2 flex-shrink-0"></div>
            <span>Existing courses with matching IDs will be updated</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-trade-accent rounded-full mt-2 flex-shrink-0"></div>
            <span>Categories and modules will be imported along with courses</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-trade-accent rounded-full mt-2 flex-shrink-0"></div>
            <span>Large imports may take several minutes to process</span>
          </li>
          <li className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 bg-trade-accent rounded-full mt-2 flex-shrink-0"></div>
            <span>Always backup your data before importing new content</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CourseExportImport;