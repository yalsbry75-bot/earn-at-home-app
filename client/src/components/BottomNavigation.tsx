/**
 * Bottom Navigation Component
 * Premium design with floating gold center button
 */
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Home, Briefcase, Wallet, Users, User, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useGuest } from '../contexts/GuestContext';

export function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { isGuestMode, showRestrictionMessage } = useGuest();

  if (!isAuthenticated) return null;

  const navItems = [
    { path: '/dashboard', label: 'الرئيسية', icon: Home },
    { path: '/tasks', label: 'المهام', icon: Briefcase },
    { path: '/wallet', label: 'المحفظة', icon: Wallet },
    { path: '/referrals', label: 'الإحالات', icon: Users },
    { path: '/profile', label: 'الملف', icon: User },
  ];

  const isActive = (path: string) => location === path;

  const handleNavClick = (path: string) => {
    if (isGuestMode && (path === '/tasks' || path === '/referrals' || path === '/wallet')) {
      if (path === '/tasks') {
        showRestrictionMessage('🎭 وضع الضيف: لا يمكنك إكمال المهام الحقيقية. قم بإنشاء حساب للبدء في الكسب');
      } else if (path === '/referrals') {
        showRestrictionMessage('🎭 وضع الضيف: لا يمكنك استخدام الإحالات. قم بإنشاء حساب للاستفادة من برنامج الإحالات');
      } else if (path === '/wallet') {
        showRestrictionMessage('🎭 وضع الضيف: لا يمكنك سحب الأموال. قم بإنشاء حساب وإكمال المهام أولاً');
      }
    } else {
      setLocation(path);
    }
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed bottom-0 left-0 right-0 z-40 glass-card-premium border-t border-white/10 backdrop-blur-xl"
      >
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-20 relative">
            {/* Left Items */}
            <div className="flex gap-2 flex-1">
              {navItems.slice(0, 2).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <motion.button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-lg transition-all duration-300 ${
                      active
                        ? 'bg-[#d4af37]/20 text-[#d4af37]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-1" />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Center Floating Button */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="absolute left-1/2 transform -translate-x-1/2 -top-8"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLocation('/dashboard')}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d4af37] to-[#f4d03f] shadow-2xl flex items-center justify-center text-black font-bold text-2xl hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all duration-300"
              >
                <Plus className="w-8 h-8" />
              </motion.button>
            </motion.div>

            {/* Right Items */}
            <div className="flex gap-2 flex-1 justify-end">
              {navItems.slice(2).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <motion.button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex flex-col items-center justify-center flex-1 py-2 px-3 rounded-lg transition-all duration-300 ${
                      active
                        ? 'bg-[#d4af37]/20 text-[#d4af37]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-1" />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Spacer */}
      <div className="h-24" />
    </>
  );
}
