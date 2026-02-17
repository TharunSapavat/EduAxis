# Super Admin Dashboard - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Login (1 minute)
1. Go to: `http://localhost:5173/system-access`
2. Enter credentials:
   - Email: `your_superadmin@email.com`
   - Password: `your_password`
   - Role: **Super Admin**
   - School Code: **(leave empty)**
3. Click **Login**

---

### Step 2: Navigate Dashboard (1 minute)

**Left Sidebar Navigation:**
```
📊 Dashboard  ← Platform overview
🏫 Schools    ← Manage schools
📈 Statistics ← Analytics & reports
⚙️  Settings  ← System config
```

**Dashboard Home Shows:**
- Total Schools: `50`
- Active Schools: `42`
- Total Students: `5,467`
- Monthly Revenue: `₹4,99,000`

---

### Step 3: Create Your First School (2 minutes)

1. Click **"Schools"** in sidebar
2. Click **"+ Add School"** button (top-right)
3. Fill in form:

**School Info:**
```
Name:    Harvard University
Code:    HARV001
Email:   contact@harvard.edu
Phone:   +1 617-495-1000
Domains: harvard.edu
```

**Initial Admin:**
```
Name:     John Doe
Email:    admin@harvard.edu
Password: SecurePass@123
Phone:    +1 617-555-0123
```

4. Click **"Create School & Admin"**
5. Done! ✅ School created

---

### Step 4: Manage Schools (1 minute)

**Search for a school:**
- Type in search bar: `"harvard"`
- Results update instantly

**Filter schools:**
- Use dropdown: Active / Inactive / Suspended

**Quick actions on any school:**
- 👁️ **View** - See details
- ✏️ **Edit** - Update info
- 🗑️ **Delete** - Remove school

---

## 📋 Common Tasks Cheat Sheet

### Create School
```
Schools → Add School → Fill Form → Create
Time: ~2 minutes
```

### View School Stats
```
Schools → Click 👁️ → See users, courses, subscription
Time: ~30 seconds
```

### Search School
```
Schools → Type in search → Results appear
Time: ~10 seconds
```

### Change School Status
```
Schools → Click ✏️ → Change Status dropdown → Save
Options: Active / Inactive / Suspended
Time: ~30 seconds
```

### View Platform Analytics
```
Statistics → See charts and metrics
Time: ~1 minute
```

---

## 🎯 Dashboard Features at a Glance

| Feature | Location | What It Does |
|---------|----------|--------------|
| **Overview** | Dashboard Home | Platform statistics & metrics |
| **School List** | Schools | All schools with search/filter |
| **Create School** | Schools → Add Button | Register new school |
| **School Details** | Schools → View Icon | Complete school information |
| **Edit School** | Schools → Edit Icon | Update school data |
| **Statistics** | Statistics Page | Charts & analytics |
| **Search** | Schools Page | Find schools quickly |
| **Filter** | Schools Page | Filter by status |

---

## 🔑 Key Information

### School Status Types
- 🟢 **Active** - School is operational, users can login
- 🟡 **Pending** - Awaiting approval, users cannot login
- 🔴 **Inactive** - Temporarily disabled by admin
- ⚫ **Suspended** - Permanently disabled (requires reactivation)

### Subscription Plans
| Plan | Students | Teachers | Fee/Month |
|------|----------|----------|-----------|
| **Trial** | 50 | 5 | Free (30 days) |
| **Basic** | 300 | 20 | ₹1,999 |
| **Premium** | 1000 | 50 | ₹4,999 |
| **Enterprise** | Unlimited | Unlimited | Custom |

### Email Domains
- Students with matching email domains auto-register to school
- Example: Student with `john@harvard.edu` → automatically assigned to Harvard school
- Set in school creation: `harvard.edu, student.harvard.edu`

---

## ⚡ Pro Tips

### 1. Use Search Shortcuts
```
Search by Name:  "Harvard"
Search by Code:  "HARV001"
Search by Email: "harvard.edu"
```

### 2. Bulk Operations
- Filter by status first
- Then apply actions to multiple schools
- Example: Find all "Pending" → Activate them

### 3. Quick Stats
- Hover over school in table to see quick preview
- Click school name to view full details
- Use stats cards for at-a-glance metrics

### 4. Security Best Practices
- ✅ Never share super admin credentials
- ✅ Log out after each session
- ✅ Use strong passwords (10+ chars)
- ✅ Review school access regularly

---

## 🆘 Quick Troubleshooting

### Can't Login?
1. ✅ Use `/system-access` URL (not `/login`)
2. ✅ Select "Super Admin" role
3. ✅ Leave School Code empty
4. ✅ Clear browser cache

### Schools Not Showing?
1. ✅ Refresh page (F5)
2. ✅ Clear search/filters
3. ✅ Check backend is running: `http://localhost:5000`

### Can't Create School?
1. ✅ Use unique school code
2. ✅ Fill all required fields (*)
3. ✅ Password min 6 chars
4. ✅ Valid email format

### Stats Not Updating?
1. ✅ Wait 5 minutes (auto-update delay)
2. ✅ Refresh dashboard
3. ✅ Check if users are actually added to school

---

## 📱 Mobile/Responsive Tips

The dashboard works on tablets and mobile devices:

**Mobile View:**
- Sidebar auto-collapses
- Use hamburger menu (☰) to open
- Tables scroll horizontally
- Cards stack vertically

**Best Practices:**
- Use landscape mode for tables
- Desktop recommended for school creation
- Mobile great for viewing stats

---

## 🎓 Learn More

**Full Documentation:**
- 📖 **Super Admin User Guide:** `SUPERADMIN_USER_GUIDE.md` (detailed)
- 🔒 **Security Audit:** `SECURITY_AUDIT.md`
- 🗺️ **Improvement Roadmap:** `IMPROVEMENT_ROADMAP.md`
- 🛠️ **Quick Fixes:** `QUICK_SECURITY_FIXES.md`

**Support:**
- Email: support@eduaxis.com
- Emergency: security@eduaxis.com

---

## 📊 Dashboard UI Reference

### Home Page Layout
```
┌────────────────────────────────────────────────────┐
│  ☰ EduAxis              [Search]    [🔔] [👤]     │ ← Header
├──────┬─────────────────────────────────────────────┤
│  📊  │  ┌────────┬────────┬────────┬────────┐     │
│  🏫  │  │Schools │Active  │Students│Revenue │     │ ← Stats Cards
│  📈  │  │   50   │   42   │ 5,467  │₹499K   │     │
│  ⚙️  │  └────────┴────────┴────────┴────────┘     │
│      │                                             │
│      │  Subscription Distribution [Pie Chart]     │ ← Charts
│      │                                             │
│      │  Recent Activity                            │ ← Activity
│      │  • Harvard registered (2 min ago)          │
│      │  • MIT updated plan (1 hour ago)           │
└──────┴─────────────────────────────────────────────┘
```

### Schools Page Layout
```
┌────────────────────────────────────────────────────┐
│  Schools Management              [+ Add School]    │ ← Header
├────────────────────────────────────────────────────┤
│  [50 Total] [42 Active] [6 Inactive] [2 Suspended]│ ← Stats
├────────────────────────────────────────────────────┤
│  [🔍 Search...]              [Filter: All Status ▾]│ ← Search/Filter
├────────────────────────────────────────────────────┤
│  School          │Code   │Users  │Plan   │Status  │ ← Table
│  Harvard Univ.   │HARV001│👨‍🎓245  │Premium│🟢Active│
│  MIT             │MIT001 │👨‍🎓189  │Basic  │🟢Active│
│  Stanford        │STAN001│👨‍🎓312  │Premium│🟢Active│
└────────────────────────────────────────────────────┘
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl + K` | Focus search |
| `Ctrl + N` | New school |
| `Ctrl + R` | Refresh |
| `Esc` | Close modal |
| `Tab` | Next field |
| `Shift + Tab` | Previous field |

---

## 🚦 Status Indicators

**Color Coding:**
- 🟢 Green Badge = Active & Healthy
- 🟡 Yellow Badge = Pending or Warning
- 🔴 Red Badge = Inactive or Error
- ⚫ Gray Badge = Suspended

**Icon Meanings:**
- 👁️ = View Details
- ✏️ = Edit Information
- 🗑️ = Delete (Permanent)
- ⚠️ = Warning/Alert
- ✅ = Success/Confirmed
- ❌ = Error/Failed

---

## 🎯 Daily Admin Checklist

### Morning (5 minutes)
- [ ] Check dashboard for new schools
- [ ] Review overnight activity
- [ ] Check for expiring subscriptions
- [ ] Monitor platform health

### During Day (10 minutes)
- [ ] Respond to school admin requests
- [ ] Process new school applications
- [ ] Update subscriptions as needed
- [ ] Monitor system alerts

### Evening (5 minutes)
- [ ] Review daily statistics
- [ ] Export reports if needed
- [ ] Check for anomalies
- [ ] Plan next day tasks

---

## 🔢 Quick Stats Reference

**Platform Metrics (As of Feb 2026):**
```
Total Schools:      50
Active Schools:     42
Total Students:     5,467
Total Teachers:     312
Total Courses:      1,234
Monthly Revenue:    ₹4,99,000
```

**Average School Size:**
```
Students:           109 per school
Teachers:           6 per school
Courses:            25 per school
Student/Teacher:    17:1 ratio
```

---

## 💡 Remember

**"With great power comes great responsibility"**

As a super admin, you have access to ALL data across ALL schools. Always:
- ✅ Respect user privacy
- ✅ Follow data protection laws
- ✅ Maintain confidentiality
- ✅ Document important actions
- ✅ Keep credentials secure

---

**Quick Start Complete!** 🎉

You're now ready to manage the EduAxis platform. For detailed information, see the full **SUPERADMIN_USER_GUIDE.md**.

**Need Help?** 
- 📧 support@eduaxis.com
- 📖 Full Guide: `SUPERADMIN_USER_GUIDE.md`

---

Last Updated: February 17, 2026
