import { supabase } from './supabase/client';

async function testBusinessMetrics() {
  console.log('Testing business metrics functions...');
  
  try {
    // Test get_all_students_for_admin function
    console.log('\n1. Testing get_all_students_for_admin function...');
    const { data: studentsData, error: studentsError } = await supabase.rpc('get_all_students_for_admin');
    
    if (studentsError) {
      console.error('❌ ERROR: Failed to fetch students:', studentsError);
    } else {
      console.log(`✅ SUCCESS: Found ${studentsData.length} students`);
      console.log('Sample students:', studentsData.slice(0, 3));
      
      // Check if our specific student is in the list
      const targetStudentId = '69e4e1ae-b84d-4023-bead-71ecf479ed6e';
      const targetStudent = studentsData.find((s: any) => s.id === targetStudentId);
      if (targetStudent) {
        console.log(`✅ SUCCESS: Target student found in students list`);
        console.log('Target student data:', targetStudent);
      } else {
        console.log(`⚠️  WARNING: Target student not found in students list`);
      }
    }
    
    // Test get_business_metrics function
    console.log('\n2. Testing get_business_metrics function...');
    const { data: metricsData, error: metricsError } = await supabase.rpc('get_business_metrics');
    
    if (metricsError) {
      console.error('❌ ERROR: Failed to fetch business metrics:', metricsError);
    } else {
      console.log('✅ SUCCESS: Business metrics fetched successfully');
      console.log('Business metrics:', metricsData);
      
      if (metricsData && metricsData.length > 0) {
        const metrics = metricsData[0];
        console.log(`\n📊 Business Metrics Summary:`);
        console.log(`   Total Revenue: $${metrics.total_revenue || 0}`);
        console.log(`   MRR: $${metrics.mrr || 0}`);
        console.log(`   Churn Rate: ${metrics.churn_rate || 0}%`);
        console.log(`   Foundation Count: ${metrics.foundation_count || 0}`);
        console.log(`   Professional Count: ${metrics.professional_count || 0}`);
        console.log(`   Elite Count: ${metrics.elite_count || 0}`);
      }
    }
    
    // Test direct query to profiles table
    console.log('\n3. Testing direct profiles query...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, subscription_tier, role')
      .eq('role', 'student');
    
    if (profilesError) {
      console.error('❌ ERROR: Failed to fetch profiles:', profilesError);
    } else {
      console.log(`✅ SUCCESS: Found ${profilesData.length} student profiles`);
      console.log('Sample profiles:', profilesData.slice(0, 3));
      
      // Check if our specific student is in the list
      const targetStudentId = '69e4e1ae-b84d-4023-bead-71ecf479ed6e';
      const targetProfile = profilesData.find((p: any) => p.id === targetStudentId);
      if (targetProfile) {
        console.log(`✅ SUCCESS: Target profile found in profiles list`);
        console.log('Target profile data:', targetProfile);
      } else {
        console.log(`⚠️  WARNING: Target profile not found in profiles list`);
      }
    }
    
  } catch (error) {
    console.error('❌ UNEXPECTED ERROR:', error);
  }
  
  console.log('\n=== BUSINESS METRICS TEST COMPLETE ===');
}

// Run the test
testBusinessMetrics();