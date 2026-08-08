import React, { useState } from 'react';
import { BookOpen, Plus, Edit2, Trash2, Save, X, CheckCircle, Lock } from 'lucide-react';

interface DifficultyLevel {
  id: string;
  name: string;
  description: string;
  color: string;
  minModules?: number;
  maxModules?: number;
  prerequisites?: string[];
}

interface DifficultyLevelManagerProps {
  levels: DifficultyLevel[];
  onSaveLevel: (level: DifficultyLevel) => void;
  onDeleteLevel: (id: string) => void;
}

const DifficultyLevelManager: React.FC<DifficultyLevelManagerProps> = ({
  levels,
  onSaveLevel,
  onDeleteLevel
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<DifficultyLevel>>({
    name: '',
    description: '',
    color: '#10B981' // Default green color
  });

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      color: '#10B981'
    });
    setIsEditing(true);
  };

  const handleEdit = (level: DifficultyLevel) => {
    setEditingId(level.id);
    setFormData({ ...level });
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.color) return;
    
    const levelData: DifficultyLevel = {
      id: editingId || Date.now().toString(),
      name: formData.name,
      description: formData.description || '',
      color: formData.color,
      minModules: formData.minModules,
      maxModules: formData.maxModules,
      prerequisites: formData.prerequisites || []
    };
    
    onSaveLevel(levelData);
    setIsEditing(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this difficulty level?')) {
      onDeleteLevel(id);
    }
  };

  const colorOptions = [
    { name: 'Green', value: '#10B981' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Teal', value: '#14B8A6' }
  ];

  return (
    <div className="text-white h-full flex flex-col pb-10">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-500" /> 
            Difficulty Level Management
          </h1>
          <p className="text-gray-400 mt-1">Manage course difficulty levels and progression paths.</p>
        </div>
      </div>

      {isEditing ? (
        <div className="bg-trade-dark border border-gray-700 rounded-xl p-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              {editingId ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingId ? 'Edit Difficulty Level' : 'Create New Difficulty Level'}
            </h2>
            <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Level Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                  placeholder="e.g. Beginner"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({...formData, color: color.value})}
                      className={`h-10 rounded-lg border-2 transition-all ${
                        formData.color === color.value 
                          ? 'border-white ring-2 ring-offset-2 ring-offset-trade-dark ring-white' 
                          : 'border-gray-600 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Description</label>
              <textarea 
                required
                className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none h-24 resize-none"
                placeholder="Brief description of this difficulty level..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">
                  Minimum Modules Required
                </label>
                <input 
                  type="number" 
                  min="0"
                  className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                  placeholder="e.g. 5"
                  value={formData.minModules || ''}
                  onChange={e => setFormData({...formData, minModules: parseInt(e.target.value) || undefined})}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">
                  Maximum Modules Allowed
                </label>
                <input 
                  type="number" 
                  min="0"
                  className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                  placeholder="e.g. 10"
                  value={formData.maxModules || ''}
                  onChange={e => setFormData({...formData, maxModules: parseInt(e.target.value) || undefined})}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
              <button 
                type="button" 
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 rounded-lg font-bold text-gray-400 hover:bg-gray-800 hover:text-white transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2"
              >
                <Save className="h-5 w-5" /> Save Level
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Difficulty Levels</h3>
            <button 
              onClick={handleAddNew}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition shadow-lg shadow-blue-900/20"
            >
              <Plus className="h-4 w-4" /> Add Level
            </button>
          </div>

          {levels.length === 0 ? (
            <div className="bg-trade-dark border border-dashed border-gray-700 rounded-xl p-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-400">No difficulty levels found</h3>
              <p className="text-gray-500">Get started by adding your first difficulty level.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {levels.map((level) => (
                <div 
                  key={level.id} 
                  className="bg-trade-dark border border-gray-700 rounded-xl p-6 transition-all hover:border-blue-500/50"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: level.color }}
                      >
                        {level.name.charAt(0).toUpperCase()}
                      </div>
                      <h4 className="text-lg font-bold text-white">{level.name}</h4>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(level)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(level.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-4">{level.description}</p>
                  
                  <div className="space-y-2 text-xs">
                    {level.minModules !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Minimum Modules:</span>
                        <span className="text-white font-mono">{level.minModules}</span>
                      </div>
                    )}
                    {level.maxModules !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Maximum Modules:</span>
                        <span className="text-white font-mono">{level.maxModules}</span>
                      </div>
                    )}
                    {level.prerequisites && level.prerequisites.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Prerequisites:</span>
                        <span className="text-white">{level.prerequisites.length}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Courses using this level:</span>
                      <span className="text-white font-bold">0</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DifficultyLevelManager;