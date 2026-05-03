import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, googleProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, signOut } from '../firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { LogIn, ShieldCheck, Mail, Lock, UserPlus, CheckCircle, Loader2 } from 'lucide-react';

const Login = () => {
  const { user, loading } = useFirebase();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/profile';

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  React.useEffect(() => {
    if (!loading && user && !showVerificationMessage) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from, showVerificationMessage]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          await signOut(auth);
          toast.error('Please verify your email before logging in.');
          setRegisteredEmail(email);
          setShowVerificationMessage(true);
          return;
        }
        toast.success('Successfully logged in!');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        await signOut(auth);
        setRegisteredEmail(email);
        setShowVerificationMessage(true);
        toast.success('Verification email sent!');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      if (isLogin) {
        toast.error('Email or password is incorrect.');
      } else {
        if (error.code === 'auth/email-already-in-use') {
          toast.error('User already exists. Please sign in.');
        } else {
          toast.error(error.message || 'Authentication failed.');
        }
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    console.log('Starting Google Login...');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google Login Result:', result.user.email);
      toast.success('Successfully logged in!');
    } catch (error: any) {
      console.error('Google Login error details:', error);
      let errorMessage = 'Failed to login with Google.';
      
      if (error.code === 'auth/popup-blocked') {
        errorMessage = 'SignIn popup was blocked by your browser. Please allow popups for this site.';
        toast.error(errorMessage, { duration: 10000 });
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized for Google Sign-In. Administrator needs to add this domain to Firebase Console Authorized Domains.';
        toast.error(errorMessage, { duration: 10000 });
        console.warn('Unauthorized Domain:', window.location.hostname);
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Login cancelled. Only one login popup can be opened at a time.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login popup was closed before completion.';
      } else if (error.message) {
        errorMessage = `Login error (${error.code || 'unknown'}): ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (showVerificationMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100 text-center"
        >
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-100">
            <CheckCircle className="text-green-600" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Verify Your Email</h1>
          <p className="text-gray-600 mb-10">
            We have sent you a verification email to <span className="font-semibold text-gray-900">{registeredEmail}</span>. Please verify it and log in.
          </p>
          <button
            onClick={() => {
              setShowVerificationMessage(false);
              setIsLogin(true);
            }}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 transition-all shadow-md flex items-center justify-center space-x-2"
          >
            <LogIn size={20} />
            <span>Login</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 pt-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100"
      >
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-100">
          <ShieldCheck className="text-green-600" size={40} />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          {isLogin 
            ? 'Sign in to your DNA Cult Fitness account to manage your membership.' 
            : 'Join DNA Cult Fitness and start your transformation journey today.'}
        </p>

        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
            <span>{authLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}</span>
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500 uppercase tracking-wider">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading || authLoading}
          className="w-full flex items-center justify-center space-x-3 bg-white border border-gray-200 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm mb-6 disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="animate-spin text-gray-400" size={20} />
          ) : (
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              className="w-5 h-5"
              referrerPolicy="no-referrer"
            />
          )}
          <span>{googleLoading ? 'Connecting...' : 'Google'}</span>
        </button>

        {window.location.hostname.includes('aistudio.google') || window.location.hostname.includes('run.app') ? (
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6">
            <p className="text-[10px] text-blue-800 font-medium leading-relaxed">
              <span className="font-bold">Note:</span> If Google Login fails on this preview site, ensure you have:
              <br />1. Enabled Google Auth in Firebase Console.
              <br />2. Added <code className="bg-blue-100 px-1 rounded">{window.location.hostname}</code> to <b>Authorized Domains</b> in Firebase Authentication settings.
            </p>
          </div>
        ) : null}

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-green-600 font-semibold hover:underline text-sm"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
