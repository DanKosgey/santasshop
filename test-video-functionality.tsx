import React from 'react';
import { CourseModule } from './types';

// Test data for a video module
const testVideoModule: CourseModule = {
  id: 'test-video-module-1',
  courseId: 'test-course-1',
  title: 'Test Video Module',
  description: 'This is a test module to verify video functionality',
  duration: '10m',
  level: 'beginner',
  completed: false,
  locked: false,
  content: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Rickroll test video
  contentType: 'video',
  order: 1
};

// Test data for a text module
const testTextModule: CourseModule = {
  id: 'test-text-module-1',
  courseId: 'test-course-1',
  title: 'Test Text Module',
  description: 'This is a test module to verify text functionality',
  duration: '5m',
  level: 'beginner',
  completed: false,
  locked: false,
  content: '# Test Text Content\n\nThis is a test of the text content functionality.',
  contentType: 'text',
  order: 2
};

console.log('Test Video Module:', testVideoModule);
console.log('Test Text Module:', testTextModule);

// Verify that the video module has the correct content type
if (testVideoModule.contentType === 'video' && testVideoModule.content) {
  console.log('✓ Video module correctly configured with content type and URL');
} else {
  console.log('✗ Video module configuration error');
}

// Verify that the text module has the correct content type
if (testTextModule.contentType === 'text' && testTextModule.content) {
  console.log('✓ Text module correctly configured with content type and content');
} else {
  console.log('✗ Text module configuration error');
}

export { testVideoModule, testTextModule };