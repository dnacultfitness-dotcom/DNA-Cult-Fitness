import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Star, Send, ShieldCheck, User, Mail, Phone, MessageSquare, Info, Sparkles, CheckCircle2 } from 'lucide-react';
import { db, addDoc, collection, serverTimestamp } from '../firebase';
import { cn } from '../lib/utils';

const ReviewPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    rating: 0,
    ambienceRating: 0,
    staffRating: 0,
    hygieneRating: 0,
    comment: '',
    suggestions: {
      staffBehavior: '',
      neatness: '',
      newFacilities: '',
      others: ''
    }
  });

  const [hoveredRating, setHoveredRating] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRatingClick = (category: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.rating === 0) {
      setError('Please provide a star rating');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'reviews'), {
        ...formData,
        name: formData.name.trim() || 'Anonymous',
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (category: string, currentRating: number, size = 22) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingClick(category, star)}
            onMouseEnter={() => setHoveredRating(prev => ({ ...prev, [category]: star }))}
            onMouseLeave={() => setHoveredRating(prev => ({ ...prev, [category]: 0 }))}
            className="focus:outline-none transition-transform hover:scale-125 active:scale-95"
          >
            <Star
              size={size}
              className={cn(
                "transition-colors",
                star <= (hoveredRating[category] || currentRating)
                  ? "fill-brand-green text-brand-green"
                  : "text-white/20"
              )}
            />
          </button>
        ))}
      </div>
    );
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-black pt-32 pb-20 px-6 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm w-full bg-zinc-900 border border-white/10 p-8 md:p-10 rounded-2xl md:rounded-3xl text-center backdrop-blur-xl"
        >
          <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-brand-green md:w-10 md:h-10" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3 md:mb-4 uppercase tracking-tighter italic">Thank You!</h2>
          <p className="text-white/60 text-xs md:text-sm mb-6 md:mb-8 leading-relaxed">
            Your feedback is invaluable. We'll use it to make DNA Cult Fitness even better.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-brand-green text-black font-black py-3 md:py-4 rounded-xl hover:bg-white transition-all uppercase tracking-tight text-xs md:text-sm"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 md:pt-32 pb-12 md:pb-20 px-4 md:px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-green/10 text-brand-green text-sm font-bold uppercase tracking-widest mb-4">
            <Sparkles size={16} /> User Feedback
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter italic">
            Share Your <span className="text-brand-green underline decoration-brand-green/30 decoration-4 underline-offset-4">Experience</span>
          </h1>
          <p className="text-white/60 text-xs sm:text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Help us improve DNA Cult Fitness. Your feedback helps us provide the best service possible.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-8">
          {/* Section 1: User Details */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-xl md:rounded-2xl p-3 md:p-6 backdrop-blur-xl">
            <h2 className="text-sm md:text-base font-bold text-white mb-3 md:mb-5 flex items-center gap-2 uppercase tracking-tight italic">
              <User size={16} className="text-brand-green" /> Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Full Name (Optional)</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-green transition-colors" size={16} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-9 pr-3 text-[11px] text-white focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Email Address (Optional)</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-green transition-colors" size={16} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-9 pr-3 text-[11px] text-white focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Phone Number (Optional)</label>
                <div className="relative group">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-brand-green transition-colors" size={16} />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91 XXX XXX XXXX"
                    className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-9 pr-3 text-[11px] text-white focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Ratings */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl md:rounded-3xl p-3 md:p-6 backdrop-blur-xl">
            <h2 className="text-sm md:text-base font-bold text-white mb-3 md:mb-5 flex items-center gap-2 uppercase tracking-tight italic">
              <Star size={16} className="text-brand-green" /> Ratings
            </h2>
            <div className="space-y-3 md:space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2.5 md:p-3 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <h3 className="text-xs font-bold text-white">Overall Experience</h3>
                  <p className="text-[8px] text-white/40">How would you rate your total time with us?</p>
                </div>
                {renderStars('rating', formData.rating, 24)}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                <div className="p-2 md:p-2.5 bg-white/5 rounded-xl border border-white/5 space-y-1.5">
                  <h3 className="text-[10px] font-bold text-white uppercase tracking-tight">Ambience</h3>
                  {renderStars('ambienceRating', formData.ambienceRating, 16)}
                </div>
                <div className="p-2 md:p-2.5 bg-white/5 rounded-xl border border-white/5 space-y-1.5">
                  <h3 className="text-[10px] font-bold text-white uppercase tracking-tight">Staff Helpfulness</h3>
                  {renderStars('staffRating', formData.staffRating, 16)}
                </div>
                <div className="p-2 md:p-2.5 bg-white/5 rounded-xl border border-white/5 space-y-1.5">
                  <h3 className="text-[10px] font-bold text-white uppercase tracking-tight">Hygiene & Safety</h3>
                  {renderStars('hygieneRating', formData.hygieneRating, 16)}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Review Text */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl md:rounded-3xl p-3 md:p-6 backdrop-blur-xl">
            <h2 className="text-sm md:text-base font-bold text-white mb-3 md:mb-5 flex items-center gap-2 uppercase tracking-tight italic">
              <MessageSquare size={16} className="text-brand-green" /> Your Review
            </h2>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Write your detailed feedback</label>
              <textarea
                required
                name="comment"
                value={formData.comment}
                onChange={handleInputChange}
                rows={3}
                placeholder="Share your thoughts about DNA Cult Fitness..."
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-[11px] text-white focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 transition-all resize-none"
              ></textarea>
            </div>
          </div>

          {/* Section 4: Suggestions */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-xl md:rounded-2xl p-2.5 md:p-4 backdrop-blur-xl">
            <h2 className="text-xs md:text-sm font-bold text-white mb-2 md:mb-3 flex items-center gap-1.5 uppercase tracking-tight italic">
              <ShieldCheck size={14} className="text-brand-green" /> Suggestions for Improvement
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest ml-1">Staff Behavior</label>
                <input
                  type="text"
                  name="suggestions.staffBehavior"
                  value={formData.suggestions.staffBehavior}
                  onChange={handleInputChange}
                  placeholder="E.g., More trainers needed"
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-[11px] text-white focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest ml-1">Neatness / Cleanliness</label>
                <input
                  type="text"
                  name="suggestions.neatness"
                  value={formData.suggestions.neatness}
                  onChange={handleInputChange}
                  placeholder="E.g., Floor cleaning frequency"
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-[11px] text-white focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest ml-1">New Facilities / Equipment</label>
                <input
                  type="text"
                  name="suggestions.newFacilities"
                  value={formData.suggestions.newFacilities}
                  onChange={handleInputChange}
                  placeholder="E.g., More squat racks"
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-[11px] text-white focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-white/40 uppercase tracking-widest ml-1">Others</label>
                <input
                  type="text"
                  name="suggestions.others"
                  value={formData.suggestions.others}
                  onChange={handleInputChange}
                  placeholder="Any other suggestion..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-[11px] text-white focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 transition-all"
                />
              </div>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-center font-bold"
            >
              <Info size={18} className="inline mr-2" /> {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full bg-brand-green text-black font-black py-3 md:py-4 rounded-lg md:rounded-xl transition-all uppercase tracking-tight text-sm md:text-base flex items-center justify-center gap-2",
              isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-white hover:scale-[1.01] active:scale-95 shadow-xl shadow-brand-green/10"
            )}
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-3 border-black/30 border-t-black rounded-full animate-spin"></div>
            ) : (
              <>Submit Review <Send size={18} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewPage;
