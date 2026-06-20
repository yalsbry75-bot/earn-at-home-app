import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { withdrawalService } from '../../services/withdrawalService';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { Shield, CheckCircle, Clock, AlertCircle, Camera, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { KYCData } from '../../types/withdrawals';

export default function KYC() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [kyc, setKyc] = useState<KYCData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadKYC();
    }
  }, [user]);

  const loadKYC = async () => {
    try {
      const data = await withdrawalService.getKYCData(user!.id);
      setKyc(data);
      if (data) {
        setFullName(data.fullName || '');
        setCountry(data.country || '');
        setIdNumber(data.idNumber || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitLevel1 = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await withdrawalService.submitKYCLevel1(user!.id, fullName, country);
      toast.success(t('kyc.level1Success'));
      loadKYC();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center">{t('common.loading')}</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          {t('kyc.title')}
        </h1>
        <p className="text-muted-foreground mt-2">{t('kyc.subtitle')}</p>
      </div>

      <div className="grid gap-6">
        {/* Level 1: Basic Info */}
        <Card className={`p-6 border-l-4 ${kyc?.level! >= 1 ? 'border-l-green-500' : 'border-l-blue-500'}`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold">{t('kyc.level1Title')}</h2>
              <p className="text-sm text-muted-foreground">{t('kyc.level1Desc')}</p>
            </div>
            {kyc?.level! >= 1 ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {t('kyc.required')}
              </span>
            )}
          </div>

          {kyc?.level! < 1 ? (
            <form onSubmit={handleSubmitLevel1} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">{t('kyc.fullName')}</label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{t('kyc.country')}</label>
                  <Input value={country} onChange={e => setCountry(e.target.value)} required />
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('common.saving') : t('kyc.submitLevel1')}
              </Button>
            </form>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">{t('kyc.fullName')}:</span> {kyc?.fullName}</div>
              <div><span className="text-muted-foreground">{t('kyc.country')}:</span> {kyc?.country}</div>
            </div>
          )}
        </Card>

        {/* Level 2: ID Verification */}
        <Card className={`p-6 border-l-4 ${kyc?.level! >= 2 ? (kyc?.status === 'verified' ? 'border-l-green-500' : 'border-l-yellow-500') : 'border-l-slate-200'}`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold">{t('kyc.level2Title')}</h2>
              <p className="text-sm text-muted-foreground">{t('kyc.level2Desc')}</p>
            </div>
            {kyc?.level! >= 2 ? (
              kyc?.status === 'verified' ? <CheckCircle className="w-6 h-6 text-green-500" /> :
              kyc?.status === 'pending' ? <Clock className="w-6 h-6 text-yellow-500" /> :
              <AlertCircle className="w-6 h-6 text-red-500" />
            ) : null}
          </div>

          {kyc?.level! < 1 ? (
            <div className="p-4 bg-slate-50 rounded text-sm text-muted-foreground text-center">
              {t('kyc.completeLevel1First')}
            </div>
          ) : kyc?.level === 1 || kyc?.status === 'rejected' ? (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 cursor-pointer">
                  <Camera className="w-8 h-8 text-muted-foreground" />
                  <span className="text-xs text-center">{t('kyc.uploadIdFront')}</span>
                </div>
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-xs text-center">{t('kyc.uploadIdBack')}</span>
                </div>
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 cursor-pointer">
                  <Camera className="w-8 h-8 text-muted-foreground" />
                  <span className="text-xs text-center">{t('kyc.uploadSelfie')}</span>
                </div>
              </div>
              <Button className="w-full" disabled={true}>{t('kyc.submitLevel2')}</Button>
              <p className="text-[10px] text-center text-muted-foreground">{t('kyc.privacyNote')}</p>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded flex items-center gap-3">
              {kyc?.status === 'pending' ? (
                <>
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">{t('kyc.statusPending')}</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">{t('kyc.statusVerified')}</span>
                </>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
