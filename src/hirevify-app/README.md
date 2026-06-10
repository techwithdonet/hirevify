# HireVify - Skills-First Hiring Platform

> Revolutionizing recruitment through project-based work and advanced candidate management.

[![Deploy Status](https://img.shields.io/github/deployments/hirevify/hirevify/production?label=deployment)](https://github.com/hirevify/hirevify/deployments)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](package.json)

## 🚀 Overview

HireVify is a comprehensive hiring platform that focuses on skills-first recruitment, helping both companies and candidates connect through meaningful project-based work. Our platform addresses hiring inefficiencies by providing advanced candidate management tools and revolutionary assessment systems.

### ✨ Key Features

- **Skills-First Hiring**: Revolutionary approach focusing on practical skills over traditional credentials
- **Project-Based Assessment**: Two-step journey with knowledge verification and practical challenges
- **Video Explanation System**: Anti-cheating project submission with detailed explanations
- **Experience Builder Program**: 1-2 week trial projects with 40% conversion rate
- **Micro-Internships Platform**: Quick wins with $150-500 average pay
- **AI-Powered Matching**: Intelligent candidate-project matching system
- **Comprehensive Analytics**: Advanced hiring metrics and insights
- **Professional Resume Builder**: ATS-optimized resume creation
- **Real-Time Messaging**: Built-in communication system

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS v4
- **Backend**: Supabase Edge Functions + PostgreSQL
- **Authentication**: Supabase Auth with JWT
- **Payments**: Stripe integration for Pro subscriptions
- **File Storage**: Supabase Storage with signed URLs
- **Deployment**: Vercel for frontend, Supabase for backend

## 📦 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- Supabase account
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/hirevify/hirevify.git
   cd hirevify
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Fill in your environment variables
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Visit the application**
   ```
   http://localhost:3000
   ```

## 🔧 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Optional Features
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_ERROR_REPORTING=true
```

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Configure environment variables in Vercel dashboard**

3. **Deploy to production**
   ```bash
   vercel --prod
   ```

### Supabase Functions

1. **Deploy edge functions**
   ```bash
   npx supabase functions deploy
   ```

2. **Set environment variables**
   ```bash
   npx supabase secrets set STRIPE_SECRET_KEY=your_key
   ```

## 📊 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run test suite
- `npm run analyze` - Analyze bundle size

## 🏢 Business Model

### Subscription Plans

- **Free Plan**: 3 projects/month, 10 searches, basic features
- **Pro Plan**: $49/month - Unlimited projects, advanced analytics, AI features
- **Annual Plan**: $490/year - Pro features + 2 months free

### Revenue Streams

1. **Subscription Revenue**: Pro plan subscriptions
2. **Transaction Fees**: Commission on successful hires
3. **Premium Features**: Advanced analytics, custom branding
4. **Enterprise Solutions**: Custom implementations for large companies

## 🎯 Target Market

### Primary Users

- **Recruiters & HR Professionals**: Looking for skills-based hiring solutions
- **Technical Candidates**: Seeking opportunities to showcase practical skills
- **Startup Companies**: Need efficient, cost-effective hiring processes
- **Career Switchers**: Professionals transitioning to new fields

### Market Size

- $200B+ global recruitment market
- 15M+ software developers worldwide
- Growing demand for skills-based hiring solutions

## 🔒 Security & Compliance

- **Data Encryption**: All data encrypted at rest and in transit
- **GDPR Compliant**: Full compliance with data protection regulations
- **SOC 2 Ready**: Security controls and monitoring in place
- **Regular Audits**: Security assessments and penetration testing

## 📈 Analytics & Monitoring

- **User Analytics**: Track user engagement and conversion
- **Performance Monitoring**: Real-time application performance
- **Error Tracking**: Comprehensive error reporting and alerts
- **Business Metrics**: Revenue, user growth, and retention tracking

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.hirevify.com](https://docs.hirevify.com)
- **Email Support**: support@hirevify.com
- **Community**: [Discord](https://discord.gg/hirevify)
- **Status Page**: [status.hirevify.com](https://status.hirevify.com)

## 🎉 Acknowledgments

- Built with [React](https://reactjs.org/) and [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- Payments by [Stripe](https://stripe.com/)
- Deployed on [Vercel](https://vercel.com/)
- UI components from [Radix UI](https://www.radix-ui.com/)

---

**Made with ❤️ by the HireVify Team**

*Transforming hiring through skills-first recruitment*