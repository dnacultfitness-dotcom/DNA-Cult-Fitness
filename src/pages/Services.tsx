import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { db, collection, query, orderBy, onSnapshot } from '../firebase';

const Services = () => {
  const [services, setServices] = useState<any[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Services (Training Programs)
    const qServices = query(collection(db, 'gymServices'), orderBy('order', 'asc'));
    const unsubServices = onSnapshot(qServices, (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch Membership Plans
    const qPlans = query(collection(db, 'membershipPlans'), orderBy('order', 'asc'));
    const unsubPlans = onSnapshot(qPlans, (snapshot) => {
      setMembershipPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubServices();
      unsubPlans();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-brand-dark">
        <Loader2 className="animate-spin text-brand-green" size={48} />
      </div>
    );
  }

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="py-16 sm:py-24 bg-brand-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight mb-4 sm:mb-6 uppercase">
              Our <span className="text-brand-green">Protocols</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto font-medium leading-relaxed">
              Precision-engineered fitness programs designed to transform your physical and mental state.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Membership Plans Section */}
          {membershipPlans.length > 0 && (
            <>
              <div className="text-center mb-10 sm:mb-16">
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900 mb-2 sm:mb-4 uppercase tracking-tight">Membership Protocols</h2>
                <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto font-medium">Comprehensive packages designed for total transformation and long-term success.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12 mb-16 sm:mb-24">
                {membershipPlans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -10 }}
                    className="flex flex-col bg-gray-50 rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-100 group shadow-sm hover:shadow-xl transition-all duration-500"
                  >
                    <div className="h-48 sm:h-64 overflow-hidden relative">
                      {plan.imageUrl ? (
                        <img 
                          src={plan.imageUrl} 
                          alt={plan.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-brand-dark flex items-center justify-center">
                          <Sparkles className="text-brand-green opacity-20" size={48} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      <h3 className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 text-xl sm:text-2xl font-black text-white uppercase tracking-tight">{plan.name}</h3>
                    </div>
                    
                    <div className="p-6 sm:p-8 flex-grow flex flex-col items-center text-center md:items-start md:text-left">
                      <div className="mb-4 sm:mb-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-green mb-1">Pricing Starts At</p>
                        <div className="flex items-baseline space-x-2 justify-center md:justify-start">
                          <span className="text-2xl sm:text-3xl font-black text-gray-900">₹{plan.priceOptions?.[0]?.offerPrice || '---'}</span>
                          {plan.priceOptions?.[0]?.actualPrice > plan.priceOptions?.[0]?.offerPrice && (
                            <span className="text-xs sm:text-sm text-gray-400 line-through font-bold">₹{plan.priceOptions[0].actualPrice}</span>
                          )}
                        </div>
                      </div>
                      
                      <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-10 flex-grow text-center md:text-left">
                        {(plan.features || []).map((feature: string, i: number) => (
                          <li key={i} className="flex flex-col md:flex-row items-center md:items-start text-gray-600 text-xs sm:text-sm font-medium">
                            <CheckCircle2 className="text-brand-green mb-1 md:mb-0 md:mr-3 shrink-0" size={14} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Link 
                        to="/membership" 
                        className="w-full bg-brand-green text-black py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-center hover:bg-black hover:text-brand-green transition-all flex items-center justify-center group shadow-lg shadow-brand-green/10 text-xs sm:text-sm"
                      >
                        Join Protocol <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {/* Training Programs Section */}
          {services.length > 0 && (
            <>
              <div className="text-center mb-10 sm:mb-16 pt-8 sm:pt-12 border-t border-gray-100">
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900 mb-2 sm:mb-4 uppercase tracking-tight">Specialized Training</h2>
                <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto font-medium">Advanced training modules focused on specific fitness disciplines and skill acquisition.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
                {services.map((service, index) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -10 }}
                    className="flex flex-col bg-gray-50 rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-100 group shadow-sm hover:shadow-xl transition-all duration-500"
                  >
                    <div className="h-48 sm:h-64 overflow-hidden relative">
                      {service.imageUrl ? (
                        <img 
                          src={service.imageUrl} 
                          alt={service.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      <h3 className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 text-xl sm:text-2xl font-black text-white uppercase tracking-tight">{service.title}</h3>
                    </div>
                    
                    <div className="p-6 sm:p-8 flex-grow flex flex-col items-center text-center md:items-start md:text-left">
                      <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed font-medium">
                        {service.description}
                      </p>
                      
                      <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-10 flex-grow">
                        {(service.features || []).map((feature: string, i: number) => (
                          <li key={i} className="flex flex-col md:flex-row items-center md:items-start text-gray-700 text-xs sm:text-sm font-medium">
                            <CheckCircle2 className="text-black mb-1 md:mb-0 md:mr-3 shrink-0" size={14} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Link 
                        to="/membership" 
                        className="w-full bg-black text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-center hover:bg-brand-green hover:text-black transition-all flex items-center justify-center group text-xs sm:text-sm"
                      >
                        Enroll Now <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Custom Training CTA */}
      <section className="py-16 sm:py-24 bg-brand-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight mb-4 sm:mb-6 uppercase">Need a Custom <span className="text-brand-green">Protocol?</span></h2>
            <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8 sm:mb-10 font-medium leading-relaxed">
              Our elite biological optimizers can design a fully personalized training and nutrition program tailored specifically to your unique goals and DNA.
            </p>
            <Link to="/contact" className="bg-brand-green text-black px-8 sm:px-10 py-4 sm:py-5 rounded-full font-black uppercase tracking-widest text-sm sm:text-lg hover:bg-white transition-all inline-block shadow-2xl shadow-brand-green/20">
              Speak with a Trainer
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Services;
