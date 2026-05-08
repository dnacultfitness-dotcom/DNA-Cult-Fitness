import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Youtube, Send, Globe } from 'lucide-react';
import { toast } from 'sonner';
import PhoneInput from '../components/PhoneInput';

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('Message sent! We will get back to you shortly.');
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  const contactInfo = [
    { 
      title: "Address", 
      content: "Royal Tower, Trichambaram, Taliparamba, Kannur - 670141", 
      icon: <MapPin className="text-brand-green" size={24} />,
      link: "https://www.google.com/maps/search/?api=1&query=DNA+Cult+Fitness+Royal+Tower+Taliparamba"
    },
    { 
      title: "Phone", 
      content: "+91 62388 92734", 
      icon: <Phone className="text-brand-green" size={24} />,
      link: "tel:+916238892734"
    },
    { 
      title: "WhatsApp", 
      content: "+91 90744 88463", 
      icon: <Phone className="text-brand-green" size={24} />,
      link: "https://wa.me/919074488463"
    },
    { 
      title: "Email", 
      content: "info@dnacultfitness.com", 
      icon: <Mail className="text-brand-green" size={24} />,
      link: "mailto:info@dnacultfitness.com"
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
              Get in <span className="text-brand-green">Touch</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Have questions or need more information? We're here to help you on your fitness journey.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Content Container Placeholder */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16">
            {/* Left: Contact Info */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-8">Contact Information</h2>
              <p className="text-gray-600 mb-12 text-lg">
                Feel free to reach out to us through any of the following channels. We're always happy to hear from you.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 mb-12">
                {contactInfo.map((info, index) => (
                  <a 
                    key={index} 
                    href={info.link} 
                    target={info.link.startsWith('http') ? "_blank" : undefined}
                    rel={info.link.startsWith('http') ? "noopener noreferrer" : undefined}
                    className="flex items-start space-x-4 group"
                  >
                    <div className="p-3 bg-brand-green/10 rounded-xl border border-brand-green/20 flex-shrink-0 group-hover:bg-brand-green group-hover:text-black transition-all">
                      {info.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{info.title}</h3>
                      <p className="text-gray-600 group-hover:text-brand-green transition-colors">{info.content}</p>
                    </div>
                  </a>
                ))}
              </div>
              
              <div className="pt-12 border-t border-gray-100">
                <h3 className="text-xl font-bold mb-6">Follow Us</h3>
                <div className="flex space-x-6">
                  <a href="#" className="p-4 bg-gray-50 rounded-full text-gray-600 hover:bg-brand-green hover:text-black transition-all"><Instagram size={24} /></a>
                  <a href="#" className="p-4 bg-gray-50 rounded-full text-gray-600 hover:bg-brand-green hover:text-black transition-all"><Facebook size={24} /></a>
                  <a href="#" className="p-4 bg-gray-50 rounded-full text-gray-600 hover:bg-brand-green hover:text-black transition-all"><Youtube size={24} /></a>
                </div>
              </div>
            </div>

            {/* Right: Contact Form */}
            <div className="flex-1">
              <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100">
                <h3 className="text-2xl font-bold mb-8">Send a Message</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                      <input
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                      <input
                        required
                        type="email"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <PhoneInput
                      label="Phone Number"
                      required
                      placeholder="00000 00000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                    <input
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none transition-all"
                      placeholder="How can we help?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                    <textarea
                      required
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green focus:border-transparent outline-none transition-all resize-none"
                      placeholder="Your message here..."
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors flex items-center justify-center group disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending...' : (
                      <>
                        Send Message <Send className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Hub placeholder - Replaced with actual Map */}
      <section className="h-[450px] w-full bg-white relative overflow-hidden">
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4640.473905197336!2d75.35947196935683!3d12.03265029115025!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba43fb67521c0d1%3A0x579e95721a3937b1!2sDNA%20Cult%20Fitness!5e0!3m2!1sen!2sin!4v1778146485375!5m2!1sen!2sin" 
          width="100%" 
          height="100%" 
          style={{ border: 0 }} 
          allowFullScreen 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
          title="Google Maps - DNA Cult Fitness"
        ></iframe>
      </section>
    </div>
  );
};

export default Contact;
