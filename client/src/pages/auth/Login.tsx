/**
 * Login Page
 * Secure user authentication with rate limiting
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Checkbox } from '@/components/ui/checkbox';

import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useGuest } from '../../contexts/GuestContext';
import {
  isRateLimited,
  recordLoginAttempt,
  getRemainingLoginAttempts,
  registerDevice,
  getDeviceInfo,
  isNewDevice,
  checkSuspiciousActivity,
} from '../../services/securityService';

export default function Login() {
  const { t } = useTranslation();
  const { login, isLoading } = useAuth();
  const { enterGuestMode } = useGuest();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error(t('auth.emailRequired'));
      return;
    }

    // Check rate limiting
    if (isRateLimited(email)) {
      const remaining = getRemainingLoginAttempts(email);
      toast.error(
        `عدد محاولات تسجيل الدخول انتهى. حاول لاحقاً. محاولات متبقية: ${remaining}`
      );
      return;
    }

    try {
      const user = await login(email, password);

      // Record successful login
      recordLoginAttempt(email, true);

      // Get device info
      if (user) {
        const deviceInfo = getDeviceInfo();
        
        // Check if new device BEFORE registering it
        if (isNewDevice(user.uid, deviceInfo.id)) {
          toast.info('تم تسجيل دخول من جهاز جديد');
        }
        
        registerDevice(user.uid, deviceInfo);

        // Check for suspicious activity
        const suspicious = checkSuspiciousActivity(email, user.uid);
        if (suspicious.isSuspicious) {
          toast.warning(`نشاط مريب: ${suspicious.reason}`);
        }
      }

      // Save remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberMe', email);
      } else {
        localStorage.removeItem('rememberMe');
      }

      toast.success(t('auth.loginSuccess'));
      setLocation('/dashboard');
    } catch (error: any) {
      // Record failed login
      recordLoginAttempt(email, false);

      const remaining = getRemainingLoginAttempts(email);
      if (remaining === 0) {
        toast.error('عدد محاولات تسجيل الدخول انتهى. حاول لاحقاً');
      } else {
        toast.error(
          `بيانات دخول غير صحيحة. محاولات متبقية: ${remaining}`
        );
      }
    }
  };

  const handleGuestMode = () => {
    enterGuestMode();
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen gradient-bg-premium flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-6">
            <img
              src="/app-icon.png"
              alt="Earn@Home"
              className="w-20 h-20 rounded-2xl shadow-2xl"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">اكسب من المنزل</h1>
          <p className="text-gray-400">تسجيل الدخول إلى حسابك</p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card-premium p-8 mb-6"
        >
          <div className="mb-6">
            <h2 className="text-2xl text-white text-center font-bold">تسجيل الدخول</h2>
          </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-200">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 text-[#d4af37] h-5 w-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="input-premium pr-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-200">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 text-[#d4af37] h-5 w-5" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="input-premium pr-10 pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-3 text-gray-400 hover:text-[#d4af37] transition"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer text-gray-200">
                    تذكرني
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setLocation('/forgot-password')}
                  className="p-0 h-auto text-xs text-brand-gold hover:text-brand-green"
                >
                  {t('auth.forgotPassword')}
                </Button>
              </div>

              <Button type="submit" className="btn-gold w-full text-lg py-6 font-bold" disabled={isLoading}>
                {isLoading ? 'جاري التحميل...' : 'تسجيل الدخول'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#1a2332] text-gray-400">أو</span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                type="button"
                variant="outline"
                className="border border-white/20 text-white hover:bg-white/10 hover:border-[#d4af37]/50"
                disabled={isLoading}
              >
                <span className="text-lg">G</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border border-white/20 text-white hover:bg-white/10 hover:border-[#d4af37]/50"
                disabled={isLoading}
              >
                <span className="text-lg">f</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border border-white/20 text-white hover:bg-white/10 hover:border-[#d4af37]/50"
                disabled={isLoading}
              >
                <span className="text-lg">🍎</span>
              </Button>
            </div>
        </motion.div>

        {/* Sign Up Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-6"
        >
          <p className="text-gray-300">
            ليس لديك حساب؟{' '}
            <Button
              type="button"
              variant="link"
              onClick={() => setLocation('/register')}
              className="p-0 h-auto text-[#d4af37] hover:text-[#f4d03f]"
            >
              إنشاء حساب جديد
            </Button>
          </p>
        </motion.div>

        {/* Guest Mode Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={handleGuestMode}
            variant="outline"
            className="w-full border-2 border-white/30 text-white hover:bg-white/10 py-6 rounded-full transition-all duration-300"
          >
            جرب التطبيق مجاناً
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
