# Subscription Tier System Testing Plan

## Overview
This document outlines the testing plan for verifying the end-to-end functionality of the subscription tier system, including signup flows, tier management, community access controls, and admin workflows.

## Test Scenarios

### 1. OTP-based Signup Flow
**Objective**: Verify that users can successfully sign up using OTP-based email verification

**Test Steps**:
1. Navigate to the signup page
2. Fill in user details (name, email, password)
3. Select a subscription tier (free, foundation, professional, elite)
4. Submit the signup form
5. Check email for verification code
6. Enter verification code
7. Verify successful account creation and proper tier assignment

**Expected Results**:
- User receives verification code via email
- Account is created with correct subscription tier
- User is properly routed based on their tier

### 2. Free Tier Signup and Access
**Objective**: Verify that free tier users get immediate community access

**Test Steps**:
1. Sign up as a new user selecting "Free" tier
2. Complete OTP verification
3. Verify user is redirected to community page
4. Verify user can access community features
5. Verify user cannot access premium features

**Expected Results**:
- Free tier users are immediately directed to community
- Community access is granted
- Premium features are properly restricted

### 3. Premium Tier Signup and Review Process
**Objective**: Verify that premium applicants go through admin review

**Test Steps**:
1. Sign up as a new user selecting a premium tier (foundation, professional, elite)
2. Complete OTP verification
3. Verify user is redirected to "Under Review" page
4. Verify user has limited access while under review
5. Admin approves the application
6. Verify user gets access to premium features

**Expected Results**:
- Premium applicants are directed to "Under Review" page
- Users have limited access while pending
- Admin approval grants appropriate access

### 4. Admin Application Review Workflow
**Objective**: Verify that admins can review and process applications

**Test Steps**:
1. Log in as admin user
2. Navigate to Applications tab
3. Verify pending applications are displayed
4. Approve a pending application
5. Verify user's tier is updated
6. Verify notification is sent to user
7. Reject a pending application
8. Verify user's tier is updated to free
9. Verify notification is sent to user

**Expected Results**:
- Pending applications are visible in admin portal
- Approval updates user tier to appropriate premium tier
- Rejection updates user tier to free
- Notifications are sent for both actions

### 5. Community Access Controls
**Objective**: Verify that community access is properly controlled by subscription tier

**Test Steps**:
1. Log in as free tier user
2. Navigate to community page
3. Verify access to free community features
4. Verify restricted access to premium features
5. Log in as premium user
6. Navigate to community page
7. Verify access to all community features

**Expected Results**:
- Free tier users have limited community access
- Premium users have full community access
- Proper UI indicators show access restrictions

### 6. Subscription History Tracking
**Objective**: Verify that subscription tier changes are properly tracked

**Test Steps**:
1. Create a user with free tier
2. Upgrade user to professional tier via admin
3. Check subscription_history table
4. Verify entry is created for tier change
5. Downgrade user to free tier
6. Check subscription_history table
7. Verify entry is created for tier change

**Expected Results**:
- Subscription history table tracks all tier changes
- Entries include user_id, old_tier, new_tier, and timestamps
- Triggers properly fire on tier updates

### 7. Notification System
**Objective**: Verify that proper notifications are sent for application status changes

**Test Steps**:
1. Submit a premium application
2. Verify "Application Received" notification is sent
3. Admin approves application
4. Verify "Application Approved" notification is sent
5. Admin rejects application
6. Verify "Application Rejected" notification is sent

**Expected Results**:
- All application status changes trigger appropriate notifications
- Notifications are properly formatted
- Notifications are sent to correct users

## Test Data Requirements

### User Accounts
- Free tier user
- Foundation tier user
- Professional tier user
- Elite tier user
- Elite-pending user
- Admin user

### Test Scenarios Matrix
| Scenario | User Type | Initial Tier | Action | Expected Final Tier |
|----------|-----------|--------------|--------|-------------------|
| 1 | New User | None | Signup (Free) | Free |
| 2 | New User | None | Signup (Premium) | Elite-Pending |
| 3 | Pending User | Elite-Pending | Admin Approve | Elite |
| 4 | Pending User | Elite-Pending | Admin Reject | Free |
| 5 | Free User | Free | Admin Upgrade | Professional |
| 6 | Premium User | Professional | Admin Downgrade | Free |

## Acceptance Criteria

1. All signup flows work with OTP verification
2. Users are properly routed based on subscription tier
3. Free tier users get immediate community access
4. Premium applicants go through admin review process
5. Admin can view and process pending applications
6. Subscription tier changes are properly tracked
7. Notifications are sent for all status changes
8. Community access is properly controlled by subscription tier
9. All edge cases are handled gracefully
10. System maintains data integrity throughout all operations

## Testing Tools
- Browser testing (Chrome, Firefox, Safari)
- Email verification testing
- Database query validation
- UI interaction testing
- Performance testing for high-concurrency scenarios

## Rollback Plan
If issues are discovered during testing:
1. Document the issue with detailed steps to reproduce
2. Identify the component causing the issue
3. Create a fix branch for the specific issue
4. Test the fix in isolation
5. Merge fix after verification
6. Retest the entire flow to ensure no regressions