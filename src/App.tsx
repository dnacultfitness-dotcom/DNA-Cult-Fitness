import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useFirebase } from './components/FirebaseProvider';
import ErrorBoundary from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import { Toaster, toast } from 'sonner';
import { Menu, X, Instagram, Facebook, Youtube, LogIn, LogOut, LayoutDashboard, Phone, Mail, Globe, MessageSquare, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { auth, signOut } from './firebase';

import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import Membership from './pages/Membership';
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import Login from './pages/Login';
import AIAssistant from './pages/AIAssistant';
import Profile from './pages/Profile';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, profile, isAdmin, isTrainer } = useFirebase();
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Membership', path: '/membership' },
    { name: 'Contact', path: '/contact' },
  ];

  if (user) {
    if (isAdmin) {
      navLinks.push({ name: 'Admin', path: '/admin' });
    }
    if (isTrainer) {
      navLinks.push({ name: 'Trainer Hub', path: '/trainer' });
    }
    navLinks.splice(3, 0, { name: 'Profile', path: '/profile' });
  }

  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-brand-dark border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tighter text-brand-green">DNA CULT <span className="text-white">FITNESS</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-brand-green",
                  location.pathname === link.path ? "text-brand-green" : "text-gray-300"
                )}
              >
                {link.name}
              </Link>
            ))}
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="flex items-center space-x-2 group">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 group-hover:border-brand-green transition-colors">
                    {profile?.photoURL ? (
                      <img 
                        src={profile.photoURL} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-brand-green/20 flex items-center justify-center text-brand-green text-xs font-bold">
                        {profile?.displayName?.[0] || user.email?.[0] || 'U'}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-bold text-gray-300 group-hover:text-brand-green transition-colors hidden lg:block">
                    {profile?.displayName || user.displayName || user.email?.split('@')[0]}
                  </span>
                </Link>
                <button 
                  onClick={async () => {
                    await signOut(auth);
                    toast.success('Signed out successfully');
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="p-2 text-gray-300 hover:text-brand-green transition-colors">
                <LogIn size={20} />
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-300 p-2 hover:text-brand-green transition-colors">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-brand-dark border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "block px-3 py-4 text-base font-medium rounded-md",
                    location.pathname === link.path ? "bg-white/5 text-brand-green" : "text-gray-300 hover:bg-white/5 hover:text-brand-green"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              {user ? (
                <div className="border-t border-white/10 mt-2 pt-4">
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-white/5 group transition-all"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 group-hover:border-brand-green transition-colors">
                      {profile?.photoURL ? (
                        <img 
                          src={profile.photoURL} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-brand-green/20 flex items-center justify-center text-brand-green text-sm font-bold">
                          {profile?.displayName?.[0] || user.email?.[0] || 'U'}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-brand-green transition-colors">
                        {profile?.displayName || user.displayName || user.email?.split('@')[0]}
                      </p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">View Profile</p>
                    </div>
                  </Link>
                  <button
                    onClick={async () => {
                      setIsOpen(false);
                      await signOut(auth);
                      toast.success('Signed out successfully');
                    }}
                    className="flex items-center space-x-3 px-3 py-4 w-full text-red-500 hover:bg-white/5 group transition-all"
                  >
                    <LogOut size={20} />
                    <span className="text-sm font-bold">Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-4 text-base font-medium text-brand-green hover:bg-white/5 rounded-md"
                >
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => {
  const location = useLocation();
  
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-gray-900 text-white pt-12 sm:pt-16 pb-6 sm:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-12 mb-10 sm:mb-12 text-center md:text-left">
          <div className="col-span-1 md:col-span-2 flex flex-col items-center md:items-start">
            <span className="text-xl sm:text-2xl font-bold tracking-tighter text-brand-green mb-4 sm:mb-6 block uppercase">DNA Cult Fitness</span>
            <p className="text-gray-400 max-w-md mb-6 text-sm sm:text-base leading-relaxed">
              Transform your body and elevate your DNA with our premium fitness programs. 
              We combine science-backed training with a supportive community to help you reach your peak performance.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Instagram size={18} /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Facebook size={18} /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors"><Youtube size={18} /></a>
            </div>
          </div>
          
          <div>
            <h4 className="text-base sm:text-lg font-black mb-4 sm:mb-6 uppercase tracking-tight">Quick Links</h4>
            <ul className="space-y-3 sm:space-y-4 text-gray-400 text-sm sm:text-base">
              <li><Link to="/about" className="hover:text-brand-green transition-colors font-medium">About Us</Link></li>
              <li><Link to="/services" className="hover:text-brand-green transition-colors font-medium">Services</Link></li>
              <li><Link to="/ai-assistant" className="hover:text-brand-green transition-colors font-medium">AI Assistant</Link></li>
              <li><Link to="/membership" className="hover:text-brand-green transition-colors font-medium">Membership</Link></li>
              <li><Link to="/contact" className="hover:text-brand-green transition-colors font-medium">Contact</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-base sm:text-lg font-black mb-4 sm:mb-6 uppercase tracking-tight">Contact Info</h4>
            <ul className="space-y-3 sm:space-y-4 text-gray-400 text-sm sm:text-base">
              <li className="flex items-start justify-center md:justify-start space-x-3 group">
                <MapPin size={16} className="text-brand-green mt-1 shrink-0" />
                <a 
                  href="https://www.google.com/maps/dir//DNA+Cult+Fitness,+Royal+Tower,+Trichambaram,+Taliparamba,+Kannur+-+670141/@12.0326503,75.359472,17z/data=!4m8!4m7!1m0!1m5!1m1!1s0x3ba43fb67521c0d1:0x579e95721a3937b1!2m2!1d75.359472!2d12.0326503?entry=ttu" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition-colors leading-tight"
                >
                  Royal Tower, Trichambaram, Taliparamba, Kannur - 670141
                </a>
              </li>
              <li className="flex items-center justify-center md:justify-start space-x-3">
                <Phone size={16} className="text-brand-green" />
                <span className="font-medium">+91 62388 92734</span>
              </li>
              <li className="flex items-center justify-center md:justify-start space-x-3">
                <MessageSquare size={16} className="text-brand-green" />
                <a href="https://wa.me/916238892734" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors font-medium">
                  +91 62388 92734
                </a>
              </li>
              <li className="flex items-center justify-center md:justify-start space-x-3">
                <Globe size={16} className="text-brand-green" />
                <a href="https://www.dnacultfitness.com" className="hover:text-white transition-colors text-[11px] sm:text-xs truncate font-medium">www.dnacultfitness.com</a>
              </li>
              <li className="flex items-center justify-center md:justify-start space-x-3">
                <Mail size={16} className="text-brand-green" />
                <a href="mailto:dnacultfitness@gmail.com" className="hover:text-white transition-colors text-[11px] sm:text-xs truncate font-medium">dnacultfitness@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-6 sm:pt-8 border-t border-gray-800 text-center text-gray-500 text-[10px] sm:text-xs uppercase font-black tracking-widest">
          <p>&copy; {new Date().getFullYear()} DNA Cult Fitness. Optimized for Performance.</p>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  const { dbError } = useFirebase();

  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-white font-sans">
          {dbError && (
            <div className="bg-red-600 text-white text-[10px] py-1 px-4 text-center sticky top-0 z-[100] font-bold tracking-wider animate-pulse uppercase">
              ⚠️ Database Connection Failed: You must enable "CLOUD FIRESTORE" in your Firebase Console (Realtime DB is NOT enough). Check Console (F12) for instructions.
            </div>
          )}
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/membership" element={<Membership />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Profile />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/trainer/*" element={<TrainerDashboard />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
            </Routes>
          </main>
          <Footer />
          <Toaster position="top-center" richColors />
        </div>
      </Router>
    </ErrorBoundary>
  );
}
