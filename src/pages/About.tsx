import React from 'react';
import { motion } from 'motion/react';
import { Target, Eye, Award, Users, Heart, Shield } from 'lucide-react';

const About = () => {
  const values = [
    {
      title: "Our Mission",
      description: "To empower individuals to reach their peak physical and mental potential through science-backed fitness and a supportive community.",
      icon: <Target className="text-brand-green" size={32} />
    },
    {
      title: "Our Vision",
      description: "To be the leading fitness destination that redefines the standard of health and wellness, one DNA at a time.",
      icon: <Eye className="text-brand-green" size={32} />
    }
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-brand-dark mb-4 sm:mb-6 uppercase">
              Our Story <span className="text-brand-green">Our DNA</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              DNA Cult Fitness was born out of a passion for high-performance living. 
              We believe that fitness is not just a hobby, but a fundamental part of our human identity.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Brand Story */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-10 sm:gap-16 items-center">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-black mb-4 sm:mb-6 uppercase tracking-tight">The DNA Philosophy</h2>
              <p className="text-gray-600 mb-4 sm:mb-6 text-base sm:text-lg leading-relaxed">
                Founded in 2020, DNA Cult Fitness started as a small community of athletes looking for a more rigorous and scientific approach to training. 
                We realized that generic gym environments often lacked the intensity and personalized guidance needed for true transformation.
              </p>
              <p className="text-gray-600 mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed">
                Our name reflects our core belief: that every individual has a unique genetic potential, and our job is to provide the environment and tools to cultivate that potential to its fullest.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                <div className="flex items-center space-x-3">
                  <Award className="text-brand-green shrink-0" size={20} />
                  <span className="font-bold text-sm sm:text-base uppercase tracking-tight">Premium Quality</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="text-brand-green shrink-0" size={20} />
                  <span className="font-bold text-sm sm:text-base uppercase tracking-tight">Elite Community</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Heart className="text-brand-green shrink-0" size={20} />
                  <span className="font-bold text-sm sm:text-base uppercase tracking-tight">Passion Driven</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="text-brand-green shrink-0" size={20} />
                  <span className="font-bold text-sm sm:text-base uppercase tracking-tight">Safe Environment</span>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full">
              <img 
                src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2070&auto=format&fit=crop" 
                alt="Gym Interior" 
                className="rounded-2xl sm:rounded-3xl shadow-2xl w-full h-auto"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 sm:py-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
            {values.map((value, index) => (
              <div key={index} className="p-8 sm:p-10 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10">
                <div className="mb-4 sm:mb-6">{value.icon}</div>
                <h3 className="text-xl sm:text-2xl font-black mb-3 sm:mb-4 uppercase tracking-tight">{value.title}</h3>
                <p className="text-gray-400 text-sm sm:text-lg leading-relaxed font-medium">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;
