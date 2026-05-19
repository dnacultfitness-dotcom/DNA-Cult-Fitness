import React, { useState, useEffect, useMemo } from 'react';
// Triggering deployment re-hash after rate limit error
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  Dumbbell, 
  FileText, 
  Settings, 
  LayoutDashboard,
  Sparkles,
  Activity,
  Clock,
  Info,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Edit2,
  Save as SaveIcon,
  ArrowLeft,
  ShieldCheck,
  Briefcase,
  Search,
  Eye,
  X,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { db, collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, addDoc, setDoc, handleFirestoreError, OperationType, where, getDocs, serverTimestamp, storage, ref, uploadBytes, uploadBytesResumable, getDownloadURL } from '../firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { toast } from 'sonner';
import { NotificationBell } from '../components/NotificationBell';
import { createNotification, NotificationType } from '../utils/notifications';

const CustomerIdInput = ({ userId, initialValue }: { userId: string, initialValue?: string }) => {
  const [value, setValue] = useState(initialValue || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', userId), { customerId: value });
      toast.success('Customer ID updated');
      setIsEditing(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-24 px-2 py-1 text-xs border border-gray-200 rounded outline-none focus:ring-1 focus:ring-green-500"
          placeholder="ID..."
          autoFocus
        />
        <button 
          onClick={handleUpdate} 
          disabled={loading}
          className="text-green-600 hover:text-green-700 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
        </button>
        <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
          <XCircle size={14} />
        </button>
      </div>
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className="group flex items-center space-x-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors"
    >
      <span className={cn("text-sm", !value && "text-gray-300")}>
        {value || 'Add ID'}
      </span>
      <Settings size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

const ValidityInput = ({ membershipId, expiryDate }: { membershipId: string, expiryDate?: any }) => {
  const [days, setDays] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetValidity = async () => {
    if (!days || isNaN(parseInt(days))) return;
    setLoading(true);
    try {
      const newExpiry = new Date(new Date().getTime() + parseInt(days) * 24 * 60 * 60 * 1000);
      
      await updateDoc(doc(db, 'memberships', membershipId), {
        expiryDate: newExpiry
      });
      toast.success(`Set validity to ${days} days`);
      setDays('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `memberships/${membershipId}`);
    } finally {
      setLoading(false);
    }
  };

  const remainingDays = useMemo(() => {
    if (!expiryDate || typeof expiryDate.toDate !== 'function') return 0;
    try {
      const expiry = expiryDate.toDate().getTime();
      const now = new Date().getTime();
      if (isNaN(expiry)) return 0;
      return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    } catch (e) {
      return 0;
    }
  }, [expiryDate]);

  return (
    <div className="flex items-center space-x-4">
      <div className="text-right">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Validity</p>
        <p className={cn("text-xs font-black uppercase tracking-tight", remainingDays > 0 ? "text-green-600" : "text-red-500")}>
          {remainingDays > 0 ? `${remainingDays} Days` : 'Expired'}
        </p>
      </div>
      <div className="flex items-center bg-gray-50 rounded-xl border border-gray-200 p-1">
        <input
          type="number"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          placeholder="Days"
          className="w-12 bg-transparent border-none text-[10px] font-bold outline-none px-2"
        />
        <button
          onClick={handleSetValidity}
          disabled={loading}
          className="bg-gray-900 text-white px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : 'Set'}
        </button>
      </div>
    </div>
  );
};

const MemberTypeSelect = ({ membershipId, userId, currentProgram, availablePlans }: { membershipId: string, userId?: string, currentProgram: string, availablePlans?: any[] }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentProgram);
  const [loading, setLoading] = useState(false);

  // Fallback plans if none provided
  const standardOptions = availablePlans?.length 
    ? availablePlans.map(p => p.name)
    : ["Normal", "Silver", "Gold", "Platinum", "Kick Boxing"];

  const handleUpdate = async (newVal: string) => {
    if (!newVal) {
      toast.error("Program name cannot be empty");
      return;
    }
    setLoading(true);
    try {
      // 1. Update Membership record
      await updateDoc(doc(db, 'memberships', membershipId), {
        program: newVal
      });

      // 2. Update User profile for redundancy and easier access
      if (userId) {
        await updateDoc(doc(db, 'users', userId), {
          program: newVal
        });
      }

      toast.success('Program updated successfully');
      setIsEditing(false);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `memberships/${membershipId}`);
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <select
          value={standardOptions.includes(value) ? value : "Other"}
          onChange={(e) => {
            const val = e.target.value;
            if (val === "Other") {
              if (standardOptions.includes(value)) setValue("");
            } else {
              setValue(val);
              handleUpdate(val);
            }
          }}
          className="text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-lg px-2 py-1 outline-none bg-white focus:border-green-500"
          disabled={loading}
        >
          <option value="" disabled>Select Plan...</option>
          {standardOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          <option value="Other">Other (Custom)...</option>
        </select>
        
        {(value === "" || !standardOptions.includes(value)) && (
          <input
            type="text"
            className="text-[10px] font-medium border border-gray-200 rounded-lg px-2 py-1 outline-none w-24 focus:border-green-500"
            placeholder="Custom name..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUpdate(value);
            }}
            disabled={loading}
          />
        )}
        
        <button 
          onClick={() => setIsEditing(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <XCircle size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="group flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-700 border border-green-100 hover:bg-green-100 transition-all"
    >
      {currentProgram}
      <Edit2 size={10} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};

const TrainerSelect = ({ membershipId, userId, currentTrainerId, trainers }: { membershipId: string, userId?: string, currentTrainerId?: string, trainers: any[] }) => {
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (trainerId: string) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'memberships', membershipId), {
        trainerId: trainerId || null
      });

      // If we have a userId and a trainerId, also link them for Security Rules
      if (userId && trainerId) {
        const trainerDoc = trainers.find(t => t.id === trainerId);
        if (trainerDoc?.email) {
          const uSnap = await getDocs(query(collection(db, 'users'), where('email', '==', trainerDoc.email)));
          if (!uSnap.empty) {
            const trainerUid = uSnap.docs[0].id;
            await updateDoc(doc(db, 'users', userId), {
              assignedTrainerUid: trainerUid
            });
          }
        }
      } else if (userId && !trainerId) {
        await updateDoc(doc(db, 'users', userId), {
          assignedTrainerUid: null
        });
      }

      toast.success('Trainer assigned successfully');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `memberships/${membershipId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Assign Trainer</label>
      <div className="flex items-center space-x-2">
        <select 
          value={currentTrainerId || ''} 
          onChange={(e) => handleUpdate(e.target.value)}
          disabled={loading}
          className="text-xs font-bold border border-gray-100 rounded-xl px-3 py-2 outline-none bg-gray-50/50 focus:border-blue-500 transition-colors disabled:opacity-50"
        >
          <option value="">No Trainer</option>
          {trainers.map(t => (
            <option key={t.id} value={t.id}>{t.name} ({t.speciality || 'General'})</option>
          ))}
        </select>
        {loading && <Loader2 size={12} className="animate-spin text-blue-500" />}
      </div>
    </div>
  );
};
const RoleSelect = ({ userId, currentRole }: { userId: string, currentRole: string }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentRole);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (newVal: string) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newVal
      });
      toast.success('User role updated');
      setIsEditing(false);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <select
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            setValue(val);
            handleUpdate(val);
          }}
          className="text-[10px] font-black uppercase tracking-widest border border-gray-200 rounded-lg px-2 py-1 outline-none bg-white focus:border-green-500"
          disabled={loading}
        >
          <option value="customer">Customer</option>
          <option value="trainer">Trainer</option>
          <option value="admin">Admin</option>
        </select>
        <button 
          onClick={() => setIsEditing(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <XCircle size={14} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={cn(
        "group flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
        currentRole === 'admin' ? "bg-purple-50 text-purple-700 border-purple-100" : 
        currentRole === 'trainer' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
        "bg-blue-50 text-blue-700 border-blue-100"
      )}
    >
      {currentRole}
      <Edit2 size={10} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};

const PlanOrderInput = ({ planId, initialOrder }: { planId: string, initialOrder: number }) => {
  const [value, setValue] = useState(initialOrder);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'membershipPlans', planId), { order: Number(value) });
      toast.success('Order updated');
      setIsEditing(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `membershipPlans/${planId}`);
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-16 px-2 py-1 text-xs border border-gray-200 rounded outline-none focus:ring-1 focus:ring-green-500 font-mono"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
        />
        <button 
          onClick={handleUpdate} 
          disabled={loading}
          className="text-green-600 hover:text-green-700 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
        </button>
        <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
          <XCircle size={14} />
        </button>
      </div>
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className="group flex items-center space-x-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors w-fit"
    >
      <span className="font-mono text-xs font-black text-gray-400">
        #{initialOrder}
      </span>
      <Edit2 size={10} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

const AIPlanSelector = ({ membershipId, userId, currentAiPlan, onUpdate }: { membershipId: string, userId?: string, currentAiPlan?: string, onUpdate?: (val: string) => void }) => {
  const [loading, setLoading] = useState(false);
  const aiPlanOptions = [
    { id: 'demo', name: 'Demo Workout' },
    { id: 'new_user_1_week', name: 'New User: 1 Week' },
    { id: 'normal_1_week', name: 'Normal: 1 Week' },
    { id: 'silver_1_month', name: 'Silver: 1 Month' },
    { id: 'gold_1_month', name: 'Gold: 1 Month' },
    { id: 'platinum_1_month', name: 'Platinum: 1 Month' }
  ];

  const handleUpdate = async (val: string) => {
    if (onUpdate) {
      onUpdate(val);
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'memberships', membershipId), {
        approvedAiPlan: val
      });
      if (userId) {
        await updateDoc(doc(db, 'users', userId), {
          approvedAiPlan: val
        });
      }
      toast.success('AI Plan Tier updated');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `memberships/${membershipId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center space-x-2">
        <select 
          value={currentAiPlan || 'demo'} 
          onChange={(e) => handleUpdate(e.target.value)}
          disabled={loading}
          className="text-[10px] font-black uppercase tracking-widest border border-gray-100 rounded-lg px-2 py-1 outline-none bg-white focus:border-green-500 transition-colors disabled:opacity-50"
        >
          {aiPlanOptions.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.name}</option>
          ))}
        </select>
        {loading && <Loader2 size={10} className="animate-spin text-green-500" />}
      </div>
    </div>
  );
};

const MembershipActivator = ({ userId, userName, userEmail, availablePlans }: { userId: string, userName?: string, userEmail?: string, availablePlans: any[] }) => {
  const [loading, setLoading] = useState(false);

  const handleActivate = async (program: string) => {
    if (!program) return;
    setLoading(true);
    try {
      // 1. Create a membership record
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1); // Default to 1 month

      await addDoc(collection(db, 'memberships'), {
        userId,
        name: userName || 'User',
        email: userEmail || '',
        phone: '',
        program,
        status: 'approved',
        approvedAiPlan: 'demo',
        expiryDate,
        createdAt: serverTimestamp()
      });

      // 2. Update user profile
      await updateDoc(doc(db, 'users', userId), {
        program,
        approvedAiPlan: 'demo'
      });

      toast.success(`Membership activated: ${program}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'memberships');
    } finally {
      setLoading(false);
    }
  };

  const options = availablePlans?.length 
    ? availablePlans.map(p => p.name)
    : ["Normal", "Silver", "Gold", "Platinum", "Kick Boxing"];

  return (
    <div className="flex items-center space-x-2">
      <select 
        onChange={(e) => handleActivate(e.target.value)}
        disabled={loading}
        className="text-[10px] font-black uppercase tracking-widest border border-dashed border-gray-200 rounded-lg px-2 py-1 outline-none bg-gray-50 hover:bg-white transition-all cursor-pointer"
        defaultValue=""
      >
        <option value="" disabled>+ Activate Membership</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {loading && <Loader2 size={10} className="animate-spin text-green-500" />}
    </div>
  );
};

const UserManager = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [localDbError, setLocalDbError] = useState<string | null>(null);
  const { isAdmin, dbError: globalDbError } = useFirebase();

  useEffect(() => {
    if (!isAdmin) return;
    
    // Explicit connectivity test
    const testDocRef = doc(db, '_connection_test_', 'connectivity_check');
    setDoc(testDocRef, { timestamp: serverTimestamp(), check: true }).catch(err => {
      console.error("Diagnostic connectivity check failed:", err);
      setLocalDbError(`Connectivity Check Failed: ${err.message}`);
    });

    const qUsers = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // Sort in memory by lastActive or createdAt to ensure users with missing fields are still visible
      data.sort((a, b) => (b.lastActive?.toMillis() || b.createdAt?.toMillis() || 0) - (a.lastActive?.toMillis() || a.createdAt?.toMillis() || 0));
      setUsers(data);
      setLoading(false);
      setLocalDbError(null);
    }, (err) => {
      setLocalDbError(`Users List Error: ${err.message}`);
      handleFirestoreError(err, OperationType.LIST, 'users');
    });

    const qMems = query(collection(db, 'memberships'), where('status', '==', 'approved'));
    const unsubscribeMems = onSnapshot(qMems, (snapshot) => {
      setMemberships(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'memberships');
    });

    const unsubMembershipPlans = onSnapshot(query(collection(db, 'membershipPlans'), orderBy('order', 'asc')), (s) => {
      setMembershipPlans(s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubTrainers = onSnapshot(collection(db, 'trainers'), (s) => {
      setTrainers(s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeUsers();
      unsubscribeMems();
      unsubMembershipPlans();
      unsubTrainers();
    };
  }, [isAdmin]);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteUser = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
      return;
    }
    const loadingToast = toast.loading('Deleting user profile...');
    try {
      await deleteDoc(doc(db, 'users', id));
      toast.success('User profile deleted', { id: loadingToast });
      setDeletingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${id}`);
    }
  };

  const getApprovedPlan = (userId: string) => {
    const mem = memberships.find(m => m.userId === userId);
    if (!mem || !mem.approvedAiPlan) return null;
    
    const planMap: Record<string, { label: string, color: string }> = {
      'demo': { label: 'Demo Workout', color: 'bg-gray-100 text-gray-700' },
      'new_user_1_week': { label: 'New User (1W)', color: 'bg-blue-50 text-blue-700 border-blue-100' },
      'normal_1_week': { label: 'Normal (1W)', color: 'bg-green-50 text-green-700 border-green-100' },
      'silver_1_month': { label: 'Silver (1M)', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
      'gold_1_month': { label: 'Gold (1M)', color: 'bg-amber-50 text-amber-700 border-amber-100' },
      'platinum_1_month': { label: 'Platinum (1M)', color: 'bg-purple-50 text-purple-700 border-purple-100' }
    };
    
    return planMap[mem.approvedAiPlan] || { label: mem.approvedAiPlan, color: 'bg-gray-100 text-gray-600' };
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(user => {
      const membership = memberships.find(m => m.userId === user.id);
      const name = (user.displayName || membership?.name || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [users, memberships, searchQuery]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-900">User Management</h1>
          <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mt-1">Manage member profiles & assignments</p>
        </div>
        <div className="relative group w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-green-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all text-sm font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle size={16} />
            </button>
          )}
        </div>
      </div>

      {(localDbError || globalDbError) && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3 text-red-600">
          <XCircle size={20} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Database Error</p>
            <p className="text-sm">{localDbError || globalDbError}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-green-600" /></div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left min-w-[1000px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Trainer</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Engagement</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Plan</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic font-medium">
                      No matching members found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const planInfo = getApprovedPlan(user.id);
                    const membership = memberships.find(m => m.userId === user.id);
                    return (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center bg-gray-100 text-gray-400 font-bold">
                              {user.photoURL ? (
                                <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                user.displayName?.[0] || user.email?.[0] || 'U'
                              )}
                            </div>
                            <div>
                              <p className="font-black text-gray-900 text-xs uppercase tracking-tight">
                                {user.displayName || membership?.name || 'No Name'}
                              </p>
                              <p className="text-[10px] text-gray-400 font-medium">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <CustomerIdInput userId={user.id} initialValue={user.customerId} />
                        </td>
                        <td className="px-6 py-4">
                          <RoleSelect userId={user.id} currentRole={user.role || 'customer'} />
                        </td>
                        <td className="px-6 py-4">
                          {membership ? (
                            <TrainerSelect membershipId={membership.id} userId={user.id} currentTrainerId={membership.trainerId} trainers={trainers} />
                          ) : (
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Not Assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-900 uppercase">
                              {user.lastActive ? user.lastActive.toDate().toLocaleDateString() : 'Never'}
                            </span>
                            {user.lastActive && (
                              <span className="text-[9px] text-gray-400 font-bold">
                                {user.lastActive.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                             {membership ? (
                               <div className="flex flex-col space-y-2">
                                <MemberTypeSelect membershipId={membership.id} userId={user.id} currentProgram={membership.program} availablePlans={membershipPlans} />
                                <AIPlanSelector membershipId={membership.id} userId={user.id} currentAiPlan={membership.approvedAiPlan} />
                               </div>
                            ) : (
                              <MembershipActivator 
                                userId={user.id} 
                                userName={user.displayName || membership?.name} 
                                userEmail={user.email} 
                                availablePlans={membershipPlans} 
                              />
                            )}
                            {planInfo && (
                              <div className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border ml-0 mt-1", planInfo.color)}>
                                <Sparkles size={8} className="mr-1" />
                                {planInfo.label}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => deleteUser(user.id)}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              deletingId === user.id ? "bg-red-600 text-white shadow-lg" : "text-red-500 hover:bg-red-50"
                            )}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};


const MembershipManager = () => {
  const [memberships, setMemberships] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAdmin } = useFirebase();

  useEffect(() => {
    if (!isAdmin) return;
    
    const unsubMems = onSnapshot(collection(db, 'memberships'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setMemberships(data);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'memberships');
      setLoading(false);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubMembershipPlans = onSnapshot(query(collection(db, 'membershipPlans'), orderBy('order', 'asc')), (s) => {
      setMembershipPlans(s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubTrainers = onSnapshot(query(collection(db, 'trainers'), orderBy('name', 'asc')), (s) => {
      setTrainers(s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubMems(); unsubUsers(); unsubMembershipPlans(); unsubTrainers(); };
  }, [isAdmin]);

  const userMap = useMemo(() => {
    return users.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});
  }, [users]);

  const updateStatus = async (id: string, status: string, approvedAiPlan?: string) => {
    const loadingToast = toast.loading('Updating status...');
    try {
      const updateData: any = { status };
      if (approvedAiPlan) updateData.approvedAiPlan = approvedAiPlan;
      await updateDoc(doc(db, 'memberships', id), updateData);

      // Also sync to user profile for redundancy
      const membership = memberships.find(m => m.id === id);
      if (membership) {
        if (approvedAiPlan) {
          await updateDoc(doc(db, 'users', membership.userId), {
            approvedAiPlan: approvedAiPlan
          });
        }
        
        // Notify User
        await createNotification(
          membership.userId,
          `Membership ${status === 'approved' ? 'Approved' : 'Updated'}`,
          `Your membership for ${membership.program} has been ${status}.`,
          status === 'approved' ? NotificationType.SUCCESS : NotificationType.INFO,
          '/profile'
        );
      }

      toast.success(`Status updated to ${status}`, { id: loadingToast });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `memberships/${id}`);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
      return;
    }
    const loadingToast = toast.loading('Deleting application...');
    try {
      await deleteDoc(doc(db, 'memberships', id));
      toast.success('Application deleted', { id: loadingToast });
      setDeletingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `memberships/${id}`);
    }
  };

  const filteredMemberships = useMemo(() => {
    if (!searchQuery.trim()) return memberships;
    const q = searchQuery.toLowerCase();
    return memberships.filter(m => {
      const userAccount = (userMap as any)[m.userId];
      const name = (userAccount?.displayName || m.name || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      const phone = (m.phone || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [memberships, searchQuery, userMap]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-900">Membership Applications</h1>
          <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mt-1">Review & approve subscriptions</p>
        </div>
        <div className="relative group w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-green-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all text-sm font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-green-600" /></div>
        ) : filteredMemberships.length === 0 ? (
          <div className="bg-white p-12 rounded-[2rem] border border-gray-100 shadow-sm text-center text-gray-400 font-medium italic">
            {searchQuery ? `No matching applications found` : "No membership applications found"}
          </div>
        ) : (
          filteredMemberships.map((m) => {
            const userAccount = (userMap as any)[m.userId];
            return (
              <div key={m.id} className="bg-white p-4 sm:p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:border-green-500/20 transition-all">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-400 font-bold flex-shrink-0">
                      {userAccount?.photoURL ? (
                        <img src={userAccount.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        userAccount?.displayName?.[0] || m.name?.[0] || 'U'
                      )}
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-black text-gray-900 uppercase tracking-tight">{userAccount?.displayName || m.name}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest",
                          m.status === 'pending' ? "bg-yellow-50 text-yellow-600 border border-yellow-100" : 
                          m.status === 'approved' ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"
                        )}>
                          {m.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium">{m.email} • {m.phone}</p>
                      
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <MemberTypeSelect membershipId={m.id} userId={m.userId} currentProgram={m.program} availablePlans={membershipPlans} />
                        {m.message && <p className="text-[10px] text-gray-400 font-medium italic leading-none">"{m.message}"</p>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 lg:bg-transparent lg:p-0 lg:border-0">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Approved AI Plan</label>
                      <AIPlanSelector 
                        membershipId={m.id} 
                        userId={m.userId}
                        currentAiPlan={m.approvedAiPlan} 
                        onUpdate={(val) => updateStatus(m.id, m.status || 'pending', val)}
                      />
                    </div>
                    
                    {m.status === 'approved' && (
                      <ValidityInput membershipId={m.id} expiryDate={m.expiryDate} />
                    )}
                    
                    <div className="flex items-center gap-2 pt-2 sm:pt-0">
                      <TrainerSelect 
                        membershipId={m.id} 
                        userId={m.userId}
                        currentTrainerId={m.trainerId} 
                        trainers={trainers} 
                      />

                      <div className="flex items-center gap-2 ml-2">
                        <button 
                          onClick={() => updateStatus(m.id, 'approved', m.approvedAiPlan)} 
                          className={cn(
                            "p-2.5 rounded-xl transition-all shadow-sm",
                            m.status === 'approved' ? "bg-green-600 text-white shadow-green-200" : "bg-white text-green-600 border border-gray-100 hover:bg-green-50"
                          )}
                        >
                          <CheckCircle size={20} />
                        </button>
                        <button 
                          onClick={() => handleDelete(m.id)}
                          className={cn(
                            "p-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2",
                            deletingId === m.id ? "bg-red-600 text-white shadow-red-200" : "bg-white text-red-500 border border-gray-100 hover:bg-red-50"
                          )}
                        >
                          <Trash2 size={20} />
                          {deletingId === m.id && <span className="text-[10px] font-black uppercase tracking-widest">Confirm</span>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const DailyWorkoutManager = () => {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [aiPlans, setAiPlans] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [denyingWorkoutId, setDenyingWorkoutId] = useState<string | null>(null);
  const [denialMessage, setDenialMessage] = useState('');
  const [submittingDeny, setSubmittingDeny] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  useEffect(() => {
    // 1. Fetch Workout Submissions
    const unsubWorkouts = onSnapshot(collection(db, 'dailyWorkouts'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setWorkouts(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'dailyWorkouts'));

    // 2. Fetch Active Memberships
    const unsubMems = onSnapshot(query(collection(db, 'memberships'), where('status', '==', 'approved')), (snapshot) => {
      setMemberships(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'memberships'));

    // 3. Fetch AI Plans
    const unsubPlans = onSnapshot(collection(db, 'aiPlans'), (snapshot) => {
      setAiPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'aiPlans'));

    // 4. Fetch Trainers
    const unsubTrainers = onSnapshot(collection(db, 'trainers'), (snapshot) => {
      setTrainers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'trainers'));

    // 5. Fetch User Profiles for exact names and IDs
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    return () => {
      unsubWorkouts();
      unsubMems();
      unsubPlans();
      unsubTrainers();
      unsubUsers();
    };
  }, []);

  const todayStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const combinedData = useMemo(() => {
    const trainersMap = trainers.reduce((acc, t) => ({ ...acc, [t.id]: t.name }), {});
    const usersMap = users.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});
    
    return memberships.map(mem => {
      const submission = workouts.find(w => w.userId === mem.userId && w.date === todayStr);
      const plan = aiPlans.find(p => p.userId === mem.userId);
      const userProfile = usersMap[mem.userId] || {};
      
      const workoutIndex = mem.currentWorkoutIndex || 0;
      const workoutPlan = plan?.planData?.workoutPlan || [];
      const dietPlan = plan?.planData?.dietPlan || [];
      const scheduledWorkout = workoutPlan[workoutIndex % Math.max(1, workoutPlan.length)] || null;
      const scheduledDiet = dietPlan[workoutIndex % Math.max(1, dietPlan.length)] || null;

      return {
        id: mem.id,
        userId: mem.userId,
        userName: userProfile.displayName || mem.name || 'Unknown Client',
        customerId: userProfile.customerId || mem.id.substring(0, 8),
        trainerName: trainersMap[mem.trainerId] || 'Not Assigned',
        workout: scheduledWorkout ? (scheduledWorkout.exercises?.join(', ') || 'Rest Day') : 'No Plan',
        fullWorkout: scheduledWorkout,
        fullDiet: scheduledDiet,
        submission: submission || null,
        status: submission?.status || 'no-submission'
      };
    });
  }, [memberships, workouts, aiPlans, trainers, users, todayStr]);

  const filteredCombined = useMemo(() => {
    if (!searchQuery.trim()) return combinedData;
    const q = searchQuery.toLowerCase();
    return combinedData.filter(d => 
      d.userName.toLowerCase().includes(q) || 
      d.trainerName.toLowerCase().includes(q)
    );
  }, [combinedData, searchQuery]);

  const handleApprove = async (workout: any) => {
    try {
      const workoutRef = doc(db, 'dailyWorkouts', workout.id);
      await updateDoc(workoutRef, {
        status: 'approved'
      });

      // Notify User
      await createNotification(
        workout.userId,
        'Workout Verified',
        `Your workout submission for ${workout.date} has been approved.`,
        NotificationType.SUCCESS,
        '/profile'
      );

      // Increment user's workout index in membership
      const membershipQuery = query(
        collection(db, 'memberships'),
        where('userId', '==', workout.userId),
        where('status', '==', 'approved')
      );
      const membershipSnap = await getDocs(membershipQuery);
      if (!membershipSnap.empty) {
        const membershipDoc = membershipSnap.docs[0];
        const currentIndex = membershipDoc.data().currentWorkoutIndex || 0;
        
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;

        await updateDoc(doc(db, 'memberships', membershipDoc.id), {
          currentWorkoutIndex: currentIndex + 1,
          lastWorkoutDate: today,
          lastWorkoutStatus: 'approved'
        });
      }

      toast.success('Workout approved and user progressed!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `dailyWorkouts/${workout.id}`);
    }
  };

  const handleDeny = async (workoutId: string) => {
    if (!denialMessage.trim()) {
      toast.error('Please enter a reason for denial');
      return;
    }

    setSubmittingDeny(true);
    try {
      const workoutRef = doc(db, 'dailyWorkouts', workoutId);
      await updateDoc(workoutRef, {
        status: 'denied',
        adminMessage: denialMessage
      });

      // Notify User
      const workoutSnap = await getDocs(query(collection(db, 'dailyWorkouts'), where('__name__', '==', workoutId)));
      if (!workoutSnap.empty) {
        const workoutData = workoutSnap.docs[0].data();
        await createNotification(
          workoutData.userId,
          'Workout Revision Needed',
          `Your workout for ${workoutData.date} requires revision: ${denialMessage}`,
          NotificationType.WARNING,
          '/profile'
        );
      }

      toast.success('Workout denied with feedback.');
      setDenyingWorkoutId(null);
      setDenialMessage('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `dailyWorkouts/${workoutId}`);
    } finally {
      setSubmittingDeny(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand" size={32} /></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Today's Protocol Tracking</h2>
        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-green-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search by client or trainer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all text-sm font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Client</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Trainer</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Target Protocol</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Verification</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCombined.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-gray-500 font-medium">
                    {searchQuery ? `No matching records found` : "No active members found."}
                  </td>
                </tr>
              ) : (
                filteredCombined.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div 
                        className="flex items-center cursor-pointer group/client hover:bg-gray-50 p-2 -m-2 rounded-xl transition-all"
                        onClick={() => setSelectedRecord(record)}
                      >
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 font-black mr-4 border border-green-100 uppercase tracking-tighter group-hover/client:bg-green-100 transition-colors">
                          {record.userName?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 uppercase text-xs tracking-tight group-hover/client:text-green-600 transition-colors">{record.userName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center group-hover/client:text-gray-500 transition-colors">
                            DNA ID: {record.customerId}
                            <Info size={8} className="ml-1 opacity-0 group-hover/client:opacity-100 transition-opacity" />
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border",
                        record.trainerName === 'Not Assigned' ? "bg-gray-50 text-gray-400 border-gray-100" : "bg-blue-50 text-blue-700 border-blue-100"
                      )}>
                        {record.trainerName}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div 
                        className="max-w-xs cursor-pointer group/protocol hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors"
                        onClick={() => setSelectedRecord(record)}
                      >
                        <p className="text-xs font-bold text-gray-700 line-clamp-2 leading-tight uppercase tracking-tight group-hover/protocol:text-green-600 transition-colors">{record.workout}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 opacity-0 group-hover/protocol:opacity-100 transition-opacity flex items-center">
                          <Info size={10} className="mr-1" /> View Full Plan
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        record.status === 'approved' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                        record.status === 'denied' ? "bg-red-50 text-red-700 border-red-100" : 
                        record.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-100" :
                        "bg-gray-50 text-gray-400 border-gray-200"
                      )}>
                        {record.status === 'approved' ? <CheckCircle size={10} className="mr-1" /> : 
                         record.status === 'denied' ? <XCircle size={10} className="mr-1" /> :
                         record.status === 'pending' ? <Loader2 size={10} className="mr-1 animate-spin" /> : 
                         <Clock size={10} className="mr-1" />}
                        {record.status === 'no-submission' ? 'Awaiting Protocol' : record.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {record.status === 'pending' && record.submission && (
                        <div className="flex items-center justify-end space-x-2">
                          {denyingWorkoutId === record.submission.id ? (
                            <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                              <input
                                type="text"
                                value={denialMessage}
                                onChange={(e) => setDenialMessage(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleDeny(record.submission.id);
                                  if (e.key === 'Escape') {
                                    setDenyingWorkoutId(null);
                                    setDenialMessage('');
                                  }
                                }}
                                placeholder="Reason..."
                                className="bg-transparent border-none text-[10px] text-gray-900 font-bold outline-none w-32 placeholder:text-gray-400"
                                autoFocus
                              />
                               <button
                                onClick={() => handleDeny(record.submission.id)}
                                disabled={submittingDeny}
                                className="text-red-500 hover:text-red-700 transition-colors p-1"
                              >
                                {submittingDeny ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleApprove(record.submission)}
                                className="bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm shadow-green-100"
                              >
                                Verify
                              </button>
                              <button
                                onClick={() => setDenyingWorkoutId(record.submission.id)}
                                className="bg-white text-red-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all border border-red-50"
                              >
                                Deny
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Protocol Details Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRecord(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-2xl text-green-600">
                    <Activity size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{selectedRecord.userName}'s Protocol</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Target for: {todayStr}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto no-scrollbar space-y-8">
                {/* Workout Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-green-600">
                    <Dumbbell size={18} />
                    <h4 className="text-sm font-black uppercase tracking-widest">Daily Workout</h4>
                  </div>
                  {selectedRecord.fullWorkout ? (
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <p className="text-lg font-black text-gray-900 uppercase tracking-tight mb-4">{selectedRecord.fullWorkout.day || 'Workout Session'}</p>
                      <ul className="space-y-3">
                        {selectedRecord.fullWorkout.exercises?.map((ex: string, i: number) => (
                          <li key={i} className="flex items-center text-sm text-gray-700 font-medium">
                            <span className="w-6 h-6 rounded-lg bg-green-100 text-green-700 flex items-center justify-center text-[10px] font-black mr-3 shrink-0">{i + 1}</span>
                            {ex}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 font-medium italic">No specific workout plan found for this index.</p>
                  )}
                </div>

                {/* Diet Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Activity size={18} />
                    <h4 className="text-sm font-black uppercase tracking-widest">Nutritional Protocol</h4>
                  </div>
                  {selectedRecord.fullDiet ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(selectedRecord.fullDiet).map(([meal, details]: [string, any]) => {
                        if (meal === 'day') return null;
                        return (
                          <div key={meal} className="bg-blue-50/30 rounded-2xl p-5 border border-blue-100/50">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">{meal}</p>
                            <p className="text-xs font-bold text-gray-800 leading-relaxed uppercase tracking-tight">{String(details)}</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 font-medium italic">No specific diet plan found for this index.</p>
                  )}
                </div>
              </div>

              <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-8 py-3 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
                >
                  Close Plan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MemberManager = () => {
  const [memberships, setMemberships] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useFirebase();

  useEffect(() => {
    if (!isAdmin) return;

    const unsubMems = onSnapshot(
      query(collection(db, 'memberships'), where('status', '==', 'approved')),
      (s) => {
        let data = s.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setMemberships(data);
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'memberships');
        setLoading(false);
      }
    );

    const unsubUsers = onSnapshot(collection(db, 'users'), (s) => 
      setUsers(s.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );

    const unsubPlans = onSnapshot(collection(db, 'aiPlans'), (s) => 
      setPlans(s.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );

    const unsubMembershipPlans = onSnapshot(query(collection(db, 'membershipPlans'), orderBy('order', 'asc')), (s) => {
      setMembershipPlans(s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubTrainers = onSnapshot(collection(db, 'trainers'), (s) => {
      setTrainers(s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubMems(); unsubUsers(); unsubPlans(); unsubMembershipPlans(); unsubTrainers(); };
  }, [isAdmin]);

  const joinedMembers = React.useMemo(() => {
    const usersMap = users.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});
    const trainersMap = trainers.reduce((acc, t) => ({ ...acc, [t.id]: t.name }), {});
    const plansMap = plans.reduce((acc, p) => {
      if (!acc[p.userId] || p.createdAt > acc[p.userId].createdAt) {
        acc[p.userId] = p;
      }
      return acc;
    }, {});

    const aiPlanMap: Record<string, { label: string, color: string }> = {
      'demo': { label: 'Demo Workout', color: 'bg-gray-100 text-gray-700' },
      'new_user_1_week': { label: 'New User (1W)', color: 'bg-blue-50 text-blue-700 border-blue-100' },
      'normal_1_week': { label: 'Normal (1W)', color: 'bg-green-50 text-green-700 border-green-100' },
      'silver_1_month': { label: 'Silver (1M)', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
      'gold_1_month': { label: 'Gold (1M)', color: 'bg-amber-50 text-amber-700 border-amber-100' },
      'platinum_1_month': { label: 'Platinum (1M)', color: 'bg-purple-50 text-purple-700 border-purple-100' }
    };

    return memberships.map(mem => ({
      ...mem,
      userData: usersMap[mem.userId] || null,
      trainerName: trainersMap[mem.trainerId] || 'Unassigned',
      customerId: usersMap[mem.userId]?.customerId || 'N/A',
      activeWorkoutPlan: plansMap[mem.userId]?.planData?.overview?.split('.')[0] || 'No Workout',
      planTier: mem.approvedAiPlan ? (aiPlanMap[mem.approvedAiPlan] || { label: mem.approvedAiPlan, color: 'bg-gray-100' }) : null
    }));
  }, [memberships, users, plans, trainers]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-900">Active Members</h1>
          <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mt-1">Monitor & manage current subscriptions</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-green-600" /></div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left min-w-[1000px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Member Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ownership</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan Model</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">AI Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Focus</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Validity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {joinedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium italic">No active members found</td>
                  </tr>
                ) : joinedMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center bg-gray-100 text-gray-400 font-bold flex-shrink-0">
                          {member.userData?.photoURL ? (
                            <img src={member.userData.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            member.userData?.displayName?.[0] || member.name?.[0] || 'U'
                          )}
                        </div>
                        <div>
                          <p className="font-black text-gray-900 uppercase text-xs tracking-tight leading-tight">{member.userData?.displayName || member.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{member.phone} • {member.userData?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border",
                        member.trainerName === 'Unassigned' ? "bg-gray-50 text-gray-400 border-gray-100" : "bg-blue-50 text-blue-700 border-blue-100"
                      )}>
                        {member.trainerName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <MemberTypeSelect membershipId={member.id} currentProgram={member.program} availablePlans={membershipPlans} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {member.planTier ? (
                        <div className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border", member.planTier.color)}>
                          <Sparkles size={10} className="mr-1.5" />
                          {member.planTier.label}
                        </div>
                      ) : (
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest opacity-50">Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-tight truncate" title={member.activeWorkoutPlan}>
                        {member.activeWorkoutPlan}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end">
                        <ValidityInput membershipId={member.id} expiryDate={member.expiryDate} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};


const AIPlanManager = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedViewPlan, setSelectedViewPlan] = useState<any | null>(null);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [editPlanData, setEditPlanData] = useState<any | null>(null);
  const { isAdmin } = useFirebase();

  useEffect(() => {
    if (!isAdmin) return;
    
    // Fetch AI Plans
    const qPlans = query(collection(db, 'aiPlans'), orderBy('createdAt', 'desc'));
    const unsubscribePlans = onSnapshot(qPlans, (snapshot) => {
      setPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'aiPlans');
    });

    // Fetch Users for Customer ID mapping
    const qUsers = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users');
    });

    setLoading(false); // Initial loading handled by snapshots

    return () => {
      unsubscribePlans();
      unsubscribeUsers();
    };
  }, [isAdmin]);

  const plansWithUserData = useMemo(() => {
    const userMap = users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    return plans.map(plan => ({
      ...plan,
      customerData: userMap[plan.userId] || null
    }));
  }, [plans, users]);

  const filteredPlans = useMemo(() => {
    if (!searchQuery.trim()) return plansWithUserData;
    const q = searchQuery.toLowerCase();
    return plansWithUserData.filter(plan => {
      const userName = (plan.customerData?.displayName || plan.userName || '').toLowerCase();
      const customerId = (plan.customerData?.customerId || '').toLowerCase();
      const overview = (plan.planData?.overview || '').toLowerCase();
      return userName.includes(q) || customerId.includes(q) || overview.includes(q);
    });
  }, [plansWithUserData, searchQuery]);

  const handleDelete = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
      return;
    }

    const loadingToast = toast.loading('Deleting AI plan...');
    try {
      await deleteDoc(doc(db, 'aiPlans', id));
      toast.success('Plan deleted successfully', { id: loadingToast });
      setDeletingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `aiPlans/${id}`);
    }
  };

  const handleSavePlan = async () => {
    if (!selectedViewPlan || !editPlanData) return;

    const loadingToast = toast.loading('Updating AI plan...');
    try {
      const planRef = doc(db, 'aiPlans', selectedViewPlan.id);
      await updateDoc(planRef, {
        planData: editPlanData,
        updatedAt: serverTimestamp()
      });
      toast.success('Plan updated successfully', { id: loadingToast });
      setSelectedViewPlan({ ...selectedViewPlan, planData: editPlanData });
      setIsEditingPlan(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `aiPlans/${selectedViewPlan.id}`);
      toast.error('Failed to update plan', { id: loadingToast });
    }
  };

  const updateWorkoutDay = (dayIndex: number, field: string, value: any) => {
    const newData = { ...editPlanData };
    newData.workoutPlan = [...(newData.workoutPlan || [])];
    newData.workoutPlan[dayIndex] = { ...newData.workoutPlan[dayIndex], [field]: value };
    setEditPlanData(newData);
  };

  const updateDietDay = (dayIndex: number, field: string, value: string) => {
    const newData = { ...editPlanData };
    newData.dietPlan = [...(newData.dietPlan || [])];
    newData.dietPlan[dayIndex] = { ...newData.dietPlan[dayIndex], [field]: value };
    setEditPlanData(newData);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-900">Generated AI Plans</h1>
          <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mt-1">Review personalized fitness protocols</p>
        </div>

        <div className="relative group w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-green-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search plans or IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:border-green-500 transition-all text-sm font-medium"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol Target</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Classification</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Created</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPlans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 font-black border border-green-100 uppercase">
                        {plan.userName?.[0] || plan.customerData?.displayName?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-black text-gray-900 uppercase text-xs tracking-tight">{plan.userName || plan.customerData?.displayName}</p>
                        <p className="text-[10px] text-gray-400 font-medium truncate max-w-[200px]">{plan.planData?.overview}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100">
                      {plan.customerData?.customerId || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{plan.trainerId ? 'Custom Protocol' : 'Initial AI Logic'}</span>
                  </td>
                  <td className="px-6 py-4 text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                    {plan.createdAt?.toDate() ? new Date(plan.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center space-x-2">
                      <button 
                        onClick={() => { setSelectedViewPlan(plan); setEditPlanData(plan.planData); }}
                        className="p-2.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl transition-all"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(plan.id)}
                        className={cn(
                          "p-2.5 rounded-xl transition-all",
                          deletingId === plan.id ? "bg-red-600 text-white shadow-lg" : "text-red-400 hover:bg-red-50 hover:text-red-600"
                        )}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { title: 'New User Tier', desc: '1-Week Starter Plan. One-time foundation protocol.', color: 'blue' },
          { title: 'Silver Tier', desc: '1-Month Beginner. Consistency & habits focus.', color: 'green' },
          { title: 'Gold Tier', desc: '1-Month Transformation. High intensity protocol.', color: 'amber' },
          { title: 'Platinum Tier', desc: '1-Month Elite. Advanced transformation & recovery.', color: 'purple' }
        ].map((tier, idx) => (
          <div key={idx} className={cn("p-4 rounded-2xl border flex flex-col justify-between", {
            "bg-blue-50/50 border-blue-100 text-blue-900": tier.color === 'blue',
            "bg-green-50/50 border-green-100 text-green-900": tier.color === 'green',
            "bg-amber-50/50 border-amber-100 text-amber-900": tier.color === 'amber',
            "bg-purple-50/50 border-purple-100 text-purple-900": tier.color === 'purple'
          })}>
            <h3 className="font-black text-xs uppercase tracking-widest mb-1">{tier.title}</h3>
            <p className={cn("text-[10px] font-medium leading-relaxed opacity-80", {
              "text-blue-700": tier.color === 'blue',
              "text-green-700": tier.color === 'green',
              "text-amber-700": tier.color === 'amber',
              "text-purple-700": tier.color === 'purple'
            })}>{tier.desc}</p>
          </div>
        ))}
      </div>



      {/* Plan Detail Modal */}
      {selectedViewPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedViewPlan(null)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          >
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Program Details</h2>
                  <p className="text-sm text-gray-400 font-medium tracking-tight">For {selectedViewPlan.customerData?.displayName || selectedViewPlan.userName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {isEditingPlan ? (
                  <>
                    <button 
                      onClick={() => setIsEditingPlan(false)}
                      className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSavePlan}
                      className="px-4 py-2 text-sm font-bold bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-sm"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => {
                      setIsEditingPlan(true);
                      setEditPlanData(JSON.parse(JSON.stringify(selectedViewPlan.planData)));
                    }}
                    className="px-4 py-2 text-sm font-bold bg-black text-white rounded-xl hover:bg-gray-800 transition-all shadow-sm flex items-center space-x-2"
                  >
                    <Edit2 size={16} />
                    <span>Edit Plan</span>
                  </button>
                )}
                <button 
                  onClick={() => {
                    setSelectedViewPlan(null);
                    setIsEditingPlan(false);
                  }}
                  className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-8 space-y-10 custom-scrollbar">
              {isEditingPlan ? (
                <div className="space-y-10">
                  {/* Edit Overview/Vision */}
                  <section className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-green-600 flex items-center">
                      <span className="w-6 h-px bg-green-200 mr-2" />
                      Program Vision & Overview
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Vision Statement</label>
                        <textarea
                          value={editPlanData.vision || ''}
                          onChange={(e) => setEditPlanData({ ...editPlanData, vision: e.target.value })}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-green-500 transition-all text-sm font-medium resize-none h-24"
                          placeholder="Long term goals..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Daily Overview</label>
                        <textarea
                          value={editPlanData.overview || ''}
                          onChange={(e) => setEditPlanData({ ...editPlanData, overview: e.target.value })}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-green-500 transition-all text-sm font-medium resize-none h-24"
                          placeholder="Quick summary..."
                        />
                      </div>
                    </div>
                  </section>

                  {/* Edit Workout Plan */}
                  <section className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-orange-600 flex items-center">
                      <span className="w-6 h-px bg-orange-200 mr-2" />
                      Workout Protocol (Editing)
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      {editPlanData.workoutPlan?.map((day: any, idx: number) => (
                        <div key={idx} className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
                          <p className="text-xs font-black text-gray-900 uppercase mb-4">{day.day || `Day ${idx + 1}`}</p>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Exercises (Comma separated)</label>
                              <input
                                type="text"
                                value={day.exercises?.join(', ') || ''}
                                onChange={(e) => updateWorkoutDay(idx, 'exercises', e.target.value.split(',').map(s => s.trim()))}
                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-orange-500 transition-all text-xs font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Notes</label>
                              <input
                                type="text"
                                value={day.notes || ''}
                                onChange={(e) => updateWorkoutDay(idx, 'notes', e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-orange-500 transition-all text-xs font-medium"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Edit Diet Plan */}
                  <section className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-green-600 flex items-center">
                      <span className="w-6 h-px bg-green-200 mr-2" />
                      Nutritional Strategy (Editing)
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      {editPlanData.dietPlan?.map((day: any, idx: number) => (
                        <div key={idx} className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
                          <p className="text-xs font-black text-gray-900 uppercase mb-4">{day.day || `Day ${idx + 1}`}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {['breakfast', 'lunch', 'snack', 'dinner'].map((meal) => (
                              <div key={meal}>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 capitalize">{meal}</label>
                                <input
                                  type="text"
                                  value={day[meal] || ''}
                                  onChange={(e) => updateDietDay(idx, meal, e.target.value)}
                                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-green-500 transition-all text-xs font-medium"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              ) : (
                <div className="space-y-10">
                  {/* OverviewSection */}
                  <section className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-green-600 flex items-center">
                      <span className="w-6 h-px bg-green-200 mr-2" />
                      Program Vision
                    </h3>
                    <div className="p-6 bg-green-50/30 rounded-3xl border border-green-50">
                      <p className="text-gray-700 leading-relaxed italic font-medium whitespace-pre-line">
                        {selectedViewPlan.planData?.vision || selectedViewPlan.planData?.overview}
                      </p>
                    </div>
                  </section>

                  {/* Workout Plan Section */}
                  {selectedViewPlan.planData?.workoutPlan && (
                    <section className="space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-widest text-orange-600 flex items-center">
                        <span className="w-6 h-px bg-orange-200 mr-2" />
                        Workout Protocol
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedViewPlan.planData.workoutPlan.map((day: any, idx: number) => (
                          <div key={idx} className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm hover:border-orange-100 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 bg-orange-50 text-orange-600 rounded-md">
                                {day.day || `Day ${idx + 1}`}
                              </span>
                            </div>
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-2">
                                {day.exercises?.map((ex: string, i: number) => (
                                  <span key={i} className="text-[10px] font-bold px-2 py-1 bg-gray-50 text-gray-600 rounded-lg border border-gray-100">
                                    {ex}
                                  </span>
                                ))}
                              </div>
                              {day.notes && (
                                <div className="pt-2 border-t border-gray-50">
                                  <p className="text-[11px] text-gray-400 leading-relaxed font-medium">Note: {day.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Diet Plan Section */}
                  {selectedViewPlan.planData?.dietPlan && (
                    <section className="space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-widest text-green-600 flex items-center">
                        <span className="w-6 h-px bg-green-200 mr-2" />
                        Nutritional Strategy
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedViewPlan.planData.dietPlan.map((day: any, idx: number) => (
                          <div key={idx} className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm hover:border-green-100 transition-colors">
                            <div className="mb-4">
                              <span className="text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 bg-green-50 text-green-600 rounded-md">
                                {day.day || `Day ${idx + 1}`}
                              </span>
                            </div>
                            <div className="space-y-3">
                              {[
                                { label: 'Breakfast', value: day.breakfast, icon: <Clock size={12} className="text-orange-400" /> },
                                { label: 'Lunch', value: day.lunch, icon: <Clock size={12} className="text-green-400" /> },
                                { label: 'Snack', value: day.snack, icon: <Clock size={12} className="text-yellow-400" /> },
                                { label: 'Dinner', value: day.dinner, icon: <Clock size={12} className="text-blue-400" /> },
                              ].map((meal, i) => (
                                <div key={i} className="flex items-start space-x-3">
                                  <div className="mt-1">{meal.icon}</div>
                                  <div className="flex-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{meal.label}</p>
                                    <p className="text-[11px] font-bold text-gray-700 leading-tight">{meal.value || 'Balanced Meal'}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Disclaimer */}
                  <div className="pt-6 border-t border-gray-50">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black text-center">
                      AI Generated Program • Subject to trainer evaluation
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const MembershipPlanManager = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAdmin } = useFirebase();
  const [newPlan, setNewPlan] = useState({
    name: '',
    priceOptions: [
      { duration: '1 Month', actualPrice: '', offerPrice: '' },
      { duration: '3 Months', actualPrice: '', offerPrice: '' },
      { duration: '6 Months', actualPrice: '', offerPrice: '' },
      { duration: '12 Months', actualPrice: '', offerPrice: '' }
    ],
    features: '',
    order: 0
  });

  const updateNewPlanPrice = (index: number, field: 'actualPrice' | 'offerPrice', value: string) => {
    setNewPlan(prev => ({
      ...prev,
      priceOptions: prev.priceOptions.map((opt, i) => 
        i === index ? { ...opt, [field]: value } : opt
      )
    }));
  };
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'membershipPlans'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'membershipPlans');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const filteredPlans = useMemo(() => {
    if (!searchQuery.trim()) return plans;
    const q = searchQuery.toLowerCase();
    return plans.filter(p => (p.name || '').toLowerCase().includes(q));
  }, [plans, searchQuery]);

  const updateEditPlanPrice = (index: number, field: 'actualPrice' | 'offerPrice', value: string) => {
    setEditForm((prev: any) => ({
      ...prev,
      priceOptions: prev.priceOptions.map((opt: any, i: number) => 
        i === index ? { ...opt, [field]: value } : opt
      )
    }));
  };

  const startEdit = (plan: any) => {
    setEditingId(plan.id);
    const defaultOptions = [
      { duration: '1 Month', actualPrice: '', offerPrice: '' },
      { duration: '3 Months', actualPrice: '', offerPrice: '' },
      { duration: '6 Months', actualPrice: '', offerPrice: '' },
      { duration: '12 Months', actualPrice: '', offerPrice: '' }
    ];

    const currentOptions = plan.priceOptions || [];
    const mergedOptions = defaultOptions.map(def => {
      const existing = currentOptions.find((o: any) => o.duration === def.duration);
      return existing ? { ...existing } : def;
    });

    setEditForm({ 
      ...plan, 
      priceOptions: mergedOptions,
      features: Array.isArray(plan.features) ? plan.features.join(', ') : (plan.features || '')
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdatePlan = async () => {
    if (!editingId || !editForm) return;
    const loadingToast = toast.loading('Synchronizing update...');
    setUploading(true);

    try {
      const sanitizedOptions = editForm.priceOptions.map((opt: any) => ({
        duration: opt.duration,
        actualPrice: Number(opt.actualPrice) || 0,
        offerPrice: Number(opt.offerPrice) || 0
      })).filter((opt: any) => opt.actualPrice > 0 || opt.offerPrice > 0);

      await updateDoc(doc(db, 'membershipPlans', editingId), {
        name: editForm.name.trim(),
        priceOptions: sanitizedOptions,
        features: (editForm.features || '').toString().split(',').map((f: string) => f.trim()).filter((f: string) => f !== ''),
        order: parseInt(editForm.order) || 0,
        updatedAt: serverTimestamp()
      });

      toast.success('Protocol updated', { id: loadingToast });
      setEditingId(null);
      setEditForm(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `membershipPlans/${editingId}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return;
    setUploading(true);
    const loadingToast = toast.loading('Deploying protocol...');

    try {
      const sanitizedOptions = newPlan.priceOptions.map(opt => ({
        duration: opt.duration,
        actualPrice: Number(opt.actualPrice) || 0,
        offerPrice: Number(opt.offerPrice) || 0
      })).filter(opt => opt.actualPrice > 0 || opt.offerPrice > 0);

      await addDoc(collection(db, 'membershipPlans'), {
        name: newPlan.name.trim(),
        priceOptions: sanitizedOptions,
        features: (newPlan.features || '').split(',').map(f => f.trim()).filter(f => f !== ''),
        order: parseInt(newPlan.order as any) || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success('Protocol deployed', { id: loadingToast });
      setShowAddForm(false);
      setNewPlan({
        name: '',
        priceOptions: [
          { duration: '1 Month', actualPrice: '', offerPrice: '' },
          { duration: '3 Months', actualPrice: '', offerPrice: '' },
          { duration: '6 Months', actualPrice: '', offerPrice: '' },
          { duration: '12 Months', actualPrice: '', offerPrice: '' }
        ],
        features: '',
        order: plans.length + 1
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, 'membershipPlans');
    } finally {
      setUploading(false);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deletePlan = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
      return;
    }

    const loadingToast = toast.loading('Deleting plan...');
    try {
      await deleteDoc(doc(db, 'membershipPlans', id));
      toast.success('Plan deleted successfully', { id: loadingToast });
      setDeletingId(null);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `membershipPlans/${id}`);
    }
  };

  const seedPlans = async () => {
    if (!window.confirm('This will seed the standard membership protocols. Continue?')) return;
    const loadingToast = toast.loading('Seeding membership protocols...');
    
    const initialPlans = [
      { 
        name: 'Silver Protocol', 
        priceOptions: [
          { duration: '1 Month', actualPrice: 3500, offerPrice: 3000 },
          { duration: '3 Months', actualPrice: 9000, offerPrice: 8000 }
        ],
        order: 1, 
        features: ['12 DAYS CARDIO', '12 DAYS PERSONAL SESSION', 'BEGINNER DIET PLAN', '10% DISCOUNT ON ADDONS', 'PROTIEN BAR AND CAFE', '₹100/- VOUCHER OF HAIRBAY STUDIO'] 
      },
      { 
        name: 'Gold Protocol', 
        priceOptions: [
          { duration: '1 Month', actualPrice: 5500, offerPrice: 5000 },
          { duration: '3 Months', actualPrice: 15000, offerPrice: 13500 }
        ],
        order: 2, 
        features: ['15 DAYS TRANSFORMATION', '15 DAYS ALTERNATIVE CARDIO & conditioning', 'TRANSFORMATION DIET PLAN', '15% DISCOUNT ON ADDONS', 'PROTIEN BAR AND CAFE', '₹200/- VOUCHER OF HAIRBAY STUDIO'] 
      },
      { 
        name: 'Platinum Protocol', 
        priceOptions: [
          { duration: '1 Month', actualPrice: 8500, offerPrice: 8000 },
          { duration: '3 Months', actualPrice: 24000, offerPrice: 21500 }
        ],
        order: 3, 
        features: ['15 DAYS INJURY', '15 DAYS ALTERNATIVE TRANSFORMATION CARDIO & conditioning', 'TRANSFORMATION & RECOVERY DIET PLAN', '20% DISCOUNT ADDONS', 'PROTIEN BAR AND CAFE', '₹300/- VOUCHER OF HAIRBAY STUDIO'] 
      },
      { 
        name: 'Kick Boxing', 
        priceOptions: [
          { duration: '1 Month', actualPrice: 4500, offerPrice: 4000 }
        ],
        order: 4, 
        features: ['Striking Technique', 'Bag Work', 'Partner Drills', 'High-Intensity Cardio'] 
      },
      { 
        name: 'Hybrid Protocol', 
        priceOptions: [
          { duration: '3 Months', actualPrice: 15000, offerPrice: 12000 }
        ],
        order: 5, 
        features: ['Pre bridal and groom package for three month', 'Collab with hairbay studio salon & spa', 'Complete fitness and wellness program'] 
      },
      { 
        name: 'Ice Bath Protocol', 
        priceOptions: [
          { duration: '1 Session', actualPrice: 1000, offerPrice: 800 },
          { duration: '5 Sessions', actualPrice: 4500, offerPrice: 3500 },
          { duration: '10 Sessions', actualPrice: 8000, offerPrice: 6000 }
        ],
        order: 6, 
        features: ['Full Cold Immersion', 'Mental Resilience Training', 'Rapid Recovery', 'Anti-Inflammation Boost'] 
      },
      { 
        name: 'Steam Bath Protocol', 
        priceOptions: [
          { duration: '1 Session', actualPrice: 800, offerPrice: 600 },
          { duration: '5 Sessions', actualPrice: 3500, offerPrice: 2500 },
          { duration: '10 Sessions', actualPrice: 6000, offerPrice: 4500 }
        ],
        order: 7, 
        features: ['Full Body Steam', 'Aromatherapy', 'Muscle Relaxation', 'Detoxification Boost'] 
      },
    ];

    try {
      for (const plan of initialPlans) {
        await addDoc(collection(db, 'membershipPlans'), {
          ...plan,
          createdAt: serverTimestamp(),
          imageUrl: ''
        });
      }
      toast.success('Membership protocols seeded successfully!', { id: loadingToast });
    } catch (err) {
      toast.error('Failed to seed protocols', { id: loadingToast });
      handleFirestoreError(err, OperationType.CREATE, 'membershipPlans');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-900">System Protocols</h1>
          <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mt-1">Configure membership tiers & pricing</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="relative group w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-green-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search protocols..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all text-sm font-medium"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex-1 sm:flex-none bg-black text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-2 hover:bg-gray-800 transition-all shadow-lg"
            >
              {showAddForm ? <><X size={16} /> <span>Cancel</span></> : <><Plus size={16} /> <span>Add protocol</span></>}
            </button>
            <button 
              onClick={seedPlans}
              className="px-4 py-3 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg"
            >
              Seed
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {(showAddForm || editingId) && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900 mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {editingId ? 'Edit Protocol' : 'Initial Protocol Deployment'}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Protocol Designation *</label>
                  <input
                    type="text"
                    value={editingId ? editForm.name : newPlan.name}
                    onChange={e => editingId ? setEditForm({...editForm, name: e.target.value}) : setNewPlan({...newPlan, name: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-green-500 transition-all font-bold"
                    placeholder="e.g. SILVER PROTOCOL"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Features (Comma Separated)</label>
                  <textarea
                    rows={4}
                    value={editingId ? editForm.features : newPlan.features}
                    onChange={e => editingId ? setEditForm({...editForm, features: e.target.value}) : setNewPlan({...newPlan, features: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-green-500 transition-all text-sm font-medium"
                    placeholder="Feature 1, Feature 2, ..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Matrix Order</label>
                  <input
                    type="number"
                    value={editingId ? editForm.order : newPlan.order}
                    onChange={e => editingId ? setEditForm({...editForm, order: e.target.value}) : setNewPlan({...newPlan, order: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-green-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Pricing Matrix</label>
                <div className="space-y-3">
                  {(editingId ? editForm.priceOptions : newPlan.priceOptions).map((opt: any, i: number) => (
                    <div key={i} className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                      <span className="w-full sm:w-24 text-[10px] font-black uppercase tracking-widest text-gray-500">{opt.duration}</span>
                      <div className="flex items-center gap-2 flex-grow w-full">
                        <input
                          type="number"
                          placeholder="Base ₹"
                          value={opt.actualPrice}
                          onChange={e => editingId ? updateEditPlanPrice(i, 'actualPrice', e.target.value) : updateNewPlanPrice(i, 'actualPrice', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg outline-none focus:border-green-500 text-xs font-mono"
                        />
                        <input
                          type="number"
                          placeholder="Offer ₹"
                          value={opt.offerPrice}
                          onChange={e => editingId ? updateEditPlanPrice(i, 'offerPrice', e.target.value) : updateNewPlanPrice(i, 'offerPrice', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-100 rounded-lg outline-none focus:border-green-500 text-xs font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={editingId ? handleUpdatePlan : handleAddPlan}
                  disabled={uploading}
                  className="w-full mt-8 bg-black text-white p-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-all shadow-xl shadow-gray-200 disabled:opacity-50"
                >
                  {uploading ? 'Processing Matrix...' : editingId ? 'Update Matrix' : 'Deploy Protocol'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-green-600" /></div>
        ) : filteredPlans.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-medium italic">No system protocols initialized</div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Protocol</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Entry Pricing</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <h3 className="font-black text-gray-900 text-xs uppercase tracking-tight">{plan.name}</h3>
                        <p className="text-[10px] text-gray-400 font-medium truncate max-w-[200px]">{(plan.features || []).join(', ')}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {(plan.priceOptions || []).slice(0, 2).map((po: any, i: number) => (
                          <span key={i} className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-600 border border-gray-200">
                            {po.duration}: ₹{po.offerPrice || po.actualPrice}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <PlanOrderInput planId={plan.id} initialOrder={plan.order || 0} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => startEdit(plan)}
                          className="p-2.5 text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl transition-all"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => deletePlan(plan.id)}
                          className={cn(
                            "p-2.5 rounded-xl transition-all flex items-center gap-2",
                            deletingId === plan.id ? "bg-red-600 text-white shadow-lg shadow-red-200" : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                          )}
                        >
                          <Trash2 size={18} />
                          {deletingId === plan.id && <span className="text-[10px] font-bold uppercase tracking-tight">Confirm?</span>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const ServiceManager = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAdmin } = useFirebase();
  const [newService, setNewService] = useState({
    title: '',
    description: '',
    features: '',
    order: 0
  });

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'gymServices'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'gymServices');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;
    const q = searchQuery.toLowerCase();
    return services.filter(s => 
      (s.title || '').toLowerCase().includes(q) || 
      (s.description || '').toLowerCase().includes(q)
    );
  }, [services, searchQuery]);

  const startEdit = (service: any) => {
    setEditingId(service.id);
    setEditForm({ ...service, features: (service.features || []).join(', ') });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateDoc(doc(db, 'gymServices', editingId), {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        features: editForm.features.split(',').map((f: string) => f.trim()).filter((f: string) => f !== ''),
        order: Number(editForm.order) || 0,
        updatedAt: serverTimestamp()
      });
      toast.success('Training program updated successfully');
      setEditingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `gymServices/${editingId}`);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    const loadingToast = toast.loading('Creating training program...');
    try {
      const serviceData = {
        title: newService.title.trim(),
        description: newService.description.trim(),
        features: newService.features.split(',').map(f => f.trim()).filter(f => f !== ''),
        order: Number(newService.order) || 0,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'gymServices'), serviceData);
      
      toast.success('New training program created successfully!', { id: loadingToast });
      setShowAddForm(false);
      setNewService({
        title: '',
        description: '',
        features: '',
        order: services.length + 1
      });
    } catch (err: any) {
      toast.error('Failed to create program: ' + err.message, { id: loadingToast });
      handleFirestoreError(err, OperationType.CREATE, 'gymServices');
    } finally {
      setUploading(false);
    }
  };

  const seedServices = async () => {
    if (!window.confirm('This will seed the standard training programs. Continue?')) return;
    const loadingToast = toast.loading('Seeding services...');
    
    const initialServices = [
      {
        title: "Flexibility & Mobility",
        description: "Improve your range of motion and reduce the risk of injury with our specialized mobility sessions.",
        imageUrl: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?q=80&w=1926&auto=format&fit=crop",
        features: ["Dynamic Stretching", "Joint Mobilization", "Yoga-Based Flow", "Injury Prevention"],
        order: 1
      },
      {
        title: "Resistance Training",
        description: "Build lean muscle and increase metabolic rate through progressive resistance and weight training.",
        imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop",
        features: ["Hypertrophy Focus", "Functional Strength", "Form Correction", "Progressive Overload"],
        order: 2
      },
      {
        title: "Strength Training",
        description: "Focus on the big compound lifts to maximize your absolute strength and power output.",
        imageUrl: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1974&auto=format&fit=crop",
        features: ["Powerlifting Basics", "Olympic Lifting", "Core Stability", "Max Effort Days"],
        order: 3
      },
      {
        title: "CrossFit Training",
        description: "Join our high-intensity community workouts that challenge every aspect of your fitness.",
        imageUrl: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2069&auto=format&fit=crop",
        features: ["WOD (Workout of the Day)", "Metabolic Conditioning", "Gymnastics Skills", "Team Challenges"],
        order: 4
      },
      {
        title: "Kick-Boxing",
        description: "Learn effective striking techniques while getting an incredible full-body cardio workout.",
        imageUrl: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=1974&auto=format&fit=crop",
        features: ["Striking Technique", "Bag Work", "Partner Drills", "High-Intensity Cardio"],
        order: 5
      },
      {
        title: "Rooftop Protein Bar",
        description: "Enjoy premium post-workout nutrition at our exclusive rooftop bar with stunning city views.",
        imageUrl: "https://images.unsplash.com/photo-1579619173025-79d2a18d7970?q=80&w=2070&auto=format&fit=crop",
        features: ["Custom Protein Shakes", "Healthy Snacks", "Rooftop Lounge", "Social Community"],
        order: 6
      },
      {
        title: "Ice Bath Recovery",
        description: "Experience the science of cold exposure to accelerate muscle recovery and enhance focus.",
        imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop",
        features: ["Sub-Zero Immersion", "Breathwork Guidance", "Optimized Recovery", "Reduced Muscle Soreness"],
        order: 7
      },
      {
        title: "Steam Bath Therapy",
        description: "Relax your muscles and detoxify your body with our premium steam bath sessions featuring aromatherapy.",
        imageUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2070&auto=format&fit=crop",
        features: ["Deep Cleansing", "Improved Circulation", "Stress Relief", "Muscle Soothing"],
        order: 8
      }
    ];

    try {
      for (const svc of initialServices) {
        await addDoc(collection(db, 'gymServices'), {
          ...svc,
          createdAt: serverTimestamp()
        });
      }
      toast.success('Services seeded successfully!', { id: loadingToast });
    } catch (err) {
      toast.error('Failed to seed services', { id: loadingToast });
      handleFirestoreError(err, OperationType.CREATE, 'gymServices');
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-900">Training Programs</h1>
          <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mt-1">Curate specializations & modules</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="relative group w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-green-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all text-sm font-medium"
            />
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-3 bg-black text-white rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all"
            >
              {showAddForm ? <><XCircle size={18} /> <span>Cancel</span></> : <><Plus size={18} /> <span>Add</span></>}
            </button>
            <button 
              onClick={seedServices}
              className="px-4 py-3 bg-green-600 text-white rounded-2xl text-sm font-bold hover:bg-green-700 transition-all shadow-sm"
            >
              Seed
            </button>
          </div>
        </div>
      </div>

      {showAddForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <h2 className="text-xl font-bold mb-6 text-gray-900">New specialization</h2>
          <form onSubmit={handleAddService} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Program Title</label>
              <input required type="text" value={newService.title} onChange={e => setNewService({...newService, title: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-gray-100 rounded-xl outline-none focus:border-green-500 transition-all font-bold" placeholder="e.g. CrossFit Training" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Display Order</label>
              <input type="number" value={newService.order || ''} onChange={e => setNewService({...newService, order: e.target.value === '' ? 0 : Number(e.target.value)})} className="w-full px-4 py-3 bg-gray-50 border-gray-100 rounded-xl outline-none focus:border-green-500 transition-all" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Description</label>
              <textarea required value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-gray-100 rounded-xl outline-none focus:border-green-500 transition-all h-24 resize-none" placeholder="Describe the outcome..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Features (Comma separated)</label>
              <textarea value={newService.features} onChange={e => setNewService({...newService, features: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-gray-100 rounded-xl outline-none focus:border-green-500 transition-all h-24 resize-none text-xs" placeholder="e.g. Mobility, Foundation, Strength" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={uploading} className="w-full bg-green-600 text-white p-4 rounded-xl font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-100 disabled:opacity-50">
                {uploading ? 'Architecting...' : 'Release Program'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center"><Loader2 className="animate-spin mx-auto text-green-600" /></div>
        ) : services.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-[2rem] border border-gray-100 text-center text-gray-400 font-medium italic">No programs released yet</div>
        ) : (
          filteredServices.map(svc => (
            <div key={svc.id} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
              <div className="h-40 relative group">
                {svc.imageUrl ? (
                  <img src={svc.imageUrl} alt={svc.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-50 flex items-center justify-center border-b border-gray-100"><Briefcase size={32} className="text-gray-200" /></div>
                )}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-[8px] font-black uppercase px-2 py-1 rounded tracking-widest">RANK {svc.order}</div>
              </div>
              
              <div className="p-5 flex-grow">
                {editingId === svc.id ? (
                  <div className="space-y-3">
                    <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-xs font-black uppercase" />
                    <textarea value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-[10px] h-20" />
                    <input type="number" value={editForm.order} onChange={e => setEditForm({...editForm, order: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border rounded-xl text-[10px]" />
                  </div>
                ) : (
                  <>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-2">{svc.title}</h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3 mb-4 font-medium">{svc.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {(svc.features || []).slice(0, 4).map((f: string, i: number) => (
                        <span key={i} className="text-[8px] bg-gray-100 text-gray-400 px-2 py-0.5 rounded-md font-black uppercase tracking-tighter">{f}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center group">
                {editingId === svc.id ? (
                  <div className="flex gap-2 w-full">
                    <button onClick={saveEdit} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Update</button>
                    <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => startEdit(svc)} className="text-blue-500 hover:text-blue-600 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors"><Edit2 size={12} /> Edit</button>
                    <button 
                      onClick={() => {
                        if (deletingId === svc.id) {
                          deleteDoc(doc(db, 'gymServices', svc.id));
                          toast.success('Program removed');
                        } else {
                          setDeletingId(svc.id);
                          setTimeout(() => setDeletingId(null), 3000);
                        }
                      }}
                      className={cn("text-[10px] font-black uppercase tracking-widest transition-all", deletingId === svc.id ? "text-red-700 bg-red-100 px-2 py-1 rounded" : "text-red-400 hover:text-red-600")}
                    >
                      {deletingId === svc.id ? 'Confirm?' : 'Remove'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const PlanApprovalManager = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [denyingId, setDenyingId] = useState<string | null>(null);
  const [adminMsg, setAdminMsg] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const { isAdmin } = useFirebase();

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'planApprovalRequests'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      data.sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setRequests(data);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'planApprovalRequests'));
    return () => unsubscribe();
  }, [isAdmin]);

  const filteredRequests = useMemo(() => {
    if (filter === 'all') return requests;
    return requests.filter(r => r.status === filter);
  }, [requests, filter]);

  const handleAction = async (request: any, status: 'approved' | 'rejected', message: string = '') => {
    const loadingToast = toast.loading(`${status === 'approved' ? 'Approving' : 'Rejecting'}...`);
    try {
      await updateDoc(doc(db, 'planApprovalRequests', request.id), {
        status,
        adminMessage: message,
        updatedAt: serverTimestamp()
      });

      if (status === 'approved') {
        const planRef = doc(db, 'aiPlans', request.planId);
        await updateDoc(planRef, {
          planData: request.requestedPlanData,
          updatedAt: serverTimestamp()
        });

        await createNotification(
          request.trainerId,
          'Plan Approved',
          `Admin approved your plan for ${request.userName}.`,
          NotificationType.SUCCESS,
          '/trainer'
        );
        toast.success('Matrix updated', { id: loadingToast });
      } else {
        await createNotification(
          request.trainerId,
          'Plan Rejected',
          `Admin rejected plan for ${request.userName}: ${message}`,
          NotificationType.ERROR,
          '/trainer'
        );
        toast.success('Modification rejected', { id: loadingToast });
      }
      setDenyingId(null);
      setAdminMsg('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `planApprovalRequests/${request.id}`);
    }
  };

  if (loading) return <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-green-600" /></div>;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-900">Protocol Approvals</h1>
          <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mt-1">Review & finalize trainer requests</p>
        </div>

        <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-fit">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  filter === s ? "bg-gray-900 text-white shadow-md scale-105" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="p-12 text-center text-gray-400 italic bg-white rounded-[2rem] border border-gray-100 shadow-sm uppercase text-[10px] font-black tracking-widest">
          No {filter !== 'all' ? filter : ''} requests in queue
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.map((r) => (
            <div key={r.id} className="bg-white p-5 sm:p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex flex-col gap-5 flex-grow">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-lg border border-blue-100 uppercase">
                    {r.userName?.[0]}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-sm uppercase tracking-tight leading-none">{r.userName}</h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded border border-gray-100">Trainer: {r.trainerName}</p>
                      <p className="text-[9px] text-gray-300 font-bold uppercase tracking-tighter">
                        {r.createdAt?.toDate() ? new Date(r.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-300 mb-3 leading-none">Modified Payload</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <span className="text-[8px] text-gray-400 font-black uppercase block mb-1">Calories</span>
                      <p className="text-xs font-black text-gray-900 tracking-tight">{r.requestedPlanData?.nutrition?.calories} kcal</p>
                    </div>
                    <div>
                      <span className="text-[8px] text-gray-400 font-black uppercase block mb-1">Status</span>
                      <p className="text-xs font-black text-gray-900 uppercase tracking-widest">{r.requestedPlanData?.status}</p>
                    </div>
                    <div>
                      <span className="text-[8px] text-gray-400 font-black uppercase block mb-1">Water</span>
                      <p className="text-xs font-black text-gray-900 tracking-tight">{r.requestedPlanData?.nutrition?.water}L</p>
                    </div>
                    <div>
                      <span className="text-[8px] text-gray-400 font-black uppercase block mb-1">Trainer</span>
                      <p className="text-xs font-black text-gray-900 uppercase tracking-widest truncate">{r.trainerName}</p>
                    </div>
                  </div>
                  {r.adminMessage && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="text-[9px] text-red-500/50 font-black uppercase tracking-widest block mb-1">Internal Note</span>
                      <p className="text-[11px] text-red-600 font-medium italic leading-relaxed">"{r.adminMessage}"</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between lg:justify-end lg:flex-shrink-0 gap-3">
                <span className={cn(
                  "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm",
                  r.status === 'pending' ? "bg-yellow-50 text-yellow-600 border-yellow-100" :
                  r.status === 'approved' ? "bg-green-50 text-green-600 border-green-100" :
                  "bg-red-50 text-red-600 border-red-100"
                )}>
                  {r.status}
                </span>

                {r.status === 'pending' && denyingId !== r.id && (
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleAction(r, 'approved')}
                      className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm border border-green-100"
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button 
                      onClick={() => setDenyingId(r.id)}
                      className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                )}

                {denyingId === r.id && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-grow lg:flex-none flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Reason for rejection..." 
                      value={adminMsg} 
                      onChange={e => setAdminMsg(e.target.value)}
                      className="w-full lg:w-48 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-red-500 text-[10px] font-medium"
                    />
                    <button onClick={() => handleAction(r, 'rejected', adminMsg)} className="px-3 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Reject</button>
                    <button onClick={() => setDenyingId(null)} className="p-2 text-gray-400 font-bold uppercase text-[9px] tracking-widest">Back</button>
                  </motion.div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TrainerManager = () => {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAdmin } = useFirebase();

  const [formData, setFormData] = useState({
    name: '',
    staffId: '',
    speciality: '',
    numberOfClients: 0,
    email: ''
  });

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'trainers'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTrainers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'trainers');
    });
    return () => unsubscribe();
  }, [isAdmin]);
  
  const filteredTrainers = useMemo(() => {
    if (!searchQuery.trim()) return trainers;
    const q = searchQuery.toLowerCase();
    return trainers.filter(t => 
      (t.name || '').toLowerCase().includes(q) || 
      (t.staffId || '').toLowerCase().includes(q) ||
      (t.email || '').toLowerCase().includes(q) ||
      (t.speciality || '').toLowerCase().includes(q)
    );
  }, [trainers, searchQuery]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.staffId || !formData.email) {
      toast.error('Required fields missing');
      return;
    }
    const loadingToast = toast.loading('Verifying trainer credentials...');
    try {
      const emailLower = formData.email.trim().toLowerCase();
      
      // 1. Check if user exists in members and has trainer role
      const userSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', emailLower)));
      
      if (userSnapshot.empty) {
        toast.error('User not found in Member section. Add them as a member first.', { id: loadingToast });
        return;
      }

      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();

      if (userData.role !== 'trainer') {
        toast.error('User does not have "Trainer" role in Members section. Update their role first.', { id: loadingToast });
        return;
      }

      // 2. Check if already in trainers collection
      const existingTrainer = await getDocs(query(collection(db, 'trainers'), where('email', '==', emailLower)));
      if (!existingTrainer.empty) {
        toast.error('This trainer is already registered.', { id: loadingToast });
        return;
      }

      // 3. Add to trainers collection
      await addDoc(collection(db, 'trainers'), {
        ...formData,
        email: emailLower,
        numberOfClients: Number(formData.numberOfClients),
        createdAt: serverTimestamp()
      });

      toast.success('Trainer registered successfully', { id: loadingToast });
      setIsAdding(false);
      setFormData({ name: '', staffId: '', speciality: '', numberOfClients: 0, email: '' });
    } catch (err) {
      toast.error('Failed to register trainer');
      handleFirestoreError(err, OperationType.CREATE, 'trainers');
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
      return;
    }
    const loadingToast = toast.loading('Removing trainer...');
    try {
      // Find trainer to get their email and reset user role
      const trainerToPurge = trainers.find(t => t.id === id);
      if (trainerToPurge?.email) {
        const userSnapshot = await getDocs(query(collection(db, 'users'), where('email', '==', trainerToPurge.email)));
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          await updateDoc(doc(db, 'users', userDoc.id), { role: 'customer' });
        }
      }

      await deleteDoc(doc(db, 'trainers', id));
      toast.success('Trainer removed', { id: loadingToast });
      setDeletingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `trainers/${id}`);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-900">Trainer Registry</h1>
          <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mt-1">Manage trainer staff & specialties</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="relative group w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-green-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search registry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all text-sm font-medium"
            />
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="w-full sm:w-auto bg-black text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-2 hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
          >
            {isAdding ? <><XCircle size={16} /> <span>Cancel</span></> : <><Plus size={16} /> <span>ADD TRAINERS</span></>}
          </button>
        </div>
      </div>

      {isAdding && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 sm:p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Trainer Name *</label>
              <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-green-500 transition-all font-bold" placeholder="Full name" required />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Trainer ID *</label>
              <input type="text" value={formData.staffId} onChange={e => setFormData({ ...formData, staffId: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-green-500 transition-all font-mono" placeholder="STF-000" required />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Email Identity *</label>
              <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-green-500 transition-all" placeholder="name@dnacult.com" required />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Specialization</label>
              <input type="text" value={formData.speciality} onChange={e => setFormData({ ...formData, speciality: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-green-500 transition-all" placeholder="e.g. Hypertrophy" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Base Load (Clients)</label>
              <input type="number" value={formData.numberOfClients || ''} onChange={e => setFormData({ ...formData, numberOfClients: e.target.value === '' ? 0 : parseInt(e.target.value) })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-green-500 transition-all" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-green-600 text-white p-4 rounded-xl font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-100">
                Add Trainer
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-green-600" /></div>
        ) : filteredTrainers.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-medium italic">No trainers registered</div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Trainer</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID Code</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Specialization</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Load</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTrainers.map((trainer) => (
                  <tr key={trainer.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-black uppercase text-gray-900 text-xs tracking-tight">{trainer.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100">
                        {trainer.staffId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">{trainer.speciality || 'Generalist'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Users size={12} className="text-gray-300" />
                        <span className="font-black text-gray-900 text-xs">{trainer.numberOfClients}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[10px] text-gray-400 font-medium">{trainer.email}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(trainer.id)}
                        className={cn(
                          "p-2 rounded-xl transition-all flex items-center space-x-2 ml-auto",
                          deletingId === trainer.id 
                            ? "bg-red-600 text-white shadow-lg" 
                            : "text-red-400 hover:bg-red-50 hover:text-red-600"
                        )}
                      >
                        <Trash2 size={16} />
                        {deletingId === trainer.id && <span className="text-[9px] font-black uppercase tracking-widest">Purge?</span>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminSidebar = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const location = useLocation();
  const [counts, setCounts] = useState({ workouts: 0, approvals: 0 });

  useEffect(() => {
    const unsubWorkouts = onSnapshot(query(collection(db, 'dailyWorkouts'), where('status', '==', 'pending')), s => setCounts(prev => ({ ...prev, workouts: s.size })));
    const unsubApprovals = onSnapshot(query(collection(db, 'planApprovalRequests'), where('status', '==', 'pending')), s => setCounts(prev => ({ ...prev, approvals: s.size })));
    return () => { unsubWorkouts(); unsubApprovals(); };
  }, []);

  const menuItems = [
    { name: 'Overview', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Members', path: '/admin/users', icon: <Users size={20} /> },
    { name: 'Applications', path: '/admin/memberships', icon: <FileText size={20} /> },
    { name: 'Plan Approvals', path: '/admin/approvals', icon: <CheckCircle size={20} />, badge: counts.approvals },
    { name: 'Today\'s Workouts', path: '/admin/workouts', icon: <Activity size={20} />, badge: counts.workouts },
    { name: 'Trainers', path: '/admin/trainers', icon: <Briefcase size={20} /> },
    { name: 'Plans', path: '/admin/plans', icon: <ShieldCheck size={20} /> },
    { name: 'Services', path: '/admin/services', icon: <Dumbbell size={20} /> },
    { name: 'AI Plans', path: '/admin/ai-plans', icon: <Sparkles size={20} /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform lg:translate-x-0 lg:static lg:inset-auto transition-transform duration-300 ease-in-out flex flex-col pt-8 pb-[env(safe-area-inset-bottom)] text-center lg:text-left",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="px-6 sm:px-8 mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center justify-center lg:justify-start space-x-2 w-full lg:w-auto">
            <span className="text-xl font-bold tracking-tighter text-green-700">DNA <span className="text-black">CULT</span></span>
          </Link>
          <button onClick={onClose} className="lg:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors absolute right-4">
            <XCircle size={24} />
          </button>
        </div>
        
        <div className="px-6 sm:px-8 mb-4">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center lg:text-left">Admin Menu</h2>
        </div>

        <nav className="flex-grow px-2 space-y-1 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={cn(
                "flex items-center justify-center lg:justify-between px-4 py-3 rounded-xl font-medium transition-all group",
                location.pathname === item.path ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <div className="flex items-center space-x-3">
                <span className={cn(
                  "transition-transform group-hover:scale-110",
                  location.pathname === item.path ? "text-green-600" : "text-gray-400"
                )}>
                  {item.icon}
                </span>
                <span className="text-sm">{item.name}</span>
              </div>
              {item.badge && item.badge > 0 && (
                <span className="hidden lg:block bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center ml-2">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <Link 
            to="/" 
            className="flex items-center justify-center lg:justify-start space-x-3 px-4 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            <ArrowLeft size={20} />
            <span>Back to Site</span>
          </Link>
        </div>
      </div>
    </>
  );
};

const Overview = () => {
  const [stats, setStats] = useState({ members: 0, plans: 0, memberships: 0, activeMembers: 0, workouts: 0, trainers: 0, pendingApprovals: 0 });
  const [recentApprovals, setRecentApprovals] = useState<any[]>([]);
  const { isAdmin } = useFirebase();

  useEffect(() => {
    if (!isAdmin) return;
    const unsubUsers = onSnapshot(collection(db, 'users'), s => setStats(prev => ({ ...prev, members: s.size })));
    const unsubPlans = onSnapshot(collection(db, 'aiPlans'), s => setStats(prev => ({ ...prev, plans: s.size })));
    const unsubTrainers = onSnapshot(collection(db, 'trainers'), s => setStats(prev => ({ ...prev, trainers: s.size })));
    const unsubMems = onSnapshot(collection(db, 'memberships'), s => {
      const all = s.docs.map(d => d.data());
      const approved = all.filter(m => m.status === 'approved').length;
      setStats(prev => ({ ...prev, memberships: s.size, activeMembers: approved }));
    });
    const unsubWorkouts = onSnapshot(collection(db, 'dailyWorkouts'), s => {
      const pending = s.docs.filter(d => d.data().status === 'pending').length;
      setStats(prev => ({ ...prev, workouts: pending }));
    });
    const unsubApprovals = onSnapshot(query(collection(db, 'planApprovalRequests'), where('status', '==', 'pending')), s => {
      setStats(prev => ({ ...prev, pendingApprovals: s.size }));
      let data = s.docs.map(d => ({ id: d.id, ...d.data() } as any));
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setRecentApprovals(data.slice(0, 5));
    });

    return () => { unsubUsers(); unsubPlans(); unsubTrainers(); unsubMems(); unsubWorkouts(); unsubApprovals(); };
  }, [isAdmin]);

  const statCards = [
    { name: 'Total Members', value: stats.members, icon: <Users className="text-blue-600" />, color: 'bg-blue-50' },
    { name: 'Active Subscriptions', value: stats.activeMembers, icon: <ShieldCheck className="text-purple-600" />, color: 'bg-purple-50' },
    { name: 'AI Plans', value: stats.plans, icon: <Sparkles className="text-green-600" />, color: 'bg-green-50' },
    { name: 'Today\'s Workouts', value: stats.workouts, icon: <Activity className="text-red-600" />, color: 'bg-red-50' },
    { name: 'Pending Approvals', value: stats.pendingApprovals, icon: <Clock className="text-yellow-600" />, color: 'bg-yellow-50' },
    { name: 'Trainers', value: stats.trainers || 0, icon: <Briefcase className="text-cyan-600" />, color: 'bg-cyan-50' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mt-1">Real-time performance metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map((stat, idx) => (
          <motion.div 
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4 group hover:border-green-500/30 transition-all"
          >
            <div className={cn("p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-transform group-hover:scale-110", stat.color)}>
              {React.cloneElement(stat.icon as React.ReactElement, { size: 24 })}
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-gray-400 font-black uppercase tracking-widest leading-none mb-1.5">{stat.name}</p>
              <p className="text-xl sm:text-2xl font-black text-gray-900 leading-none">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {recentApprovals.length > 0 && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-base sm:text-lg font-black flex items-center gap-2 uppercase tracking-tight text-gray-900">
              <Clock className="text-yellow-500" size={18} />
              Pending Approvals
            </h2>
            <Link to="/admin/approvals" className="text-[10px] font-black uppercase tracking-widest text-green-600 hover:text-green-700 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm transition-all">View All</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentApprovals.map((req) => (
              <div key={req.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50/10 transition-colors">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 uppercase text-xs">
                    {req.userName?.[0]}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-sm uppercase tracking-tight">{req.userName}</h3>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none mt-1">By: {req.trainerName}</p>
                  </div>
                </div>
                <Link 
                  to="/admin/approvals" 
                  className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-200"
                >
                  Review
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const { isAdmin, loading } = useFirebase();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-green-600" size={40} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <XCircle size={32} className="text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Unauthorized Access</h1>
        <p className="text-gray-600 mb-8 max-w-md">
          You do not have the required administrator permissions to view this dashboard. 
          If you believe this is an error, please contact the system administrator.
        </p>
        <Link 
          to="/" 
          className="px-8 py-3 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen min-h-[100dvh] bg-gray-50 overflow-hidden">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-grow relative h-screen h-[100dvh] overflow-y-auto no-scrollbar pb-[env(safe-area-inset-bottom)]">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between p-4 bg-white border-b border-gray-100 shadow-sm pt-[env(safe-area-inset-top)]">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-600 hover:text-black transition-colors"
            >
              <LayoutDashboard size={24} />
            </button>
            <span className="text-lg font-black tracking-tighter text-green-700 uppercase">Admin</span>
          </div>
          <NotificationBell />
        </div>

        <div className="hidden lg:block absolute top-8 right-8 z-20">
          <NotificationBell />
        </div>

        <div className="p-4 sm:p-8">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="members" element={<MemberManager />} />
            <Route path="users" element={<UserManager />} />
            <Route path="plans" element={<MembershipPlanManager />} />
            <Route path="services" element={<ServiceManager />} />
            <Route path="ai-plans" element={<AIPlanManager />} />
            <Route path="trainers" element={<TrainerManager />} />
            <Route path="approvals" element={<div className="sm:p-0"><h1 className="text-2xl sm:text-3xl font-black mb-6 sm:mb-8 uppercase tracking-tight">Plan Modification Approvals</h1><PlanApprovalManager /></div>} />
            <Route path="memberships" element={<MembershipManager />} />
            <Route path="workouts" element={<DailyWorkoutManager />} />
            <Route path="settings" element={<div className="sm:p-0"><h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Settings</h1><p className="text-gray-500 mt-4 font-medium">Admin settings coming soon...</p></div>} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
