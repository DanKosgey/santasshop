import React, { useState, useEffect } from 'react';
import { Course, CourseModule, CourseCategory } from '../../types';
import { 
  Search, Filter, X, Tag, BookOpen, Clock, 
  User, Layers, ChevronDown, ChevronUp
} from 'lucide-react';

interface CourseSearchFilterProps {
  courses: Course[];
  modules: CourseModule[];
  categories: CourseCategory[];
  onSearchResults: (results: {courses: Course[], modules: CourseModule[]}) => void;
}

const CourseSearchFilter: React.FC<CourseSearchFilterProps> = ({
  courses,
  modules,
  categories,
  onSearchResults
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'title' | 'duration' | 'level'>('relevance');

  // Filter and search courses/modules
  useEffect(() => {
    // If no search term and no filters, return all
    if (!searchTerm && selectedCategories.length === 0 && selectedLevels.length === 0 && selectedContentTypes.length === 0) {
      onSearchResults({ courses, modules });
      return;
    }

    // Filter courses
    let filteredCourses = [...courses];
    
    // Apply category filter
    if (selectedCategories.length > 0) {
      filteredCourses = filteredCourses.filter(course => 
        course.categoryId && selectedCategories.includes(course.categoryId)
      );
    }
    
    // Apply level filter
    if (selectedLevels.length > 0) {
      filteredCourses = filteredCourses.filter(course => 
        selectedLevels.includes(course.level)
      );
    }
    
    // Filter modules
    let filteredModules = [...modules];
    
    // Apply content type filter
    if (selectedContentTypes.length > 0) {
      filteredModules = filteredModules.filter(module => 
        module.contentType && selectedContentTypes.includes(module.contentType)
      );
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      
      // Search in courses
      filteredCourses = filteredCourses.filter(course => 
        course.title.toLowerCase().includes(term) ||
        course.description.toLowerCase().includes(term) ||
        course.instructor?.toLowerCase().includes(term)
      );
      
      // Search in modules
      filteredModules = filteredModules.filter(module => 
        module.title.toLowerCase().includes(term) ||
        module.description?.toLowerCase().includes(term)
      );
    }
    
    // Sort results
    if (sortBy === 'title') {
      filteredCourses.sort((a, b) => a.title.localeCompare(b.title));
      filteredModules.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'duration') {
      filteredCourses.sort((a, b) => a.duration.localeCompare(b.duration));
      filteredModules.sort((a, b) => a.duration.localeCompare(b.duration));
    } else if (sortBy === 'level') {
      const levelOrder = { beginner: 1, intermediate: 2, advanced: 3 };
      filteredCourses.sort((a, b) => 
        (levelOrder[a.level] || 0) - (levelOrder[b.level] || 0)
      );
      filteredModules.sort((a, b) => 
        (levelOrder[a.level] || 0) - (levelOrder[b.level] || 0)
      );
    }
    
    onSearchResults({ courses: filteredCourses, modules: filteredModules });
  }, [searchTerm, selectedCategories, selectedLevels, selectedContentTypes, sortBy, courses, modules, onSearchResults]);

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    );
  };

  // Toggle level selection
  const toggleLevel = (level: string) => {
    setSelectedLevels(prev => 
      prev.includes(level) 
        ? prev.filter(l => l !== level) 
        : [...prev, level]
    );
  };

  // Toggle content type selection
  const toggleContentType = (type: string) => {
    setSelectedContentTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type) 
        : [...prev, type]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedLevels([]);
    setSelectedContentTypes([]);
  };

  // Check if any filters are applied
  const hasFilters = searchTerm !== '' || 
    selectedCategories.length > 0 || 
    selectedLevels.length > 0 || 
    selectedContentTypes.length > 0;

  return (
    <div className="bg-trade-dark border border-gray-700 rounded-xl p-6">
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search courses and modules..."
          className="w-full bg-black border border-gray-700 rounded-lg p-4 text-white focus:border-blue-500 outline-none pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {/* Filter Toggle */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-gray-400 hover:text-white"
        >
          <Filter className="h-4 w-4" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
          {showFilters ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-red-400 flex items-center gap-1"
          >
            <X className="h-4 w-4" /> Clear all
          </button>
        )}
      </div>
      
      {/* Filters */}
      {showFilters && (
        <div className="space-y-6 pb-4 border-b border-gray-700">
          {/* Categories */}
          <div>
            <h4 className="font-bold text-white mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4" /> Categories
            </h4>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-bold transition ${
                    selectedCategories.includes(category.id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                  style={
                    selectedCategories.includes(category.id) 
                      ? { backgroundColor: category.color } 
                      : {}
                  }
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Difficulty Levels */}
          <div>
            <h4 className="font-bold text-white mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4" /> Difficulty Levels
            </h4>
            <div className="flex flex-wrap gap-2">
              {['beginner', 'intermediate', 'advanced'].map(level => (
                <button
                  key={level}
                  onClick={() => toggleLevel(level)}
                  className={`px-3 py-1.5 rounded-full text-sm font-bold capitalize transition ${
                    selectedLevels.includes(level)
                      ? level === 'beginner' 
                        ? 'bg-green-500 text-white' 
                        : level === 'intermediate' 
                          ? 'bg-yellow-500 text-white' 
                          : 'bg-red-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          
          {/* Content Types */}
          <div>
            <h4 className="font-bold text-white mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Content Types
            </h4>
            <div className="flex flex-wrap gap-2">
              {['video', 'text'].map(type => (
                <button
                  key={type}
                  onClick={() => toggleContentType(type)}
                  className={`px-3 py-1.5 rounded-full text-sm font-bold capitalize transition ${
                    selectedContentTypes.includes(type)
                      ? type === 'video' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-purple-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Sort Options */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
        <div className="text-sm text-gray-400">
          {courses.length} courses, {modules.length} modules
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Sort by:</span>
          <select
            className="bg-black border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-blue-500 outline-none"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="relevance">Relevance</option>
            <option value="title">Title</option>
            <option value="duration">Duration</option>
            <option value="level">Difficulty</option>
          </select>
        </div>
      </div>
      
      {/* Active Filters */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-700">
          {searchTerm && (
            <div className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-full text-sm">
              <Search className="h-3 w-3" />
              <span>"{searchTerm}"</span>
              <button 
                onClick={() => setSearchTerm('')}
                className="text-gray-500 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {selectedCategories.map(categoryId => {
            const category = categories.find(c => c.id === categoryId);
            return category ? (
              <div 
                key={categoryId} 
                className="flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                style={{ backgroundColor: `${category.color}20`, color: category.color }}
              >
                <Tag className="h-3 w-3" />
                <span>{category.name}</span>
                <button 
                  onClick={() => toggleCategory(categoryId)}
                  className="hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : null;
          })}
          
          {selectedLevels.map(level => (
            <div 
              key={level} 
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm capitalize ${
                level === 'beginner' ? 'bg-green-500/20 text-green-400' :
                level === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}
            >
              <Layers className="h-3 w-3" />
              <span>{level}</span>
              <button 
                onClick={() => toggleLevel(level)}
                className="hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          {selectedContentTypes.map(type => (
            <div 
              key={type} 
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm capitalize ${
                type === 'video' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
              }`}
            >
              <BookOpen className="h-3 w-3" />
              <span>{type}</span>
              <button 
                onClick={() => toggleContentType(type)}
                className="hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseSearchFilter;