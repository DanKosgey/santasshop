<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Maichez Trades - Trade Hub

An AI-powered educational platform focused on business and trading, integrated with Google's AI Studio. This platform provides interactive learning, assessment, and community features centered around an MBA-style curriculum with practical trading tools.

## 🚀 Key Features

### 🔐 Authentication & Security
- Secure authentication with Supabase OTP (One-Time Password) email verification
- Role-based access control (Student, Admin)
- Subscription tier management (Free, Foundation, Professional, Elite)

### 📊 Data Analysis & Trading Insights
- **Advanced Trade Analytics**: Comprehensive performance metrics including win rates, profit factors, and drawdown analysis
- **Pattern Recognition**: AI-powered identification of trading patterns and behavioral insights
- **Performance Visualization**: Interactive charts for equity curves, drawdown analysis, and win/loss distributions
- **Personalized Insights**: AI-generated recommendations based on individual trading behavior
- **Risk Management**: Built-in tools to monitor and improve risk-to-reward ratios

### 🎓 Learning Management System
- **Interactive Courses**: Video, text, and quiz-based learning modules
- **Progress Tracking**: Real-time monitoring of student advancement
- **Course Management**: Admin tools for creating and organizing curriculum
- **Quiz System**: Automated assessment with immediate feedback
- **To-Do Lists**: Personalized task management for students

### 👥 Community & Social Features
- **Premium Social Media Integration**: WhatsApp, Telegram, TikTok, and Instagram community links
- **Live Trading Community**: Real-time interaction with fellow traders
- **Mentorship Programs**: Elite tier mentorship opportunities

### 🛠️ Administrative Tools
- **Student Management**: Monitor and manage student progress
- **Trade Analysis**: Review and analyze student trading performance
- **Content Management**: Create and organize educational materials
- **Rule Engine**: Define and enforce trading rules and validations
- **Analytics Dashboard**: Comprehensive platform usage and performance metrics

### 🤖 AI Integration
- **AI Trade Assistant**: Real-time trade validation and approval system
- **Smart Trade Journal**: AI-enhanced logging and analysis of trades
- **Performance Analysis**: Machine learning-driven insights and recommendations

## 🏗️ Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **AI Services**: Google Gemini API
- **Data Visualization**: Recharts
- **UI Components**: Lucide React Icons
- **Build Tool**: Vite
- **Testing**: Jest, Supabase Tests

## 📁 Project Structure

```
├── components/
│   ├── admin/           # Administrative portal components
│   ├── enhanced/        # Advanced UI components with data visualization
│   ├── AITradeAssistant.tsx
│   ├── CommunityHub.tsx
│   ├── Dashboard.tsx
│   ├── LandingPage.tsx
│   └── ...              # Other UI components
├── services/            # Business logic and API integrations
├── supabase/            # Database schemas and migrations
├── test/                # Unit and integration tests
└── types.ts             # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- Google Gemini API key

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Create a `.env.local` file with:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Run the Application**:
   ```bash
   npm run dev
   ```

## 🔐 Authentication Setup

1. In your Supabase Dashboard, go to Authentication > Settings
2. Enable "Email Confirmations" 
3. Enable "Enable Email OTP"
4. Customize email templates to use codes instead of links:

**Signup Confirmation Template**:
```html
<h2>Confirm your email</h2>
<p>Enter this code to confirm your account:</p>
<h1>{{ .Token }}</h1>
<p>This code expires in 24 hours.</p>
```

**Passwordless Login Template**:
```html
<h2>Login to Maichez Trades</h2>
<p>Enter this code to login to your account:</p>
<h1>{{ .Token }}</h1>
<p>This code expires in 24 hours.</p>
```

## 🗄️ Database Migrations

Run migrations with:
```bash
npx supabase migration up
```

## 🧪 Testing

Run tests with:
```bash
npm test
```

## 📈 Data Analysis Features

### Trade Performance Analytics
- Win rate tracking and visualization
- Profit factor calculation
- Drawdown analysis
- Risk-to-reward ratio monitoring
- Average win/loss calculations

### Pattern Recognition
- Revenge trading detection
- Overtrading identification
- Chasing losses pattern recognition
- Consistency analysis
- Time-based performance patterns

### AI-Powered Insights
- Personalized trading recommendations
- Behavioral pattern analysis
- Risk management suggestions
- Performance improvement strategies

## 🛡️ Security

- Role-based access control
- Secure authentication with OTP
- Protected admin routes
- Data encryption at rest
- Regular security audits

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google AI Studio for AI capabilities
- Supabase for backend infrastructure
- React community for the amazing ecosystem