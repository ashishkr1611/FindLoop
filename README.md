# FINDLOOP

**Official Tagline:** *"Scan it. Report it. Return it."*

> **Project Classification:** Functional Academic Prototype & Working Privacy-Focused Prototype for College Campus Lost-and-Found Recovery.

---

## 📌 Project Overview

**FindLoop** is a privacy-safe QR-based lost-and-found system designed specifically for college campuses. It allows students, faculty, and campus staff to attach unique QR tags to their belongings (calculators, water bottles, backpacks, notebooks, keys, and ID-card holders) and recover lost items without publicly exposing their personal contact information.

---

## 💡 Problem & Solution (Design Thinking Framework)

### Problem Statement
Traditional lost-and-found tags require owners to print personal phone numbers, emails, or student IDs directly onto their physical belongings. This creates severe privacy and safety risks across college campuses. Conversely, standard unclaimed item boxes at security desks often remain unorganized.

### How Might We (HMW) Question
*"How might we help students recover lost items quickly without exposing their personal contact information?"*

### The FindLoop Solution
1. **App-Free QR Scanning**: Finders scan the physical tag using any smartphone camera without downloading an app or creating an account.
2. **Privacy Shield**: The finder sees only the item category and Tag ID (`FL-8X92K`). Owner phone numbers, emails, addresses, and private distinguishing details are strictly suppressed.
3. **Monitored Campus Handover**: Items are deposited at designated campus desks (Security Desk, Reception, Library Desk).
4. **6-Digit Verification Code**: Physical handover is verified using a one-time 6-digit collection code provided to the owner.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6 Modules)
- **Backend Services**: Firebase Authentication & Cloud Firestore
- **Deployment**: Firebase Hosting (`firebase.json`)
- **Security**: Firestore Security Rules (`firestore.rules`)
- **Design & Wireframing**: Figma UI/UX Mockups
- **Research & Evidence**: Google Forms (Student Survey) & Google Sheets (Data Analysis)

---

## 📂 Project Structure

```
FindLoop/
├── index.html                  # Main Landing Page
├── how-it-works.html           # 5-Step Process Guide
├── login.html                  # Owner Authentication Page
├── signup.html                 # Owner Registration Page
│
├── pages/
│   ├── dashboard.html          # Owner Dashboard (My Items & Stats)
│   ├── add-item.html           # Register Belonging Form
│   ├── item-details.html       # Item Audit & History Timeline
│   ├── qr-tag.html             # Printable Physical QR Tag View
│   ├── notifications.html      # Owner Notification Center
│   ├── found-report.html       # Found Report View for Owner
│   ├── handover.html           # 6-Digit Collection Code Verification
│   └── profile.html            # Owner Profile & Settings
│
├── public/
│   ├── scan.html               # Public Finder QR Scan Page (No Login)
│   ├── report-found.html       # Public Finder Report Form (No Login)
│   └── success.html            # Public Finder Confirmation Screen
│
├── admin/
│   ├── login.html              # Admin Portal Login Page
│   ├── index.html              # Admin Dispatch Overview
│   ├── items.html              # Global Items Registry
│   ├── item-details.html       # Admin Item Audit Detail View
│   ├── reports.html            # Global Reports Registry
│   ├── report-details.html     # Report Moderation Controls
│   ├── users.html              # Campus User Directory
│   ├── analytics.html          # Recovery & Hotspot Analytics
│   └── settings.html           # Campus Desk Configuration
│
├── css/
│   ├── global.css              # Design Tokens & Theme Variables
│   └── responsive.css          # Mobile, Tablet & Desktop Layouts
│
├── js/
│   ├── firebase-config.js      # Firebase SDK Initialization
│   ├── auth.js                 # Authentication & Role Observers
│   ├── firestore.js            # Firestore Database Operations
│   ├── qr.js                   # QR Generator & Printable Tag Handler
│   ├── utils.js                # Helper Utilities & Toast Launcher
│   └── app.js                 # Global Application Logic
│
├── firestore.rules             # Cloud Firestore Security Rules
├── firebase.json               # Firebase Hosting Configuration
└── README.md                   # Project Documentation
```

---

## 🔒 Privacy Model & Security Rules

FindLoop enforces strict privacy protection:
- **No Personal Contact Data in QR Code**: Physical QR tags reference only a random token (e.g. `tok_calc_8X92K_secure` or `FL-8X92K`).
- **Owner Information Suppression**: Public scanner routes (`public/scan.html`) never expose owner names, phone numbers, email addresses, or student IDs.
- **Firestore Security Rules**: Normal users can only write to their own profile and item documents. Public finders are restricted to reading item status and creating found report documents.

---

## 📊 Design Thinking Research (Google Forms & Google Sheets)

As part of the university Design Thinking research phase:
- **Google Forms**: Used to conduct student & faculty surveys regarding lost item frequency, privacy concerns, and willingness to use QR recovery tags.
- **Google Sheets**: Used to aggregate survey responses, analyze loss patterns by campus location, and visualize response charts.

---

## 🎯 End-to-End Core Demo Flow

1. **Owner Registration**: Log in as `anshubala@gehu.ac.in`.
2. **Add Item**: Register "My Black Calculator" $\rightarrow$ System generates Tag ID `FL-8X92K`.
3. **Print QR & Mark Lost**: View printable tag at `pages/qr-tag.html` $\rightarrow$ Mark item status as `LOST`.
4. **Finder Scan (No Login)**: Open `public/scan.html?token=FL-8X92K` $\rightarrow$ Verify owner identity is 100% hidden $\rightarrow$ Submit Found Report (Location: Library, Handover Desk: Security Desk).
5. **Owner Handover & Recovery**: Owner receives notification $\rightarrow$ Opens `pages/found-report.html` $\rightarrow$ Starts verification at `pages/handover.html` $\rightarrow$ Enters code `482910` $\rightarrow$ Item status becomes `RETURNED`.
6. **Admin Audit**: Admin logs in at `admin/login.html` to review central campus dispatch statistics.

---

## 🚀 Firebase Deployment Instructions

```bash
# 1. Install Firebase CLI (if not installed)
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Initialize Firebase Hosting & Firestore
firebase init hosting

# 4. Deploy Application
firebase deploy
```

---

## 📝 Academic viva & Prototype Note

This project is a **functional academic prototype** built using pure **HTML5, CSS3, Vanilla JavaScript, and Firebase** to demonstrate privacy-safe IoT/QR recovery workflows for college campus presentations.
