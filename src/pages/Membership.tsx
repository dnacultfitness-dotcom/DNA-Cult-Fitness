import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { CheckCircle2, ShieldCheck, Zap, Users, Award, Star, Crown, Shield, Zap as ZapIcon, Info, Loader2, Activity, Sparkles } from 'lucide-react';
import { useFirebase } from '../components/FirebaseProvider';
import { db, collection, addDoc, serverTimestamp, handleFirestoreError, OperationType, query, orderBy, onSnapshot } from '../firebase';
import PhoneInput from '../components/PhoneInput';
import { notifyAdmins, NotificationType } from '../utils/notifications';

const membershipSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  program: z.string().min(1, 'Please select a program'),
  message: z.string().optional()
});

type MembershipFormValues = z.infer<typeof membershipSchema>;

const Membership = () => {
  const { user } = useFirebase();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedDurations, setSelectedDurations] = useState<Record<string, string>>({});
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<MembershipFormValues>({
    resolver: zodResolver(membershipSchema)
  });

  useEffect(() => {
    const q = query(collection(db, 'membershipPlans'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlans(plansData);
      
      // Set default selected durations
      const defaults: Record<string, string> = {};
      plansData.forEach((plan: any) => {
        if (plan.priceOptions && plan.priceOptions.length > 0) {
          defaults[plan.id] = plan.priceOptions[0].duration;
        }
      });
      setSelectedDurations(defaults);
      
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'membershipPlans');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const onSubmit = async (data: MembershipFormValues) => {
    if (!user) {
      toast.error('Please log in to apply for membership.');
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'memberships'), {
        ...data,
        userId: user.uid,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      // Notify Admins
      await notifyAdmins(
        'New Membership Application',
        `${data.name} has applied for the ${data.program} program.`,
        NotificationType.INFO,
        '/admin/memberships'
      );
      
      toast.success('Application submitted successfully! We will contact you soon.');
      reset();
      setSelectedPlan(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'memberships');
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPlan = (planName: string, duration: string) => {
    const fullPlanName = `${planName} (${duration})`;
    setSelectedPlan(fullPlanName);
    setValue('program', fullPlanName);
    const formElement = document.getElementById('application-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('silver')) return <Shield className="text-gray-400" size={32} />;
    if (name.includes('gold')) return <Star className="text-yellow-500" size={32} />;
    if (name.includes('platinum')) return <Crown className="text-purple-600" size={32} />;
    if (name.includes('kick')) return <ZapIcon className="text-red-600" size={32} />;
    if (name.includes('hybrid')) return <Activity className="text-blue-600" size={32} />;
    if (name.includes('diamond')) return <Award className="text-blue-400" size={32} />;
    if (name.includes('elite')) return <Crown className="text-brand-green" size={32} />;
    if (name.includes('basic')) return <ShieldCheck className="text-gray-500" size={32} />;
    if (name.includes('legacy')) return <Sparkles className="text-brand-green" size={32} />;
    return <Users className="text-brand-green" size={32} />;
  };

  return (
    <div className="pt-20 bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="relative py-32 bg-black overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2070&auto=format&fit=crop" 
            alt="Background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/50 to-black z-10"></div>
        
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-brand-green/20 border border-brand-green/30 rounded-full text-brand-green text-xs font-black uppercase tracking-widest mb-6 backdrop-blur-md">
              Membership Programs
            </span>
            <h1 className="text-5xl md:text-8xl font-black text-white mb-8 uppercase leading-none">
              Choose Your <br />
              <span className="text-brand-green">Legacy</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium">
              From foundational access to elite biological transformation, find the protocol that matches your ambition.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 relative z-20 -mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-brand-green mb-4" size={48} />
              <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Initializing Protocols...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-20 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10">
              <Info className="mx-auto text-brand-green mb-4 opacity-50" size={48} />
              <h3 className="text-2xl font-black text-white uppercase mb-2">Protocols Coming Soon</h3>
              <p className="text-gray-400 font-medium">Our biological transformation protocols are currently being updated.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.map((plan, idx) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  viewport={{ once: true }}
                  className={`card-premium p-0 flex flex-col relative overflow-hidden ${selectedPlan === plan.name ? 'ring-4 ring-brand-green/20 border-brand-green' : ''}`}
                >
                  {plan.imageUrl && (
                    <div className="w-full h-48 relative">
                      <img src={plan.imageUrl} alt={plan.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent opacity-60"></div>
                    </div>
                  )}
                  
                  <div className="p-10 flex flex-col flex-grow">
                    {(() => {
                      const selectedDur = selectedDurations[plan.id];
                      const selectedOpt = plan.priceOptions?.find((o: any) => o.duration === selectedDur) || plan.priceOptions?.[0];
                      if (selectedOpt && selectedOpt.offerPrice < selectedOpt.actualPrice) {
                        return (
                          <div className="absolute top-6 right-6 bg-brand-green text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest z-10">
                            Save ₹{selectedOpt.actualPrice - selectedOpt.offerPrice}
                          </div>
                        );
                      }
                      return null;
                    })()}
                    
                    <div className="mb-8">{getPlanIcon(plan.name)}</div>
                    <h3 className="text-3xl font-black text-gray-900 mb-2 uppercase leading-none">{plan.name}</h3>
                    
                    {/* Duration Selector */}
                    <div className="flex flex-wrap gap-2 mb-8">
                      {plan.priceOptions?.map((opt: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => setSelectedDurations({ ...selectedDurations, [plan.id]: opt.duration })}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                            selectedDurations[plan.id] === opt.duration
                              ? 'bg-brand-green border-brand-green text-black'
                              : 'bg-white border-gray-200 text-gray-500 hover:border-brand-green'
                          }`}
                        >
                          {opt.duration}
                        </button>
                      ))}
                    </div>
                    
                    {/* Show selected price */}
                    {(() => {
                      const selectedDur = selectedDurations[plan.id];
                      const selectedOpt = plan.priceOptions?.find((o: any) => o.duration === selectedDur) || plan.priceOptions?.[0];
                      if (!selectedOpt) return <div className="h-20" />;
                      return (
                        <div className="flex items-baseline mb-10 h-20">
                          <div>
                            <span className="text-5xl font-black text-gray-900 tracking-tighter">₹{selectedOpt.offerPrice}</span>
                            {selectedOpt.actualPrice > selectedOpt.offerPrice && (
                              <span className="ml-3 text-xl text-gray-400 line-through font-bold">₹{selectedOpt.actualPrice}</span>
                            )}
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">For {selectedOpt.duration}</p>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="w-full h-px bg-gray-100 mb-10" />

                    <ul className="space-y-5 mb-12 flex-grow">
                      {plan.features?.map((feature: string, fIdx: number) => (
                        <li key={fIdx} className="flex items-start text-sm font-medium text-gray-600">
                          <CheckCircle2 size={18} className="mr-4 text-brand-green flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleSelectPlan(plan.name, selectedDurations[plan.id] || plan.priceOptions?.[0]?.duration)}
                      className={`btn-primary w-full ${
                        selectedPlan === `${plan.name} (${selectedDurations[plan.id] || plan.priceOptions?.[0]?.duration})`
                          ? 'bg-brand-green text-black' 
                          : 'bg-gray-900 hover:bg-black text-white'
                      }`}
                    >
                      {selectedPlan === `${plan.name} (${selectedDurations[plan.id] || plan.priceOptions?.[0]?.duration})` ? 'Protocol Selected' : 'Select Protocol'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Application Form Section */}
      <section id="application-form" className="py-32 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
            <div className="lg:col-span-2">
              <span className="text-brand-green font-black uppercase tracking-widest text-sm mb-6 block">Join the Cult</span>
              <h2 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight mb-8 uppercase">
                Start Your <br /> Evolution
              </h2>
              <p className="text-gray-500 font-medium text-lg leading-relaxed mb-8">
                Our selection process ensures we maintain a community of dedicated high-performers.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-brand-green">
                    <ShieldCheck size={20} />
                  </div>
                  <p className="text-sm font-bold text-gray-700">Secure Enrollment</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-brand-green">
                    <Zap size={20} />
                  </div>
                  <p className="text-sm font-bold text-gray-700">Fast-Track Onboarding</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100">
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Full Name</label>
                    <input
                      {...register('name')}
                      className="w-full px-6 py-4 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-brand-green outline-none transition-all font-bold text-gray-900"
                      placeholder="John Doe"
                    />
                    {errors.name && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2 ml-2">{errors.name.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Email Address</label>
                      <input
                        {...register('email')}
                        className="w-full px-6 py-4 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-brand-green outline-none transition-all font-bold text-gray-900"
                        placeholder="john@example.com"
                      />
                      {errors.email && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2 ml-2">{errors.email.message}</p>}
                    </div>
                    <div>
                      <PhoneInput
                        label="Phone Number"
                        {...register('phone')}
                        placeholder="00000 00000"
                        error={errors.phone?.message}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Selected Program</label>
                    <select
                      {...register('program')}
                      className="w-full px-6 py-4 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-brand-green outline-none transition-all font-bold text-gray-900 appearance-none"
                    >
                      <option value="">Select a program...</option>
                      {plans.map(plan => (
                        <React.Fragment key={plan.id}>
                          {plan.priceOptions?.map((opt: any, i: number) => (
                            <option key={`${plan.id}-${i}`} value={`${plan.name} (${opt.duration})`}>
                              {plan.name} - {opt.duration} (₹{opt.offerPrice})
                            </option>
                          ))}
                          {!plan.priceOptions && <option value={plan.name}>{plan.name}</option>}
                        </React.Fragment>
                      ))}
                    </select>
                    {errors.program && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2 ml-2">{errors.program.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Message (Optional)</label>
                    <textarea
                      {...register('message')}
                      rows={4}
                      className="w-full px-6 py-4 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-brand-green outline-none transition-all resize-none font-bold text-gray-900"
                      placeholder="Tell us about your fitness goals..."
                    ></textarea>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full py-5 text-lg bg-brand-green text-black hover:bg-black hover:text-white transition-all rounded-full font-black uppercase tracking-tight"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="animate-spin mr-3" size={20} />
                      <span>Processing...</span>
                    </div>
                  ) : 'Submit Application'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Membership;
