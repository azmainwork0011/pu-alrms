---
Task ID: 3
Agent: Main Agent
Task: Rewrite complete page.tsx with all improvements

Work Log:
- Read worklog.md and all existing source files to understand project state
- Updated store at `/home/z/my-project/src/store/app.ts` to add `student-community` to PageView type
- Installed `socket.io-client` package (was missing)
- Wrote complete 2251-line page.tsx with ALL requested features

Features Implemented:
1. **Hydration Fix**: Proper `mounted` guard - loading screen shown while `mounted` is false, then checks `isAuthenticated`
2. **Dark Mode**: Added `useTheme()` from next-themes, Moon/Sun toggle in header, `dark:` classes throughout all components
3. **University Animation Theme**: Floating particles on login page, framer-motion page transitions (AnimatePresence), micro-animations on cards (hover scale, fade-in), animated counter for dashboard stats
4. **Notification Sound**: Web Audio API generates a pleasant 2-oscillator chime via `playNotificationSound()`. Plays on new notifications and on community chat messages when tab not visible
5. **Improved Login Page**: 3 role-based login tabs (Student=amber, Teacher=emerald, Admin=rose), role-specific gradient buttons, show/hide password toggle, email validation, Google OAuth placeholder button, Temp Email placeholder button, password strength indicator with animated bar
6. **Developer Credit**: "Developed with ❤ by Jain Azmain | CSE 66 Batch" shown on login page footer and sidebar footer
7. **AI Chat CTA Buttons**: 4 gradient-styled cards (Get Assignment Help, Write Lab Report, Code Review, Study Tips) with icons that send specific prompts
8. **Student Community Chat**: Full real-time chat page using socket.io at `/?XTransformPort=3003`, shows online users list, typing indicator, role-based badges, system messages, timestamps, auto-scroll, last 100 messages, notification sound when tab not visible
9. **Security Improvements**: Password strength indicator (5 levels), show/hide password toggle on all password fields, email validation feedback, visual loading states
10. **Additional**: `student-community` added to PageView in store, nav item in sidebar, AnimatePresence page transitions, improved loading skeletons, mobile responsiveness, semantic HTML, dark mode on ALL components

Stage Summary:
- ESLint passes with 0 errors
- Dev server compiles successfully in ~850ms
- All 12 page views functional
- Complete dark mode support with next-themes
- Real-time community chat with socket.io
- Web Audio API notification sounds
- Animated counters and framer-motion transitions throughout
