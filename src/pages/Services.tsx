import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const Services = () => {
  const services = [
    {
      title: "Flexibility & Mobility",
      description: "Improve your range of motion and reduce the risk of injury with our specialized mobility sessions.",
      image: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?q=80&w=1926&auto=format&fit=crop",
      features: ["Dynamic Stretching", "Joint Mobilization", "Yoga-Based Flow", "Injury Prevention"]
    },
    {
      title: "Resistance Training",
      description: "Build lean muscle and increase metabolic rate through progressive resistance and weight training.",
      image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop",
      features: ["Hypertrophy Focus", "Functional Strength", "Form Correction", "Progressive Overload"]
    },
    {
      title: "Strength Training",
      description: "Focus on the big compound lifts to maximize your absolute strength and power output.",
      image: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1974&auto=format&fit=crop",
      features: ["Powerlifting Basics", "Olympic Lifting", "Core Stability", "Max Effort Days"]
    },
    {
      title: "CrossFit Training",
      description: "Join our high-intensity community workouts that challenge every aspect of your fitness.",
      image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2069&auto=format&fit=crop",
      features: ["WOD (Workout of the Day)", "Metabolic Conditioning", "Gymnastics Skills", "Team Challenges"]
    },
    {
      title: "Kick-Boxing",
      description: "Learn effective striking techniques while getting an incredible full-body cardio workout.",
      image: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=1974&auto=format&fit=crop",
      features: ["Striking Technique", "Bag Work", "Partner Drills", "High-Intensity Cardio"]
    },
    {
      title: "Rooftop Protein Bar",
      description: "Enjoy premium post-workout nutrition at our exclusive rooftop bar with stunning city views.",
      image: "https://images.unsplash.com/photo-1579619173025-79d2a18d7970?q=80&w=2070&auto=format&fit=crop",
      features: ["Custom Protein Shakes", "Healthy Snacks", "Rooftop Lounge", "Social Community"]
    }
  ];

  const membershipPlans = [
    {
      title: "General Membership",
      description: "Access to our state-of-the-art gym facilities with flexible duration options.",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop",
      features: ["1 Month", "3 Months", "6 Months", "1 Year", "Full Gym Access", "Locker Room Access"]
    },
    {
      title: "Silver Plan",
      description: "A balanced plan for beginners looking for guidance and consistent cardio.",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop",
      features: ["12 Days Cardio", "12 Days Personal Session", "Beginner Diet Plan", "10% Discount on Add-ons", "Protein Bar and Cafe", "₹100 Voucher for Hairbay Studio"]
    },
    {
      title: "Gold Plan",
      description: "Our most popular transformation plan for serious results.",
      image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2070&auto=format&fit=crop",
      features: ["15 Days Transformation", "15 Days Alternative Cardio & Conditioning", "Transformation Diet Plan", "15% Discount on Add-ons", "Protein Bar and Cafe", "₹200 Voucher for Hairbay Studio"]
    },
    {
      title: "Platinum Plan",
      description: "The ultimate elite package for injury recovery and total body transformation.",
      image: "https://images.unsplash.com/photo-1594882645126-14020914d58d?q=80&w=2085&auto=format&fit=crop",
      features: ["15 Days Injury Recovery", "15 Days Alternative Transformation Cardio & Conditioning", "Transformation & Recovery Diet Plan", "20% Discount on Add-ons", "Protein Bar and Cafe", "₹300 Voucher for Hairbay Studio"]
    },
    {
      title: "Hybrid Plan",
      description: "Exclusive pre-bridal and groom package for a complete wellness overhaul.",
      image: "https://images.unsplash.com/photo-1576091160550-2173bdb999ef?q=80&w=2070&auto=format&fit=crop",
      features: ["Pre-bridal and Groom Package (3 Months)", "Collaboration with Hairbay Studio Salon & Spa", "Complete Fitness and Wellness Program"]
    }
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="py-24 bg-brand-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              Our <span className="text-brand-green">Programs</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Whether you're a beginner or an elite athlete, we have a program designed to push you to your limits.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Membership Plans Section */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 uppercase tracking-tight">Membership Plans</h2>
            <p className="text-gray-500 max-w-2xl mx-auto font-medium">Comprehensive packages designed for total transformation and long-term success.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-24">
            {membershipPlans.map((plan, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -10 }}
                className="flex flex-col bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 group"
              >
                <div className="h-64 overflow-hidden relative">
                  <img 
                    src={plan.image} 
                    alt={plan.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <h3 className="absolute bottom-6 left-6 text-2xl font-bold text-white">{plan.title}</h3>
                </div>
                
                <div className="p-8 flex-grow flex flex-col">
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    {plan.description}
                  </p>
                  
                  <ul className="space-y-3 mb-10 flex-grow">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center text-gray-700 text-sm font-medium">
                        <CheckCircle2 className="text-green-600 mr-3" size={16} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Link 
                    to="/membership" 
                    className="w-full bg-brand-green text-black py-4 rounded-full font-bold text-center hover:bg-white transition-all flex items-center justify-center group shadow-lg shadow-brand-green/10"
                  >
                    View Pricing <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 uppercase tracking-tight">Training Programs</h2>
            <p className="text-gray-500 max-w-2xl mx-auto font-medium">Specialized training modules focused on specific fitness disciplines.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {services.map((service, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -10 }}
                className="flex flex-col bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 group"
              >
                <div className="h-64 overflow-hidden relative">
                  <img 
                    src={service.image} 
                    alt={service.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <h3 className="absolute bottom-6 left-6 text-2xl font-bold text-white">{service.title}</h3>
                </div>
                
                <div className="p-8 flex-grow flex flex-col">
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    {service.description}
                  </p>
                  
                  <ul className="space-y-3 mb-10 flex-grow">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-center text-gray-700 text-sm font-medium">
                        <CheckCircle2 className="text-green-600 mr-3" size={16} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Link 
                    to="/membership" 
                    className="w-full bg-black text-white py-4 rounded-full font-bold text-center hover:bg-gray-800 transition-colors flex items-center justify-center group"
                  >
                    Join Now <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Training CTA */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-brand-dark mb-6 uppercase">Need a Custom Plan?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 font-medium">
            Our expert trainers can design a fully personalized training and nutrition program tailored specifically to your unique goals and lifestyle.
          </p>
          <Link to="/contact" className="bg-brand-green text-black px-10 py-4 rounded-full font-bold text-lg hover:bg-brand-dark hover:text-white transition-all inline-block">
            Speak with a Trainer
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Services;
