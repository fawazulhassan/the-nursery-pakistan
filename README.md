# 🌿 The Nursery Pakistan

A full-stack production web platform for plant e-commerce, workshop booking, and landscaping portfolio management. Live at **[nurserypakistan.pk](https://nurserypakistan.pk)**

![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

---

## 🚀 Live Demo

🔗 [nurserypakistan.pk](https://nurserypakistan.pk)

---

## 📋 Features

### 🛒 Plant E-commerce
- Browse and search plants with filtering options
- Product image galleries with thumbnail sync and lightbox support
- Cart and wishlist system
- Time-bound sale pricing with start/end dates
- Centralized pricing logic consistent across all pages

### 📅 Workshop Booking
- Browse available workshops
- Book workshops directly through the platform
- Admin can publish and manage workshop listings

### 🏡 Landscaping Portfolio
- Showcase completed landscaping projects
- Image and video gallery support with carousel controls
- Admin can add and manage portfolio entries

### 🔐 Admin Panel
- Role-based admin flows
- Manage products, sales windows, workshops, and projects
- Review approval workflows
- Real-time data management via Supabase

### ⚡ Performance & Infrastructure
- Lazy loading for images and components
- Cloudflare CDN for fast global delivery
- Resend email integration for booking confirmations
- Custom `.pk` domain with SSL
- Deployed on Vercel with 48+ production deployments

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Frontend | React.js, TypeScript, Tailwind CSS |
| UI Components | shadcn/ui |
| Routing | React Router |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Email | Resend |
| CDN & Security | Cloudflare |
| Build Tool | Vite |
| Deployment | Vercel |
| Version Control | Git & GitHub |

---

## 📦 Getting Started

### Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- A [Supabase](https://supabase.com/) account
- A [Resend](https://resend.com/) account (for email)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/fawazulhassan/the-nursery-pakistan.git
cd the-nursery-pakistan
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up environment variables**

Create a `.env` file in the root of the project:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_RESEND_API_KEY=your_resend_api_key
```

You can find your Supabase URL and anon key in your Supabase project dashboard under **Settings → API**.

**4. Run the development server**
```bash
npm run dev
```

The app will be running at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

---

## 📁 Project Structure

```plaintext
the-nursery-pakistan/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   ├── integrations/    # Supabase client & types
│   └── main.tsx         # App entry point
├── supabase/            # Supabase config & migrations
├── .env                 # Environment variables (not committed)
├── vite.config.ts       # Vite configuration
└── tailwind.config.ts   # Tailwind configuration
```

## 🔧 Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key |
| `VITE_RESEND_API_KEY` | Your Resend API key for emails |

---

## 🚀 Deployment

This project is deployed on **Vercel** with a custom domain via **Cloudflare**.

To deploy your own instance:
1. Push your code to GitHub
2. Import the repo into [Vercel](https://vercel.com)
3. Add your environment variables in Vercel project settings
4. Connect your custom domain
5. Set up Cloudflare as your DNS provider for CDN and security

---

## 👨‍💻 Developer

**Muhammad Fawaz ul Hassan**
- 🌐 [portfolio-website-bwxe.vercel.app](https://portfolio-website-bwxe.vercel.app/)
- 💼 [linkedin.com/in/muhammad-fawaz-ul-hassan](https://linkedin.com/in/muhammad-fawaz-ul-hassan/)
- 📧 fawazulhassan@gmail.com

---

## 📄 License

This project is proprietary and built for a real client.
All rights reserved © 2025 The Nursery Pakistan