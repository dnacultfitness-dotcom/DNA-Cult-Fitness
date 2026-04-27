import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Youtube, Send } from 'lucide-react';
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
    { title: "Address", content: "123 Fitness Ave, Gym City, GC 12345", icon: <MapPin className="text-brand-green" size={24} /> },
    { title: "Phone", content: "+1 (555) 123-4567", icon: <Phone className="text-brand-green" size={24} /> },
    { title: "Email", content: "info@dnacultfitness.com", icon: <Mail className="text-brand-green" size={24} /> },
    { title: "Hours", content: "Mon-Fri: 5am - 10pm | Sat-Sun: 7am - 8pm", icon: <Clock className="text-brand-green" size={24} /> }
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

      {/* Contact Content */}
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
                  <div key={index} className="flex items-start space-x-4">
                    <div className="p-3 bg-brand-green/10 rounded-xl border border-brand-green/20 flex-shrink-0">
                      {info.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{info.title}</h3>
                      <p className="text-gray-600">{info.content}</p>
                    </div>
                  </div>
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

      {/* Map Placeholder */}
      <section className="h-[500px] bg-gray-200 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xl font-medium">
          <div className="text-center">
            <MapPin className="mx-auto mb-4 text-brand-green" size={48} />
            <p>Interactive Map Placeholder</p>
            <p className="text-sm text-gray-400 mt-2">123 Fitness Ave, Gym City, GC 12345</p>
          </div>
        </div>
        {/* In a real app, you'd embed a Google Map here */}
      </section>
    </div>
  );
};

export default Contact;
