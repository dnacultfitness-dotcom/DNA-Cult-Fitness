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
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { db, collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, addDoc, handleFirestoreError, OperationType, where, getDocs, serverTimestamp, storage, ref, uploadBytes, getDownloadURL } from '../firebase';
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

  const remainingDays = expiryDate ? Math.ceil((expiryDate.toDate().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

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

const MemberTypeSelect = ({ membershipId, currentProgram, availablePlans }: { membershipId: string, currentProgram: string, availablePlans?: any[] }) => {
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
      await updateDoc(doc(db, 'memberships', membershipId), {
        program: newVal
      });
      toast.success('Member type updated');
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

const UserManager = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAdmin } = useFirebase();

  useEffect(() => {
    if (!isAdmin) return;
    
    const qUsers = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // Sort in memory by lastActive or createdAt to ensure users with missing fields are still visible
      data.sort((a, b) => (b.lastActive?.toMillis() || b.createdAt?.toMillis() || 0) - (a.lastActive?.toMillis() || a.createdAt?.toMillis() || 0));
      setUsers(data);
      setLoading(false);
    }, (err) => {
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
      const name = (membership?.name || user.displayName || '').toLowerCase();
      const email = (user.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [users, memberships, searchQuery]);

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-green-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search members by name or email..."
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
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-green-600" /></div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Customer ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Trainer</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Last Active</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Program / Plan</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">AI Plan Tier</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">
                    No matching members found for "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const planInfo = getApprovedPlan(user.id);
                  const membership = memberships.find(m => m.userId === user.id);
                  const trainer = trainers.find(t => t.id === membership?.trainerId);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 flex items-center justify-center bg-gray-100 text-gray-400 font-bold">
                          {user.photoURL ? (
                            <img 
                              src={user.photoURL} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            user.displayName?.[0] || user.email?.[0] || 'U'
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 leading-tight">
                            {membership?.name || user.displayName || 'No Name'}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">{user.email}</p>
                          {membership?.name && user.displayName && membership?.name !== user.displayName && (
                            <p className="text-[9px] text-gray-400 uppercase tracking-tighter">Acc: {user.displayName}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <CustomerIdInput userId={user.id} initialValue={user.customerId} />
                    </td>
                    <td className="px-6 py-4">
                      {membership ? (
                        <TrainerSelect 
                          membershipId={membership.id} 
                          userId={user.id}
                          currentTrainerId={membership.trainerId} 
                          trainers={trainers} 
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Not Assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-900">
                          {user.lastActive ? user.lastActive.toDate().toLocaleDateString() : 'Never'}
                        </span>
                        {user.lastActive && (
                          <span className="text-[9px] text-gray-400">
                            {user.lastActive.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {membership ? (
                        <MemberTypeSelect 
                          membershipId={membership.id} 
                          currentProgram={membership.program} 
                          availablePlans={membershipPlans}
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-gray-300 uppercase italic">No Active Membership</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {planInfo ? (
                        <div className={cn(
                          "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          planInfo.color
                        )}>
                          <Sparkles size={10} className="mr-1.5" />
                          {planInfo.label}
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">No Plan Assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <RoleSelect userId={user.id} currentRole={user.role || 'customer'} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => deleteUser(user.id)} 
                        className={cn(
                          "p-2 rounded-lg transition-all flex items-center space-x-2 ml-auto",
                          deletingId === user.id 
                            ? "bg-red-600 text-white shadow-lg" 
                            : "text-red-500 hover:bg-red-50"
                        )}
                        title={deletingId === user.id ? "Click again to confirm" : "Delete User"}
                      >
                        <Trash2 size={18} />
                        {deletingId === user.id && <span className="text-[10px] font-bold">Confirm?</span>}
                      </button>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
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
      
      // Notify User
      const membership = memberships.find(m => m.id === id);
      if (membership) {
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

  const aiPlanOptions = [
    { id: 'demo', name: 'Demo Workout (No approval needed)' },
    { id: 'new_user_1_week', name: 'New User: 1 Week Plan' },
    { id: 'normal_1_week', name: 'Normal Member: 1 Week Plan' },
    { id: 'silver_1_month', name: 'Silver: 1 Month Beginner Diet & Workout' },
    { id: 'gold_1_month', name: 'Gold: 1 Month Transformation' },
    { id: 'platinum_1_month', name: 'Platinum: 1 Month Adv Transformation' }
  ];

  const AIPlanSelector = ({ membershipId, currentAiPlan, onUpdate }: { membershipId: string, currentAiPlan?: string, onUpdate: (val: string) => void }) => {
    return (
      <div className="flex flex-col space-y-1">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Approved AI Plan</label>
        <select 
          value={currentAiPlan || 'demo'} 
          onChange={(e) => onUpdate(e.target.value)}
          className="text-xs font-bold border border-gray-100 rounded-xl px-3 py-2 outline-none bg-gray-50/50 focus:border-green-500 transition-colors"
        >
          {aiPlanOptions.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.name}</option>
          ))}
        </select>
      </div>
    );
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
      const name = (m.name || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      const phone = (m.phone || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [memberships, searchQuery]);

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">Membership Applications</h1>
        <div className="relative group w-full md:w-80">
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
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-green-600" /></div>
        ) : filteredMemberships.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm text-center text-gray-400 italic">
            {searchQuery ? `No matching applications found for "${searchQuery}"` : "No membership applications found."}
          </div>
        ) : (
          filteredMemberships.map((m) => {
            const userAccount = (userMap as any)[m.userId];
            return (
            <div key={m.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between transition-all hover:border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-400 font-bold flex-shrink-0">
                  {userAccount?.photoURL ? (
                    <img 
                      src={userAccount.photoURL} 
                      alt="Account" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    userAccount?.displayName?.[0] || m.name?.[0] || 'U'
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-lg">{m.name}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      m.status === 'pending' ? "bg-yellow-100 text-yellow-700" : 
                      m.status === 'approved' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {m.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{m.email} • {m.phone}</p>
                  {userAccount?.displayName && userAccount.displayName !== m.name && (
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Account Name: {userAccount.displayName}</p>
                  )}
                  <div className="pt-1">
                    <MemberTypeSelect membershipId={m.id} currentProgram={m.program} availablePlans={membershipPlans} />
                  </div>
                  {m.message && <p className="text-xs text-gray-400 italic">"{m.message}"</p>}
                </div>
              </div>
            <div className="flex items-center space-x-6">
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <AIPlanSelector 
                  membershipId={m.id} 
                  currentAiPlan={m.approvedAiPlan} 
                  onUpdate={(val) => updateStatus(m.id, m.status || 'pending', val)}
                />
                
                {m.status === 'approved' && (
                  <ValidityInput membershipId={m.id} expiryDate={m.expiryDate} />
                )}
                
                <div className="flex space-x-2 items-center pt-4 md:pt-0">
                  <TrainerSelect 
                    membershipId={m.id} 
                    userId={m.userId}
                    currentTrainerId={m.trainerId} 
                    trainers={trainers} 
                  />

                  <button 
                    onClick={() => updateStatus(m.id, 'approved', m.approvedAiPlan)} 
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      m.status === 'approved' ? "bg-green-600 text-white" : "text-green-600 hover:bg-green-50"
                    )}
                    title="Approve"
                  >
                    <CheckCircle size={20} />
                  </button>
                  <button 
                    onClick={() => updateStatus(m.id, 'rejected')} 
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      m.status === 'rejected' ? "bg-red-600 text-white" : "text-red-600 hover:bg-red-50"
                    )}
                    title="Reject"
                  >
                    <XCircle size={20} />
                  </button>
                  <button 
                    onClick={() => handleDelete(m.id)}
                    className={cn(
                      "p-2 rounded-lg transition-all flex items-center space-x-2",
                      deletingId === m.id 
                        ? "bg-red-600 text-white shadow-lg" 
                        : "text-gray-400 hover:bg-gray-50"
                    )}
                    title={deletingId === m.id ? "Click again to confirm" : "Delete Application"}
                  >
                    <Trash2 size={20} />
                    {deletingId === m.id && <span className="text-[10px] font-bold">Confirm Delete?</span>}
                  </button>
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
  const [loading, setLoading] = useState(true);
  const [denyingWorkoutId, setDenyingWorkoutId] = useState<string | null>(null);
  const [denialMessage, setDenialMessage] = useState('');
  const [submittingDeny, setSubmittingDeny] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = collection(db, 'dailyWorkouts');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setWorkouts(data);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'dailyWorkouts'));

    return () => unsubscribe();
  }, []);

  const filteredWorkouts = useMemo(() => {
    if (!searchQuery.trim()) return workouts;
    const q = searchQuery.toLowerCase();
    return workouts.filter(w => 
      (w.userName || '').toLowerCase().includes(q) || 
      (w.userId || '').toLowerCase().includes(q)
    );
  }, [workouts, searchQuery]);

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
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Today's Workout Submissions</h2>
        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-green-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search by name or ID..."
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">User</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Action</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredWorkouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-gray-500 font-medium">
                    {searchQuery ? `No matching workouts found for "${searchQuery}"` : "No workout submissions found."}
                  </td>
                </tr>
              ) : (
                filteredWorkouts.map((workout) => (
                  <tr key={workout.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 font-black mr-4 border border-green-100">
                          {workout.userName?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 uppercase text-xs tracking-tight">{workout.userName}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{workout.userId.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-gray-600">{workout.date}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        workout.action === 'done' ? "bg-green-50 text-green-700 border-green-100" : "bg-gray-50 text-gray-400 border-gray-200"
                      )}>
                        {workout.action || 'done'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        workout.status === 'approved' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : 
                        workout.status === 'denied' ? "bg-red-50 text-red-700 border-red-100" : "bg-amber-50 text-amber-700 border-amber-100"
                      )}>
                        {workout.status === 'approved' ? <CheckCircle size={10} className="mr-1" /> : 
                         workout.status === 'denied' ? <XCircle size={10} className="mr-1" /> :
                         <Loader2 size={10} className="mr-1 animate-spin" />}
                        {workout.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {workout.status === 'pending' && (
                        <div className="flex items-center justify-end space-x-2">
                          {denyingWorkoutId === workout.id ? (
                            <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                              <input
                                type="text"
                                value={denialMessage}
                                onChange={(e) => setDenialMessage(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleDeny(workout.id);
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
                                onClick={() => handleDeny(workout.id)}
                                disabled={submittingDeny}
                                className="text-red-500 hover:text-red-700 transition-colors p-1"
                                title="Send"
                              >
                                {submittingDeny ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                              </button>
                              <button
                                onClick={() => {
                                  setDenyingWorkoutId(null);
                                  setDenialMessage('');
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                                title="Cancel"
                              >
                                <XCircle size={14} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleApprove(workout)}
                                className="bg-green-50 text-green-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all border border-green-100"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setDenyingWorkoutId(workout.id)}
                                className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-100"
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
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Active Members</h1>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-green-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Active Member</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Trainer</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Member Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">AI Plan Tier</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Current Workout</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Customer ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Validity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {joinedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No active members found.</td>
                  </tr>
                ) : joinedMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 flex items-center justify-center bg-gray-100 text-gray-400 font-bold flex-shrink-0">
                          {member.userData?.photoURL ? (
                            <img 
                              src={member.userData.photoURL} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            member.userData?.displayName?.[0] || member.name?.[0] || 'U'
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 leading-tight">{member.name}</p>
                          <p className="text-[10px] text-gray-500">{member.phone} • {member.userData?.email}</p>
                          {member.userData?.displayName && member.userData.displayName !== member.name && (
                            <p className="text-[9px] text-gray-400 uppercase tracking-tighter">Acc: {member.userData.displayName}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        member.trainerName === 'Unassigned' ? "bg-gray-50 text-gray-400 border-gray-100" : "bg-blue-50 text-blue-700 border-blue-100"
                      )}>
                        {member.trainerName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <MemberTypeSelect membershipId={member.id} currentProgram={member.program} availablePlans={membershipPlans} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.planTier ? (
                        <div className={cn(
                          "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          member.planTier.color
                        )}>
                          <Sparkles size={10} className="mr-1.5" />
                          {member.planTier.label}
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">No Plan Assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[10px] text-gray-600 font-bold uppercase tracking-tight max-w-xs truncate">
                      {member.activeWorkoutPlan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-mono bg-gray-50 border border-gray-100 px-2 py-1 rounded">
                        {member.customerId}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Generated AI Plans</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
          <h3 className="font-bold text-blue-900 mb-2">New User Tier</h3>
          <p className="text-xs text-blue-700">1-Week One Time Plan. No approval needed for Demo, but this is the starter tier after application.</p>
        </div>
        <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
          <h3 className="font-bold text-green-900 mb-2">Silver Tier</h3>
          <p className="text-xs text-green-700">1-Month Beginner Diet & Workout Plan. Focus on foundation and consistency.</p>
        </div>
        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
          <h3 className="font-bold text-amber-900 mb-2">Gold Tier</h3>
          <p className="text-xs text-amber-700">1-Month Transformation. High intensity workout and transformation diet.</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100">
          <h3 className="font-bold text-purple-900 mb-2">Platinum Tier</h3>
          <p className="text-xs text-purple-700">1-Month Advanced. Transformation + Recovery + Elite Dieting Protocols.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h2 className="text-xl font-bold">User History</h2>
        <div className="relative group w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-green-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search AI plans..."
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-green-600" /></div>
        ) : filteredPlans.length === 0 ? (
          <div className="col-span-full p-12 bg-white rounded-3xl border border-gray-100 shadow-sm text-center text-gray-400 italic">
            {searchQuery ? `No matching AI plans found for "${searchQuery}"` : "No AI plans found."}
          </div>
        ) : filteredPlans.map((plan) => (
          <div 
            key={plan.id} 
            onClick={() => setSelectedViewPlan(plan)}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 font-bold border border-green-100">
                  {plan.customerData?.photoURL ? (
                    <img src={plan.customerData.photoURL} alt="User" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                  ) : (
                    plan.customerData?.displayName?.[0] || plan.userName?.[0] || 'U'
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center">
                    {plan.customerData?.displayName || plan.userName}
                    <Sparkles size={14} className="ml-2 text-brand" />
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[10px] font-mono bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                      ID: {plan.customerData?.customerId || "PENDING"}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                      {plan.createdAt?.toDate().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-4">
              <p className="text-xs text-gray-600 font-medium line-clamp-3 italic">"{plan.planData.overview}"</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={cn(
                  "px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest",
                  plan.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                )}>
                  {plan.isActive ? "Active on Profile" : "Archived"}
                </span>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(plan.id);
                }}
                className={cn(
                  "text-xs font-bold flex items-center px-3 py-1.5 rounded-lg transition-all",
                  deletingId === plan.id 
                    ? "bg-red-600 text-white shadow-lg" 
                    : "text-red-500 hover:bg-red-50"
                )}
              >
                <Trash2 size={14} className="mr-1" /> 
                {deletingId === plan.id ? "Confirm?" : "Delete"}
              </button>
            </div>
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
    order: 0,
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

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
    return plans.filter(p => 
      (p.name || '').toLowerCase().includes(q) || 
      (p.category || '').toLowerCase().includes(q) ||
      (p.duration || '').toLowerCase().includes(q)
    );
  }, [plans, searchQuery]);

  const startEdit = (plan: any) => {
    setEditingId(plan.id);
    // Ensure priceOptions exists
    const defaultOptions = [
      { duration: '1 Month', actualPrice: '', offerPrice: '' },
      { duration: '3 Months', actualPrice: '', offerPrice: '' },
      { duration: '6 Months', actualPrice: '', offerPrice: '' },
      { duration: '12 Months', actualPrice: '', offerPrice: '' }
    ];
    setEditForm({ 
      ...plan, 
      priceOptions: plan.priceOptions || defaultOptions 
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const sanitizedOptions = editForm.priceOptions.map((opt: any) => ({
        duration: opt.duration,
        actualPrice: opt.actualPrice === '' ? 0 : Number(opt.actualPrice),
        offerPrice: opt.offerPrice === '' ? 0 : Number(opt.offerPrice)
      })).filter((opt: any) => !isNaN(opt.actualPrice) && (opt.actualPrice > 0 || opt.offerPrice > 0));

      await updateDoc(doc(db, 'membershipPlans', editingId), {
        name: editForm.name.trim(),
        priceOptions: sanitizedOptions,
        order: Number(editForm.order) || 0,
        updatedAt: serverTimestamp()
      });
      toast.success('Membership plan updated successfully');
      setEditingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `membershipPlans/${editingId}`);
    }
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return;
    
    setUploading(true);
    const loadingToast = toast.loading('Creating membership plan...');
    try {
      let finalImageUrl = '';

      if (imageFile) {
        if (!storage) {
          throw new Error('Firebase Storage is not available. Please ensure "Cloud Storage" is enabled in your Firebase Console and the configuration is correct.');
        }
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `plans/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const storageRef = ref(storage, fileName);
        const snapshot = await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      }

      console.log('[Admin] Raw price options:', newPlan.priceOptions);
      const sanitizedOptions = newPlan.priceOptions.map(opt => ({
        duration: opt.duration,
        actualPrice: opt.actualPrice === '' || opt.actualPrice === null ? 0 : Number(opt.actualPrice),
        offerPrice: opt.offerPrice === '' || opt.offerPrice === null ? 0 : Number(opt.offerPrice)
      })).filter(opt => !isNaN(opt.actualPrice) && (opt.actualPrice > 0 || opt.offerPrice > 0));

      console.log('[Admin] Sanitized price options:', sanitizedOptions);

      if (sanitizedOptions.length === 0) {
        throw new Error('Please add at least one valid price option with a value greater than 0');
      }

      if (!newPlan.name.trim()) {
        throw new Error('Please enter a plan name');
      }

      const planData = {
        name: newPlan.name.trim(),
        priceOptions: sanitizedOptions,
        imageUrl: finalImageUrl,
        features: newPlan.features.split(',').map(f => f.trim()).filter(f => f !== ''),
        order: Number(newPlan.order) || 0,
        createdAt: serverTimestamp()
      };
      
      console.log('[Admin] Final plan data:', planData);
      const docRef = await addDoc(collection(db, 'membershipPlans'), planData);
      console.log('[Admin] Plan created with ID:', docRef.id);
      
      toast.success('New membership plan created successfully!', { id: loadingToast });
      setShowAddForm(false);
      setImageFile(null);
      setImagePreview(null);
      setNewPlan({
        name: '',
        priceOptions: [
          { duration: '1 Month', actualPrice: '', offerPrice: '' },
          { duration: '3 Months', actualPrice: '', offerPrice: '' },
          { duration: '6 Months', actualPrice: '', offerPrice: '' },
          { duration: '12 Months', actualPrice: '', offerPrice: '' }
        ],
        features: '',
        order: plans.length + 1,
        imageUrl: ''
      });
    } catch (err: any) {
      console.error('[Admin] Failed to create plan:', err);
      toast.error('Failed to create plan: ' + err.message, { id: loadingToast });
      handleFirestoreError(err, OperationType.CREATE, 'membershipPlans');
    } finally {
      setUploading(false);
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
      console.error('Delete plan failed:', err);
      toast.error('Failed to delete plan: ' + (err.message || 'Unknown error'), { id: loadingToast });
      handleFirestoreError(err, OperationType.DELETE, `membershipPlans/${id}`);
    }
  };

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">Membership Plans</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-green-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search plans by name, duration..."
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
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-6 py-3 bg-black text-white rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all whitespace-nowrap"
            >
              {showAddForm ? <><XCircle size={18} /> <span>Cancel</span></> : <><Plus size={18} /> <span>Add New Plan</span></>}
            </button>
            <button 
              onClick={seedPlans}
              className="px-4 py-3 bg-green-600 text-white rounded-2xl text-sm font-bold hover:bg-green-700 transition-all whitespace-nowrap"
            >
              Seed
            </button>
          </div>
        </div>
      </div>

      {showAddForm && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm mb-8"
        >
          <h2 className="text-xl font-bold mb-6">Create New Membership Plan</h2>
          <form onSubmit={handleAddPlan} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Plan Name</label>
              <input 
                required
                type="text" 
                value={newPlan.name} 
                onChange={e => setNewPlan({...newPlan, name: e.target.value})}
                className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g. Diamond Plan"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Display Order</label>
              <input 
                type="number" 
                value={newPlan.order} 
                onChange={e => setNewPlan({...newPlan, order: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="md:col-span-2 border-t pt-6">
              <h3 className="font-bold text-gray-800 mb-4">Pricing Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {newPlan.priceOptions.map((opt, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="font-bold text-sm text-gray-700 mb-3">{opt.duration}</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400">Actual Price</label>
                        <input 
                          type="number"
                          value={opt.actualPrice}
                          onChange={e => {
                            const updated = [...newPlan.priceOptions];
                            updated[index].actualPrice = e.target.value;
                            setNewPlan({...newPlan, priceOptions: updated});
                          }}
                          className="w-full px-3 py-1.5 border rounded-lg text-sm"
                          placeholder="e.g. 5000"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-400">Offer Price</label>
                        <input 
                          type="number"
                          value={opt.offerPrice}
                          onChange={e => {
                            const updated = [...newPlan.priceOptions];
                            updated[index].offerPrice = e.target.value;
                            setNewPlan({...newPlan, priceOptions: updated});
                          }}
                          className="w-full px-3 py-1.5 border rounded-lg text-sm"
                          placeholder="e.g. 4500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Plan Image (Recommended 1080x1080px)</label>
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden flex items-center justify-center group relative">
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={20} />
                      </button>
                    </>
                  ) : (
                    <Dumbbell size={24} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition-all cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-gray-400">High quality 1:1 aspect ratio image looks best.</p>
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Features (Comma separated)</label>
              <textarea 
                value={newPlan.features} 
                onChange={e => setNewPlan({...newPlan, features: e.target.value})}
                className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-green-500 h-24 resize-none"
                placeholder="Feature 1, Feature 2, Feature 3..."
              />
            </div>
            <div className="md:col-span-2">
              <button 
                type="submit"
                disabled={uploading}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {uploading ? <Loader2 size={20} className="animate-spin" /> : null}
                <span>{uploading ? 'Processing...' : 'Create Plan'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}
      
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-green-600" /></div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">Image</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">Plan Name</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">Pricing Options</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">Order</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">
                    {searchQuery ? `No matching plans found for "${searchQuery}"` : "No membership plans found."}
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center">
                      {plan.imageUrl ? (
                        <img src={plan.imageUrl} alt={plan.name} className="w-full h-full object-cover" />
                      ) : (
                        <Dumbbell size={16} className="text-gray-300" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingId === plan.id ? (
                      <input 
                        type="text" 
                        value={editForm.name} 
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        className="px-2 py-1 border rounded"
                      />
                    ) : (
                      <span className="font-bold text-gray-900">{plan.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === plan.id ? (
                      <div className="space-y-2">
                        {editForm.priceOptions.map((opt: any, idx: number) => (
                          <div key={idx} className="flex gap-2 items-center text-[10px]">
                            <span className="w-12 font-bold">{opt.duration}:</span>
                            <input 
                              type="number" 
                              value={opt.actualPrice} 
                              onChange={e => {
                                const updated = [...editForm.priceOptions];
                                updated[idx].actualPrice = e.target.value;
                                setEditForm({...editForm, priceOptions: updated});
                              }}
                              className="w-16 border rounded p-1"
                              placeholder="Act"
                            />
                            <input 
                              type="number" 
                              value={opt.offerPrice} 
                              onChange={e => {
                                const updated = [...editForm.priceOptions];
                                updated[idx].offerPrice = e.target.value;
                                setEditForm({...editForm, priceOptions: updated});
                              }}
                              className="w-16 border rounded p-1"
                              placeholder="Off"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {(plan.priceOptions || []).map((opt: any, i: number) => (
                          <div key={i} className="text-[10px] flex justify-between gap-4">
                            <span className="font-bold text-gray-500">{opt.duration}:</span>
                            <span className="font-black text-gray-900">₹{opt.offerPrice} <span className="line-through text-gray-400 font-normal">₹{opt.actualPrice}</span></span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {editingId === plan.id ? (
                      <input 
                        type="number" 
                        value={editForm.order} 
                        onChange={e => setEditForm({...editForm, order: e.target.value})}
                        className="px-2 py-1 border rounded w-16"
                      />
                    ) : (
                      plan.order || 0
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {editingId === plan.id ? (
                        <>
                          <button onClick={saveEdit} className="text-green-600 hover:text-green-700">
                            <SaveIcon size={18} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                            <XCircle size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            type="button"
                            onClick={() => startEdit(plan)} 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Plan"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              deletePlan(plan.id);
                            }}
                            className={cn(
                              "p-2 rounded-lg transition-all flex items-center space-x-1",
                              deletingId === plan.id 
                                ? "bg-red-600 text-white shadow-lg" 
                                : "text-red-500 hover:bg-red-50"
                            )}
                            title={deletingId === plan.id ? "Click again to confirm" : "Delete Plan"}
                          >
                            <Trash2 size={18} />
                            {deletingId === plan.id && <span className="text-[10px] font-bold uppercase">Confirm?</span>}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
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
    order: 0,
    imageUrl: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

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
      let finalImageUrl = '';

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `services/${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, fileName);
        const snapshot = await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(snapshot.ref);
      }

      const serviceData = {
        title: newService.title.trim(),
        description: newService.description.trim(),
        imageUrl: finalImageUrl,
        features: newService.features.split(',').map(f => f.trim()).filter(f => f !== ''),
        order: Number(newService.order) || 0,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'gymServices'), serviceData);
      
      toast.success('New training program created successfully!', { id: loadingToast });
      setShowAddForm(false);
      setImageFile(null);
      setImagePreview(null);
      setNewService({
        title: '',
        description: '',
        features: '',
        order: services.length + 1,
        imageUrl: ''
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
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">Training Programs</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-green-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all text-sm font-medium"
            />
          </div>
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-6 py-3 bg-black text-white rounded-2xl text-sm font-bold hover:bg-gray-800 transition-all flex items-center space-x-2"
            >
              {showAddForm ? <><XCircle size={18} /> <span>Cancel</span></> : <><Plus size={18} /> <span>Add Service</span></>}
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
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm mb-8"
        >
          <h2 className="text-xl font-bold mb-6 text-gray-900">Add Training Program</h2>
          <form onSubmit={handleAddService} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Program Title</label>
              <input 
                required
                type="text" 
                value={newService.title} 
                onChange={e => setNewService({...newService, title: e.target.value})}
                className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g. CrossFit Training"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Display Order</label>
              <input 
                type="number" 
                value={newService.order} 
                onChange={e => setNewService({...newService, order: Number(e.target.value)})}
                className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
              <textarea 
                required
                value={newService.description} 
                onChange={e => setNewService({...newService, description: e.target.value})}
                className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-green-500 h-24 resize-none"
                placeholder="Briefly describe the training program..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Banner Image</label>
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden flex items-center justify-center">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Briefcase size={24} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
                  />
                  <p className="mt-1 text-xs text-gray-400">Recommended size: 1080x720px.</p>
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Features (Comma separated)</label>
              <textarea 
                value={newService.features} 
                onChange={e => setNewService({...newService, features: e.target.value})}
                className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-green-500 h-24 resize-none"
                placeholder="WOD, Cardio, Gymnastics..."
              />
            </div>
            <div className="md:col-span-2">
              <button 
                type="submit"
                disabled={uploading}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50"
              >
                {uploading ? 'Processing...' : 'Create Program'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center"><Loader2 className="animate-spin mx-auto text-green-600" /></div>
        ) : services.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-gray-100 text-center text-gray-400 italic">No services found. Seed them to start!</div>
        ) : (
          filteredServices.map(svc => (
            <div key={svc.id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
              <div className="h-40 relative group">
                {svc.imageUrl ? (
                  <img src={svc.imageUrl} alt={svc.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center"><Briefcase size={32} className="text-gray-300" /></div>
                )}
                <div className="absolute top-4 left-4 bg-black/60 text-white text-[10px] font-black uppercase px-2 py-1 rounded">Order: {svc.order}</div>
              </div>
              
              <div className="p-6 flex-grow">
                {editingId === svc.id ? (
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      value={editForm.title} 
                      onChange={e => setEditForm({...editForm, title: e.target.value})}
                      className="w-full px-3 py-2 border rounded-xl text-sm font-bold"
                    />
                    <textarea 
                      value={editForm.description} 
                      onChange={e => setEditForm({...editForm, description: e.target.value})}
                      className="w-full px-3 py-2 border rounded-xl text-xs h-20"
                    />
                    <input 
                      type="number" 
                      value={editForm.order} 
                      onChange={e => setEditForm({...editForm, order: e.target.value})}
                      className="w-full px-3 py-2 border rounded-xl text-xs"
                      placeholder="Order"
                    />
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{svc.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-3 mb-4">{svc.description}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {(svc.features || []).slice(0, 3).map((f: string, i: number) => (
                        <span key={i} className="text-[9px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-tight">{f}</span>
                      ))}
                      {(svc.features || []).length > 3 && <span className="text-[9px] text-gray-300">+{svc.features.length - 3} more</span>}
                    </div>
                  </>
                )}
              </div>
              
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                {editingId === svc.id ? (
                  <div className="flex space-x-2 w-full">
                    <button onClick={saveEdit} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-bold">Save</button>
                    <button onClick={() => setEditingId(null)} className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold">Cancel</button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => startEdit(svc)} className="text-blue-600 hover:text-blue-700 flex items-center space-x-1 text-xs font-bold"><Edit2 size={14} /> <span>Edit</span></button>
                    <button 
                      onClick={() => {
                        if (deletingId === svc.id) {
                          deleteDoc(doc(db, 'gymServices', svc.id));
                          toast.success('Service deleted');
                        } else {
                          setDeletingId(svc.id);
                          setTimeout(() => setDeletingId(null), 3000);
                        }
                      }}
                      className={cn("text-xs font-bold transition-all", deletingId === svc.id ? "text-red-700 bg-red-100 px-2 py-1 rounded" : "text-red-500")}
                    >
                      {deletingId === svc.id ? 'Confirm?' : 'Delete'}
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
    // Removing orderBy to ensure all documents appear even if createdAt is missing temporarily
    const q = query(collection(db, 'planApprovalRequests'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // Sort in memory instead
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
    const loadingToast = toast.loading(`${status === 'approved' ? 'Approving' : 'Rejecting'} plan modification...`);
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

        // Notify Trainer
        await createNotification(
          request.trainerId,
          'Plan Approved',
          `Admin has approved your plan modification for ${request.userName}.`,
          NotificationType.SUCCESS,
          '/trainer'
        );

        toast.success('Plan approved and updated successfully', { id: loadingToast });
      } else {
        // Notify Trainer
        await createNotification(
          request.trainerId,
          'Plan Rejected',
          `Admin has rejected your plan modification for ${request.userName}: ${message}`,
          NotificationType.ERROR,
          '/trainer'
        );

        toast.success('Plan modification rejected', { id: loadingToast });
      }
      setDenyingId(null);
      setAdminMsg('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `planApprovalRequests/${request.id}`);
      toast.error(`Error: ${status} failed`, { id: loadingToast });
    }
  };

  if (loading) return <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-green-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-fit mb-6">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              filter === s ? "bg-gray-900 text-white shadow-md scale-105" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {filteredRequests.length === 0 ? (
        <div className="p-12 text-center text-gray-400 italic bg-white rounded-3xl border border-gray-100 shadow-sm uppercase text-[10px] font-black tracking-widest">
          No {filter !== 'all' ? filter : ''} approval requests found
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.map((r) => (
            <div key={r.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 uppercase">
                    {r.userName?.[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{r.userName}</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mt-1">Requested by: {r.trainerName}</p>
                    <p className="text-[10px] text-gray-300 font-bold mt-1">Date: {r.createdAt?.toDate().toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Requested Modification</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold block mb-1">Calories</span>
                      <p className="text-sm font-bold text-gray-900">{r.requestedPlanData?.nutrition?.calories} kcal</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold block mb-1">Status</span>
                      <p className="text-sm font-bold text-gray-900 capitalize">{r.requestedPlanData?.status}</p>
                    </div>
                  </div>
                  {r.adminMessage && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="text-[10px] text-red-400 font-bold block mb-1">Admin Note</span>
                      <p className="text-xs text-red-600 italic">"{r.adminMessage}"</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 mt-4 md:mt-0">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
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
                      className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all shadow-sm"
                      title="Approve Changes"
                    >
                      <CheckCircle size={20} />
                    </button>
                    <button 
                      onClick={() => setDenyingId(r.id)}
                      className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                      title="Reject & Add Note"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                )}
              </div>

              <AnimatePresence>
                {denyingId === r.id && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="w-full md:w-auto pt-4 md:pt-0"
                  >
                    <div className="flex items-center space-x-2">
                      <input 
                        type="text" 
                        value={adminMsg}
                        onChange={(e) => setAdminMsg(e.target.value)}
                        placeholder="Reason for rejection..."
                        className="flex-1 md:w-64 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500 outline-none"
                      />
                      <button 
                        onClick={() => handleAction(r, 'rejected', adminMsg)}
                        className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                      >
                        Confirm
                      </button>
                      <button onClick={() => setDenyingId(null)} className="p-2 text-gray-400"><XCircle size={18} /></button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
  const [activeTab, setActiveTab] = useState<'manage'>('manage');
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
      toast.error('Please fill in required fields');
      return;
    }
    const loadingToast = toast.loading('Adding trainer...');
    try {
      await addDoc(collection(db, 'trainers'), {
        ...formData,
        numberOfClients: Number(formData.numberOfClients),
        createdAt: serverTimestamp()
      });
      toast.success('Trainer added successfully', { id: loadingToast });
      setIsAdding(false);
      setFormData({ name: '', staffId: '', speciality: '', numberOfClients: 0, email: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'trainers');
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
      return;
    }
    const loadingToast = toast.loading('Deleting trainer...');
    try {
      await deleteDoc(doc(db, 'trainers', id));
      toast.success('Trainer deleted', { id: loadingToast });
      setDeletingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `trainers/${id}`);
    }
  };

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">Trainer Management</h1>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-green-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search trainers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/5 transition-all text-sm font-medium"
            />
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="w-full md:w-auto bg-black text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-gray-800 transition-all whitespace-nowrap"
          >
            {isAdding ? <><XCircle size={20} /> <span>Cancel</span></> : <><Plus size={20} /> <span>Add Trainer</span></>}
          </button>
        </div>
      </div>

      {isAdding && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm mb-8"
            >
              <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-500"
                    placeholder="Trainer Name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Staff ID *</label>
                  <input
                    type="text"
                    value={formData.staffId}
                    onChange={e => setFormData({ ...formData, staffId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-500"
                    placeholder="STF001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-500"
                    placeholder="trainer@dnacult.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Speciality</label>
                  <input
                    type="text"
                    value={formData.speciality}
                    onChange={e => setFormData({ ...formData, speciality: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-500"
                    placeholder="Weight Lifting, Yoga, etc."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Clients Count</label>
                  <input
                    type="number"
                    value={formData.numberOfClients}
                    onChange={e => setFormData({ ...formData, numberOfClients: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-500"
                  />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all">
                    Save Trainer
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-green-600" /></div>
            ) : filteredTrainers.length === 0 ? (
              <div className="p-12 text-center text-gray-500 font-medium">
                {searchQuery ? `No matching trainers found for "${searchQuery}"` : "No trainers found. Add your first trainer!"}
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Staff ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Speciality</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Clients</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Login Mail</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredTrainers.map((trainer) => (
                    <tr key={trainer.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{trainer.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100">
                          {trainer.staffId}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{trainer.speciality || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Users size={14} className="text-gray-400" />
                          <span className="font-bold text-gray-900">{trainer.numberOfClients}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{trainer.email}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDelete(trainer.id)}
                          className={cn(
                            "p-2 rounded-lg transition-all flex items-center space-x-2 ml-auto",
                            deletingId === trainer.id 
                              ? "bg-red-600 text-white shadow-lg" 
                              : "text-red-500 hover:bg-red-50"
                          )}
                        >
                          <Trash2 size={18} />
                          {deletingId === trainer.id && <span className="text-[10px] font-bold uppercase transition-all">Confirm?</span>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
    </div>
  );
};

const AdminSidebar = () => {
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
    { name: 'Protocols', path: '/admin/plans', icon: <ShieldCheck size={20} /> },
    { name: 'Services', path: '/admin/services', icon: <Dumbbell size={20} /> },
    { name: 'AI Plans', path: '/admin/ai-plans', icon: <Sparkles size={20} /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col pt-8">
      <div className="px-8 mb-8">
        <Link to="/" className="flex items-center space-x-2 mb-8">
          <span className="text-xl font-bold tracking-tighter text-green-700">DNA <span className="text-black">CULT</span></span>
        </Link>
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Admin Menu</h2>
      </div>
      <nav className="flex-grow px-2 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all",
              location.pathname === item.path ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <div className="flex items-center space-x-3">
              {item.icon}
              <span>{item.name}</span>
            </div>
            {item.badge > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <Link 
          to="/" 
          className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-all"
        >
          <ArrowLeft size={20} />
          <span>Back to Site</span>
        </Link>
      </div>
    </div>
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
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className={cn("p-4 rounded-2xl", stat.color)}>{stat.icon}</div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {recentApprovals.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Clock className="text-yellow-500" size={20} />
              Recent Pending Approval Requests
            </h2>
            <Link to="/admin/approvals" className="text-xs font-black uppercase tracking-widest text-green-600 hover:text-green-700">View All</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentApprovals.map((req) => (
              <div key={req.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold border border-blue-100 uppercase text-xs">
                    {req.userName?.[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{req.userName}</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mt-1">Requested by: {req.trainerName}</p>
                  </div>
                </div>
                <Link 
                  to="/admin/approvals" 
                  className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
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
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-grow relative">
        <div className="absolute top-8 right-8 z-20">
          <NotificationBell />
        </div>
        <Routes>
          <Route index element={<Overview />} />
          <Route path="members" element={<MemberManager />} />
          <Route path="users" element={<UserManager />} />
          <Route path="plans" element={<MembershipPlanManager />} />
          <Route path="services" element={<ServiceManager />} />
          <Route path="ai-plans" element={<AIPlanManager />} />
          <Route path="trainers" element={<TrainerManager />} />
          <Route path="approvals" element={<div className="p-8"><h1 className="text-3xl font-bold mb-8">Plan Modification Approvals</h1><PlanApprovalManager /></div>} />
          <Route path="memberships" element={<MembershipManager />} />
          <Route path="workouts" element={<DailyWorkoutManager />} />
          <Route path="settings" element={<div className="p-8"><h1 className="text-3xl font-bold">Settings</h1><p className="text-gray-500 mt-4">Admin settings coming soon...</p></div>} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;
