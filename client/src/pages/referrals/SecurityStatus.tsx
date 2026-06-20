import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { antifraudService } from '../../services/antifraudService';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { AlertCircle, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { RiskScore, FraudFlag } from '../../types/referrals';

export default function SecurityStatus() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [fraudFlags, setFraudFlags] = useState<FraudFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const loadSecurityData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get risk score
        const risk = await antifraudService.calculateRiskScore(user.id);
        setRiskScore(risk);

        // Get fraud flags
        const flags = await antifraudService.getFraudFlags(user.id);
        setFraudFlags(flags);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load security data';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadSecurityData();
  }, [user]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'medium':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'high':
        return <AlertTriangle className="w-6 h-6 text-orange-600" />;
      case 'critical':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Shield className="w-6 h-6 text-slate-600" />;
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 max-w-md">
          <p className="text-red-600">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Shield className="w-10 h-10" />
            {t('security.title')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">{t('security.subtitle')}</p>
        </div>

        {/* Risk Score Card */}
        {riskScore && (
          <Card className="mb-6 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{t('security.riskScore')}</h2>
                <p className="text-slate-600 dark:text-slate-400">
                  {t('security.lastUpdated')}: {new Date(riskScore.lastUpdated).toLocaleString()}
                </p>
              </div>
              {getRiskIcon(riskScore.level)}
            </div>

            {/* Risk Score Visualization */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold">{riskScore.score}/100</span>
                <Badge className={getRiskColor(riskScore.level)}>
                  {t(`security.level.${riskScore.level}`)}
                </Badge>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    riskScore.level === 'low'
                      ? 'bg-green-500'
                      : riskScore.level === 'medium'
                      ? 'bg-yellow-500'
                      : riskScore.level === 'high'
                      ? 'bg-orange-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${riskScore.score}%` }}
                ></div>
              </div>
            </div>

            {/* Risk Factors */}
            <div>
              <h3 className="font-semibold mb-3">{t('security.riskFactors')}</h3>
              <div className="space-y-2">
                {riskScore.factors.length === 0 ? (
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {t('security.noRiskFactors')}
                  </p>
                ) : (
                  riskScore.factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {t(`security.factor.${factor.name}`)}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {factor.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {factor.value.toFixed(0)}/100
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {t('security.weight')}: {(factor.weight * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Fraud Flags */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">{t('security.fraudFlags')}</h2>

          {fraudFlags.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                {t('security.noFraudFlags')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {fraudFlags.map((flag) => (
                <div
                  key={flag.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    flag.severity === 'critical'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                      : flag.severity === 'high'
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
                      : flag.severity === 'medium'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                        {t(`security.flagType.${flag.flagType}`)}
                      </h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                        {flag.description}
                      </p>
                    </div>
                    <Badge
                      className={
                        flag.severity === 'critical'
                          ? 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-200'
                          : flag.severity === 'high'
                          ? 'bg-orange-200 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200'
                          : flag.severity === 'medium'
                          ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
                          : 'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                      }
                    >
                      {t(`security.severity.${flag.severity}`)}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mt-3">
                    <span>{t('security.action')}: {t(`security.action.${flag.action}`)}</span>
                    <span>{new Date(flag.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Security Tips */}
        <Card className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
          <h3 className="text-lg font-bold mb-3 text-blue-900 dark:text-blue-100">
            {t('security.tips')}
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
              <span>{t('security.tip1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
              <span>{t('security.tip2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
              <span>{t('security.tip3')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
              <span>{t('security.tip4')}</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
