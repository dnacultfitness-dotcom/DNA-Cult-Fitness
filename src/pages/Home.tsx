import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Users, Dumbbell, Zap, Sparkles, LayoutDashboard, ChevronLeft, ChevronRight, Coffee } from 'lucide-react';
import { useFirebase } from '../components/FirebaseProvider';
import { AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const Home = () => {
  const { user } = useFirebase();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [direction, setDirection] = React.useState(0);

  const [isPaused, setIsPaused] = React.useState(false);

  const services = [
    {
      title: "Resistance Training",
      description: "Build foundational strength and muscle tone with our expert-led resistance programs.",
      icon: <Dumbbell className="text-brand-green" size={32} />
    },
    {
      title: "CrossFit Training",
      description: "High-intensity functional movements designed to push your limits and improve overall fitness.",
      icon: <Zap className="text-brand-green" size={32} />
    },
    {
      title: "Hybrid Package",
      description: "A unique 3-month fitness + beauty collaboration with Hairbay Studio for a total transformation.",
      icon: <Users className="text-brand-green" size={32} />
    },
    {
      title: "Personal Training",
      description: "One-on-one coaching tailored to your specific goals, body type, and fitness level.",
      icon: <Sparkles className="text-brand-green" size={32} />
    },
    {
      title: "Group Classes",
      description: "High-energy group sessions that combine community support with intense workouts.",
      icon: <Users className="text-brand-green" size={32} />
    },
    {
      title: "Nutrition Coaching",
      description: "Expert dietary guidance to fuel your workouts and optimize your body composition.",
      icon: <Zap className="text-brand-green" size={32} />
    },
    {
      title: "Rooftop Protein Bar",
      description: "Refuel after your workout with premium protein shakes and healthy snacks with a view.",
      icon: <Coffee className="text-brand-green" size={32} />
    }
  ];

  const nextSlide = React.useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % services.length);
  }, [services.length]);

  const prevSlide = React.useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + services.length) % services.length);
  }, [services.length]);

  React.useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [nextSlide, isPaused]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center pt-20 overflow-hidden bg-black">
        {/* Parallax Background */}
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 z-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop" 
            alt="Gym Hero" 
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        
        {/* Enhanced Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent z-10"></div>
        
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white w-full">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 uppercase drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                TRANSFORM <br />
                <span className="text-white">YOUR BODY.</span> <br />
                <span className="text-brand-green">ELEVATE DNA.</span>
              </h1>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-gray-300 mb-12 max-w-lg leading-relaxed font-medium"
            >
              Experience the next level of fitness at DNA Cult Fitness. 
              Science-backed training, elite coaching, and a community that breeds excellence.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row flex-wrap gap-5"
            >
              {user ? (
                <Link to="/profile" className="bg-brand-green text-black px-10 py-5 rounded-full font-black text-lg hover:bg-white transition-all flex items-center justify-center group shadow-2xl shadow-brand-green/20 uppercase tracking-tight">
                  My Profile <LayoutDashboard className="ml-2 group-hover:translate-x-1 transition-transform" size={22} />
                </Link>
              ) : (
                <Link to="/membership" className="bg-brand-green text-black px-10 py-5 rounded-full font-black text-lg hover:bg-white transition-all flex items-center justify-center group shadow-2xl shadow-brand-green/20 uppercase tracking-tight">
                  Join Now <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={22} />
                </Link>
              )}
              
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Link to="/ai-assistant" className="bg-white text-black px-10 py-5 rounded-full font-black text-lg hover:bg-brand-green transition-all flex items-center justify-center space-x-2 shadow-2xl shadow-white/10 uppercase tracking-tight">
                  <Sparkles size={22} className="text-brand-green group-hover:text-black" />
                  <span>AI Assistant</span>
                </Link>
              </motion.div>

              <Link to="/services" className="bg-white/5 backdrop-blur-xl border border-white/10 text-white px-10 py-5 rounded-full font-black text-lg hover:bg-white/20 transition-all text-center uppercase tracking-tight">
                Programs
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Preview Carousel */}
      <section className="py-24 bg-[#c6dcff] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-brand-dark mb-4 uppercase">Our Core Programs</h2>
            <p className="text-gray-600 max-w-2xl mx-auto font-medium">
              We offer a diverse range of training styles to suit your specific goals and fitness level.
            </p>
          </div>
          
          <div 
            className="relative h-[500px] md:h-[450px]"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.3 }
                  }}
                  className="absolute w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {[0, 1, 2].map((offset) => {
                    const index = (currentIndex + offset) % services.length;
                    const service = services[index];
                    return (
                      <div
                        key={index}
                        className={cn(
                          "p-10 bg-[#101828] rounded-[40px] border border-white/5 shadow-2xl hover:shadow-brand-green/10 transition-all h-full flex flex-col justify-between group",
                          offset === 2 ? "hidden lg:flex" : offset === 1 ? "hidden md:flex" : "flex"
                        )}
                      >
                        <div>
                          <div className="mb-8 p-4 bg-white/5 rounded-2xl w-fit shadow-sm group-hover:scale-110 transition-transform duration-300">
                            {service.icon}
                          </div>
                          <h3 className="text-2xl font-black mb-4 uppercase text-white">{service.title}</h3>
                          <p className="text-gray-400 mb-8 leading-relaxed font-medium">{service.description}</p>
                        </div>
                        <Link to="/services" className="text-brand-green font-black flex items-center hover:translate-x-2 transition-transform uppercase tracking-tight">
                          Learn More <ArrowRight size={20} className="ml-2" />
                        </Link>
                      </div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-12 z-30">
              <button 
                onClick={prevSlide}
                className="p-4 bg-white rounded-full shadow-xl hover:bg-brand-green hover:text-white transition-all text-brand-dark border border-gray-100 group"
                aria-label="Previous slide"
              >
                <ChevronLeft size={24} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-12 z-30">
              <button 
                onClick={nextSlide}
                className="p-4 bg-white rounded-full shadow-xl hover:bg-brand-green hover:text-white transition-all text-brand-dark border border-gray-100 group"
                aria-label="Next slide"
              >
                <ChevronRight size={24} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-12 space-x-2">
            {services.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setDirection(i > currentIndex ? 1 : -1);
                  setCurrentIndex(i);
                }}
                className={cn(
                  "h-2 transition-all rounded-full",
                  currentIndex === i ? "w-8 bg-brand-green" : "w-2 bg-gray-200 hover:bg-gray-300"
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="py-24 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1 relative">
              <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2070&auto=format&fit=crop" 
                  alt="Trainer" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-green-600 rounded-3xl -z-10 hidden md:block"></div>
            </div>
            
            <div className="flex-1">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 mb-6">Why Choose DNA Cult Fitness?</h2>
              <p className="text-lg text-gray-600 mb-8">
                At DNA Cult Fitness, we don't just provide equipment; we provide a roadmap to your best self. 
                Our approach is rooted in the belief that everyone has untapped potential waiting to be unlocked through disciplined training and proper guidance.
              </p>
              
              <ul className="space-y-4 mb-10">
                {[
                  "Expert trainers with years of experience",
                  "State-of-the-art equipment and facilities",
                  "Personalized nutrition and training plans",
                  "Supportive and motivating community"
                ].map((item, i) => (
                  <li key={i} className="flex items-center text-gray-700">
                    <CheckCircle2 className="text-brand-green mr-3" size={20} />
                    {item}
                  </li>
                ))}
              </ul>
              
              <Link to="/about" className="inline-block bg-black text-white px-8 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors">
                Our Story
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-brand-green text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-8">Ready to Start Your Journey?</h2>
          <p className="text-xl text-black/80 mb-10 max-w-2xl mx-auto font-medium">
            Join DNA Cult Fitness today and take the first step towards a stronger, healthier, and more confident you.
          </p>
          <Link to="/membership" className="bg-black text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-900 transition-colors inline-block">
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
