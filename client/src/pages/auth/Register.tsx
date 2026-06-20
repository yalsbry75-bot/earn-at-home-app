/**
 * Register Page
 * Advanced user registration with OTP verification
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useGuest } from '../../contexts/GuestContext';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import {
  sendOTPEmail,
  verifyOTP,
  isTemporaryEmail,
  isValidEmail,
} from '../../services/emailService';
import { validatePasswordStrength } from '../../services/securityService';
import { referralService } from '../../services/referralService';
import { rewardsService } from '../../services/rewardsService';

type RegistrationStep = 'email' | 'otp' | 'profile' | 'password' | 'complete';

export default function Register() {
  const { t } = useTranslation();
  const { register, isLoading } = useAuth();
  const { enterGuestMode } = useGuest();
  const [, setLocation] = useLocation();

  const handleGuestMode = () => {
    enterGuestMode();
    setLocation('/dashboard');
  };

  // Form states
  const [step, setStep] = useState<RegistrationStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] as string[] });
  const [otpSent, setOtpSent] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('ref');
    if (code) {
      setReferralCode(code.trim().toUpperCase());
    }
  }, []);

  // Step 1: Email verification
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error(t('auth.emailRequired'));
      return;
    }

    if (!isValidEmail(email)) {
      toast.error(t('auth.invalidEmail'));
      return;
    }

    if (isTemporaryEmail(email)) {
      toast.error('لا يمكن استخدام بريد مؤقت');
      return;
    }

    try {
      const sent = await sendOTPEmail(email);
      if (sent) {
        setOtpSent(true);
        setStep('otp');
        toast.success('تم إرسال كود التحقق إلى بريدك الإلكتروني');
      } else {
        toast.error('فشل إرسال كود التحقق');
      }
    } catch (error: any) {
      toast.error(error.message || t('errors.serverError'));
    }
  };

  // Step 2: OTP verification
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp) {
      toast.error('يرجى إدخال كود التحقق');
      return;
    }

    if (otp.length !== 6) {
      toast.error('كود التحقق يجب أن يكون 6 أرقام');
      return;
    }

    try {
      const verified = verifyOTP(email, otp);
      if (verified) {
        setStep('profile');
        toast.success('تم التحقق من البريد بنجاح');
      } else {
        setOtpAttempts(otpAttempts + 1);
        if (otpAttempts >= 4) {
          toast.error('عدد محاولات التحقق انتهى');
          setStep('email');
        } else {
          toast.error(`كود غير صحيح. محاولات متبقية: ${5 - otpAttempts}`);
        }
      }
    } catch (error: any) {
      toast.error(error.message || t('errors.serverError'));
    }
  };

  // Step 3: Profile information
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName || !fatherName || !country) {
      toast.error('يرجى ملء جميع الحقول');
      return;
    }

    setStep('password');
  };

  // Step 4: Password setup
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error(t('auth.passwordRequired'));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('auth.passwordMismatch'));
      return;
    }

    const strength = validatePasswordStrength(password);
    if (!strength.isValid) {
      toast.error(strength.feedback[0] || 'كلمة المرور ضعيفة جداً');
      return;
    }

    setStep('complete');
  };

  // Step 5: Complete registration
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await register(email, password, displayName, fatherName, country);

      const registrationReward = await rewardsService.claimRegistrationBonus();
      if (registrationReward.granted) {
        toast.success(`مرحباً بك! تمت إضافة ${registrationReward.points} نقطة إلى محفظتك`);
      } else {
        toast.success(t('auth.registerSuccess'));
      }

      if (referralCode) {
        try {
          await referralService.registerReferral(referralCode);
          toast.success('تم ربط حسابك برابط الإحالة بنجاح');
        } catch (referralError) {
          console.warn('Referral registration failed:', referralError);
          toast.warning('تم إنشاء الحساب، لكن لم يتم قبول كود الإحالة');
        }
      }

      setLocation('/dashboard');
    } catch (error: any) {
      toast.error(error.message || t('errors.serverError'));
    }
  };

  // Update password strength
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const strength = validatePasswordStrength(value);
    setPasswordStrength(strength);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('auth.register')}</CardTitle>
          <CardDescription>
            {step === 'email' && 'أدخل بريدك الإلكتروني'}
            {step === 'otp' && 'أدخل كود التحقق'}
            {step === 'profile' && 'أكمل بيانات ملفك الشخصي'}
            {step === 'password' && 'أنشئ كلمة مرور قوية'}
            {step === 'complete' && 'تأكيد البيانات'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner className="mr-2" />
                    {t('common.loading')}
                  </>
                ) : (
                  'إرسال كود التحقق'
                )}
              </Button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">كود التحقق</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  تم إرسال كود التحقق إلى {email}
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner className="mr-2" />
                    {t('common.loading')}
                  </>
                ) : (
                  'التحقق'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep('email')}
              >
                تغيير البريد الإلكتروني
              </Button>
            </form>
          )}

          {/* Step 3: Profile */}
          {step === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">{t('auth.displayName')}</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="الاسم الأول"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fatherName">اسم الأب</Label>
                <Input
                  id="fatherName"
                  type="text"
                  placeholder="اسم الأب"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">الدولة</Label>
                <Input
                  id="country"
                  type="text"
                  placeholder="الدولة"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {t('common.next')}
              </Button>
            </form>
          )}

          {/* Step 4: Password */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  disabled={isLoading}
                />
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded ${
                        i <= passwordStrength.score ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <ul className="text-xs text-red-500 mt-2">
                    {passwordStrength.feedback.map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.passwordConfirm')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {t('common.next')}
              </Button>
            </form>
          )}

          {/* Step 5: Complete */}
          {step === 'complete' && (
            <form onSubmit={handleCompleteRegistration} className="space-y-4">
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">البريد الإلكتروني:</span>
                  <p className="font-medium">{email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">الاسم:</span>
                  <p className="font-medium">{displayName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">اسم الأب:</span>
                  <p className="font-medium">{fatherName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">الدولة:</span>
                  <p className="font-medium">{country}</p>
                </div>
                {referralCode && (
                  <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                    <span className="text-muted-foreground">كود الإحالة:</span>
                    <p className="font-mono font-bold text-green-600">{referralCode}</p>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner className="mr-2" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('auth.signUp')
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep('password')}
              >
                {t('common.back')}
              </Button>
            </form>
          )}

          <div className="mt-4 space-y-3 text-center text-sm">
            <div>
              <span className="text-muted-foreground">{t('auth.haveAccount')}</span>
              <Button
                variant="link"
                onClick={() => setLocation('/login')}
                className="p-0 h-auto"
              >
                {t('auth.signIn')}
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleGuestMode}
              className="w-full"
            >
              جرب التطبيق مجاناً
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
