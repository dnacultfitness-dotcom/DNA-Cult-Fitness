import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { Loader2, Download, Sparkles, User, Ruler, Weight, Activity, AlertCircle, HeartPulse, Calendar, Utensils, Dumbbell, Info, Clock, Trash2, CheckCircle2, Plus, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useFirebase } from '../components/FirebaseProvider';
import { db, collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, doc, setDoc, handleFirestoreError, OperationType, deleteDoc, updateDoc, writeBatch, getDocs } from '../firebase';

interface WorkoutDay {
  day: string;
  exercises: string[];
  notes: string;
}

interface DietDay {
  day: string;
  breakfast: string;
  lunch: string;
  snack: string;
  dinner: string;
}

interface PlanData {
  overview: string;
  workoutPlan: WorkoutDay[];
  dietPlan: DietDay[];
  tips: string[];
}

const ProgressTracker = () => {
  const { user } = useFirebase();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddReport, setShowAddReport] = useState(false);
  const [newReport, setNewReport] = useState({
    weight: '',
    notes: ''
  });

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'weeklyReports'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setReports(data);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'weeklyReports');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addDoc(collection(db, 'weeklyReports'), {
        userId: user.uid,
        weight: parseFloat(newReport.weight) || 0,
        notes: newReport.notes,
        createdAt: serverTimestamp()
      });
      toast.success('Progress report added!');
      setShowAddReport(false);
      setNewReport({ weight: '', notes: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'weeklyReports');
      toast.error('Failed to add report');
    }
  };

  return (
    <div className="space-y-8">
      <div className="card-premium p-6 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-10 gap-4">
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center uppercase tracking-tight">
            <Activity className="mr-3 text-brand" /> Weekly Progress Tracker
          </h3>
          <button
            onClick={() => setShowAddReport(!showAddReport)}
            className="bg-brand text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-brand/90 transition-all shadow-lg shadow-brand/20 w-fit"
          >
            {showAddReport ? 'Cancel' : 'Add Report'}
          </button>
        </div>

        {showAddReport && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleAddReport}
            className="mb-10 p-8 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-6"
          >
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Current Weight (kg)</label>
              <input
                required
                type="number"
                step="0.1"
                value={newReport.weight}
                onChange={(e) => setNewReport({ ...newReport, weight: e.target.value })}
                className="w-full px-6 py-4 bg-white border-none shadow-sm rounded-2xl outline-none focus:ring-2 focus:ring-brand font-bold text-gray-900"
                placeholder="70.5"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Notes / Feelings</label>
              <textarea
                value={newReport.notes}
                onChange={(e) => setNewReport({ ...newReport, notes: e.target.value })}
                className="w-full px-6 py-4 bg-white border-none shadow-sm rounded-2xl outline-none focus:ring-2 focus:ring-brand font-bold text-gray-900 resize-none"
                placeholder="How was your week?"
                rows={3}
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full py-5 text-xs"
            >
              Save Progress Report
            </button>
          </motion.form>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="animate-spin text-brand mx-auto" size={48} />
            </div>
          ) : reports.length > 0 ? (
            reports.map((report) => (
              <div key={report.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between hover:bg-white hover:shadow-xl hover:border-transparent transition-all group">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <p className="text-xl font-black text-gray-900">{report.weight} kg</p>
                    <span className="text-[10px] font-black text-brand uppercase tracking-widest bg-brand/10 px-2 py-0.5 rounded">Weekly</span>
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{report.createdAt?.toDate().toLocaleDateString()}</p>
                  {report.notes && <p className="text-sm font-medium text-gray-500 mt-3 bg-white p-3 rounded-xl border border-gray-100">"{report.notes}"</p>}
                </div>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-brand shadow-sm group-hover:bg-brand group-hover:text-white transition-all">
                  <Activity size={24} />
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                <Activity size={40} />
              </div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No reports yet. Start tracking your progress!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AIAssistant = () => {
  const { user, personalDetails } = useFirebase();
  const [activeTab, setActiveTab] = useState<'generator' | 'tracker' | 'history'>('generator');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlanData | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [membershipInfo, setMembershipInfo] = useState<{ status: string, approvedAiPlan?: string }>({ status: 'none' });
  const resultRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    height: '',
    weight: '',
    gender: 'male',
    injury: '',
    lifestyleDisease: '',
    goal: ''
  });

  useEffect(() => {
    if (personalDetails) {
      setFormData({
        name: personalDetails.name || '',
        height: personalDetails.height?.toString() || '',
        weight: personalDetails.weight?.toString() || '',
        gender: personalDetails.gender || 'male',
        injury: personalDetails.injury || '',
        lifestyleDisease: personalDetails.lifestyleDisease || '',
        goal: personalDetails.goal || ''
      });
    }
  }, [personalDetails]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'aiPlans'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setHistory(data);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const membershipQuery = query(
      collection(db, 'memberships'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(membershipQuery, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const status = data.status || 'pending';
        const expiryDate = data.expiryDate?.toDate();
        const isExpired = expiryDate ? expiryDate < new Date() : false;
        
        setMembershipInfo({ 
          status: isExpired ? 'expired' : status, 
          approvedAiPlan: data.approvedAiPlan 
        });
      } else {
        setMembershipInfo({ status: 'none' });
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'memberships'));

    return () => unsubscribe();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const scrollToResult = () => {
    if (resultRef.current) {
      const offset = 100;
      const elementPosition = resultRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const generatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to generate a plan.");
      return;
    }
    setLoading(true);
    setResult(null);
    
    setTimeout(scrollToResult, 100);

    try {
      // Save personal details first
      const h = parseFloat(formData.height) || 0;
      const w = parseFloat(formData.weight) || 0;
      
      const detailsRef = doc(db, 'users', user.uid, 'details', 'personal');
      await setDoc(detailsRef, {
        ...formData,
        height: h,
        weight: w,
        updatedAt: serverTimestamp()
      });

      // Sync to root user doc for visibility
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: formData.name,
        height: h,
        weight: w,
        goal: formData.goal,
        gender: formData.gender,
        lastActive: serverTimestamp()
      });

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const model = "gemini-3-flash-preview";
      
      const isApproved = membershipInfo.status === 'approved';
      const aiPlanTier = isApproved ? membershipInfo.approvedAiPlan : 'demo';

      let planDuration = "1-week demo";
      let planInstructions = "Provide a structured 1-week demo workout plan (7 days). This is a trial version.";

      if (isApproved) {
        switch (aiPlanTier) {
          case 'new_user_1_week':
            planDuration = "1-week starter";
            planInstructions = "Provide a structured 1-week beginner plan for a new user. Focus on fundamentals.";
            break;
          case 'normal_1_week':
            planDuration = "1-week";
            planInstructions = "Provide a structured 1-week plan for a regular member. Balanced workout and basic diet.";
            break;
          case 'silver_1_month':
            planDuration = "1-month beginner";
            planInstructions = "Provide a structured 1-month beginner workout and diet plan. Split into a 7-day routine that should be followed for 4 weeks.";
            break;
          case 'gold_1_month':
            planDuration = "1-month transformation";
            planInstructions = "Provide a high-intensity 1-month transformation workout and diet plan. Focus on significant body recomposition.";
            break;
          case 'platinum_1_month':
            planDuration = "1-month advanced transformation";
            planInstructions = "Provide a professional-grade 1-month advanced transformation, recovery, and diet plan. Include specific recovery protocols like Ice Bath Recovery (Cold Immersion) twice a week, Steam Bath sessions for detoxification, and advanced nutritional timing.";
            break;
          default:
            planDuration = "1-week demo";
            planInstructions = "Provide a basic 1-week demo plan as no specific tier was assigned.";
        }
      }

      const prompt = `
        Generate a comprehensive ${planDuration} personalized diet and workout plan for the following individual:
        Name: ${formData.name}
        Height: ${formData.height} cm
        Weight: ${formData.weight} kg
        Gender: ${formData.gender}
        Injuries: ${formData.injury || 'None'}
        Lifestyle Diseases: ${formData.lifestyleDisease || 'None'}
        Goal: ${formData.goal || 'General fitness'}

        TIER SETTINGS: ${planInstructions}
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overview: { type: Type.STRING, description: `General overview and goals for the ${planDuration} plan` },
              workoutPlan: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.STRING, description: "Day of the week (e.g., Day 1, Monday)" },
                    exercises: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of exercises for the day" },
                    notes: { type: Type.STRING, description: "Specific instructions or focus for the workout" }
                  },
                  required: ["day", "exercises", "notes"]
                }
              },
              dietPlan: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.STRING, description: "Day of the week" },
                    breakfast: { type: Type.STRING },
                    lunch: { type: Type.STRING },
                    snack: { type: Type.STRING },
                    dinner: { type: Type.STRING }
                  },
                  required: ["day", "breakfast", "lunch", "snack", "dinner"]
                }
              },
              tips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "General health and safety tips" }
            },
            required: ["overview", "workoutPlan", "dietPlan", "tips"]
          }
        }
      });

      const data = JSON.parse(response.text);
      setResult(data);
      
      // Save plan to history
      const docRef = await addDoc(collection(db, 'aiPlans'), {
        userId: user.uid,
        userName: formData.name,
        planData: data,
        isActive: false,
        createdAt: serverTimestamp()
      });
      setCurrentPlanId(docRef.id);

      toast.success("Your personalized plan has been generated and saved!");
      setTimeout(scrollToResult, 100);
    } catch (error) {
      console.error("AI Generation Error:", error);
      toast.error("Failed to generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      await deleteDoc(doc(db, 'aiPlans', id));
      toast.success('Plan deleted');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'aiPlans');
    }
  };

  const setActivePlan = async (planId: string) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      
      // Deactivate all other plans
      const q = query(collection(db, 'aiPlans'), where('userId', '==', user.uid), where('isActive', '==', true));
      const snapshot = await getDocs(q);
      snapshot.forEach((d) => {
        batch.update(doc(db, 'aiPlans', d.id), { isActive: false });
      });

      // Activate the selected plan
      batch.update(doc(db, 'aiPlans', planId), { isActive: true });
      
      await batch.commit();
      toast.success('Plan set as active on your profile overview!');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `aiPlans/${planId}`);
    }
  };

  const downloadPDF = (plan: PlanData = result!) => {
    if (!plan) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(22);
    doc.setTextColor(78, 158, 99);
    doc.text("DNA CULT FITNESS", pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    const pdfTitle = membershipInfo.status === 'approved' 
      ? "Personalized 1-Month Fitness & Diet Plan" 
      : "Personalized 1-Week Demo Fitness & Diet Plan";
    doc.text(pdfTitle, pageWidth / 2, 30, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Name: ${formData.name} | Height: ${formData.height}cm | Weight: ${formData.weight}kg | Gender: ${formData.gender}`, 20, 40);
    if (formData.injury) doc.text(`Injuries: ${formData.injury}`, 20, 45);
    if (formData.lifestyleDisease) doc.text(`Lifestyle Diseases: ${formData.lifestyleDisease}`, 20, 50);

    doc.setFontSize(12);
    doc.setTextColor(78, 158, 99);
    doc.text("Overview & Goals", 20, 60);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const overviewLines = doc.splitTextToSize(plan.overview, pageWidth - 40);
    doc.text(overviewLines, 20, 65);

    let currentY = 65 + (overviewLines.length * 5) + 10;
    doc.setFontSize(12);
    doc.setTextColor(78, 158, 99);
    doc.text("Weekly Workout Schedule", 20, currentY);
    
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Day', 'Exercises', 'Notes']],
      body: plan.workoutPlan.map(w => [w.day, w.exercises.join('\n'), w.notes]),
      theme: 'grid',
      headStyles: { fillColor: [78, 158, 99] },
      styles: { fontSize: 8 }
    });

    doc.addPage();
    doc.setFontSize(12);
    doc.setTextColor(78, 158, 99);
    doc.text("Daily Diet Plan", 20, 20);

    autoTable(doc, {
      startY: 25,
      head: [['Day', 'Breakfast', 'Lunch', 'Snack', 'Dinner']],
      body: plan.dietPlan.map(d => [d.day, d.breakfast, d.lunch, d.snack, d.dinner]),
      theme: 'grid',
      headStyles: { fillColor: [78, 158, 99] },
      styles: { fontSize: 8 }
    });

    doc.save(`${formData.name.replace(/\s+/g, '_')}_Fitness_Plan.pdf`);
  };

  const getDayColor = (index: number) => {
    const colors = [
      'bg-blue-50 border-blue-200',
      'bg-green-50 border-green-200',
      'bg-yellow-50 border-yellow-200',
      'bg-purple-50 border-purple-200',
      'bg-pink-50 border-pink-200',
      'bg-orange-50 border-orange-200',
      'bg-indigo-50 border-indigo-200',
    ];
    return colors[index % colors.length];
  };

  const getDayIconColor = (index: number) => {
    const colors = [
      'text-blue-600',
      'text-green-600',
      'text-yellow-600',
      'text-purple-600',
      'text-pink-600',
      'text-orange-600',
      'text-indigo-600',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="pt-[calc(8rem+env(safe-area-inset-top))] pb-[calc(6rem+env(safe-area-inset-bottom))] min-h-screen min-h-dvh bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-3 bg-brand/10 text-brand px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-4 sm:mb-6 border border-brand/20"
          >
            <Sparkles size={14} sm:size={16} />
            <span>AI-Powered Personal Training</span>
          </motion.div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-4 sm:mb-6 uppercase tracking-tight leading-tight sm:leading-none">
            AI DIET & <span className="text-brand">WORKOUT</span>
          </h1>
          <p className="text-sm sm:text-lg font-bold text-gray-400 max-w-2xl mx-auto uppercase tracking-wide px-4">
            {membershipInfo.status === 'approved' 
              ? "Get your personalized 1-month professional plan."
              : membershipInfo.status === 'expired'
              ? "Your membership has expired. Renew to access 1-month plans."
              : "Generate a 1-week demo plan to experience our AI training."}
          </p>
          {!loading && membershipInfo.status !== 'approved' && (
            <div className="mt-6">
              <Link 
                to="/membership" 
                className="text-brand font-black uppercase tracking-widest text-[10px] hover:underline flex items-center justify-center"
              >
                Upgrade to Membership for 1-Month Plans <ChevronRight size={14} className="ml-1" />
              </Link>
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-10 sm:mb-16 px-4">
          <div className="bg-white p-1.5 sm:p-2 rounded-[1.5rem] sm:rounded-[2rem] shadow-xl shadow-gray-200/50 flex space-x-1 sm:space-x-2 border border-gray-100 overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => setActiveTab('generator')}
              className={cn(
                "px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] transition-all flex items-center space-x-2 sm:space-x-3 whitespace-nowrap",
                activeTab === 'generator' ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:bg-gray-50"
              )}
            >
              <Sparkles size={16} sm:size={18} />
              <span className="hidden xs:inline sm:inline">Generator</span>
              <span className="xs:hidden">Gen</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                "px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] transition-all flex items-center space-x-2 sm:space-x-3 whitespace-nowrap",
                activeTab === 'history' ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:bg-gray-50"
              )}
            >
              <Clock size={16} sm:size={18} />
              <span className="hidden xs:inline sm:inline">History</span>
              <span className="xs:hidden">Hist</span>
            </button>
            <button
              onClick={() => setActiveTab('tracker')}
              className={cn(
                "px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] transition-all flex items-center space-x-2 sm:space-x-3 whitespace-nowrap",
                activeTab === 'tracker' ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:bg-gray-50"
              )}
            >
              <Activity size={16} sm:size={18} />
              <span className="hidden xs:inline sm:inline">Tracker</span>
              <span className="xs:hidden">Track</span>
            </button>
          </div>
        </div>

        {activeTab === 'tracker' ? (
          <div className="max-w-3xl mx-auto">
            <ProgressTracker />
          </div>
        ) : activeTab === 'history' ? (
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center sm:justify-start">
              <Clock size={24} className="mr-3 text-green-600" /> Your Generated Plans
            </h2>
            {history.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {history.map((plan) => (
                  <div key={plan.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Sparkles size={18} className="text-green-600" />
                        <span className="font-bold text-gray-900">{plan.userName}</span>
                      </div>
                      <span className="text-xs text-gray-400 hidden sm:block">{plan.createdAt?.toDate().toLocaleDateString()}</span>
                    </div>
                    <span className="text-xs text-gray-400 sm:hidden block mb-4">{plan.createdAt?.toDate().toLocaleDateString()}</span>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-6">{plan.planData.overview}</p>
                    <div className="flex flex-col space-y-3">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => {
                            setResult(plan.planData);
                            setActiveTab('generator');
                            setTimeout(scrollToResult, 100);
                          }}
                          className="flex-1 py-2 bg-green-50 text-green-700 rounded-lg font-bold text-xs hover:bg-green-100 transition-colors"
                        >
                          View Plan
                        </button>
                        <button
                          onClick={() => downloadPDF(plan.planData)}
                          className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => deletePlan(plan.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <button
                        onClick={() => setActivePlan(plan.id)}
                        className={cn(
                          "w-full py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center space-x-2",
                          plan.isActive 
                            ? "bg-green-600 text-white" 
                            : "bg-gray-900 text-white hover:bg-black"
                        )}
                      >
                        {plan.isActive ? (
                          <>
                            <CheckCircle2 size={14} />
                            <span>Active on Profile</span>
                          </>
                        ) : (
                          <>
                            <Plus size={14} />
                            <span>Add to Profile Overview</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                <Clock size={48} className="text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500">No plans generated yet.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 h-fit lg:sticky lg:top-[calc(6rem+env(safe-area-inset-top))] mx-4 sm:mx-0 text-center sm:text-left"
          >
            <form onSubmit={generatePlan} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="flex items-center justify-center sm:justify-start text-sm font-medium text-gray-700 mb-1">
                    <User size={16} className="mr-2 text-green-600" /> Full Name
                  </label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-center sm:text-left"
                    placeholder="John Doe"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center justify-center sm:justify-start text-sm font-medium text-gray-700 mb-1">
                      <Ruler size={16} className="mr-2 text-green-600" /> Height (cm)
                    </label>
                    <input
                      required
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-center sm:text-left"
                      placeholder="175"
                    />
                  </div>
                  <div>
                    <label className="flex items-center justify-center sm:justify-start text-sm font-medium text-gray-700 mb-1">
                      <Weight size={16} className="mr-2 text-green-600" /> Weight (kg)
                    </label>
                    <input
                      required
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-center sm:text-left"
                      placeholder="70"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center justify-center sm:justify-start text-sm font-medium text-gray-700 mb-1">
                    <Activity size={16} className="mr-2 text-green-600" /> Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-center sm:text-left"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center justify-center sm:justify-start text-sm font-medium text-gray-700 mb-1">
                    <Sparkles size={16} className="mr-2 text-green-600" /> Fitness Goal
                  </label>
                  <input
                    required
                    type="text"
                    name="goal"
                    value={formData.goal}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-center sm:text-left"
                    placeholder="e.g. Weight loss, Muscle gain"
                  />
                </div>

                <div>
                  <label className="flex items-center justify-center sm:justify-start text-sm font-medium text-gray-700 mb-1">
                    <AlertCircle size={16} className="mr-2 text-green-600" /> Any Injuries?
                  </label>
                  <textarea
                    name="injury"
                    value={formData.injury}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-center sm:text-left"
                    placeholder="e.g. Lower back pain"
                  />
                </div>

                <div>
                  <label className="flex items-center justify-center sm:justify-start text-sm font-medium text-gray-700 mb-1">
                    <HeartPulse size={16} className="mr-2 text-green-600" /> Lifestyle Diseases?
                  </label>
                  <textarea
                    name="lifestyleDisease"
                    value={formData.lifestyleDisease}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-center sm:text-left"
                    placeholder="e.g. Diabetes"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    <span>Generate Plan</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Result Section */}
          <motion.div
            ref={resultRef}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-8"
          >
            {!result && !loading && (
              <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100 text-center mx-4 sm:mx-0">
                <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles size={40} className="text-green-600 opacity-40" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Transform?</h2>
                <p className="text-gray-500 max-w-md mx-auto">Fill out your details to receive a custom 1-month fitness and diet plan generated by our AI.</p>
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100 text-center mx-4 sm:mx-0">
                <Loader2 className="animate-spin text-green-600 mx-auto mb-6" size={48} />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Crafting Your Plan...</h2>
                <p className="text-gray-500">Our AI is analyzing your profile to create the perfect workout and diet schedule.</p>
              </div>
            )}

            {result && (
              <div className="space-y-8 mx-4 sm:mx-0">
                {/* Header & Overview */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-6">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center sm:justify-start">
                        <Calendar className="mr-3 text-green-600" /> 
                        {membershipInfo.status === 'approved' ? "Your Professional AI Plan" : "Your 1-Week Demo Plan"}
                      </h2>
                      <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
                        {currentPlanId && (
                          <button
                            onClick={() => setActivePlan(currentPlanId)}
                            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-black transition-colors shadow-sm"
                          >
                            <Plus size={18} />
                            <span>Add to Profile</span>
                          </button>
                        )}
                        <button
                          onClick={() => downloadPDF(result)}
                          className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm"
                        >
                          <Download size={18} />
                          <span>Download PDF</span>
                        </button>
                      </div>
                    </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-center sm:justify-start">
                      <Sparkles size={14} className="mr-2" /> Overview & Goals
                    </h3>
                    <p className="text-gray-700 leading-relaxed">{result.overview}</p>
                  </div>
                </div>

                {/* Day by Day Sorting */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 px-2 flex items-center justify-center sm:justify-start">
                    <Dumbbell className="mr-3 text-green-600" /> Weekly Schedule
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {result.workoutPlan.map((workout, index) => (
                      <motion.div
                        key={workout.day}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "rounded-2xl p-6 border-2 transition-all hover:shadow-lg text-center sm:text-left",
                          getDayColor(index)
                        )}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                          <h4 className={cn("text-lg font-bold", getDayIconColor(index))}>{workout.day}</h4>
                          <div className={cn("p-2 rounded-lg bg-white/50 w-fit mx-auto sm:mx-0", getDayIconColor(index))}>
                            <Dumbbell size={20} />
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Workout</h5>
                            <ul className="space-y-1">
                              {workout.exercises.map((ex, i) => (
                                <li key={i} className="text-sm text-gray-700 flex items-start justify-center sm:justify-start">
                                  <span className="mr-2 mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0 hidden sm:block" />
                                  {ex}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="pt-4 border-t border-gray-200/50">
                            <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-center sm:justify-start">
                              <Utensils size={12} className="mr-1" /> Nutrition
                            </h5>
                            <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
                              <div className="bg-white/40 p-2 rounded-lg">
                                <span className="font-bold block text-gray-600">B:</span> {result.dietPlan[index]?.breakfast}
                              </div>
                              <div className="bg-white/40 p-2 rounded-lg">
                                <span className="font-bold block text-gray-600">L:</span> {result.dietPlan[index]?.lunch}
                              </div>
                              <div className="bg-white/40 p-2 rounded-lg">
                                <span className="font-bold block text-gray-600">S:</span> {result.dietPlan[index]?.snack}
                              </div>
                              <div className="bg-white/40 p-2 rounded-lg">
                                <span className="font-bold block text-gray-600">D:</span> {result.dietPlan[index]?.dinner}
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-gray-200/50">
                            <p className="text-xs text-gray-600">
                              <span className="font-bold">Note:</span> {workout.notes}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Tips Section */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center sm:text-left">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center justify-center sm:justify-start">
                    <Info className="mr-2 text-green-600" /> Pro Tips & Precautions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.tips.map((tip, i) => (
                      <div key={i} className="flex items-start p-3 bg-green-50 rounded-lg border border-green-100 justify-center sm:justify-start">
                        <Sparkles size={14} className="text-green-600 mr-2 mt-1 flex-shrink-0 hidden sm:block" />
                        <p className="text-sm text-gray-700">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  </div>
);
};

export default AIAssistant;
