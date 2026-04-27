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

  const trainers = [
    {
      name: "Alex Johnson",
      specialty: "Strength & Conditioning",
      image: "https://images.unsplash.com/photo-1567013127542-490d757e51fe?q=80&w=1974&auto=format&fit=crop"
    },
    {
      name: "Sarah Miller",
      specialty: "CrossFit & Mobility",
      image: "https://images.unsplash.com/photo-1548690312-e3b507d17a47?q=80&w=1974&auto=format&fit=crop"
    },
    {
      name: "Mike Chen",
      specialty: "Kick-Boxing & HIIT",
      image: "https://images.unsplash.com/photo-1583454110551-21f2fa2ae617?q=80&w=2070&auto=format&fit=crop"
    }
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-brand-dark mb-6">
              Our Story <span className="text-brand-green">Our DNA</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              DNA Cult Fitness was born out of a passion for high-performance living. 
              We believe that fitness is not just a hobby, but a fundamental part of our human identity.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Brand Story */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-6">The DNA Cult Philosophy</h2>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Founded in 2020, DNA Cult Fitness started as a small community of athletes looking for a more rigorous and scientific approach to training. 
                We realized that generic gym environments often lacked the intensity and personalized guidance needed for true transformation.
              </p>
              <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                Our name reflects our core belief: that every individual has a unique genetic potential, and our job is to provide the environment and tools to cultivate that potential to its fullest. 
                We are a "cult" in the sense of a devoted community—united by a shared commitment to excellence and self-improvement.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div className="flex items-center space-x-3">
                  <Award className="text-brand-green" size={24} />
                  <span className="font-semibold">Premium Quality</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="text-brand-green" size={24} />
                  <span className="font-semibold">Elite Community</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Heart className="text-brand-green" size={24} />
                  <span className="font-semibold">Passion Driven</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="text-brand-green" size={24} />
                  <span className="font-semibold">Safe Environment</span>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <img 
                src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2070&auto=format&fit=crop" 
                alt="Gym Interior" 
                className="rounded-3xl shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {values.map((value, index) => (
              <div key={index} className="p-10 bg-white/5 rounded-3xl border border-white/10">
                <div className="mb-6">{value.icon}</div>
                <h3 className="text-2xl font-bold mb-4">{value.title}</h3>
                <p className="text-gray-400 text-lg">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trainers */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">Meet Our Elite Trainers</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our coaches are more than just trainers; they are mentors dedicated to your success.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {trainers.map((trainer, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -10 }}
                className="group"
              >
                <div className="relative h-[400px] rounded-3xl overflow-hidden mb-6">
                  <img 
                    src={trainer.image} 
                    alt={trainer.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{trainer.name}</h3>
                <p className="text-brand-green font-medium">{trainer.specialty}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
