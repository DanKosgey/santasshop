import React, { useState } from 'react';
import { CourseCategory } from '../../types';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

interface CategoryManagerProps {
  categories: CourseCategory[];
  onAddCategory: (category: Omit<CourseCategory, 'id'>) => void;
  onUpdateCategory: (id: string, category: Partial<CourseCategory>) => void;
  onDeleteCategory: (id: string) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CourseCategory>>({
    name: '',
    description: '',
    color: '#3B82F6' // Default blue color
  });

  const handleAddNew = () => {
    setIsEditing(true);
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6'
    });
  };

  const handleEdit = (category: CourseCategory) => {
    setIsEditing(true);
    setEditingId(category.id);
    setFormData({ 
      ...category,
      description: category.description || '',
      color: category.color || '#3B82F6'
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      // Update existing category
      onUpdateCategory(editingId, formData);
    } else {
      // Create new category
      onAddCategory({
        name: formData.name || 'Untitled Category',
        description: formData.description || '',
        color: formData.color || '#3B82F6'
      });
    }
    
    setIsEditing(false);
    setEditingId(null);
    setFormData({ name: '', description: '', color: '#3B82F6' });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({ name: '', description: '', color: '#3B82F6' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? Courses using this category will become uncategorized.')) {
      onDeleteCategory(id);
    }
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Course Categories</h2>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-trade-accent hover:bg-trade-accent/80 text-black font-bold rounded-lg transition"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">
            {editingId ? 'Edit Category' : 'Add New Category'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Category Name</label>
              <input
                type="text"
                required
                className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-trade-accent outline-none"
                placeholder="e.g. Trading Fundamentals"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-2">Description</label>
              <textarea
                className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-trade-accent outline-none h-24 resize-none"
                placeholder="Brief description of this category..."
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-2">Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  className="w-12 h-12 bg-black border border-gray-700 rounded-lg p-1 cursor-pointer"
                  value={formData.color || '#3B82F6'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
                <input
                  type="text"
                  className="flex-1 bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-trade-accent outline-none"
                  placeholder="#3B82F6"
                  value={formData.color || '#3B82F6'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-trade-accent hover:bg-trade-accent/80 text-black font-bold rounded-lg transition flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Category
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-4">
        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No categories found. Add your first category to get started.
          </div>
        ) : (
          categories.map((category) => (
            <div 
              key={category.id} 
              className="bg-gray-900/30 border border-gray-700 rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: category.color }}
                >
                  {category.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-white">{category.name}</h3>
                  <p className="text-sm text-gray-400">{category.description}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 hover:text-white transition"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryManager;