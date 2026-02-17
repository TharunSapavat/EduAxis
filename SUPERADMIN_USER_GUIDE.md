# Super Admin Dashboard - User Guide

## 📖 Table of Contents
1. [Overview](#overview)
2. [Accessing the Dashboard](#accessing-the-dashboard)
3. [Dashboard Layout](#dashboard-layout)
4. [Main Features](#main-features)
5. [Step-by-Step Guides](#step-by-step-guides)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The **Super Admin Dashboard** is the central control panel for managing the entire EduAxis platform. As a super admin, you have complete oversight of all schools, users, and platform statistics.

### What You Can Do:
- ✅ Create and manage schools
- ✅ Monitor platform-wide statistics
- ✅ Activate/suspend school accounts
- ✅ View all schools' users and data
- ✅ Track subscription plans and billing
- ✅ Manage school administrators
- ✅ Generate platform reports

---

## Accessing the Dashboard

### Initial Setup (First Time)

1. **Access the Secret Login Route**
   - Navigate to: `http://localhost:5173/system-access`
   - This is a hidden route not accessible from the main login page

2. **Login Credentials**
   - **Email:** Your super admin email (configured during initial setup)
   - **Password:** Your secure super admin password
   - **Role:** Select "Super Admin" from dropdown
   - Leave **School Code** field empty (super admins don't belong to any school)

3. **Click "Login"**
   - You'll be redirected to `/superadmin/home`

### Regular Access After Setup

Once logged in, bookmark the super admin dashboard URL:
- **Dashboard Home:** `http://localhost:5173/superadmin/home`
- **Schools Management:** `http://localhost:5173/superadmin/schools`
- **Statistics:** `http://localhost:5173/superadmin/statistics`

---

## Dashboard Layout

### Navigation Sidebar (Left)

The sidebar contains 4 main sections:

```
┌─────────────────────┐
│ 📊 Dashboard        │  ← Overview of platform
│ 🏫 Schools          │  ← Manage all schools
│ 📈 Statistics       │  ← Platform analytics
│ ⚙️  Settings        │  ← System settings
└─────────────────────┘
```

- **Toggle Sidebar:** Click the hamburger icon (☰) to collapse/expand
- **Active Section:** Highlighted in red
- **Navigation:** Click any section to navigate

### Top Header

```
┌──────────────────────────────────────────────┐
│  EduAxis    [Search...]    [Notifications] 👤│
└──────────────────────────────────────────────┘
```

- **Logo:** Click to return to dashboard home
- **Search:** Quick search across schools
- **Profile:** Your super admin profile and logout option

---

## Main Features

### 1. Dashboard Home (`/superadmin/home`)

**Overview Cards:**
- **Total Schools** - Number of schools on platform
- **Active Schools** - Currently operating schools
- **Total Students** - Students across all schools
- **Total Revenue** - Monthly revenue (₹ INR)

**Platform Statistics:**
Displays pie chart showing:
- Trial subscriptions
- Basic subscriptions
- Premium subscriptions
- Enterprise subscriptions

**Recent Activity:**
- Newly registered schools
- Recent school updates
- System notifications

**Quick Actions:**
- 🏫 Manage Schools - Jump to school management
- 📈 View Analytics - Access detailed statistics

---

### 2. Schools Management (`/superadmin/schools`)

**School Statistics Cards:**
```
┌───────────────┬───────────────┬───────────────┬───────────────┐
│ Total Schools │ Active        │ Inactive      │ Suspended     │
│     50        │     42        │      6        │      2        │
└───────────────┴───────────────┴───────────────┴───────────────┘
```

**Search & Filter:**
- **Search Bar:** Search by school name, code, or email
- **Status Filter:** Filter by All / Active / Inactive / Suspended

**Schools Table:**

| School | Code | Users | Subscription | Status | Actions |
|--------|------|-------|--------------|--------|---------|
| Harvard University | HARV001 | 👨‍🎓 245<br>👨‍🏫 18 | Premium | Active | 👁️ 📝 🗑️ |

**Columns Explained:**
- **School:** Name and contact email
- **Code:** Unique school identifier
- **Users:** Student and teacher counts
- **Subscription:** Current plan (Trial/Basic/Premium/Enterprise)
- **Status:** Active, Inactive, or Suspended
- **Actions:** View, Edit, Delete buttons

---

### 3. Statistics (`/superadmin/statistics`)

**Real-Time Platform Metrics:**

📊 **User Statistics**
- Total users across all schools
- Active vs inactive users
- User growth trends
- Users by role breakdown

📈 **Academic Statistics**
- Total courses offered
- Total assignments created
- Assignment completion rates
- Grade averages by school

💰 **Revenue Analytics**
- Monthly recurring revenue (MRR)
- Annual recurring revenue (ARR)
- Revenue by subscription tier
- Revenue growth trends

📅 **Growth Metrics**
- New schools this month
- Student enrollment rate
- Platform adoption rate
- Churn rate

---

## Step-by-Step Guides

### 🎯 Creating a New School

1. **Navigate to Schools**
   - Click "Schools" in the left sidebar

2. **Click "Add School" Button**
   - Located in the top-right corner (red button with + icon)

3. **Fill in School Information**
   ```
   ┌─────────────────────────────────────┐
   │ School Information                  │
   ├─────────────────────────────────────┤
   │ School Name: Harvard University     │
   │ School Code: HARV001                │
   │ Email: contact@harvard.edu          │
   │ Phone: +1 617-495-1000              │
   │ Domains: harvard.edu, fas.harvard.edu│
   └─────────────────────────────────────┘
   ```

   **Field Descriptions:**
   - **School Name:** Official name of the institution (min 3 chars)
   - **School Code:** Unique identifier (3-10 alphanumeric, auto-uppercase)
   - **Email:** Main contact email for the school
   - **Phone:** School's contact number
   - **Allowed Email Domains:** Comma-separated list (students with these domains can auto-register)
     - Example: `harvard.edu, student.harvard.edu`
     - Students with emails ending in these domains will automatically be assigned to this school

4. **Create Initial Admin User**
   ```
   ┌─────────────────────────────────────┐
   │ Initial Admin User                  │
   ├─────────────────────────────────────┤
   │ Admin Name: John Doe                │
   │ Admin Email: admin@harvard.edu      │
   │ Password: SecurePass@123            │
   │ Phone: +1 617-555-0123              │
   └─────────────────────────────────────┘
   ```

   **Important Notes:**
   - Admin password must be at least 6 characters (10+ recommended)
   - Admin will manage this school's operations
   - Admin cannot be changed later (contact super admin to add more)

5. **Review & Submit**
   - Review all information
   - Click **"Create School & Admin"** button
   - Wait for confirmation (modal closes on success)

6. **Verification**
   - New school appears in the schools table
   - Initial status: **"Pending"** or **"Active"** (based on configuration)
   - Admin receives automated email with login credentials

---

### 👁️ Viewing School Details

1. **Locate the School**
   - Go to Schools section
   - Use search or scroll to find the school

2. **Click "View Details" Icon (👁️)**
   - Located in the Actions column
   - Opens detailed school information panel

3. **Information Displayed:**

   **Basic Info:**
   - School name, code, email, phone
   - Address (street, city, state, country, zip)
   - Principal details
   - Allowed email domains

   **Statistics:**
   - Total Students: `245`
   - Total Teachers: `18`
   - Total Admins: `3`
   - Total Courses: `42`

   **Subscription Details:**
   - Current Plan: Premium
   - Start Date: Jan 15, 2026
   - End Date: Jan 15, 2027
   - Max Students: 500
   - Max Teachers: 50

   **Users List:**
   - Students table with names, emails, grades
   - Teachers table with names, subjects
   - Admins table with names, contact info

   **Courses List:**
   - Course names, codes, teachers
   - Student counts per course

4. **Actions Available:**
   - View all students
   - View all teachers
   - View all courses
   - Edit school details
   - Change subscription plan
   - Activate/Suspend account

---

### ✏️ Editing School Information

1. **Find the School**
   - Navigate to Schools section
   - Locate the school to edit

2. **Click "Edit" Icon (📝)**
   - Opens edit modal with pre-filled data

3. **Editable Fields:**
   ```
   School Name: [Can modify]
   School Code: [Cannot modify - read-only]
   Email: [Can modify]
   Phone: [Can modify]
   Address: [Can modify all fields]
   Principal: [Can modify]
   Allowed Email Domains: [Can add/remove]
   ```

4. **Subscription Management:**
   - Change plan: Trial → Basic → Premium → Enterprise
   - Adjust max students/teachers
   - Set subscription end date

5. **Status Management:**
   - **Active** - School is operational
   - **Inactive** - Temporarily disabled (users cannot login)
   - **Suspended** - Permanently disabled (requires super admin to reactivate)

6. **Save Changes**
   - Click "Save Changes" button
   - Changes take effect immediately
   - School admin receives notification email

---

### 🗑️ Deleting a School

⚠️ **WARNING: This action is permanent!**

1. **Consider Alternatives First:**
   - Suspend the school instead of deleting
   - Export data for backup
   - Ensure no active students/courses

2. **Delete Process:**
   - Click "Delete" icon (🗑️) in Actions column
   - Confirmation dialog appears:
     ```
     ⚠️  Are you sure you want to delete this school?
     
     This will permanently delete:
     - All students, teachers, and admins
     - All courses and assignments
     - All grades and attendance records
     - All library resources
     
     This action cannot be undone!
     
     [Cancel]  [Delete School]
     ```

3. **Type School Code to Confirm:**
   - Enter the school code (e.g., `HARV001`)
   - Click "Delete School" button
   - School is permanently removed from database

4. **Post-Deletion:**
   - School removed from table
   - All associated users accounts deleted
   - All data purged from system
   - Cannot be recovered

---

### 🔍 Searching & Filtering

**Search Functionality:**

1. **Search Bar Usage:**
   - Type in the search field
   - Searches across:
     - School names (e.g., "Harvard")
     - School codes (e.g., "HARV001")
     - Email addresses (e.g., "harvard.edu")
   - Results update in real-time

2. **Search Examples:**
   ```
   Search: "harvard"    → Finds "Harvard University"
   Search: "HARV"       → Finds "HARV001", "HARV002"
   Search: ".edu"       → Finds all .edu schools
   Search: "active"     → No results (use filter instead)
   ```

**Filter Functionality:**

1. **Status Filter Dropdown:**
   - **All Status** - Shows all schools
   - **Active** - Only operational schools
   - **Inactive** - Only disabled schools
   - **Suspended** - Only suspended schools

2. **Combining Search + Filter:**
   - Search: "university"
   - Filter: "Active"
   - Result: Only active schools with "university" in name

3. **Results Counter:**
   - Displays: `Showing 8 of 50 schools`
   - Updates based on search/filter

---

### 📊 Viewing Statistics & Analytics

1. **Navigate to Statistics Section**
   - Click "Statistics" in sidebar

2. **Dashboard Overview:**

   **Top Metrics (Cards):**
   ```
   ┌──────────────────────────────────────────────┐
   │  📈 Total Revenue    │  👥 Total Users       │
   │     ₹4,99,000       │      5,467            │
   ├──────────────────────────────────────────────┤
   │  📚 Total Courses    │  📝 Assignments       │
   │      1,234          │      3,456            │
   └──────────────────────────────────────────────┘
   ```

3. **Charts & Visualizations:**

   **Subscription Distribution (Pie Chart):**
   - Shows breakdown by plan type
   - Click segments for details

   **Growth Trends (Line Chart):**
   - Monthly user growth
   - Revenue trends
   - School registrations over time

4. **Detailed Reports:**
   - Click "Export Report" to download CSV
   - Select date range for custom reports
   - View historical data comparison

---

## Best Practices

### 🎯 School Management

**Before Creating a School:**
- [ ] Verify school information is accurate
- [ ] Ensure email domain is unique
- [ ] Create strong admin password
- [ ] Document school code for reference

**Regular Monitoring:**
- Check dashboard daily for:
  - New school registrations
  - Subscription expirations
  - System alerts
  - Unusual activity

**Data Hygiene:**
- Archive inactive schools (don't delete immediately)
- Regular cleanup of test accounts
- Maintain up-to-date contact information
- Review subscription limits quarterly

---

### 🔐 Security Best Practices

**Access Control:**
- Never share super admin credentials
- Use strong, unique passwords (10+ characters)
- Enable two-factor authentication (if available)
- Log out after each session
- Access only from secure networks

**Account Management:**
- Review school admin permissions monthly
- Suspend (don't delete) suspicious accounts
- Monitor failed login attempts
- Keep audit logs for compliance

**Data Protection:**
- Export backups weekly
- Verify GDPR/FERPA compliance
- Handle student data with care
- Report security incidents immediately

---

### 💡 Operational Tips

**Subscription Management:**
- Set reminders for subscription renewals
- Notify schools 30 days before expiration
- Offer grace period for renewals
- Track usage vs limits

**Communication:**
- Respond to school admin requests within 24 hours
- Maintain documentation of policy changes
- Send platform updates via email
- Create FAQ for common issues

**Performance Monitoring:**
- Check system uptime daily
- Monitor response times
- Track error rates
- Review user feedback regularly

---

## Troubleshooting

### ❌ Common Issues & Solutions

#### Issue: Cannot Login to Super Admin Dashboard

**Symptoms:**
- "Invalid credentials" error
- Redirected to landing page
- "Access denied" message

**Solutions:**
1. ✅ Verify you're using `/system-access` route
2. ✅ Check role is set to "Super Admin"
3. ✅ Leave school code field EMPTY
4. ✅ Clear browser cache and cookies
5. ✅ Check credentials with database admin

---

#### Issue: Schools Not Appearing in List

**Symptoms:**
- Empty schools table
- "No schools found" message
- Loading spinner forever

**Solutions:**
1. ✅ Check internet connection
2. ✅ Refresh the page (F5)
3. ✅ Clear search filters
4. ✅ Check browser console for errors
5. ✅ Verify backend API is running

**Backend Check:**
```bash
# Verify backend is running
curl http://localhost:5000/api/superadmin/dashboard

# Should return JSON with schools array
```

---

#### Issue: Cannot Create New School

**Symptoms:**
- "School code already exists" error
- "Validation failed" message
- Form won't submit

**Solutions:**
1. ✅ Use unique school code (check existing schools)
2. ✅ Ensure all required fields are filled
3. ✅ Verify email format is valid
4. ✅ Check password meets requirements (6+ chars)
5. ✅ Remove special characters from school name

**Validation Rules:**
- School Name: Min 3 characters
- School Code: 3-10 alphanumeric, unique
- Email: Valid email format
- Admin Password: Min 6 characters

---

#### Issue: School Statistics Not Updating

**Symptoms:**
- User counts stuck at 0
- Old data displayed
- Stats don't match reality

**Solutions:**
1. ✅ Wait 5 minutes (stats update on user creation)
2. ✅ Refresh dashboard (click reload icon)
3. ✅ Check if school has auto-update hooks enabled
4. ✅ Manually trigger stats recalculation

**Manual Stats Update (Backend):**
```javascript
// Contact backend administrator to run:
await School.findById(schoolId).recalculateStats();
```

---

#### Issue: Search/Filter Not Working

**Symptoms:**
- Search returns no results
- Filter doesn't apply
- Results don't match query

**Solutions:**
1. ✅ Clear search field and try again
2. ✅ Check spelling and case (search is case-insensitive)
3. ✅ Reset filter to "All Status"
4. ✅ Hard refresh page (Ctrl+Shift+R)

---

#### Issue: Cannot Delete School

**Symptoms:**
- Delete button doesn't work
- "Failed to delete" error
- School still appears after deletion

**Solutions:**
1. ✅ Check if school has active users (must remove first)
2. ✅ Verify you have super admin permissions
3. ✅ Try suspending instead of deleting
4. ✅ Contact system administrator

**Note:** Schools with active users cannot be deleted for data integrity.

---

## Quick Reference

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Focus search bar |
| `Esc` | Close modal/dialog |
| `Ctrl + R` | Refresh dashboard |
| `Tab` | Navigate between fields |

---

### Status Badge Colors

| Status | Color | Meaning |
|--------|-------|---------|
| 🟢 Active | Green | School operational |
| 🟡 Pending | Yellow | Awaiting approval |
| 🔴 Inactive | Gray | Temporarily disabled |
| ⚫ Suspended | Red | Permanently disabled |

---

### Subscription Plans

| Plan | Max Students | Max Teachers | Monthly Fee |
|------|-------------|--------------|-------------|
| Trial | 50 | 5 | ₹0 (30 days) |
| Basic | 300 | 20 | ₹1,999 |
| Premium | 1000 | 50 | ₹4,999 |
| Enterprise | Unlimited | Unlimited | Custom |

---

### API Endpoints (For Reference)

```
GET    /api/superadmin/dashboard        - Dashboard data
GET    /api/superadmin/statistics       - Platform stats
GET    /api/superadmin/schools          - List all schools
POST   /api/superadmin/schools          - Create school
GET    /api/superadmin/schools/:id      - Get school details
PUT    /api/superadmin/schools/:id      - Update school
DELETE /api/superadmin/schools/:id      - Delete school
PATCH  /api/superadmin/schools/:id/status - Update status
```

---

## Support & Resources

### Need Help?

**Documentation:**
- Security Audit: `SECURITY_AUDIT.md`
- Improvement Roadmap: `IMPROVEMENT_ROADMAP.md`
- Quick Fixes: `QUICK_SECURITY_FIXES.md`

**Contact:**
- Technical Support: support@eduaxis.com
- Security Issues: security@eduaxis.com
- General Inquiries: info@eduaxis.com

**Developer Resources:**
- Backend API Docs: `/docs/api`
- Frontend Components: `/docs/components`
- Database Schema: `/docs/schema`

---

## Changelog

### Version 1.0 (February 2026)
- ✅ Initial super admin dashboard
- ✅ School management CRUD operations
- ✅ Real-time statistics
- ✅ Multi-tenant architecture
- ✅ Subscription management

### Upcoming Features (Planned)
- 📧 Email notifications
- 📊 Advanced analytics dashboard
- 🔐 Two-factor authentication
- 📱 Mobile responsive design
- 🌍 Multi-language support
- 💳 Payment gateway integration

---

**Last Updated:** February 17, 2026  
**Guide Version:** 1.0  
**For:** EduAxis Super Admin Users
