import React, { useState, useEffect } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { db, collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, addDoc, handleFirestoreError, OperationType, where, getDocs } from '../firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { toast } from 'sonner';

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

const UserManager = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useFirebase();

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const deleteUser = async (id: string) => {
    if (!window.confirm('Are you sure? This will not delete their Auth account.')) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      toast.success('User profile deleted');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${id}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">User Management</h1>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-green-600" /></div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">User</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">Customer ID</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">Role</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 flex items-center justify-center bg-green-100 text-green-700 font-bold">
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
                        <p className="font-bold text-gray-900">{user.displayName || 'No Name'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <CustomerIdInput userId={user.id} initialValue={user.customerId} />
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold",
                      user.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.createdAt?.toDate().toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => deleteUser(user.id)} className="text-red-500 hover:text-red-700 transition-colors">
                      <Trash2 size={18} />
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

const MembershipManager = () => {
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useFirebase();

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'memberships'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMemberships(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'memberships');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'memberships', id), { status });
      toast.success(`Status updated to ${status}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `memberships/${id}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Membership Applications</h1>
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-green-600" /></div>
        ) : memberships.map((m) => (
          <div key={m.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
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
              <p className="text-sm font-medium text-green-600">{m.program}</p>
              {m.message && <p className="text-xs text-gray-400">"{m.message}"</p>}
            </div>
            <div className="flex items-center space-x-6">
              {m.status === 'approved' && (
                <ValidityInput membershipId={m.id} expiryDate={m.expiryDate} />
              )}
              <div className="flex space-x-2">
                <button onClick={() => updateStatus(m.id, 'approved')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                  <CheckCircle size={20} />
                </button>
                <button onClick={() => updateStatus(m.id, 'rejected')} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <XCircle size={20} />
                </button>
                <button onClick={async () => {
                  if (window.confirm('Delete this application?')) {
                    try {
                      await deleteDoc(doc(db, 'memberships', m.id));
                      toast.success('Application deleted');
                    } catch (err) {
                      handleFirestoreError(err, OperationType.DELETE, `memberships/${m.id}`);
                    }
                  }
                }} className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
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

  useEffect(() => {
    const q = query(collection(db, 'dailyWorkouts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const workoutList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWorkouts(workoutList);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'dailyWorkouts'));

    return () => unsubscribe();
  }, []);

  const handleApprove = async (workout: any) => {
    try {
      const workoutRef = doc(db, 'dailyWorkouts', workout.id);
      await updateDoc(workoutRef, {
        status: 'approved'
      });

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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Today's Workout Submissions</h2>
      </div>

      <div className="bg-[#101828] rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
                <tr className="border-b border-white/5 bg-white/5">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">User</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Action</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {workouts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-gray-500 font-medium">No workout submissions found.</td>
                </tr>
              ) : (
                workouts.map((workout) => (
                  <tr key={workout.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-black mr-4">
                          {workout.userName?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-black text-white uppercase text-sm">{workout.userName}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{workout.userId.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-gray-300">{workout.date}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                        workout.action === 'done' ? "bg-brand/10 text-brand" : "bg-gray-500/10 text-gray-400"
                      )}>
                        {workout.action || 'done'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        workout.status === 'approved' ? "bg-brand/20 text-brand" : 
                        workout.status === 'denied' ? "bg-red-500/20 text-red-500" : "bg-yellow-500/20 text-yellow-500"
                      )}>
                        {workout.status === 'approved' ? <CheckCircle size={12} className="mr-1" /> : 
                         workout.status === 'denied' ? <XCircle size={12} className="mr-1" /> :
                         <Loader2 size={12} className="mr-1 animate-spin" />}
                        {workout.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {workout.status === 'pending' && (
                        <div className="flex items-center justify-end space-x-2">
                          {denyingWorkoutId === workout.id ? (
                            <div className="flex items-center space-x-2 bg-white/5 p-2 rounded-xl border border-white/10">
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
                                className="bg-transparent border-none text-[10px] text-white font-bold outline-none w-32 placeholder:text-gray-600"
                                autoFocus
                              />
                              <button
                                onClick={() => handleDeny(workout.id)}
                                disabled={submittingDeny}
                                className="text-brand hover:text-white transition-colors p-1"
                                title="Send"
                              >
                                {submittingDeny ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                              </button>
                              <button
                                onClick={() => {
                                  setDenyingWorkoutId(null);
                                  setDenialMessage('');
                                }}
                                className="text-red-500 hover:text-white transition-colors p-1"
                                title="Cancel"
                              >
                                <XCircle size={14} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                onClick={() => handleApprove(workout)}
                                className="bg-brand text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-brand/10"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setDenyingWorkoutId(workout.id)}
                                className="bg-red-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/10"
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
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useFirebase();

  useEffect(() => {
    if (!isAdmin) return;

    const unsubMems = onSnapshot(
      query(collection(db, 'memberships'), where('status', '==', 'approved'), orderBy('createdAt', 'desc')),
      (s) => {
        setMemberships(s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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

    return () => { unsubMems(); unsubUsers(); unsubPlans(); };
  }, [isAdmin]);

  const joinedMembers = React.useMemo(() => {
    const usersMap = users.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});
    const plansMap = plans.reduce((acc, p) => {
      if (!acc[p.userId] || p.createdAt > acc[p.userId].createdAt) {
        acc[p.userId] = p;
      }
      return acc;
    }, {});

    return memberships.map(mem => ({
      ...mem,
      customerId: usersMap[mem.userId]?.customerId || 'N/A',
      activePlan: plansMap[mem.userId]?.planData?.overview?.split('.')[0] || 'No Plan Added'
    }));
  }, [memberships, users, plans]);

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
                  <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase whitespace-nowrap">Name</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase whitespace-nowrap">Phone</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase whitespace-nowrap">Member Type</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase whitespace-nowrap">Workout Plan</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase whitespace-nowrap">Customer ID</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase whitespace-nowrap text-right">Remaining Validity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {joinedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No active members found.</td>
                  </tr>
                ) : joinedMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">{member.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{member.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        {member.program}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {member.activePlan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
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
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useFirebase();

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'aiPlans'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'aiPlans');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">AI Workout Plans</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-green-600" /></div>
        ) : plans.map((plan) => (
          <div key={plan.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles size={18} className="text-green-600" />
                <span className="font-bold">{plan.userName}</span>
              </div>
              <span className="text-xs text-gray-400">{plan.createdAt?.toDate().toLocaleDateString()}</span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mb-4">{plan.planData.overview}</p>
            <button 
              onClick={async () => {
                if (window.confirm('Delete this plan?')) {
                  try {
                    await deleteDoc(doc(db, 'aiPlans', plan.id));
                    toast.success('Plan deleted');
                  } catch (err) {
                    handleFirestoreError(err, OperationType.DELETE, `aiPlans/${plan.id}`);
                  }
                }
              }}
              className="text-red-500 text-xs font-bold flex items-center hover:text-red-700 transition-colors"
            >
              <Trash2 size={14} className="mr-1" /> Delete Plan
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const MembershipPlanManager = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { isAdmin } = useFirebase();
  const [newPlan, setNewPlan] = useState({
    name: '',
    category: 'membership',
    duration: '',
    actualPrice: '',
    offerPrice: '',
    features: '',
    order: 0
  });

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

  const startEdit = (plan: any) => {
    setEditingId(plan.id);
    setEditForm({ ...plan });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateDoc(doc(db, 'membershipPlans', editingId), {
        actualPrice: parseFloat(editForm.actualPrice),
        offerPrice: parseFloat(editForm.offerPrice),
        name: editForm.name,
        duration: editForm.duration || ''
      });
      toast.success('Plan updated');
      setEditingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `membershipPlans/${editingId}`);
    }
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const planData = {
        ...newPlan,
        actualPrice: parseFloat(newPlan.actualPrice),
        offerPrice: parseFloat(newPlan.offerPrice),
        features: newPlan.features.split(',').map(f => f.trim()).filter(f => f !== ''),
        order: parseInt(newPlan.order.toString())
      };
      await addDoc(collection(db, 'membershipPlans'), planData);
      toast.success('New plan added successfully');
      setShowAddForm(false);
      setNewPlan({
        name: '',
        category: 'membership',
        duration: '',
        actualPrice: '',
        offerPrice: '',
        features: '',
        order: plans.length + 1
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'membershipPlans');
    }
  };

  const seedPlans = async () => {
    if (!window.confirm('This will seed initial plans. Continue?')) return;
    const initialPlans = [
      { name: '1 Month Membership', category: 'membership', duration: '1 Month', actualPrice: 2000, offerPrice: 1500, order: 1, features: ['Gym Access', 'Locker Room'] },
      { name: '3 Months Membership', category: 'membership', duration: '3 Months', actualPrice: 5000, offerPrice: 4000, order: 2, features: ['Gym Access', 'Locker Room'] },
      { name: '6 Months Membership', category: 'membership', duration: '6 Months', actualPrice: 9000, offerPrice: 7500, order: 3, features: ['Gym Access', 'Locker Room'] },
      { name: '1 Year Membership', category: 'membership', duration: '1 Year', actualPrice: 15000, offerPrice: 12000, order: 4, features: ['Gym Access', 'Locker Room'] },
      { name: 'Silver Plan', category: 'silver', actualPrice: 3000, offerPrice: 2500, order: 5, features: ['12 DAYS CARDIO', '12 DAYS PERSONAL SESSION', 'BEGINNER DIET PLAN', '10% DISCOUNT ON ADDONS', 'PROTIEN BAR AND CAFE', '₹100/- VOUCHER OF HAIRBAY STUDIO'] },
      { name: 'Gold Plan', category: 'gold', actualPrice: 5000, offerPrice: 4500, order: 6, features: ['15 DAYS TRANSFORMATION', '15 DAYS ALTERNATIVE CARDIO & conditioning', 'TRANSFORMATION DIET PLAN', '15% DISCOUNT ON ADDONS', 'PROTIEN BAR AND CAFE', '₹200/- VOUCHER OF HAIRBAY STUDIO'] },
      { name: 'Platinum Plan', category: 'platinum', actualPrice: 8000, offerPrice: 7000, order: 7, features: ['15 DAYS INJURY', '15 DAYS ALTERNATIVE TRANSFORMATION CARDIO & conditioning', 'TRANSFORMATION & RECOVERY DIET PLAN', '20% DISCOUNT ADDONS', 'PROTIEN BAR AND CAFE', '₹300/- VOUCHER OF HAIRBAY STUDIO'] },
      { name: 'Kick Boxing', category: 'kickboxing', actualPrice: 4000, offerPrice: 3500, order: 8, features: ['Striking Technique', 'Bag Work', 'Partner Drills', 'High-Intensity Cardio'] },
      { name: 'Hybrid Plan', category: 'hybrid', actualPrice: 12000, offerPrice: 10000, order: 9, features: ['Pre bridal and groom package for three month', 'Collab with hairbay studio salon & spa', 'Complete fitness and wellness program'] },
    ];

    try {
      for (const plan of initialPlans) {
        await addDoc(collection(db, 'membershipPlans'), plan);
      }
      toast.success('Initial plans seeded!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'membershipPlans');
    }
  };

  const deletePlan = async (id: string) => {
    console.log('Attempting to delete plan:', id);
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      await deleteDoc(doc(db, 'membershipPlans', id));
      toast.success('Plan deleted successfully');
    } catch (err) {
      console.error('Delete plan failed:', err);
      handleFirestoreError(err, OperationType.DELETE, `membershipPlans/${id}`);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Membership Plans</h1>
        <div className="flex space-x-4">
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all"
          >
            <Plus size={18} />
            <span>{showAddForm ? 'Cancel' : 'Add New Plan'}</span>
          </button>
          <button 
            onClick={seedPlans}
            className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all"
          >
            Seed Initial Plans
          </button>
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
              <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
              <select 
                value={newPlan.category} 
                onChange={e => setNewPlan({...newPlan, category: e.target.value})}
                className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="membership">Membership</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
                <option value="kickboxing">Kick Boxing</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Duration</label>
              <input 
                type="text" 
                value={newPlan.duration} 
                onChange={e => setNewPlan({...newPlan, duration: e.target.value})}
                className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g. 3 Months"
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
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Actual Price (₹)</label>
              <input 
                required
                type="number" 
                value={newPlan.actualPrice} 
                onChange={e => setNewPlan({...newPlan, actualPrice: e.target.value})}
                className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                placeholder="5000"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Offer Price (₹)</label>
              <input 
                required
                type="number" 
                value={newPlan.offerPrice} 
                onChange={e => setNewPlan({...newPlan, offerPrice: e.target.value})}
                className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                placeholder="4500"
              />
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
                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all"
              >
                Create Plan
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
                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">Plan Name</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">Actual Price</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">Offer Price</th>
                <th className="px-6 py-4 text-sm font-bold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
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
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {editingId === plan.id ? (
                      <input 
                        type="text" 
                        value={editForm.duration} 
                        onChange={e => setEditForm({...editForm, duration: e.target.value})}
                        className="px-2 py-1 border rounded w-24"
                      />
                    ) : (
                      plan.duration || 'N/A'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    {editingId === plan.id ? (
                      <input 
                        type="number" 
                        value={editForm.actualPrice} 
                        onChange={e => setEditForm({...editForm, actualPrice: e.target.value})}
                        className="px-2 py-1 border rounded w-24"
                      />
                    ) : (
                      `₹${plan.actualPrice}`
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-green-600">
                    {editingId === plan.id ? (
                      <input 
                        type="number" 
                        value={editForm.offerPrice} 
                        onChange={e => setEditForm({...editForm, offerPrice: e.target.value})}
                        className="px-2 py-1 border rounded w-24"
                      />
                    ) : (
                      `₹${plan.offerPrice}`
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
                          <button onClick={() => startEdit(plan)} className="text-blue-600 hover:text-blue-700">
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => deletePlan(plan.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
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
  const menuItems = [
    { name: 'Overview', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Members', path: '/admin/members', icon: <ShieldCheck size={20} /> },
    { name: 'Users', path: '/admin/users', icon: <Users size={20} /> },
    { name: 'Applications', path: '/admin/memberships', icon: <FileText size={20} /> },
    { name: 'Today\'s Workouts', path: '/admin/workouts', icon: <Activity size={20} /> },
    { name: 'Plans', path: '/admin/plans', icon: <Dumbbell size={20} /> },
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
              "flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all",
              location.pathname === item.path ? "bg-green-50 text-green-700" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            {item.icon}
            <span>{item.name}</span>
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
  const [stats, setStats] = useState({ users: 0, plans: 0, memberships: 0, members: 0, workouts: 0 });
  const { isAdmin } = useFirebase();

  useEffect(() => {
    if (!isAdmin) return;
    const unsubUsers = onSnapshot(collection(db, 'users'), s => setStats(prev => ({ ...prev, users: s.size })));
    const unsubPlans = onSnapshot(collection(db, 'aiPlans'), s => setStats(prev => ({ ...prev, plans: s.size })));
    const unsubMems = onSnapshot(collection(db, 'memberships'), s => {
      const all = s.docs.map(d => d.data());
      const approved = all.filter(m => m.status === 'approved').length;
      setStats(prev => ({ ...prev, memberships: s.size, members: approved }));
    });
    const unsubWorkouts = onSnapshot(collection(db, 'dailyWorkouts'), s => {
      const pending = s.docs.filter(d => d.data().status === 'pending').length;
      setStats(prev => ({ ...prev, workouts: pending }));
    });
    return () => { unsubUsers(); unsubPlans(); unsubMems(); unsubWorkouts(); };
  }, [isAdmin]);

  const statCards = [
    { name: 'Total Users', value: stats.users, icon: <Users className="text-blue-600" />, color: 'bg-blue-50' },
    { name: 'Active Members', value: stats.members, icon: <ShieldCheck className="text-purple-600" />, color: 'bg-purple-50' },
    { name: 'AI Plans', value: stats.plans, icon: <Sparkles className="text-green-600" />, color: 'bg-green-50' },
    { name: 'Today\'s Workouts', value: stats.workouts, icon: <Activity className="text-red-600" />, color: 'bg-red-50' },
    { name: 'Applications', value: stats.memberships, icon: <FileText className="text-orange-600" />, color: 'bg-orange-50' },
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
      <main className="flex-grow">
        <Routes>
          <Route index element={<Overview />} />
          <Route path="members" element={<MemberManager />} />
          <Route path="users" element={<UserManager />} />
          <Route path="plans" element={<MembershipPlanManager />} />
          <Route path="ai-plans" element={<AIPlanManager />} />
          <Route path="memberships" element={<MembershipManager />} />
          <Route path="workouts" element={<DailyWorkoutManager />} />
          <Route path="settings" element={<div className="p-8"><h1 className="text-3xl font-bold">Settings</h1><p className="text-gray-500 mt-4">Admin settings coming soon...</p></div>} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;
