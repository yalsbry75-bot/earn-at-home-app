/**
 * Home Page - Premium Landing Page
 * Design: Dark Emerald + Gold theme with glassmorphism
 */
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useGuest } from '../contexts/GuestContext';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, Shield, TrendingUp, Users } from 'lucide-react';

export default function Home() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { enterGuestMode } = useGuest();
  const [, setLocation] = useLocation();

  const handleGuestMode = () => {
    enterGuestMode();
    setLocation('/dashboard');
  };

  const features = [
    {
      icon: Zap,
      title: 'مهام سهلة',
      description: 'أكمل مهام بسيطة واكسب نقاط وأموال حقيقية',
    },
    {
      icon: TrendingUp,
      title: 'نمو مستمر',
      description: 'ارفع مستواك واحصل على مكافآت أكبر',
    },
    {
      icon: Users,
      title: 'إحالات مربحة',
      description: 'أحل أصدقاءك واكسب عمولة من أرباحهم',
    },
    {
      icon: Shield,
      title: 'آمن وموثوق',
      description: 'منصة آمنة مع سحب فوري للأموال',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen gradient-bg-premium overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card-premium border-b border-white/10 backdrop-blur-xl">
        <div className="container py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <img src="/app-icon.png" alt="Earn@Home" className="w-10 h-10 rounded-lg" />
            <h1 className="text-2xl font-bold gradient-text-gold">اكسب من المنزل</h1>
          </motion.div>
          <nav className="flex gap-4">
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setLocation('/dashboard')}
                  className="text-white hover:text-[#d4af37]"
                >
                  لوحة التحكم
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setLocation('/profile')}
                  className="text-white hover:text-[#d4af37]"
                >
                  الملف الشخصي
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setLocation('/login')}
                  className="text-white hover:text-[#d4af37]"
                >
                  تسجيل الدخول
                </Button>
                <Button
                  onClick={() => setLocation('/register')}
                  className="btn-gold"
                >
                  إنشاء حساب
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Animated Icon */}
          <motion.div
            animate={{ float: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="mb-8 flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#1a5f4a] to-[#d4af37] rounded-3xl blur-3xl opacity-30 animate-pulse"></div>
              <img
                src="/app-icon.png"
                alt="Earn@Home"
                className="w-32 h-32 rounded-3xl relative z-10 shadow-2xl"
              />
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h2
            variants={itemVariants}
            className="text-5xl md:text-6xl font-bold mb-6 text-white"
          >
            اكسب من المنزل{' '}
            <span className="gradient-text-gold">بسهولة</span>
          </motion.h2>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed"
          >
            منصة متكاملة توفر فرص عمل متنوعة من المنزل مع أدوات احترافية وسهلة الاستخدام
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col md:flex-row gap-4 justify-center mb-12"
          >
            {!isAuthenticated && (
              <>
                <motion.div variants={itemVariants}>
                  <Button
                    size="lg"
                    onClick={() => setLocation('/register')}
                    className="btn-gold text-lg px-8 py-6"
                  >
                    إنشاء حساب مجاني
                  </Button>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Button
                    size="lg"
                    onClick={() => setLocation('/login')}
                    className="btn-gold-outline text-lg px-8 py-6"
                  >
                    تسجيل الدخول
                  </Button>
                </motion.div>
              </>
            )}
          </motion.div>

          {/* Guest Mode Button */}
          <motion.div
            variants={itemVariants}
            className="flex justify-center"
          >
            <Button
              onClick={handleGuestMode}
              variant="outline"
              className="border-2 border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6 rounded-full transition-all duration-300"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              جرب التطبيق مجاناً واكتشف كيفية الكسب
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-3 gap-4 mt-16 pt-16 border-t border-white/10"
          >
            <motion.div variants={itemVariants} className="text-center">
              <p className="text-4xl font-bold gradient-text-gold">50K+</p>
              <p className="text-gray-400 mt-2">مستخدم نشط</p>
            </motion.div>
            <motion.div variants={itemVariants} className="text-center">
              <p className="text-4xl font-bold gradient-text-gold">$2M+</p>
              <p className="text-gray-400 mt-2">أموال مدفوعة</p>
            </motion.div>
            <motion.div variants={itemVariants} className="text-center">
              <p className="text-4xl font-bold gradient-text-gold">24/7</p>
              <p className="text-gray-400 mt-2">دعم فني</p>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 border-t border-white/10">
        <div className="container max-w-6xl mx-auto">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-16 text-white"
          >
            لماذا تختار <span className="gradient-text-gold">اكسب من المنزل</span>؟
          </motion.h3>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="glass-card-premium p-6 hover:border-[#d4af37]/50 transition-all duration-300 group"
                >
                  <div className="mb-4 p-3 bg-gradient-to-br from-[#1a5f4a]/20 to-[#d4af37]/20 rounded-lg w-fit group-hover:from-[#1a5f4a]/40 group-hover:to-[#d4af37]/40 transition-all">
                    <Icon className="w-6 h-6 text-[#d4af37]" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">{feature.title}</h4>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 border-t border-white/10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="container max-w-4xl mx-auto text-center glass-card-premium p-12 border border-[#d4af37]/30"
        >
          <h3 className="text-3xl font-bold text-white mb-4">
            ابدأ رحلتك نحو الربح اليوم
          </h3>
          <p className="text-gray-300 mb-8">
            انضم إلى آلاف المستخدمين الذين يكسبون أموالاً حقيقية من المنزل
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button
              onClick={() => setLocation('/register')}
              className="btn-gold text-lg px-8 py-6"
            >
              إنشاء حساب الآن
            </Button>
            <Button
              onClick={handleGuestMode}
              className="btn-gold-outline text-lg px-8 py-6"
            >
              جرب مجاناً أولاً
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4 mt-12">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-white mb-4">عن المنصة</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-[#d4af37] transition">من نحن</a></li>
                <li><a href="#" className="hover:text-[#d4af37] transition">المميزات</a></li>
                <li><a href="#" className="hover:text-[#d4af37] transition">الأسعار</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">الدعم</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-[#d4af37] transition">المساعدة</a></li>
                <li><a href="#" className="hover:text-[#d4af37] transition">التواصل</a></li>
                <li><a href="#" className="hover:text-[#d4af37] transition">الأسئلة الشائعة</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">القانوني</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="/privacy" className="hover:text-[#d4af37] transition">سياسة الخصوصية</a></li>
                <li><a href="/terms" className="hover:text-[#d4af37] transition">شروط الاستخدام</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">تابعنا</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-[#d4af37] transition">فيسبوك</a></li>
                <li><a href="#" className="hover:text-[#d4af37] transition">تويتر</a></li>
                <li><a href="#" className="hover:text-[#d4af37] transition">إنستجرام</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2026 اكسب من المنزل. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
