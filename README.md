# Maharashtra Police Bharti PVQ Platform 🚔 

A beautifully designed, extremely fast, Static Web Application built strictly using **HTML, CSS, and Vanilla JavaScript** to help Maharashtra Police Constable aspirants practice Previous Year Question (PYQ) papers.

The platform is designed with a mobile-first approach, focusing heavily on a distraction-free student experience.

## ✨ Key Features

### 🔐 Authentication (Powered by Firebase)
- **Google One-Tap Login:** Students can seamlessly log into the platform with their Google accounts using Firebase Authentication.
- **Email/Password Login:** Secure standard signup, completely decoupled from local browser storage to prevent data loss.
- **Cross-Device Sync:** User session state and profiles are automatically managed regardless of where they log in.

### 📝 Advanced Exam & Quiz Logic
- **Distraction-Free Interface:** All standard clunky sidebars were removed. The UI focuses 100% on the Question, Options, and bottom Navigation Bar.
- **Auto-Advancing Sections:** When a student finishes the final question of a section (e.g. Mathematics) and clicks 'Next', it automatically routes them into the first question of the *next* section without requiring them to use a separate menu.
- **Compact Question Timeline Grid:** 
  - **Desktop:** A slim (60px) vertical sidebar hugging the left screen.
  - **Mobile:** A horizontal scrollable strip fixed to the bottom.
  - Tracks Active (Blue), Attempted (Green), and Flagged (Orange) statuses in real-time.
- **Header Attempt Tracker:** A real-time tracker (`Attempted: 15 / 100`) lives inside the header so the student always knows their pacing.

### 📊 Deep Results & Analysis (Firestore Integration)
- **Per-Question Detailed Breakdown:** After submitting the quiz, students are presented with an interactive Results Card. 
- **Expandable Section Drawers:** Clicking on a subject expands a hidden drawer showing a timeline of *every* question inside that section.
- **Feedback Loop:** The analytic view highlights whether the question was Correct (✅), Wrong (❌), or Skipped (⏭️). For wrongly attempted answers, it displays the student's chosen answer in Red alongside the Correct answer in Green.
- **Time Tracking:** It tracks and outputs the exact amount of seconds the user took per individual question to help identify time bottlenecks.
- All scores, attempts, and analytics are synced directly into Google Cloud **Firestore** Database.

### ⚙️ How it Works & Scalability
- **Static Design:** Because there is no bulky backend server running node or python, the site handles hundreds of thousands of concurrent testers simply by leveraging static CDNs (like Netlify/GitHub pages). 
- **JSON Question Injection:** Test papers are stored strictly as lightweight `JSON` files. When a student chooses a district and presses "Start", the app instantly injects the requested JSON (`jalna_2026.json`) into the state, resulting in a **0-millisecond quiz load time.**

---

## 🚀 How to Run Locally

If you wish to test this locally on your PC, you do not need any complex build tools like Webpack or React:

1. Clone the repository:
   ```bash
   git clone https://github.com/Yogesh-017/maharashtra-police-bharti-pvq.git
   ```

2. Open the directory and serve the static files:
   ```bash
   npx serve .
   ```
   *(Note: Simply double clicking the `index.html` file works for most features, but running it via a local static server like `npx serve` prevents browser CORS blocking when fetching the JSON Question Papers).*

3. Open `http://localhost:3000`

## 🛠️ Tech Stack
* **Frontend UI:** HTML5 & Vanilla CSS (No frameworks)
* **Frontend Logic:** Vanilla JavaScript (ES6)
* **Authentication:** Google Firebase Auth (Compat Version)
* **Database:** Google Cloud Firestore (NoSQL)
* **Hosting Details:** Deployed via Netlify / GitHub Pages
