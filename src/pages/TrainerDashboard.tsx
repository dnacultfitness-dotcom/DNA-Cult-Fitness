import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Dumbbell, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Search,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Edit2,
  Send,
  MessageSquare,
  Activity,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { db, collection, query, where, onSnapshot, doc, addDoc, getDocs, getDoc, serverTimestamp, handleFirestoreError, OperationType, orderBy } from '../firebase';
import { useFirebase } from '../components/FirebaseProvider';
import { toast } from 'sonner';
import { NotificationBell } from '../components/NotificationBell';
import { createNotification, NotificationType, notifyAdmins } from '../utils/notifications';

const ClientsList = ({ onSelectClient }: { onSelectClient: (client: any) => void }) => {
  const { trainerData, user } = useFirebase();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!trainerData || !user) return;

    // Use a multi-source fetch to be robust
    // 1. Memberships where trainerId matches trainerData.id
    // 2. Users where assignedTrainerUid matches user.uid
    
    const membershipsQuery = query(
      collection(db, 'memberships'), 
      where('trainerId', '==', trainerData.id)
    );

    const usersQuery = query(
      collection(db, 'users'),
      where('assignedTrainerUid', '==', user.uid)
    );

    // Track memberships and users
    let membershipsMap = new Map();
    let usersList: any[] = [];

    const syncClients = async () => {
      const clientsMap = new Map();

      // Process direct user assignments (reliable source of customerId)
      for (const u of usersList) {
        clientsMap.set(u.id, {
          ...u,
          membership: Array.from(membershipsMap.values()).find((m: any) => m.userId === u.id || m.email === u.email) || null,
          hasPlan: false
        });
      }

      // Process membership assignments (source for clients that might not have user doc linked yet)
      for (const mem of Array.from(membershipsMap.values())) {
        const userId = mem.userId;
        
        // Find existing client in map either by ID or email
        let existingClientId = null;
        for (const [id, c] of clientsMap.entries()) {
          if (id === userId || (c.email && c.email === mem.email)) {
            existingClientId = id;
            break;
          }
        }

        if (existingClientId) {
          // Update existing user with their membership info if not already set or more complete
          const current = clientsMap.get(existingClientId);
          clientsMap.set(existingClientId, {
            ...current,
            membership: mem
          });
        } else {
          // Fetch user if not already in list or if userId is missing but we have email
          try {
            const userSnap = await getDocs(query(collection(db, 'users'), where('email', '==', mem.email)));
            if (!userSnap.empty) {
              const uDoc = userSnap.docs[0];
              clientsMap.set(uDoc.id, {
                id: uDoc.id,
                ...uDoc.data(),
                membership: mem,
                hasPlan: false
              });
            } else if (userId) {
               // If we have userId but email query failed (rare)
               const uDoc = await getDocs(query(collection(db, 'users'), where('id', '==', userId)));
               if (!uDoc.empty) {
                 const d = uDoc.docs[0];
                 clientsMap.set(d.id, { id: d.id, ...d.data(), membership: mem, hasPlan: false });
               }
            } else {
              // Fallback for orphaned memberships
              clientsMap.set(`mem-${mem.id}`, {
                id: `mem-${mem.id}`,
                displayName: mem.name || 'Unknown Client',
                email: mem.email,
                membership: mem,
                hasPlan: false
              });
            }
          } catch (err) {
            console.error('Error fetching user for membership:', err);
          }
        }
      }

      // Quick check for plans for these users to show indicator and status
      const finalClients = Array.from(clientsMap.values());
      for (const client of finalClients) {
          try {
            // Ensure we have a valid ID to query by
            if (client.id && !client.id.startsWith('mem-')) {
              // Get all plans for this user
              const allPlansSnap = await getDocs(query(collection(db, 'aiPlans'), where('userId', '==', client.id)));
              const activePlan = await getDocs(query(collection(db, 'aiPlans'), where('userId', '==', client.id), where('isActive', '==', true)));
              
              const hasModRequest = await getDocs(query(collection(db, 'planApprovalRequests'), where('userId', '==', client.id), where('status', '==', 'pending')));
              
              if (!activePlan.empty) {
                client.hasPlan = true;
                client.aiPlanStatus = 'Active';
              } else if (!allPlansSnap.empty) {
                client.hasPlan = true;
                client.aiPlanStatus = 'Generated';
              } else {
                client.aiPlanStatus = 'Awaiting';
              }

              if (!hasModRequest.empty) {
                client.aiPlanStatus = 'Awaiting Update';
              }

              // Also fetch personal details if missing from root user doc
              if (!client.height || !client.weight) {
                const detailsSnap = await getDoc(doc(db, 'users', client.id, 'details', 'personal'));
                if (detailsSnap.exists()) {
                  const d = detailsSnap.data();
                  client.height = d.height;
                  client.weight = d.weight;
                  client.goal = d.goal;
                  client.gender = d.gender;
                }
              }
            }
          } catch (e) {
            console.error("Error syncing client info:", e);
          }
      }

      setClients(finalClients);
      setLoading(false);
    };

    const unsubMemberships = onSnapshot(membershipsQuery, (snapshot) => {
      membershipsMap = new Map(snapshot.docs.map(doc => [doc.id, { id: doc.id, ...doc.data() }]));
      syncClients();
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'memberships');
      setLoading(false);
    });

    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      syncClients();
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users');
      setLoading(false);
    });

    return () => {
      unsubMemberships();
      unsubUsers();
    };
  }, [trainerData, user]);

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(c => 
      (c.displayName || '').toLowerCase().includes(q) || 
      (c.email || '').toLowerCase().includes(q) ||
      (c.customerId || '').toLowerCase().includes(q)
    );
  }, [clients, searchQuery]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-green" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Clients</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl outline-none focus:border-brand-green text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onSelectClient(client)}
            className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-brand-green transition-all cursor-pointer"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-50 border border-gray-100">
                {client.photoURL ? (
                  <img src={client.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-green font-bold text-xl uppercase">
                    {client.displayName?.[0] || client.email?.[0]}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-brand-green transition-colors">{client.displayName || 'Unnamed Client'}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">ID: {client.customerId || 'PENDING'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center space-x-2 text-gray-500">
                  <Activity size={14} />
                  <span className="font-medium">Program</span>
                </div>
                <span className="font-bold text-gray-900 uppercase tracking-tighter">{client.membership?.program}</span>
              </div>
              <div className="flex items-center justify-between text-xs p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center space-x-2 text-gray-500">
                  <Dumbbell size={14} />
                  <span className="font-medium">Workouts Done</span>
                </div>
                <span className="font-bold text-green-600">{client.membership?.currentWorkoutIndex || 0}</span>
              </div>
              {client.aiPlanStatus && (
                <div className={cn(
                  "flex items-center justify-between text-xs p-3 rounded-2xl border transition-all",
                  client.aiPlanStatus === 'Active' ? "bg-green-50 border-green-100 text-green-700" :
                  client.aiPlanStatus === 'Awaiting Update' ? "bg-amber-50 border-amber-100 text-amber-700" :
                  "bg-gray-50 border-gray-100 text-gray-500"
                )}>
                  <div className="flex items-center space-x-2">
                    <Sparkles size={14} />
                    <span className="font-medium font-bold uppercase tracking-widest text-[9px]">AI Plan Status</span>
                  </div>
                  <span className="font-black uppercase tracking-tighter">{client.aiPlanStatus}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-end text-[10px] font-black uppercase text-brand-green group-hover:translate-x-1 transition-transform">
              View & Edit Plans <ChevronRight size={12} className="ml-1" />
            </div>
          </motion.div>
        ))}

        {filteredClients.length === 0 && (
          <div className="col-span-full p-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
            <Users size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-medium italic">No assigned clients found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ClientDetail = ({ client, onBack }: { client: any, onBack: () => void }) => {
  const { trainerData, user } = useFirebase();
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [dailyWorkouts, setDailyWorkouts] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAppointments, setShowAppointments] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    // Fetch AI Plan
    const q = query(collection(db, 'aiPlans'), where('userId', '==', client.id));
    const unsubPlan = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        // Find newest plan, preferring active ones
        data.sort((a, b) => {
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
        });
        const plan = data[0];
        setSelectedPlan(plan);
        if (plan.planData) {
          setEditData(JSON.parse(JSON.stringify(plan.planData)));
        }
      } else {
        setSelectedPlan(null);
        setEditData(null);
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'aiPlans');
      setLoading(false);
    });

    // Fetch Daily Workouts
    const qWorkouts = query(collection(db, 'dailyWorkouts'), where('userId', '==', client.id));
    const unsubWorkouts = onSnapshot(qWorkouts, (snap) => {
      let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setDailyWorkouts(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'dailyWorkouts');
    });

    // Fetch Appointments
    const qAppts = query(collection(db, 'appointments'), where('trainerId', '==', user.uid));
    const unsubAppts = onSnapshot(qAppts, (snap) => {
      let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      data.sort((a, b) => (b.date?.toMillis() || 0) - (a.date?.toMillis() || 0));
      setAppointments(data);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'appointments');
    });

    return () => { unsubPlan(); unsubWorkouts(); unsubAppts(); };
  }, [client, user.uid]);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = e.target as HTMLFormElement;
    const date = target.date.value;
    const time = target.time.value;
    const notes = target.notes.value;

    if (!date || !time) return;

    setBookingLoading(true);
    const loadingToast = toast.loading('Booking appointment...');

    try {
      await addDoc(collection(db, 'appointments'), {
        userId: client.id,
        userName: client.displayName || client.email,
        trainerId: user.uid,
        trainerName: trainerData.name,
        date: new Date(`${date}T${time}`),
        notes,
        status: 'confirmed',
        createdAt: serverTimestamp()
      });

      await createNotification(
        client.id,
        'Appointment Booked',
        `Your trainer ${trainerData.name} has scheduled a session for ${date} at ${time}.`,
        NotificationType.SUCCESS,
        '/profile'
      );

      toast.success('Appointment booked successfully!', { id: loadingToast });
      setShowAppointments(false);
      target.reset();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'appointments');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!editData || !selectedPlan || submitting) return;
    setSubmitting(true);
    const loadingToast = toast.loading('Submitting plan for approval...');
    
    try {
      await addDoc(collection(db, 'planApprovalRequests'), {
        userId: client.id,
        userName: client.displayName || client.email,
        planId: selectedPlan.id,
        trainerId: user.uid,
        trainerName: trainerData.name,
        requestedPlanData: editData,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Notify Admins
      await notifyAdmins(
        'New Plan Approval Request',
        `Trainer ${trainerData.name} has submitted a plan modification for ${client.displayName || 'a client'}.`,
        NotificationType.INFO,
        '/admin/approvals'
      );

      toast.success('Plan submitted for admin approval', { id: loadingToast });
      setIsEditing(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'planApprovalRequests');
      toast.error('Failed to submit request', { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const updateWorkoutDay = (idx: number, field: string, val: any) => {
    const newData = { ...editData };
    newData.workoutPlan = [...newData.workoutPlan];
    newData.workoutPlan[idx] = { ...newData.workoutPlan[idx], [field]: val };
    setEditData(newData);
  };

  const updateDietDay = (idx: number, field: string, val: any) => {
    const newData = { ...editData };
    newData.dietPlan = [...newData.dietPlan];
    newData.dietPlan[idx] = { ...newData.dietPlan[idx], [field]: val };
    setEditData(newData);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button onClick={onBack} className="flex items-center text-gray-500 hover:text-black transition-colors font-bold text-sm">
        <ArrowLeft size={16} className="mr-2" /> Back to Clients
      </button>

      <div className="bg-black text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-6">
             <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/10 p-1">
                {client.photoURL ? (
                  <img src={client.photoURL} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-green font-bold text-3xl uppercase bg-white/5 rounded-full">
                    {client.displayName?.[0] || client.email?.[0]}
                  </div>
                )}
             </div>
             <div>
                <h2 className="text-3xl font-black">{client.displayName || 'Client'}</h2>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-brand-green font-bold text-sm uppercase tracking-widest leading-none">ID: {client.customerId || 'NOT ASSIGNED'}</p>
                  <span className="w-1 h-1 bg-gray-600 rounded-full" />
                  <p className="text-gray-400 font-medium text-sm leading-none">{client.email}</p>
                </div>
             </div>
          </div>
          <div className="flex items-center space-x-4">
             <div className="text-right">
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Assigned Trainer</p>
               <p className="text-lg font-bold text-brand-green">{trainerData.name}</p>
             </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Client Stats/Profile Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
             <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Height</p>
                <p className="text-lg font-bold text-gray-900">{client.height || '--'} cm</p>
             </div>
             <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Weight</p>
                <p className="text-lg font-bold text-gray-900">{client.weight || '--'} kg</p>
             </div>
             <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Experience</p>
                <p className="text-lg font-bold text-gray-900 truncate uppercase tracking-tighter">{client.experienceLevel || '--'}</p>
             </div>
             <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Goal</p>
                <p className="text-lg font-bold text-gray-900 truncate uppercase tracking-tighter">{client.goal || '--'}</p>
             </div>
          </div>

          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-gray-900 flex items-center">
                  <Sparkles size={20} className="mr-2 text-brand-green" />
                  Client AI Plan
                </h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Status: Active Program</p>
              </div>
              <div className="flex items-center gap-4">
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-black text-white rounded-full font-bold text-sm flex items-center hover:bg-brand-green transition-all shadow-lg active:scale-95"
                  >
                    <Edit2 size={16} className="mr-2" />
                    Modify Plan
                  </button>
                ) : (
                  <div className="flex items-center space-x-3">
                    <button onClick={() => setIsEditing(false)} className="px-6 py-2 text-gray-400 font-bold text-sm">Cancel</button>
                    <button 
                      onClick={handleSubmitForApproval}
                      disabled={submitting}
                      className="px-6 py-2 bg-brand-green text-white rounded-full font-bold text-sm flex items-center shadow-lg hover:shadow-brand-green/20 disabled:opacity-50"
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
                      Submit for Approval
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setShowAppointments(!showAppointments)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-full font-bold text-sm flex items-center hover:bg-blue-700 transition-all shadow-lg"
                >
                  <Clock size={16} className="mr-2" />
                  Appointments
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showAppointments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8 overflow-hidden bg-blue-50/30 rounded-3xl border border-blue-100 p-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-4">Book New Session</h4>
                      <form onSubmit={handleBookAppointment} className="space-y-4 text-left">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5">Date</label>
                            <input type="date" name="date" required className="w-full px-4 py-2 bg-white border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5">Time</label>
                            <input type="time" name="time" required className="w-full px-4 py-2 bg-white border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1.5">Notes</label>
                          <input type="text" name="notes" placeholder="Focus areas..." className="w-full px-4 py-2 bg-white border border-blue-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-xs" />
                        </div>
                        <button type="submit" disabled={bookingLoading} className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                          {bookingLoading ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
                          Confirm Session
                        </button>
                      </form>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-4">Upcoming sessions</h4>
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {appointments.filter(a => a.userId === client.id).length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No sessions booked yet.</p>
                        ) : (
                          appointments.filter(a => a.userId === client.id).map(appt => (
                            <div key={appt.id} className="bg-white p-3 rounded-2xl border border-blue-50 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="text-center min-w-[40px]">
                                  <p className="text-xs font-black text-gray-900 leading-none">{appt.date?.toDate().toLocaleDateString('en-US', { day: '2-digit' })}</p>
                                  <p className="text-[8px] font-bold text-blue-500 uppercase">{appt.date?.toDate().toLocaleDateString('en-US', { month: 'short' })}</p>
                                </div>
                                <div className="h-4 w-px bg-gray-100" />
                                <div>
                                  <p className="text-xs font-bold text-gray-700">{appt.date?.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                                  {appt.notes && <p className="text-[9px] text-gray-400 truncate max-w-[100px]">{appt.notes}</p>}
                                </div>
                              </div>
                              <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[8px] font-black uppercase rounded-full border border-green-100">Confirmed</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {loading ? (
              <div className="flex items-center justify-center p-12"><Loader2 size={24} className="animate-spin text-brand-green" /></div>
            ) : selectedPlan ? (
              <div className="space-y-10">
                {isEditing ? (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <section className="bg-blue-50/30 p-6 rounded-3xl border border-blue-50">
                      <div className="flex items-center text-blue-600 mb-4">
                        <Info size={16} className="mr-2" />
                        <p className="text-xs font-bold uppercase tracking-widest">Important Instruction</p>
                      </div>
                      <p className="text-xs text-blue-700/70 font-medium leading-relaxed">
                        You are editing this client's plan. Your changes will not take effect immediately. Once you submit, the admin will review and approve the changes.
                      </p>
                    </section>

                    {/* Editor for Workout */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 pb-2">Workout Protocol</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {editData.workoutPlan?.map((day: any, i: number) => (
                          <div key={i} className="p-4 bg-gray-50 border border-gray-100 rounded-3xl">
                            <p className="text-[10px] font-black uppercase text-gray-400 mb-3">{day.day || `Day ${i + 1}`}</p>
                            <div className="space-y-4">
                              <div>
                                <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Exercises (Comma Sep)</label>
                                <input
                                  type="text"
                                  value={day.exercises?.join(', ') || ''}
                                  onChange={(e) => updateWorkoutDay(i, 'exercises', e.target.value.split(',').map(s => s.trim()))}
                                  className="w-full p-3 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:border-brand-green shadow-sm"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Daily Note</label>
                                <input
                                  type="text"
                                  value={day.notes || ''}
                                  onChange={(e) => updateWorkoutDay(i, 'notes', e.target.value)}
                                  className="w-full p-3 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:border-brand-green shadow-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Editor for Diet */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 pb-2">Nutritional Strategy</h4>
                      <div className="space-y-4">
                        {editData.dietPlan?.map((day: any, i: number) => (
                          <div key={i} className="p-6 bg-gray-50 border border-gray-100 rounded-[30px]">
                             <p className="text-[10px] font-black uppercase text-gray-400 mb-4">{day.day || `Day ${i + 1}`}</p>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-bold">
                                {['breakfast', 'lunch', 'snack', 'dinner'].map((meal) => (
                                  <div key={meal}>
                                    <label className="text-[9px] font-black uppercase text-gray-400 ml-1 capitalize">{meal}</label>
                                    <input
                                      type="text"
                                      value={day[meal] || ''}
                                      onChange={(e) => updateDietDay(i, meal, e.target.value)}
                                      className="w-full p-3 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:border-brand-green shadow-sm"
                                    />
                                  </div>
                                ))}
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                     {/* View Mode */}
                     <section className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-widest text-orange-600 flex items-center">
                          <span className="w-6 h-px bg-orange-200 mr-2" />
                          Workouts
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {selectedPlan.planData.workoutPlan?.map((day: any, i: number) => (
                            <div key={i} className="p-5 bg-white border border-gray-100 rounded-3xl hover:border-brand-green transition-colors">
                              <span className="text-[9px] font-black uppercase tracking-widest text-brand-green px-2 py-0.5 bg-brand-green/5 rounded-md mb-3 inline-block">
                                {day.day || `Day ${i + 1}`}
                              </span>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {day.exercises?.map((ex: string, j: number) => (
                                  <span key={j} className="text-[10px] font-medium px-2 py-1 bg-gray-50 text-gray-600 rounded-lg border border-gray-100 italic">{ex}</span>
                                ))}
                              </div>
                              {day.notes && <p className="text-[11px] text-gray-400 font-medium italic border-t border-gray-50 pt-2">Note: {day.notes}</p>}
                            </div>
                          ))}
                        </div>
                     </section>

                     <section className="space-y-6">
                        <h4 className="text-xs font-black uppercase tracking-widest text-green-600 flex items-center">
                          <span className="w-6 h-px bg-green-200 mr-2" />
                          Nutrition
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {selectedPlan.planData.dietPlan?.map((day: any, i: number) => (
                            <div key={i} className="p-5 bg-white border border-gray-100 rounded-3xl hover:border-brand-green transition-colors">
                              <span className="text-[9px] font-black uppercase tracking-widest text-brand-green px-2 py-0.5 bg-brand-green/5 rounded-md mb-3 inline-block">
                                {day.day || `Day ${i + 1}`}
                              </span>
                              <div className="space-y-2">
                                {['breakfast', 'lunch', 'snack', 'dinner'].map((meal) => (
                                  <div key={meal} className="flex items-start space-x-2">
                                     <div className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 flex-shrink-0" />
                                     <div>
                                        <p className="text-[8px] font-black uppercase text-gray-400 leading-none mb-0.5">{meal}</p>
                                        <p className="text-[11px] font-bold text-gray-700 leading-tight">{day[meal] || 'Balanced Meal'}</p>
                                     </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                     </section>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-[30px]">
                No plan assigned yet.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 overflow-hidden">
             <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center">
               <Clock size={20} className="mr-2 text-gray-400" />
               Recent Activity
             </h3>
             <div className="space-y-6">
                {dailyWorkouts.map((w) => (
                  <div key={w.id} className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-gray-100 last:before:hidden">
                    <div className={cn(
                      "absolute left-[-4px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white",
                      w.status === 'approved' ? "bg-brand-green" : w.status === 'denied' ? "bg-red-500" : "bg-yellow-400"
                    )} />
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{new Date(w.date).toLocaleDateString()}</p>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-gray-50 border border-gray-100 uppercase">{w.status}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-800">Workout Day {w.workoutIndex + 1}</p>
                    <p className="text-xs text-gray-500 font-medium">Status: {w.action === 'done' ? 'Completed' : 'Skipped'}</p>
                  </div>
                ))}
                {dailyWorkouts.length === 0 && (
                  <p className="text-center text-sm text-gray-400 italic">No recent workouts.</p>
                )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const PlanApprovals = () => {
  const { trainerData, user } = useFirebase();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // Removing orderBy to avoid composite index requirements
    const q = query(collection(db, 'planApprovalRequests'), where('trainerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      // Sort in memory instead
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setRequests(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-brand-green" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        Plan Approval Requests
        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full font-bold">{requests.length}</span>
      </h2>

      <div className="grid grid-cols-1 gap-6">
        {requests.map((r) => (
          <div key={r.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-50 flex items-center justify-center font-bold text-xl text-gray-400">
                {r.userName?.[0]?.toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{r.userName}</h3>
                <p className="text-xs text-gray-400">Submitted: {r.createdAt?.toDate().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                  r.status === 'pending' ? "bg-yellow-50 text-yellow-600 border-yellow-100" :
                  r.status === 'approved' ? "bg-green-50 text-green-600 border-green-100" :
                  "bg-red-50 text-red-600 border-red-100"
                )}>
                  {r.status}
                </div>
              </div>
              {r.adminMessage && (
                <div className="max-w-xs text-right">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Admin Feedback</p>
                   <p className="text-xs text-gray-600 font-medium italic overflow-hidden text-ellipsis whitespace-nowrap">"{r.adminMessage}"</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center text-gray-400 italic">
            No approval requests submitted yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default function TrainerDashboard() {
  const { isTrainer, loading, user } = useFirebase();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  useEffect(() => {
    if (!loading && !isTrainer) {
      toast.error('Unauthorized access to trainer dashboard');
      navigate('/');
    }
  }, [isTrainer, loading]);

  if (loading || !isTrainer) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-brand-green" size={40} /></div>;
  }

  const navItems = [
    { name: 'My Clients', path: '/trainer', icon: Users },
    { name: 'Approvals', path: '/trainer/approvals', icon: Send },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pt-20">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-white border-r border-gray-100 p-6 space-y-8 flex-shrink-0">
        <div>
          <h1 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 px-4">Trainer Hub</h1>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSelectedClient(null)}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                  location.pathname === item.path && !selectedClient
                    ? "bg-brand-green text-white shadow-lg shadow-brand-green/20"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="pt-8 border-t border-gray-50 space-y-4">
           <Link 
             to="/" 
             className="flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all"
           >
             <ArrowLeft size={18} />
             <span>Back to Site</span>
           </Link>
           <div className="bg-brand-dark p-4 rounded-3xl text-white">
              <p className="text-[10px] font-black uppercase text-brand-green tracking-widest mb-1">Signed In As</p>
              <p className="text-xs font-bold truncate">{user?.email}</p>
           </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow p-4 md:p-10 max-w-7xl mx-auto w-full relative">
        <div className="absolute top-4 right-4 md:top-10 md:right-10 z-20">
          <NotificationBell />
        </div>
        <Routes>
          <Route path="/" element={
            selectedClient ? (
              <ClientDetail client={selectedClient} onBack={() => setSelectedClient(null)} />
            ) : (
              <ClientsList onSelectClient={setSelectedClient} />
            )
          } />
          <Route path="/approvals" element={<PlanApprovals />} />
        </Routes>
      </div>
    </div>
  );
}
