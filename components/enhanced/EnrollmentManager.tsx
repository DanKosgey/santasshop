import React, { useState } from 'react';
import { Course, Enrollment, StudentProfile } from '../../types';
import { 
  User, BookOpen, Search, Filter, CheckCircle, XCircle, 
  Clock, Calendar, Award, Lock, Unlock, Plus, Eye, Edit2
} from 'lucide-react';

interface EnrollmentManagerProps {
  courses: Course[];
  enrollments: Enrollment[];
  students: StudentProfile[];
  onEnrollStudent: (profileId: string, courseId: string) => void;
  onUpdateEnrollment: (enrollmentId: string, updates: Partial<Enrollment>) => void;
}

const EnrollmentManager: React.FC<EnrollmentManagerProps> = ({
  courses,
  enrollments,
  students,
  onEnrollStudent,
  onUpdateEnrollment
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [newEnrollment, setNewEnrollment] = useState({
    profileId: '',
    courseId: ''
  });

  // Filter enrollments
  const filteredEnrollments = enrollments.filter(enrollment => {
    const student = students.find(s => s.id === enrollment.profileId);
    const course = courses.find(c => c.id === enrollment.courseId);
    
    const matchesSearch = searchTerm === '' || 
      (student?.name && student.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student?.email && student.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course?.title && course.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCourse = courseFilter === 'all' || enrollment.courseId === courseFilter;
    const matchesStatus = statusFilter === 'all' || enrollment.status === statusFilter;
    
    return matchesSearch && matchesCourse && matchesStatus;
  });

  // Handle new enrollment
  const handleEnrollStudent = () => {
    if (newEnrollment.profileId && newEnrollment.courseId) {
      onEnrollStudent(newEnrollment.profileId, newEnrollment.courseId);
      setNewEnrollment({ profileId: '', courseId: '' });
      setIsEnrolling(false);
    }
  };

  // Update enrollment status
  const updateEnrollmentStatus = (enrollmentId: string, status: 'active' | 'completed' | 'dropped') => {
    onUpdateEnrollment(enrollmentId, { status });
  };

  // Get student by ID
  const getStudentById = (id: string) => {
    return students.find(student => student.id === id);
  };

  // Get course by ID
  const getCourseById = (id: string) => {
    return courses.find(course => course.id === id);
  };

  // Render enrollment details modal
  const renderEnrollmentDetails = () => {
    if (!selectedEnrollment) return null;
    
    const student = getStudentById(selectedEnrollment.profileId);
    const course = getCourseById(selectedEnrollment.courseId);
    
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-trade-dark border border-gray-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-white">Enrollment Details</h3>
              <button 
                onClick={() => setSelectedEnrollment(null)}
                className="text-gray-500 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Student Info */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                  <User className="h-5 w-5" /> Student Information
                </h4>
                {student ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Name</div>
                      <div className="text-white">{student.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Email</div>
                      <div className="text-white">{student.email}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Tier</div>
                      <div className="text-white capitalize">{student.tier}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Status</div>
                      <div className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                        student.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        student.status === 'at-risk' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {student.status}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">Student information not available</div>
                )}
              </div>
              
              {/* Course Info */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" /> Course Information
                </h4>
                {course ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Title</div>
                      <div className="text-white">{course.title}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Level</div>
                      <div className={`inline-flex px-2 py-1 rounded-full text-xs font-bold capitalize ${
                        course.level === 'beginner' ? 'bg-green-500/20 text-green-400' :
                        course.level === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {course.level}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Duration</div>
                      <div className="text-white">{course.duration}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Instructor</div>
                      <div className="text-white">{course.instructor || 'Not assigned'}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">Course information not available</div>
                )}
              </div>
              
              {/* Enrollment Info */}
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5" /> Enrollment Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Enrolled Date</div>
                    <div className="text-white">
                      {selectedEnrollment.enrolledAt.toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Status</div>
                    <div className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                      selectedEnrollment.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                      selectedEnrollment.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {selectedEnrollment.status}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Progress</div>
                    <div className="text-white">{selectedEnrollment.progress || 0}%</div>
                  </div>
                  {selectedEnrollment.status === 'completed' && selectedEnrollment.completedAt && (
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Completed Date</div>
                      <div className="text-white">
                        {selectedEnrollment.completedAt.toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => updateEnrollmentStatus(selectedEnrollment.id, 'active')}
                  disabled={selectedEnrollment.status === 'active'}
                  className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${
                    selectedEnrollment.status === 'active'
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  <Unlock className="h-4 w-4" /> Activate
                </button>
                
                <button
                  onClick={() => updateEnrollmentStatus(selectedEnrollment.id, 'completed')}
                  disabled={selectedEnrollment.status === 'completed'}
                  className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${
                    selectedEnrollment.status === 'completed'
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-500 text-white'
                  }`}
                >
                  <CheckCircle className="h-4 w-4" /> Complete
                </button>
                
                <button
                  onClick={() => updateEnrollmentStatus(selectedEnrollment.id, 'dropped')}
                  disabled={selectedEnrollment.status === 'dropped'}
                  className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${
                    selectedEnrollment.status === 'dropped'
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-500 text-white'
                  }`}
                >
                  <XCircle className="h-4 w-4" /> Drop
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render new enrollment form
  const renderNewEnrollmentForm = () => {
    if (!isEnrolling) return null;
    
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-trade-dark border border-gray-700 rounded-xl w-full max-w-md">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-white">Enroll Student</h3>
              <button 
                onClick={() => setIsEnrolling(false)}
                className="text-gray-500 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Student</label>
                <select
                  className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                  value={newEnrollment.profileId}
                  onChange={(e) => setNewEnrollment({...newEnrollment, profileId: e.target.value})}
                >
                  <option value="">Select a student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-2 uppercase font-bold">Course</label>
                <select
                  className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                  value={newEnrollment.courseId}
                  onChange={(e) => setNewEnrollment({...newEnrollment, courseId: e.target.value})}
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setIsEnrolling(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEnrollStudent}
                  disabled={!newEnrollment.profileId || !newEnrollment.courseId}
                  className={`px-4 py-2 rounded-lg font-bold ${
                    !newEnrollment.profileId || !newEnrollment.courseId
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  Enroll Student
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="text-white pb-10">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <User className="h-8 w-8 text-trade-accent" />
            Enrollment Management
          </h1>
          <p className="text-gray-400 mt-1">Manage student enrollments and course access.</p>
        </div>
        
        <button
          onClick={() => setIsEnrolling(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition shadow-lg shadow-blue-900/20"
        >
          <Plus className="h-4 w-4" /> Enroll Student
        </button>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search students or courses..."
            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div>
          <select
            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
          >
            <option value="all">All Courses</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        </div>
        
        <div>
          <select
            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="dropped">Dropped</option>
          </select>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-trade-dark border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <User className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="text-xl font-bold">{enrollments.length}</div>
              <div className="text-sm text-gray-400">Total Enrollments</div>
            </div>
          </div>
        </div>
        
        <div className="bg-trade-dark border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <div className="text-xl font-bold">
                {enrollments.filter(e => e.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-400">Completed</div>
            </div>
          </div>
        </div>
        
        <div className="bg-trade-dark border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="text-xl font-bold">
                {enrollments.filter(e => e.status === 'active').length}
              </div>
              <div className="text-sm text-gray-400">Active</div>
            </div>
          </div>
        </div>
        
        <div className="bg-trade-dark border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <div className="text-xl font-bold">
                {enrollments.filter(e => e.status === 'dropped').length}
              </div>
              <div className="text-sm text-gray-400">Dropped</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enrollments Table */}
      <div className="bg-trade-dark border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="text-left p-4 text-xs uppercase text-gray-500 font-bold">Student</th>
                <th className="text-left p-4 text-xs uppercase text-gray-500 font-bold">Course</th>
                <th className="text-left p-4 text-xs uppercase text-gray-500 font-bold">Enrolled Date</th>
                <th className="text-left p-4 text-xs uppercase text-gray-500 font-bold">Progress</th>
                <th className="text-left p-4 text-xs uppercase text-gray-500 font-bold">Status</th>
                <th className="text-left p-4 text-xs uppercase text-gray-500 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No enrollments found</p>
                    <p className="text-sm mt-1">
                      {searchTerm || courseFilter !== 'all' || statusFilter !== 'all' 
                        ? 'Try adjusting your filters' 
                        : 'No students are enrolled in courses yet'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEnrollments.map(enrollment => {
                  const student = getStudentById(enrollment.profileId);
                  const course = getCourseById(enrollment.courseId);
                  
                  return (
                    <tr key={enrollment.id} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-800/20">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold">
                            {student?.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-medium text-white">
                              {student?.name || 'Unknown Student'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {student?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-white">
                            {course?.title || 'Unknown Course'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {course?.instructor || 'No instructor'}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-400">
                        {enrollment.enrolledAt.toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${enrollment.progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-400">{enrollment.progress || 0}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                          enrollment.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                          enrollment.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {enrollment.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedEnrollment(enrollment)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              const newStatus = enrollment.status === 'active' ? 'completed' : 'active';
                              updateEnrollmentStatus(enrollment.id, newStatus);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition"
                            title={enrollment.status === 'active' ? 'Mark as Completed' : 'Activate'}
                          >
                            {enrollment.status === 'active' ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Unlock className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modals */}
      {renderEnrollmentDetails()}
      {renderNewEnrollmentForm()}
    </div>
  );
};

export default EnrollmentManager;