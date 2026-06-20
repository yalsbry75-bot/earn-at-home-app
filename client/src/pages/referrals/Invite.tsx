import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { referralService } from '../../services/referralService';
import { antifraudService, getOrCreateDeviceId } from '../../services/antifraudService';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { Copy, Share2, Mail, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Invite() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralLink, setReferralLink] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!user) return;

    const initializeReferral = async () => {
      try {
        setIsLoading(true);

        // Generate device fingerprint
        await antifraudService.createDeviceFingerprint(user.id);

        // Generate referral link via Cloud Function
        const result = await referralService.createReferralLink();
        setReferralCode(result.referralCode);
        setReferralLink(result.referralLink);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize referral';
        console.error(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeReferral();
  }, [user]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success(t('common.copied'));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success(t('common.copied'));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('invite.shareTitle'),
          text: t('invite.shareText'),
          url: referralLink,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail) {
      toast.error(t('invite.emailRequired'));
      return;
    }

    if (!inviteEmail.includes('@')) {
      toast.error(t('invite.invalidEmail'));
      return;
    }

    try {
      setIsSending(true);

      // In production, this would send an email via backend API
      // For now, we'll just show a success message
      toast.success(t('invite.sent'));
      setInviteEmail('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send invite';
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t('invite.title')}</h1>
          <p className="text-slate-600 dark:text-slate-400">{t('invite.subtitle')}</p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Share Options */}
          <div className="space-y-4">
            {/* Share Card */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                {t('invite.shareOptions')}
              </h2>

              {/* Referral Code */}
              <div className="mb-4">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  {t('invite.code')}
                </label>
                <div className="flex gap-2">
                  <Input
                    value={referralCode}
                    readOnly
                    className="font-mono font-bold"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    className="gap-2"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Referral Link */}
              <div className="mb-4">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                  {t('invite.link')}
                </label>
                <div className="flex gap-2">
                  <Input
                    value={referralLink}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="gap-2"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Share Button */}
              <Button onClick={handleShare} className="w-full gap-2" size="lg">
                <Share2 className="w-5 h-5" />
                {t('invite.share')}
              </Button>
            </Card>

            {/* Benefits Card */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
              <h3 className="text-lg font-bold mb-3 text-green-900 dark:text-green-100">
                {t('invite.benefits')}
              </h3>
              <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                  <span>{t('invite.benefit1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                  <span>{t('invite.benefit2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                  <span>{t('invite.benefit3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                  <span>{t('invite.benefit4')}</span>
                </li>
              </ul>
            </Card>
          </div>

          {/* Right Column - Email Invite */}
          <div className="space-y-4">
            {/* Email Invite Card */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                {t('invite.emailInvite')}
              </h2>

              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    {t('invite.recipientEmail')}
                  </label>
                  <Input
                    type="email"
                    placeholder={t('invite.emailPlaceholder')}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={isSending}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={isSending}
                  size="lg"
                >
                  {isSending ? t('common.sending') : t('invite.sendInvite')}
                </Button>
              </form>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {t('invite.emailNote')}
                </p>
              </div>
            </Card>

            {/* How It Works Card */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-3">{t('invite.howItWorks')}</h3>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
                    1
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {t('invite.step1')}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
                    2
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {t('invite.step2')}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
                    3
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {t('invite.step3')}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
                    4
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {t('invite.step4')}
                  </span>
                </li>
              </ol>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <Card className="mt-6 p-6">
          <h2 className="text-2xl font-bold mb-4">{t('invite.faq')}</h2>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {t('invite.faq1Question')}
              </h4>
              <p className="text-slate-700 dark:text-slate-400 text-sm">
                {t('invite.faq1Answer')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {t('invite.faq2Question')}
              </h4>
              <p className="text-slate-700 dark:text-slate-400 text-sm">
                {t('invite.faq2Answer')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {t('invite.faq3Question')}
              </h4>
              <p className="text-slate-700 dark:text-slate-400 text-sm">
                {t('invite.faq3Answer')}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
