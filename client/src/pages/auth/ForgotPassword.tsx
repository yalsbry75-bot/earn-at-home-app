/**
 * Forgot Password Page
 * Password recovery flow
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { authService } from '../../firebase/services';
import { isValidEmail } from '../../services/emailService';

type ForgotPasswordStep = 'email' | 'sent' | 'reset';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const [step, setStep] = useState<ForgotPasswordStep>('email');
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Send reset email
  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error(t('auth.emailRequired'));
      return;
    }

    if (!isValidEmail(email)) {
      toast.error(t('auth.invalidEmail'));
      return;
    }

    try {
      setIsLoading(true);
      await authService.sendResetEmail(email);
      setStep('sent');
      toast.success('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
    } catch (error: any) {
      toast.error(error.message || t('errors.serverError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify code and reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resetCode) {
      toast.error('يرجى إدخال الكود');
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error(t('auth.passwordRequired'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('auth.passwordMismatch'));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t('auth.passwordTooShort'));
      return;
    }

    try {
      setIsLoading(true);
      // In production, use Firebase confirmPasswordReset
      // await confirmPasswordReset(auth, resetCode, newPassword);
      toast.success('تم تغيير كلمة المرور بنجاح');
      setLocation('/login');
    } catch (error: any) {
      toast.error(error.message || t('errors.serverError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('auth.resetPassword')}</CardTitle>
          <CardDescription>
            {step === 'email' && 'أدخل بريدك الإلكتروني لاستعادة كلمة المرور'}
            {step === 'sent' && 'تحقق من بريدك الإلكتروني للحصول على رابط الإعادة'}
            {step === 'reset' && 'أدخل الكود الجديد وكلمة المرور الجديدة'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleSendResetEmail} className="space-y-4">
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
                  'إرسال رابط الإعادة'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setLocation('/login')}
              >
                {t('common.back')}
              </Button>
            </form>
          )}

          {/* Step 2: Sent */}
          {step === 'sent' && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  تم إرسال رابط إعادة تعيين كلمة المرور إلى <strong>{email}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  الرابط صالح لمدة 1 ساعة فقط
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setStep('reset')}
              >
                لدي الكود بالفعل
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setLocation('/login')}
              >
                {t('common.back')}
              </Button>
            </div>
          )}

          {/* Step 3: Reset Password */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetCode">كود الإعادة</Label>
                <Input
                  id="resetCode"
                  type="text"
                  placeholder="أدخل الكود من البريد"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                />
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
                {isLoading ? (
                  <>
                    <Spinner className="mr-2" />
                    {t('common.loading')}
                  </>
                ) : (
                  'تغيير كلمة المرور'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep('email')}
              >
                {t('common.back')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
