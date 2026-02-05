# 🏢 Office OFM App

Office Management System for OFM Franciscan Province of San Antonio de Padua, Philippines.

---

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Firebase Emulator (Development)

```bash
# Start Firebase Emulator Suite
firebase emulators:start

# Emulator UI: http://localhost:4000
# Realtime Database: http://localhost:9000
# Firestore: http://localhost:8081
# Storage: http://localhost:9199
# Auth: http://localhost:9099
```

---

## 📚 Documentation

**Complete documentation is available in the [`docs/`](./docs/) directory.**

### Quick Links

- **📖 [Documentation Index](./docs/README.md)** - Start here!
- **💬 [Messaging System](./docs/messaging/UNIFIED_MESSAGING_SYSTEM_COMPLETE.md)** - Unified messaging
- **🤖 [AI Features](./docs/ai-features/)** - AI-powered features
- **🔐 [Admin & Security](./docs/admin-security/)** - Security implementation
- **💰 [Financial Reporting](./docs/financial-reporting/)** - Financial management
- **🧪 [Testing Guides](./docs/testing/)** - Testing documentation

---

## 🎯 Key Features

### 💬 Unified Messaging System
- Group chat, direct messages, and channels
- File & photo sharing with progress tracking
- Real-time notifications (5 types)
- Message reactions and typing indicators
- Message status tracking (sending → sent → delivered → read)

### 🤖 AI-Powered Features
- Receipt scanning and processing
- Document search and chat assistance
- Handwritten receipt recognition
- Intelligent categorization
- Real-time AI responses

### 🔐 Security & Admin
- Hierarchical admin system
- Role-based access control (super_admin, admin, staff)
- Google Sign-in integration
- Secure authentication flow
- Firebase security rules

### 💰 Financial Management
- Receipt management system
- Financial reporting and analytics
- Franciscan category integration
- Friary financial tracking
- Detailed transaction entries

### 🏢 Organization Management
- Organizational chart
- Province structure management
- Department management
- Staff assignment system
- Member directory

---

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Firebase (Realtime Database, Firestore, Storage, Auth)
- **AI**: Firebase AI services
- **Testing**: Firebase Emulator Suite

---

## 📁 Project Structure

```
office-ofm-app/
├── docs/                          # 📚 Complete documentation
│   ├── messaging/                 # Messaging system docs
│   ├── ai-features/               # AI features docs
│   ├── admin-security/            # Admin & security docs
│   ├── financial-reporting/       # Financial docs
│   ├── organization/              # Organization docs
│   ├── firebase-setup/            # Firebase setup guides
│   ├── testing/                   # Testing guides
│   ├── fixes-and-improvements/    # Bug fixes & improvements
│   └── archived/                  # Deprecated docs
│
├── src/
│   ├── app/
│   │   ├── components/            # React components
│   │   └── contexts/              # React contexts
│   ├── lib/                       # Services & utilities
│   ├── hooks/                     # Custom React hooks
│   └── styles/                    # CSS styles
│
├── functions/                     # Firebase Cloud Functions
├── guidelines/                    # Development guidelines
└── powers/                        # Kiro Powers

```

---

## 🔧 Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase CLI
- Firebase project setup

### Environment Setup

1. Copy `.env.example` to `.env`
2. Add your Firebase configuration
3. Start Firebase Emulator
4. Run development server

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
npm run type-check   # TypeScript type checking
```

---

## 🧪 Testing

### Manual Testing

See [Testing Guide](./docs/testing/MANUAL_TESTING_GUIDE.md) for complete testing procedures.

### Firebase Emulator

Always test with Firebase Emulator before deploying to production:

```bash
firebase emulators:start
```

### Test Accounts

Create test accounts using the emulator UI at http://localhost:4000

---

## 🚀 Deployment

### Build

```bash
npm run build
```

### Deploy to Firebase

```bash
# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only database:rules
firebase deploy --only storage:rules
firebase deploy --only functions
```

---

## 📖 Documentation Guide

### For New Developers
1. Read [Documentation Index](./docs/README.md)
2. Setup [Firebase Emulator](./docs/firebase-setup/SETUP_FIREBASE_EMULATOR.md)
3. Review [Messaging System](./docs/messaging/UNIFIED_MESSAGING_SYSTEM_COMPLETE.md)

### For QA Engineers
1. [Manual Testing Guide](./docs/testing/MANUAL_TESTING_GUIDE.md)
2. [Messaging Testing](./docs/messaging/MESSAGING_TESTING_GUIDE.md)

### For Administrators
1. [Admin Security](./docs/admin-security/HIERARCHICAL_ADMIN_SECURITY.md)
2. [Super Admin Setup](./docs/admin-security/SUPER_ADMIN_SETUP.md)

---

## 🤝 Contributing

### Code Standards

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Follow existing patterns

### Documentation

- Update relevant docs when adding features
- Place docs in appropriate category
- Follow markdown standards
- Include code examples

---

## 📊 Project Status

| Feature | Status |
|---------|--------|
| Messaging System | ✅ Complete |
| AI Features | ✅ Complete |
| Admin & Security | ✅ Complete |
| Financial Reporting | ✅ Complete |
| Organization Management | ✅ Complete |
| Testing | ✅ Complete |
| Documentation | ✅ Complete |

---

## 🆘 Support

### Getting Help

1. Check [Documentation](./docs/README.md)
2. Review [Troubleshooting](./docs/fixes-and-improvements/TROUBLESHOOTING_AUTH.md)
3. Contact development team

### Common Issues

- **Firebase Connection**: Check emulator is running
- **Authentication**: Review [Troubleshooting Auth](./docs/fixes-and-improvements/TROUBLESHOOTING_AUTH.md)
- **File Upload**: Check storage rules and CORS configuration

---

## 📝 License

Copyright © 2026 OFM Franciscan Province of San Antonio de Padua, Philippines

---

## 🙏 Acknowledgments

- Firebase team for excellent real-time database
- React team for powerful UI framework
- shadcn/ui for beautiful components
- All contributors to this project

---

**Version**: 3.0.0  
**Last Updated**: February 5, 2026  
**Status**: ✅ Production Ready

---

## 📞 Contact

For questions or support, contact the development team.

---

# 🎉 Welcome to Office OFM App!

Start by reading the [Documentation](./docs/README.md) to get familiar with the system.
