# 🚀 Writewise - AI Writing Assistant for Content Creators

<div align="center">

![Writewise Logo](public/app_logo.jpg)

**An AI-powered writing assistant built specifically for content creators**

[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)]()
[![Features](https://img.shields.io/badge/Features-4%2F6%20Complete-blue)]()
[![AI](https://img.shields.io/badge/AI-GPT--4%20Powered-purple)]()
[![License](https://img.shields.io/badge/License-MIT-green)]()

</div>

---

## 📋 **Overview**

Writewise is a next-generation writing assistant designed specifically for **content creators** who need more than basic grammar checking. Unlike traditional tools, Writewise understands the unique challenges creators face: maintaining authentic voice, avoiding platform penalties, and creating engaging content that converts.

### 🎯 **Built For:**
- 📝 **Blog Writers** - Personal and professional bloggers
- 📰 **Article Authors** - Magazine and online publication writers  
- 📱 **Marketing Copywriters** - Social media, email, and web copy creators
- 🎥 **Video Script Writers** - YouTube, TikTok, and podcast creators
- 📧 **Newsletter Writers** - Email marketing and community builders

---

## ✨ **Key Features**

### ✅ **Implemented (4/6 User Stories)**

#### 🔴 **Demonetization Word Filter**
- **Orange wavy underlines** highlight platform-unsafe words
- **AI-powered alternatives** in 3 categories: Industry Standard, Conservative, Creative
- **Context-aware suggestions** maintain your message while keeping content safe
- **100+ word detection** across violence, adult content, and controversial topics

#### 🟢 **Context-Aware Grammar Checking** 
- **Green dotted underlines** protect intentional slang from correction
- **AI-first slang detection** using GPT-4's contextual understanding
- **Formality controls** (Casual/Balanced/Formal) adjust protection levels
- **70+ slang expression database** with pattern matching

#### 🟣 **Tone-Preserving Rewrites**
- **Purple solid underlines** for grammar fixes that maintain your voice
- **AI tone analysis** detects 4 style categories (Casual, Professional, Creative, Academic)
- **Priority scoring system** with intelligent conflict resolution
- **Style matching** preserves personality while fixing errors

#### 🩷 **Engagement Enhancement** 
- **Pink double underlines** highlight engagement opportunities
- **6 analysis categories**: Opening Hook, Call-to-Action, Emotional Language, Reader Interaction, Transitions, Urgency/Scarcity
- **Category badges** and **sparkle icons (✨)** for alternatives
- **Engagement scoring (1-10)** with context-aware improvements

### 🚧 **Planned (2/6 User Stories)**

#### 🔵 **SEO Content Optimization** (Next Sprint)
- Keyword density analysis and optimization
- Meta description and title enhancement  
- Content structure suggestions
- Search ranking factor integration

#### 🟡 **Audience Adaptation** (Following Sprint)
- Platform-specific recommendations (LinkedIn vs. TikTok)
- Length optimization for different channels
- Hashtag and keyword suggestions
- Audience demographic considerations

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- OpenAI API key

### **Installation**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd writewise
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file in root directory
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Frontend: `http://localhost:5180`
   - Backend API: `http://localhost:3001`

---

## 🏗️ **Technical Architecture**

### **Frontend Stack**
- ⚛️ **React 18** with TypeScript for type safety
- 🎨 **Tailwind CSS** for responsive, modern UI design
- ✏️ **Tiptap Editor** for rich text editing with real-time suggestions
- 🗄️ **Zustand** for state management and settings persistence
- 🧭 **React Router** for navigation and multi-page experience

### **Backend Stack**
- 🟢 **Node.js** with Express for API server
- 🤖 **OpenAI GPT-4/GPT-4o** integration for advanced AI analysis
- 💾 **Map-based caching** for performance optimization
- 📊 **Session management** for analytics and user tracking
- 🛡️ **Error handling** with graceful degradation

### **AI Integration**
- 🧠 **Context-aware prompting** for nuanced text analysis
- 🔄 **Multi-model approach** combining rule-based and AI detection
- 📈 **Confidence scoring** for suggestion reliability
- 💡 **Reasoning explanations** for educational user experience

---

## 📊 **Analytics & Performance**

### **Real-Time Dashboard**
- 📈 **Writing Quality Metrics**: Readability, sentence variety, vocabulary richness
- ⏱️ **Performance Tracking**: Word count, time spent, suggestion acceptance rates
- 📋 **Suggestion Breakdown**: Analysis by type, category, and acceptance rates

### **Export Capabilities**
- 📄 **Multiple Formats**: JSON, Markdown, HTML, CSV
- 📊 **Professional Reports** with analytics and suggestions
- ⏰ **Timestamped Data** for progress tracking
- 👥 **Client-Ready Formatting** for professional use

---

## 🎨 **Visual Design System**

### **Color-Coded Suggestions**
- 🔴 **Red wavy** - Grammar/spelling errors
- 🔵 **Blue wavy** - Style and clarity improvements  
- 🟠 **Orange wavy** - Demonetization warnings
- 🟢 **Green dotted** - Protected slang expressions
- 🟣 **Purple solid** - Tone-preserving rewrites
- 🩷 **Pink double** - Engagement enhancements

### **Interactive Elements**
- 🎯 **Context-sensitive popups** with detailed explanations
- 🔄 **Multiple alternatives** for each suggestion
- 🧠 **AI reasoning** helps users understand recommendations
- ⚡ **One-click application** for quick improvements
- 📚 **Educational examples** for learning grammar rules

---

## ⚙️ **Configuration**

### **Settings Panel**
- 🔧 **Feature Toggles** for each suggestion type
- 📊 **Formality Level Controls** for audience-appropriate corrections
- 🎛️ **Sensitivity Adjustments** for tone detection
- ⚖️ **Conflict Resolution Modes** for overlapping suggestions

### **Customization Options**
- 🎨 **Theme Selection** (Light/Dark modes)
- 📏 **Editor Preferences** (Font size, line spacing)
- 🔔 **Notification Settings** for real-time feedback
- 💾 **Auto-save Configuration** for document persistence

---

## 📈 **Performance Metrics**

### **Optimization Features**
- ⏱️ **Debounced Suggestions** (800ms) prevent excessive API calls
- 💾 **Comprehensive Caching** for tone analysis, engagement analysis, and suggestions
- 🚀 **Optimistic UI Updates** for responsive user experience
- 🛡️ **Error Boundaries** and graceful degradation

### **Monitoring & Health**
- 📊 **Performance Tracking**: Response times and cache hit rates
- 🏥 **Health Check Endpoints** for system monitoring
- 📝 **Error Logging** with detailed debugging information
- 📈 **Analytics Tracking** for usage patterns and improvements

---

## 🎯 **Competitive Advantages**

### **Creator-Focused Design**
- 🎤 **Maintains Authentic Voice** while improving quality
- 🛡️ **Avoids Platform Penalties** from demonetization-sensitive content
- 📈 **Increases Engagement** with compelling, reader-focused writing
- 🎯 **Adapts Content** for different audiences and platforms

### **AI-First Approach**
- 🧠 **Context Understanding** goes beyond simple rule-based checking
- 🎯 **Intent Recognition** distinguishes intentional style choices from errors
- 🎨 **Nuanced Suggestions** preserve creator personality and brand voice
- 📚 **Continuous Learning** from user feedback and acceptance patterns

---

## 🔮 **Roadmap**

### **Phase 1: SEO Integration** (Next Sprint)
- 🔍 Keyword optimization and density analysis
- 📝 Meta tag and title suggestions
- 📊 Content structure recommendations
- 🏆 Search engine ranking factors integration

### **Phase 2: Platform Adaptation** (Following Sprint)
- 📱 Multi-platform optimization (LinkedIn, Twitter, YouTube, TikTok)
- 👥 Audience-specific tone adjustments
- 📏 Character limit and format optimization
- 🎯 Platform-specific best practices

### **Phase 3: Advanced AI Features**
- 🎓 **Custom Voice Training** - Learn individual creator's style
- 📊 **Competitor Analysis** - Benchmark against successful content
- 📈 **Trend Integration** - Incorporate current topics and keywords
- 👥 **Collaborative Editing** - Team-based content creation tools

---

## 📚 **Documentation**

- 📄 **[Product Requirements Document](GrammarlyClone_PRD.md)** - Detailed feature specifications
- 📊 **[Feature Summary](WRITEWISE_FEATURE_SUMMARY.md)** - Comprehensive feature overview
- 🎬 **[Demo Script](DEMO_SCRIPT.md)** - Complete feature demonstration guide

---

## 🤝 **Contributing**

We welcome contributions! Please see our contributing guidelines for:
- 🐛 Bug reports and feature requests
- 💻 Code contributions and pull requests
- 📚 Documentation improvements
- 🧪 Testing and quality assurance

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🏆 **Project Status**

**✅ Production Ready** - 4 out of 6 user stories implemented with robust, production-ready features that provide immediate value to content creators.

### **Completed Features:**
- ✅ Demonetization Word Filter
- ✅ Context-Aware Grammar Checking  
- ✅ Tone-Preserving Rewrites
- ✅ Engagement Enhancement

### **In Development:**
- 🚧 SEO Content Optimization
- 🚧 Audience Adaptation

---

<div align="center">

**Built with ❤️ for Content Creators**

[Demo](http://localhost:5180) • [Documentation](GrammarlyClone_PRD.md) • [Features](WRITEWISE_FEATURE_SUMMARY.md)

</div> 