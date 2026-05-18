import React, { useState, useEffect } from 'react';
import { useFirebase } from '../components/FirebaseProvider';
import { db, collection, query, where, onSnapshot, doc, updateDoc, setDoc, addDoc, serverTimestamp, handleFirestoreError, OperationType, orderBy } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Phone, 
  Scale, 
  Ruler, 
  Target, 
  ShieldAlert, 
  Stethoscope, 
  Save, 
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  SkipForward,
  LayoutDashboard,
  Settings as SettingsIcon,
  Dumbbell,
  Calendar,
  TrendingUp,
  Sparkles,
  FileText,
  Activity,
  ChevronRight,
  Plus,
  X,
  Info,
  Camera,
  Upload,
  LogOut,
  Clock
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import PhoneInput from '../components/PhoneInput';
import { auth, signOut } from '../firebase';
import { NotificationBell } from '../components/NotificationBell';

const Profile = () => {
  const { user, profile, personalDetails, loading: authLoading } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'workout'>('overview');
  const [isSetupMode, setIsSetupMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'workout' || tabParam === 'settings' || tabParam === 'overview') {
      setActiveTab(tabParam as any);
    }
  }, [location.search]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user && !personalDetails) {
      setActiveTab('settings');
      setIsSetupMode(true);
    } else if (personalDetails) {
      setIsSetupMode(false);
    }
  }, [personalDetails, authLoading, user]);

  // Dashboard States
  const [activePlan, setActivePlan] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [workoutStatusLoading, setWorkoutStatusLoading] = useState(true);
  const [showQuickUpdate, setShowQuickUpdate] = useState(false);
  const [displayDay, setDisplayDay] = useState<'today' | 'tomorrow'>('today');
  const [quickWeight, setQuickWeight] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'workout' | 'diet'>('workout');

  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString();
  const isFinishedToday = membership?.lastWorkoutDate === todayStr;
  const targetIndex = isFinishedToday 
    ? Math.max(0, (membership?.currentWorkoutIndex || 1) - 1)
    : (membership?.currentWorkoutIndex || 0);
  
  const displayIndex = displayDay === 'today' ? targetIndex : targetIndex + 1;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    weight: '',
    height: '',
    gender: 'male',
    injury: '',
    lifestyleDisease: '',
    goal: '',
    photoURL: ''
  });

  useEffect(() => {
    if (personalDetails) {
      setFormData({
        name: personalDetails.name || '',
        phone: (personalDetails as any).phone || '',
        weight: personalDetails.weight?.toString() || '',
        height: personalDetails.height?.toString() || '',
        gender: personalDetails.gender || 'male',
        injury: personalDetails.injury || '',
        lifestyleDisease: personalDetails.lifestyleDisease || '',
        goal: personalDetails.goal || '',
        photoURL: profile?.photoURL || ''
      });
    }
  }, [personalDetails, profile]);

  useEffect(() => {
    if (!user) {
      setDashboardLoading(false);
      setWorkoutStatusLoading(false);
      return;
    }

    setDashboardLoading(true);
    setWorkoutStatusLoading(true);

    // Fetch membership
    const membershipQuery = query(collection(db, 'memberships'), where('userId', '==', user.uid));
    const unsubscribeMembership = onSnapshot(membershipQuery, (snapshot) => {
      if (!snapshot.empty) {
        setMembership({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setMembership(null);
      }
      setDashboardLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'memberships'));

    // Fetch active plan
    const planQuery = query(collection(db, 'aiPlans'), where('userId', '==', user.uid), where('isActive', '==', true));
    const unsubscribePlan = onSnapshot(planQuery, (snapshot) => {
      if (!snapshot.empty) {
        setActivePlan({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setActivePlan(null);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'aiPlans'));

    // Fetch weekly reports
    const reportsQuery = query(collection(db, 'weeklyReports'), where('userId', '==', user.uid));
    const unsubscribeReports = onSnapshot(reportsQuery, (snapshot) => {
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      data.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setRecentReports(data);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'weeklyReports'));

    // Fetch today's workout status
    const today = getLocalDateString();
    const todayWorkoutQuery = query(collection(db, 'dailyWorkouts'), where('userId', '==', user.uid), where('date', '==', today));
    const unsubscribeTodayWorkout = onSnapshot(todayWorkoutQuery, (snapshot) => {
      if (!snapshot.empty) {
        setTodayWorkout({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setTodayWorkout(null);
      }
      setWorkoutStatusLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'dailyWorkouts'));

    return () => {
      unsubscribeMembership();
      unsubscribePlan();
      unsubscribeReports();
      unsubscribeTodayWorkout();
    };
  }, [user]);

  const handleWorkoutAction = async (action: 'done' | 'skipped') => {
    if (!user || !membership) return;
    setUpdating(true);
    try {
      const today = getLocalDateString();
      await addDoc(collection(db, 'dailyWorkouts'), {
        userId: user.uid,
        userName: personalDetails?.name || profile?.displayName || user.email,
        date: today,
        status: 'pending',
        action: action,
        workoutIndex: membership.currentWorkoutIndex || 0,
        createdAt: serverTimestamp()
      });
      toast.success(`Workout ${action === 'done' ? 'completed' : 'skipped'}! Submitted for verification.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'dailyWorkouts');
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUpdating(true);
    try {
      await addDoc(collection(db, 'weeklyReports'), {
        userId: user.uid,
        weight: parseFloat(quickWeight),
        notes: 'Quick update from profile',
        createdAt: serverTimestamp()
      });
      
      const detailsRef = doc(db, 'users', user.uid, 'details', 'personal');
      await updateDoc(detailsRef, {
        weight: parseFloat(quickWeight),
        updatedAt: serverTimestamp()
      });

      toast.success('Weight updated successfully!');
      setQuickWeight('');
      setShowQuickUpdate(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'weeklyReports');
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Update personal details
      const detailsDocRef = doc(db, 'users', user.uid, 'details', 'personal');
      const h = parseFloat(formData.height) || 0;
      const w = parseFloat(formData.weight) || 0;
      
      const detailsData = {
        name: formData.name,
        phone: formData.phone,
        weight: w,
        height: h,
        gender: formData.gender,
        injury: formData.injury,
        lifestyleDisease: formData.lifestyleDisease,
        goal: formData.goal,
        updatedAt: serverTimestamp()
      };

      await setDoc(detailsDocRef, detailsData, { merge: true });

      // Sync important fields to root user doc for visibility in Trainer Hub / Admin
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: formData.name,
        photoURL: formData.photoURL,
        height: h,
        weight: w,
        gender: formData.gender,
        goal: formData.goal,
        experienceLevel: formData.experienceLevel || '',
        lastActive: serverTimestamp()
      });

      setSuccess(true);
      toast.success('Profile updated successfully!');
      setActiveTab('overview');
      navigate('/profile?tab=overview'); // Force URL update for consistency
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (err) {
      toast.error('Failed to sign out');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for base64 in Firestore
        toast.error("Image size too large. Please upload an image under 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoURL: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (authLoading || (activeTab === 'overview' && dashboardLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-brand" size={48} />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen min-h-dvh bg-gray-50 pt-[calc(6rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {!isSetupMode ? (
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-brand font-black uppercase tracking-widest text-xs mb-3 block">Member Portal</span>
              <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tight">Your Dashboard</h1>
                <div className="md:hidden">
                  <NotificationBell />
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="hidden md:block">
                <NotificationBell />
              </div>
              <div className="flex bg-white p-1 rounded-xl border border-gray-200">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={cn(
                    "flex items-center px-6 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                    activeTab === 'overview' 
                      ? "bg-gray-900 text-white" 
                      : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  <LayoutDashboard size={16} className="mr-2" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('workout')}
                  className={cn(
                    "flex items-center px-6 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                    activeTab === 'workout' 
                      ? "bg-gray-900 text-white" 
                      : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  <Dumbbell size={16} className="mr-2" />
                  Today's Workout
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={cn(
                    "flex items-center px-6 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                    activeTab === 'settings' 
                      ? "bg-gray-900 text-white" 
                      : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  <SettingsIcon size={16} className="mr-2" />
                  Settings
                </button>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center w-full sm:w-auto px-6 py-2.5 bg-white border border-red-100 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all shadow-sm group"
              >
                <LogOut size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center mb-12">
            <span className="text-brand font-black uppercase tracking-widest text-xs mb-3 block">Initialization Sequence</span>
            <h1 className="text-4xl font-black text-gray-900 uppercase">Setup Your DNA Profile</h1>
            <p className="text-gray-500 mt-4 max-w-lg mx-auto font-medium">Please provide your biological parameters to unlock your customized training protocols.</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'overview' ? (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Profile Summary Card */}
              <div className="lg:col-span-1 space-y-8">
                <div className="card-premium overflow-hidden">
                  <div className="p-6 sm:p-10 text-center border-b border-gray-50 bg-gray-50/30">
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 sm:mb-6">
                      {profile?.photoURL ? (
                        <img 
                          src={profile.photoURL} 
                          alt="Profile" 
                          className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-xl"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-brand/10 flex items-center justify-center text-brand text-4xl sm:text-5xl font-black border-4 border-white shadow-xl">
                          {profile?.displayName?.[0] || user.email?.[0] || 'U'}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 sm:w-10 sm:h-10 bg-brand rounded-full border-4 border-white flex items-center justify-center text-white shadow-lg">
                        <CheckCircle2 size={16} sm:size={18} />
                      </div>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-gray-900 mb-1 uppercase tracking-tight">{personalDetails?.name || profile?.displayName || 'User'}</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mb-4">{user.email}</p>
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      {profile?.role || 'Member'}
                    </span>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Weight</p>
                        <p className="text-lg font-bold text-gray-900">{personalDetails?.weight || '--'} kg</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Height</p>
                        <p className="text-lg font-bold text-gray-900">{personalDetails?.height || '--'} cm</p>
                      </div>
                    </div>
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Target size={16} className="mr-3 text-green-600" />
                        <span className="truncate">{personalDetails?.goal || 'No goal set'}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <ShieldAlert size={16} className="mr-3 text-green-600" />
                        <span className="truncate">{personalDetails?.injury || 'No injuries'}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className="w-full mt-4 py-2 bg-gray-900 text-white text-sm font-bold rounded-lg hover:bg-black transition-all flex items-center justify-center"
                    >
                      <SettingsIcon size={16} className="mr-2" />
                      Edit Profile
                    </button>
                  </div>
                </div>

                {/* Membership Card */}
                <div className="card-premium overflow-hidden">
                  <div className="p-8 border-b border-gray-50">
                    <h2 className="font-black text-gray-900 uppercase flex items-center tracking-tight">
                      <Calendar size={20} className="mr-3 text-brand" /> Membership
                    </h2>
                  </div>
                  <div className="p-8">
                    {membership ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-black text-gray-900 uppercase text-lg">{membership.program}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Status: 
                              <span className={cn(
                                "ml-2",
                                membership.status === 'approved' ? "text-brand" : "text-yellow-600"
                              )}>
                                {membership.status.toUpperCase()}
                              </span>
                            </p>
                            {membership.status === 'approved' && membership.expiryDate && (
                              <div className="mt-4 p-4 bg-brand/5 rounded-2xl border border-brand/10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Membership Validity</p>
                                <div className="flex items-center justify-between">
                                  {(() => {
                                    const expiry = (membership.expiryDate && typeof membership.expiryDate.toDate === 'function') 
                                      ? membership.expiryDate.toDate().getTime() 
                                      : null;
                                    const now = new Date().getTime();
                                    const diff = expiry ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : 0;
                                    const daysLeft = isNaN(diff) ? 0 : diff;
                                    
                                    return (
                                      <>
                                        <p className={cn(
                                          "text-lg font-black",
                                          daysLeft > 0 ? "text-gray-900" : "text-red-500"
                                        )}>
                                          {Math.max(0, daysLeft)} Days Left
                                        </p>
                                        <Clock size={16} className={cn(
                                          daysLeft > 0 ? "text-brand" : "text-red-500"
                                        )} />
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center text-brand">
                            <FileText size={28} />
                          </div>
                        </div>
                        <Link to="/membership" className="block w-full py-4 text-center text-xs font-black uppercase tracking-widest text-brand bg-brand/5 border border-brand/10 rounded-2xl hover:bg-brand/10 transition-all">
                          View Details
                        </Link>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm font-bold text-gray-400 mb-6">No active membership found.</p>
                        <Link to="/membership" className="btn-primary w-full inline-block">
                          Join Now
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Active Plan & Progress */}
              <div className="lg:col-span-2 space-y-8">
                {/* Active Training Plan */}
                <div className="card-premium overflow-hidden">
                  <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="font-black text-gray-900 uppercase flex items-center tracking-tight">
                      <Dumbbell size={20} className="mr-3 text-brand" /> Active Training Plan
                    </h2>
                    <Link to="/ai-assistant" className="text-[10px] font-black uppercase tracking-widest text-brand hover:underline">Manage Plans</Link>
                  </div>
                  <div className="p-6 sm:p-10">
                    {activePlan ? (
                      <div className="space-y-6 sm:space-y-8">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2 sm:mb-3 uppercase leading-none">{activePlan.planData.overview.split('.')[0]}</h3>
                            <p className="text-xs sm:text-sm font-medium text-gray-500 leading-relaxed line-clamp-2">{activePlan.planData.overview}</p>
                          </div>
                          <div className="bg-brand/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-brand group-hover:scale-110 transition-transform">
                            <Sparkles size={24} sm:size={28} />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2">Tier</p>
                            <p className="font-black text-gray-900 uppercase">
                              {membership?.approvedAiPlan 
                                ? membership.approvedAiPlan.replace(/_/g, ' ') 
                                : 'Demo Tier'}
                            </p>
                          </div>
                          <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2">Duration</p>
                            <p className="font-black text-gray-900 uppercase">
                              {membership?.approvedAiPlan?.includes('1_month') ? '1 Month' : '1 Week'}
                            </p>
                          </div>
                          <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2">Focus</p>
                            <p className="font-black text-gray-900 uppercase">{personalDetails?.goal || 'Fitness'}</p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                          <button 
                            onClick={() => navigate('/ai-assistant')}
                            className="btn-primary flex-1 py-5 text-sm"
                          >
                            Continue Training
                            <ChevronRight size={18} className="ml-2" />
                          </button>
                          <button 
                            onClick={() => setShowPlanModal(true)}
                            className="flex-1 py-5 bg-white border-2 border-gray-900 text-gray-900 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center"
                          >
                            <FileText size={18} className="mr-2 text-brand" />
                            View Full Plan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                          <Dumbbell size={40} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-3 uppercase">No Active Plan</h3>
                        <p className="text-gray-500 mb-8 max-w-xs mx-auto font-medium">Generate a personalized AI training plan to start your transformation.</p>
                        <Link to="/ai-assistant" className="btn-primary px-10">
                          Generate My Plan
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Tracker */}
                <div className="card-premium overflow-hidden">
                  <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="font-black text-gray-900 uppercase flex items-center tracking-tight">
                      <TrendingUp size={20} className="mr-3 text-brand" /> Progress Tracking
                    </h2>
                    <button 
                      onClick={() => setShowQuickUpdate(!showQuickUpdate)}
                      className="text-[10px] font-black uppercase tracking-widest text-brand hover:underline"
                    >
                      {showQuickUpdate ? 'Cancel' : 'Quick Update'}
                    </button>
                  </div>
                  <div className="p-8">
                    {showQuickUpdate && (
                      <motion.form 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        onSubmit={handleQuickUpdate}
                        className="mb-8 p-8 bg-gray-50 rounded-3xl border border-gray-100 space-y-6"
                      >
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Current Weight (kg)</label>
                          <input 
                            type="number" 
                            step="0.1"
                            required
                            value={quickWeight}
                            onChange={(e) => setQuickWeight(e.target.value)}
                            className="w-full px-6 py-4 bg-white border-none shadow-sm rounded-2xl outline-none focus:ring-2 focus:ring-brand font-bold text-gray-900"
                            placeholder="70.5"
                          />
                        </div>
                        <button 
                          type="submit" 
                          disabled={updating}
                          className="btn-primary w-full py-4 text-xs"
                        >
                          {updating ? <Loader2 className="animate-spin mr-2" size={16} /> : <Plus className="mr-2" size={16} />}
                          Update Weight
                        </button>
                      </motion.form>
                    )}

                    {recentReports.length > 0 ? (
                      <div className="space-y-8">
                        <div className="flex items-center justify-between p-8 bg-brand/5 rounded-3xl border border-brand/10">
                          <div>
                            <p className="text-[10px] text-brand font-black uppercase tracking-widest mb-2">Current Weight</p>
                            <p className="text-4xl font-black text-gray-900 leading-none">{recentReports[0].weight} <span className="text-lg font-bold text-gray-400">kg</span></p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Last updated</p>
                            <p className="text-sm font-black text-gray-900 uppercase">{recentReports[0].createdAt?.toDate().toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {recentReports.map((report) => (
                            <div key={report.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-all border border-transparent hover:border-gray-100">
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-brand">
                                  <Activity size={20} />
                                </div>
                                <div>
                                  <p className="text-sm font-black text-gray-900">{report.weight} kg</p>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{report.createdAt?.toDate().toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="text-brand">
                                <ChevronRight size={18} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-sm font-bold text-gray-400">No progress reports yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'workout' ? (
            <motion.div
              key="workout"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="card-premium overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="bg-[#00c950]/10 px-5 py-2.5 rounded-2xl font-black text-gray-900 uppercase flex items-center tracking-tight border border-[#00c950]/10">
                    <Dumbbell size={20} className="mr-3 text-[#00c950]" /> 
                    {displayDay === 'today' ? "Today's Training Session" : "Next Training Session Preview"}
                  </h2>
                  <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                    <button
                      onClick={() => setDisplayDay('today')}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        displayDay === 'today' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                      )}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setDisplayDay('tomorrow')}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        displayDay === 'tomorrow' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                      )}
                    >
                      Tomorrow
                    </button>
                  </div>
                </div>
                <div className="p-6 sm:p-10">
                  {activePlan ? (
                    <div className="space-y-6 sm:space-y-8">
                      {/* Sub-tab Switcher */}
                      <div className="flex justify-center mb-6 sm:mb-8">
                        <div className="bg-gray-100 p-1.5 rounded-2xl flex space-x-1 border border-gray-200">
                          <button
                            onClick={() => setActiveSubTab('workout')}
                            className={cn(
                              "px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2",
                              activeSubTab === 'workout' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                            )}
                          >
                            <Dumbbell size={14} sm:size={16} />
                            <span>Workout</span>
                          </button>
                          <button
                            onClick={() => setActiveSubTab('diet')}
                            className={cn(
                              "px-4 sm:px-8 py-2.5 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2",
                              activeSubTab === 'diet' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                            )}
                          >
                            <Activity size={14} sm:size={16} />
                            <span>Diet</span>
                          </button>
                        </div>
                      </div>

                      {activeSubTab === 'workout' ? (
                        <div className="relative p-8 bg-[#101828] rounded-[2.5rem] border border-[#c6dcff]/10 shadow-2xl overflow-hidden group/card">
                        {/* Background Decoration */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#00c950]/5 rounded-full blur-3xl group-hover/card:bg-[#00c950]/10 transition-colors duration-700" />
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#c6dcff]/5 rounded-full blur-3xl group-hover/card:bg-[#c6dcff]/10 transition-colors duration-700" />

                        <div className="relative flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                          <div className="flex items-center">
                            <div className="w-16 h-16 bg-[#00c950] rounded-2xl flex items-center justify-center text-[#101828] mr-6 shadow-lg shadow-[#00c950]/20 rotate-3 group-hover/card:rotate-0 transition-transform duration-500">
                              <Dumbbell size={32} />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <span className={cn(
                                  "px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-md border",
                                  displayDay === 'today' ? "bg-[#00c950]/10 text-[#00c950] border-[#00c950]/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                )}>
                                  {displayDay === 'today' ? "Active Session" : "Preview Mode"}
                                </span>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#c6dcff]/50">Day {displayIndex + 1}</p>
                              </div>
                              <h4 className="text-2xl font-black text-white uppercase tracking-tight">
                                {activePlan.planData.workoutPlan && activePlan.planData.workoutPlan[displayIndex]?.day || `Training Day`}
                              </h4>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {displayDay === 'today' && (
                              <>
                                {todayWorkout?.status === 'approved' && (
                                  <div className="flex items-center bg-emerald-500/10 px-5 py-2.5 rounded-2xl border border-emerald-500/20 backdrop-blur-sm">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3 animate-pulse" />
                                    <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Session Verified</span>
                                  </div>
                                )}
                                {todayWorkout?.status === 'denied' && (
                                  <div className="flex items-center bg-rose-500/10 px-5 py-2.5 rounded-2xl border border-rose-500/20 backdrop-blur-sm">
                                    <XCircle size={16} className="text-rose-500 mr-2" />
                                    <span className="text-xs font-black text-rose-500 uppercase tracking-widest">Revision Needed</span>
                                  </div>
                                )}
                                {todayWorkout?.status === 'pending' && (
                                  <div className="flex items-center bg-amber-500/10 px-5 py-2.5 rounded-2xl border border-amber-500/20 backdrop-blur-sm">
                                    <Loader2 size={16} className="text-amber-500 mr-2 animate-spin" />
                                    <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Awaiting Review</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {activePlan.planData.workoutPlan && (
                          <div className="relative space-y-3 mb-10">
                            <p className="text-[10px] font-black text-[#c6dcff]/50 uppercase tracking-widest mb-4 flex items-center">
                              <Activity size={14} className="mr-2 text-[#00c950]" /> Exercise List
                            </p>
                            <div className="grid grid-cols-1 gap-3">
                              {activePlan.planData.workoutPlan[displayIndex]?.exercises ? (
                                activePlan.planData.workoutPlan[displayIndex].exercises.map((ex: string, i: number) => (
                                  <div key={i} className="flex items-center p-5 bg-[#c6dcff]/5 rounded-2xl border border-[#c6dcff]/10 hover:bg-[#c6dcff]/10 hover:border-[#c6dcff]/20 transition-all duration-300 group/item">
                                    <div className="w-8 h-8 bg-[#101828] rounded-lg flex items-center justify-center text-[#c6dcff] mr-4 group-hover/item:bg-[#00c950] group-hover/item:text-[#101828] transition-colors">
                                      <span className="text-xs font-black">{i + 1}</span>
                                    </div>
                                    <p className="text-base text-gray-200 font-semibold leading-tight group-hover/item:text-white transition-colors">{ex}</p>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-12 bg-[#c6dcff]/5 rounded-2xl border border-[#c6dcff]/10">
                                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">End of generated plan or Rest Day</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {activePlan.planData.workoutPlan && activePlan.planData.workoutPlan[displayIndex]?.notes && (
                          <div className="mb-10 p-6 bg-[#c6dcff]/5 rounded-[1.5rem] border border-[#c6dcff]/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                              <Info size={48} className="text-[#c6dcff]" />
                            </div>
                            <p className="text-[10px] text-[#00c950] font-black uppercase tracking-widest mb-3 flex items-center">
                              <Sparkles size={14} className="mr-2" /> Coach's Strategy
                            </p>
                            <p className="text-sm text-[#c6dcff]/80 font-medium leading-relaxed italic relative z-10">"{activePlan.planData.workoutPlan[displayIndex].notes}"</p>
                          </div>
                        )}

                        {todayWorkout?.status === 'denied' && todayWorkout.adminMessage && (
                          <div className="mb-10 p-6 bg-rose-500/10 border border-rose-500/20 rounded-[1.5rem]">
                            <div className="flex items-center gap-2 mb-2">
                              <XCircle size={14} className="text-rose-500" />
                              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Feedback from Coach</p>
                            </div>
                            <p className="text-sm text-rose-400 font-medium leading-relaxed">{todayWorkout.adminMessage}</p>
                          </div>
                        )}

                        {displayDay === 'today' && (
                          <div className="mb-10 flex justify-center">
                            <button 
                              onClick={() => setDisplayDay('tomorrow')}
                              className="px-8 py-4 bg-[#c6dcff]/10 border border-[#c6dcff]/20 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-[#c6dcff] hover:bg-[#00c950]/10 hover:text-[#00c950] hover:border-[#00c950]/20 transition-all flex items-center gap-3 group shadow-xl"
                            >
                              <Calendar size={16} className="group-hover:scale-110 transition-transform" />
                              Preview Tomorrow's Session
                            </button>
                          </div>
                        )}

                        {displayDay === 'today' && (!todayWorkout || todayWorkout.status === 'denied') ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <button 
                              onClick={() => handleWorkoutAction('done')}
                              disabled={updating}
                              className="relative py-6 bg-[#00c950] text-[#101828] font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-white transition-all flex items-center justify-center group/btn shadow-2xl shadow-[#00c950]/20 active:scale-95"
                            >
                              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                              <span className="relative flex items-center">
                                {updating ? <Loader2 className="animate-spin mr-3" size={22} /> : <CheckCircle2 className="mr-3 group-hover/btn:scale-110 transition-transform" size={22} />}
                                Complete Workout
                              </span>
                            </button>
                            <button 
                              onClick={() => handleWorkoutAction('skipped')}
                              disabled={updating}
                              className="py-6 bg-transparent text-[#c6dcff] font-black uppercase tracking-widest text-sm rounded-2xl border-2 border-[#c6dcff]/20 hover:bg-[#c6dcff]/5 hover:border-[#c6dcff]/30 transition-all flex items-center justify-center group/skip active:scale-95"
                            >
                              {updating ? <Loader2 className="animate-spin mr-3" size={22} /> : <SkipForward className="mr-3 group-hover/skip:translate-x-1 transition-transform" size={22} />}
                              Skip Session
                            </button>
                          </div>
                        ) : displayDay === 'today' && todayWorkout?.status === 'pending' ? (
                          <div className="w-full py-10 bg-amber-500/5 border border-amber-500/20 rounded-[2rem] flex flex-col items-center justify-center text-center px-6">
                            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                              <Loader2 className="animate-spin text-amber-500" size={32} />
                            </div>
                            <span className="text-lg font-black text-amber-500 uppercase tracking-tight mb-2">Verification in Progress</span>
                            <p className="text-xs text-gray-400 max-w-xs font-medium leading-relaxed">Your coach is reviewing your workout submission. You'll be notified once it's approved.</p>
                          </div>
                        ) : displayDay === 'today' ? (
                          <div className="w-full py-10 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] flex flex-col items-center justify-center text-center px-6">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                              <CheckCircle2 className="text-emerald-500" size={32} />
                            </div>
                            <span className="text-lg font-black text-emerald-500 uppercase tracking-tight mb-2">Session Approved</span>
                            <p className="text-xs text-gray-400 max-w-xs font-medium leading-relaxed">Excellent work! You've successfully completed this session. Get ready for your next challenge tomorrow.</p>
                            <button 
                              onClick={() => setDisplayDay('tomorrow')}
                              className="mt-6 text-[10px] font-black uppercase tracking-widest text-[#00c950] hover:underline flex items-center"
                            >
                              View Tomorrow's Plan <ChevronRight size={14} className="ml-1" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-full py-8 text-center bg-blue-500/5 border border-blue-500/20 rounded-[2.5rem]">
                            <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2 font-mono">Status: Upcoming Protocol</p>
                            <p className="text-xs text-blue-200/60 font-medium">This is a preview of your tomorrow's challenge.</p>
                            <button 
                              onClick={() => setDisplayDay('today')}
                              className="mt-4 px-6 py-2 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all border border-blue-500/10"
                            >
                              Return to Current Session
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative p-8 bg-[#101828] rounded-[2.5rem] border border-[#c6dcff]/10 shadow-2xl overflow-hidden group/card">
                        {/* Background Decoration */}
                        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#00c950]/5 rounded-full blur-3xl group-hover/card:bg-[#00c950]/10 transition-colors duration-700" />
                        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#c6dcff]/5 rounded-full blur-3xl group-hover/card:bg-[#c6dcff]/10 transition-colors duration-700" />

                        <div className="relative flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                          <div className="flex items-center">
                            <div className="w-16 h-16 bg-[#00c950] rounded-2xl flex items-center justify-center text-[#101828] mr-6 shadow-lg shadow-[#00c950]/20 rotate-3 group-hover/card:rotate-0 transition-transform duration-500">
                              <Activity size={32} />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <span className={cn(
                                  "px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-md border",
                                  displayDay === 'today' ? "bg-[#00c950]/10 text-[#00c950] border-[#00c950]/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                )}>
                                  {displayDay === 'today' ? "Nutrition Plan" : "Preview Mode"}
                                </span>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#c6dcff]/50">Day {displayIndex + 1}</p>
                              </div>
                              <h4 className="text-2xl font-black text-white uppercase tracking-tight">
                                {activePlan.planData.dietPlan && activePlan.planData.dietPlan[displayIndex]?.day || `Diet Day`}
                              </h4>
                            </div>
                          </div>
                        </div>

                        {activePlan.planData.dietPlan && (
                          <div className="relative space-y-6">
                            {activePlan.planData.dietPlan[displayIndex] ? [
                              { label: 'Breakfast', value: activePlan.planData.dietPlan[displayIndex]?.breakfast, icon: <Sparkles size={16} /> },
                              { label: 'Lunch', value: activePlan.planData.dietPlan[displayIndex]?.lunch, icon: <Sparkles size={16} /> },
                              { label: 'Snack', value: activePlan.planData.dietPlan[displayIndex]?.snack, icon: <Sparkles size={16} /> },
                              { label: 'Dinner', value: activePlan.planData.dietPlan[displayIndex]?.dinner, icon: <Sparkles size={16} /> },
                            ].map((meal, i) => (
                              <div key={i} className="flex flex-col p-6 bg-[#c6dcff]/5 rounded-2xl border border-[#c6dcff]/10 hover:bg-[#c6dcff]/10 hover:border-[#c6dcff]/20 transition-all duration-300 group/item">
                                <div className="flex items-center mb-3">
                                  <div className="w-8 h-8 bg-[#101828] rounded-lg flex items-center justify-center text-[#00c950] mr-3 group-hover/item:bg-[#00c950] group-hover/item:text-[#101828] transition-colors">
                                    {meal.icon}
                                  </div>
                                  <p className="text-[10px] font-black text-[#00c950] uppercase tracking-widest">{meal.label}</p>
                                </div>
                                <p className="text-base text-gray-200 font-semibold leading-relaxed group-hover/item:text-white transition-colors">{meal.value}</p>
                              </div>
                            )) : (
                              <div className="text-center py-12 bg-[#c6dcff]/5 rounded-2xl border border-[#c6dcff]/10 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                No nutrition protocol found for this period.
                              </div>
                            )}
                          </div>
                        )}

                        {displayDay === 'today' ? (
                          <div className="mt-10 flex justify-center">
                            <button 
                              onClick={() => setDisplayDay('tomorrow')}
                              className="px-8 py-4 bg-[#c6dcff]/10 border border-[#c6dcff]/20 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-[#c6dcff] hover:bg-[#00c950]/10 hover:text-[#00c950] hover:border-[#00c950]/20 transition-all flex items-center gap-3 group shadow-xl"
                            >
                              <Activity size={16} className="group-hover:rotate-12 transition-transform" />
                              Explore Next Day Nutrition
                            </button>
                          </div>
                        ) : (
                          <div className="mt-10 flex justify-center">
                            <button 
                              onClick={() => setDisplayDay('today')}
                              className="px-8 py-4 bg-blue-500/10 border border-blue-500/20 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-500/20 transition-all flex items-center gap-3 group shadow-xl"
                            >
                              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                              Return to Current Nutrition
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  ) : (
                    <div className="text-center py-20">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                        <Dumbbell size={40} />
                      </div>
                      <h3 className="text-xl font-black text-gray-900 mb-3 uppercase">No Active Plan</h3>
                      <p className="text-gray-500 mb-8 max-w-xs mx-auto font-medium">Generate a personalized plan to start tracking your workouts.</p>
                      <Link to="/ai-assistant" className="btn-primary px-8">Get Started</Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card-premium overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="p-10 space-y-12">
                {/* Profile Picture Upload */}
                <div className="space-y-8">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Profile Picture</h3>
                  <div className="flex flex-col md:flex-row items-center gap-10 p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                    <div className="relative group">
                      <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-white flex items-center justify-center">
                        {formData.photoURL ? (
                          <img 
                            src={formData.photoURL} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <User size={64} className="text-gray-200" />
                        )}
                      </div>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                        <Camera size={32} />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handlePhotoUpload}
                        />
                      </label>
                    </div>
                    <div className="flex-1 space-y-4 text-center md:text-left">
                      <h4 className="text-xl font-black text-gray-900 uppercase leading-none">Upload your profile photo</h4>
                      <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl">
                        <p className="text-[10px] text-yellow-800 font-black uppercase tracking-widest flex items-center">
                          <Info size={14} className="mr-2 flex-shrink-0" />
                          STRICT INSTRUCTION: Please upload a CLEAR picture WITHOUT A CAP.
                        </p>
                      </div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Max size 1MB. JPG, PNG or WebP.</p>
                      <label className="inline-flex items-center px-6 py-3 bg-white border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50 transition-all cursor-pointer shadow-sm">
                        <Upload size={16} className="mr-2" />
                        Choose File
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handlePhotoUpload}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="space-y-8">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                        <User size={14} className="mr-2" /> Full Name
                      </label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border-none shadow-sm rounded-2xl focus:ring-2 focus:ring-brand focus:bg-white transition-all outline-none font-bold text-gray-900"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <PhoneInput
                        label="Phone Number"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="00000 00000"
                        className="bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Physical Stats */}
                <div className="space-y-8">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Physical Stats</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                        <Scale size={14} className="mr-2" /> Weight (kg)
                      </label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={formData.weight}
                        onChange={(e) => setFormData({...formData, weight: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border-none shadow-sm rounded-2xl focus:ring-2 focus:ring-brand focus:bg-white transition-all outline-none font-bold text-gray-900"
                        placeholder="70.5"
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                        <Ruler size={14} className="mr-2" /> Height (cm)
                      </label>
                      <input 
                        type="number" 
                        value={formData.height}
                        onChange={(e) => setFormData({...formData, height: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border-none shadow-sm rounded-2xl focus:ring-2 focus:ring-brand focus:bg-white transition-all outline-none font-bold text-gray-900"
                        placeholder="175"
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gender</label>
                      <select 
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border-none shadow-sm rounded-2xl focus:ring-2 focus:ring-brand focus:bg-white transition-all outline-none font-bold text-gray-900 appearance-none"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Health & Goals */}
                <div className="space-y-8">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Health & Goals</h3>
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                        <Target size={14} className="mr-2" /> Fitness Goal
                      </label>
                      <textarea 
                        value={formData.goal}
                        onChange={(e) => setFormData({...formData, goal: e.target.value})}
                        className="w-full px-6 py-4 bg-gray-50 border-none shadow-sm rounded-2xl focus:ring-2 focus:ring-brand focus:bg-white transition-all outline-none resize-none h-32 font-bold text-gray-900"
                        placeholder="What do you want to achieve? (e.g., Lose 5kg, Build muscle)"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                          <ShieldAlert size={14} className="mr-2" /> Injuries
                        </label>
                        <input 
                          type="text" 
                          value={formData.injury}
                          onChange={(e) => setFormData({...formData, injury: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border-none shadow-sm rounded-2xl focus:ring-2 focus:ring-brand focus:bg-white transition-all outline-none font-bold text-gray-900"
                          placeholder="Any current injuries?"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                          <Stethoscope size={14} className="mr-2" /> Diseases
                        </label>
                        <input 
                          type="text" 
                          value={formData.lifestyleDisease}
                          onChange={(e) => setFormData({...formData, lifestyleDisease: e.target.value})}
                          className="w-full px-6 py-4 bg-gray-50 border-none shadow-sm rounded-2xl focus:ring-2 focus:ring-brand focus:bg-white transition-all outline-none font-bold text-gray-900"
                          placeholder="Any lifestyle diseases?"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-10">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className={cn(
                      "w-full py-6 rounded-3xl font-black uppercase tracking-widest text-sm flex items-center justify-center transition-all shadow-xl",
                      success ? "bg-brand text-white shadow-brand/20" : "bg-gray-900 text-white hover:bg-black shadow-gray-200"
                    )}
                  >
                    {loading ? (
                      <Loader2 className="animate-spin mr-3" size={20} />
                    ) : success ? (
                      <CheckCircle2 className="mr-3" size={20} />
                    ) : (
                      <Save className="mr-3" size={20} />
                    )}
                    {loading ? 'Initializing DNA...' : success ? 'Profile Activated!' : isSetupMode ? 'Initialize My Profile' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full Plan Modal */}
        <AnimatePresence>
          {showPlanModal && activePlan && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPlanModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                      <Sparkles className="mr-2 text-purple-600" /> {activePlan.planData.overview.split('.')[0]}
                    </h2>
                    <p className="text-sm text-gray-500">Your Active AI Training & Diet Plan</p>
                  </div>
                  <button
                    onClick={() => setShowPlanModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={24} className="text-gray-500" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="flex-grow overflow-y-auto p-6 sm:p-8 space-y-8">
                  {/* Overview */}
                  <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100">
                    <h3 className="text-sm font-bold text-purple-700 uppercase tracking-wider mb-2 flex items-center">
                      <Info size={14} className="mr-2" /> Overview & Goals
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{activePlan.planData.overview}</p>
                  </div>

                  {/* Workout Plan */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                      <Dumbbell className="mr-3 text-purple-600" /> Weekly Workout Schedule
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activePlan.planData.workoutPlan.map((workout: any, idx: number) => (
                        <div key={idx} className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                          <h4 className="font-bold text-purple-700 mb-3">{workout.day}</h4>
                          <ul className="space-y-2 mb-3">
                            {workout.exercises.map((ex: string, i: number) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start">
                                <CheckCircle2 size={14} className="mr-2 mt-1 text-green-500 flex-shrink-0" />
                                {ex}
                              </li>
                            ))}
                          </ul>
                          <p className="text-xs text-gray-500 border-t border-gray-200 pt-2 mt-2">
                            {workout.notes}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Diet Plan */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                      <Activity className="mr-3 text-green-600" /> Daily Diet Plan
                    </h3>
                    <div className="overflow-x-auto rounded-2xl border border-gray-100">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Day</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Breakfast</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Lunch</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Snack</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">Dinner</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {activePlan.planData.dietPlan.map((diet: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-4 text-sm font-bold text-gray-900">{diet.day}</td>
                              <td className="p-4 text-sm text-gray-600">{diet.breakfast}</td>
                              <td className="p-4 text-sm text-gray-600">{diet.lunch}</td>
                              <td className="p-4 text-sm text-gray-600">{diet.snack}</td>
                              <td className="p-4 text-sm text-gray-600">{diet.dinner}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tips */}
                  {activePlan.planData.tips && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center">
                        <Sparkles className="mr-3 text-yellow-500" /> Expert Tips
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activePlan.planData.tips.map((tip: string, idx: number) => (
                          <div key={idx} className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-sm text-gray-700 flex items-start">
                            <Info size={16} className="mr-2 mt-0.5 text-yellow-600 flex-shrink-0" />
                            {tip}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                  <button
                    onClick={() => setShowPlanModal(false)}
                    className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all"
                  >
                    Close Plan
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Profile;
