import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  DocumentTextIcon, 
  ClockIcon, 
  ShieldCheckIcon, 
  ChartBarIcon,
  ArrowRightIcon,
  UserGroupIcon,
  DocumentDuplicateIcon,
  ChatBubbleBottomCenterTextIcon,
  SparklesIcon,
  LockClosedIcon,
  PresentationChartLineIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  CogIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  PlayIcon,
  StarIcon,
  BoltIcon,
  GlobeAltIcon,
  CloudIcon
} from '@heroicons/react/24/outline';

// Modern Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 50,
    scale: 0.9
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const floatingAnimation = {
  y: [-10, 10, -10],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

const gradientShift = {
  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
  transition: {
    duration: 8,
    repeat: Infinity,
    ease: "linear"
  }
};

const features = [
  {
    icon: <BoltIcon className="h-8 w-8" />,
    title: 'Lightning Fast',
    description: 'Process documents at incredible speeds with our optimized workflow engine.',
    gradient: 'from-violet-500 to-purple-600',
    color: 'violet'
  },
  {
    icon: <ShieldCheckIcon className="h-8 w-8" />,
    title: 'Bank-Level Security',
    description: 'Your documents are protected with military-grade encryption and security.',
    gradient: 'from-emerald-500 to-teal-600',
    color: 'emerald'
  },
  {
    icon: <GlobeAltIcon className="h-8 w-8" />,
    title: 'Global Access',
    description: 'Access your documents from anywhere in the world, anytime you need them.',
    gradient: 'from-blue-500 to-cyan-600',
    color: 'blue'
  },
  {
    icon: <CloudIcon className="h-8 w-8" />,
    title: 'Cloud Native',
    description: 'Built for the cloud with automatic backups and 99.9% uptime guarantee.',
    gradient: 'from-orange-500 to-red-600',
    color: 'orange'
  },
  {
    icon: <ChartBarIcon className="h-8 w-8" />,
    title: 'Smart Analytics',
    description: 'AI-powered insights help you make better decisions with real-time data.',
    gradient: 'from-pink-500 to-rose-600',
    color: 'pink'
  },
  {
    icon: <CogIcon className="h-8 w-8" />,
    title: 'Automation',
    description: 'Automate repetitive tasks and focus on what matters most to your business.',
    gradient: 'from-indigo-500 to-blue-600',
    color: 'indigo'
  }
];

const stats = [
  { number: '10K+', label: 'Documents Processed', delay: 0 },
  { number: '500+', label: 'Active Vendors', delay: 0.1 },
  { number: '99.9%', label: 'Uptime Guarantee', delay: 0.2 },
  { number: '24/7', label: 'Support Available', delay: 0.3 }
];

const testimonials = [
  {
    quote: "This platform revolutionized our document workflow. Processing time reduced by 80%!",
    author: "Sarah Johnson",
    position: "Operations Director",
    company: "TechCorp",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
  },
  {
    quote: "The security features give us complete peace of mind. Best investment we've made.",
    author: "Michael Chen",
    position: "CTO",
    company: "Global Finance",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
  },
  {
    quote: "Incredible user experience. Our team adapted within days, not weeks.",
    author: "Alex Rivera",
    position: "Project Manager", 
    company: "Supply Solutions",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
  }
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollYProgress } = useScroll();
  
  // Parallax effects
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  
  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  const handleAdminLogin = () => navigate('/admin/login');
  const handleVendorLogin = () => navigate('/vendor/login');
  const handleConsultantLogin = () => navigate('/consultant/login');
  const handleGetStarted = () => navigate('/register');
  
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Floating background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-600/20 rounded-full blur-xl"
          animate={floatingAnimation}
          style={{ animationDelay: '0s' }}
        />
        <motion.div
          className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-cyan-600/20 rounded-full blur-xl"
          animate={floatingAnimation}
          style={{ animationDelay: '1s' }}
        />
        <motion.div
          className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-br from-emerald-400/20 to-teal-600/20 rounded-full blur-xl"
          animate={floatingAnimation}
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Modern Header */}
      <motion.header 
        className="relative z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <DocumentTextIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Vendor Management
                </h1>
                <p className="text-xs text-gray-500"></p>
              </div>
            </motion.div>
            
            {/* Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                Features
              </a>
              <a href="#testimonials" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                Reviews
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                Pricing
              </a>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 font-medium transition-colors duration-200">
                  <span>Login</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-100">
                  <button onClick={handleAdminLogin} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150 rounded-lg mx-2">
                    Admin Login
                  </button>
                  <button onClick={handleVendorLogin} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150 rounded-lg mx-2">
                    Vendor Login
                  </button>
                  <button onClick={handleConsultantLogin} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150 rounded-lg mx-2">
                    Consultant Login
                  </button>
                </div>
              </div>
              
              <motion.button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Get Started
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={gradientShift}
            style={{
              background: 'linear-gradient(45deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
              backgroundSize: '400% 400%'
            }}
          />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center lg:text-left"
            >
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-blue-700 font-medium mb-6"
              >
                <SparklesIcon className="h-5 w-5 mr-2" />
                <span>Transform Your Workflow</span>
              </motion.div>
              
              <motion.h1
                variants={itemVariants}
                className="text-4xl md:text-6xl font-bold mb-6"
              >
                <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  Vendor Management
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  System
                </span>
              </motion.h1>
              
              <motion.p
                variants={itemVariants}
                className="text-xl text-gray-600 mb-8 max-w-2xl"
              >
                Streamline your document workflows with our intelligent platform. 
                Automate approvals, track compliance, and manage vendors with ease.
              </motion.p>
              
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <motion.button
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Free Trial
                  <ArrowRightIcon className="h-5 w-5 ml-2 inline" />
                </motion.button>
                
                <motion.button
                  className="flex items-center justify-center px-8 py-4 rounded-2xl font-semibold text-lg border-2 border-gray-300 hover:border-blue-400 transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <PlayIcon className="h-5 w-5 mr-2" />
                  
                </motion.button>
              </motion.div>
              
              {/* Stats */}
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-12 pt-8 border-t border-gray-200"
              >
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: stat.delay }}
                  >
                    <div className="text-2xl font-bold text-gray-900">{stat.number}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
            
            {/* Right Content - Dashboard Preview */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative">
                <motion.div
                  className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200"
                  animate={pulseAnimation}
                >
                  {/* Mock Dashboard */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800">Dashboard Overview</h3>
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                        <div className="text-2xl font-bold text-blue-600">1,234</div>
                        <div className="text-sm text-blue-600">Documents</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                        <div className="text-2xl font-bold text-green-600">98.5%</div>
                        <div className="text-sm text-green-600">Accuracy</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-2 bg-gray-200 rounded-full">
                            <div className="h-2 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full w-3/4"></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-2 bg-gray-200 rounded-full">
                            <div className="h-2 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full w-1/2"></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-2 bg-gray-200 rounded-full">
                            <div className="h-2 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full w-5/6"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                {/* Floating Cards */}
                <motion.div
                  className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-lg p-4 border border-gray-200"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <CheckCircleIcon className="h-6 w-6 text-green-500" />
                </motion.div>
                
                <motion.div
                  className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-lg p-4 border border-gray-200"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <BoltIcon className="h-6 w-6 text-yellow-500" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 text-blue-700 font-medium mb-6">
              <SparklesIcon className="h-5 w-5 mr-2" />
              <span>Powerful Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Everything You Need
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the tools that will transform your document management workflow
            </p>
          </motion.div>
          
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-gray-200"
                whileHover={{ y: -5 }}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Trusted by Thousands
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See what our customers say about their experience
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{testimonial.position}</div>
                    <div className="text-sm text-blue-600">{testimonial.company}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Join thousands of organizations who trust us with their document management
            </p>
            <motion.button
              onClick={handleGetStarted}
              className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Your Free Trial
              <ArrowRightIcon className="h-5 w-5 ml-2 inline" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Vendor Management</h3>
                  <p className="text-gray-400 text-sm"></p>
                </div>
              </div>
              <p className="text-gray-400">
                Streamline your vendor document management with our intelligent platform.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#demo" className="hover:text-white transition-colors">Demo</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#careers" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#help" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#docs" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#status" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 VendorFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;