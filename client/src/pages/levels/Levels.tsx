/**
 * Levels Page
 * Display user level information and progression
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { levelService, walletService } from '../../services/walletService';

export default function LevelsPage() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [points, setPoints] = useState(0);
  const [currentLevel, setCurrentLevel] = useState('Bronze');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    setIsLoading(true);

    const loadPoints = async () => {
      try {
        const wallet = await walletService.getWallet();
        if (wallet) {
          const totalPoints = wallet.totalEarnings;
          setPoints(totalPoints);
          setCurrentLevel(levelService.calculateLevel(totalPoints));
        }
        setIsLoading(false);
      } catch (error: any) {
        toast.error(error.message || t('errors.serverError'));
        setIsLoading(false);
      }
    };

    loadPoints();
  }, [user, t]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    setLocation('/login');
    return null;
  }

  const levels = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  const currentLevelIndex = levels.indexOf(currentLevel);
  const progress = levelService.getLevelProgress(points);
  const pointsForNext = levelService.getPointsForNextLevel(points);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{t('levels.title')}</h1>
          <p className="text-gray-400">{t('levels.description')}</p>
        </div>

        {/* Current Level */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle>{t('levels.currentLevel')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-3xl font-bold text-white">{currentLevel}</p>
                <p className="text-gray-400 mt-2">
                  {levelService.getLevelInfo(currentLevel).description}
                </p>
              </div>
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold"
                style={{
                  backgroundColor: levelService.getLevelInfo(currentLevel).color,
                }}
              >
                {currentLevel[0]}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">{t('levels.progress')}</span>
                <span className="text-white font-semibold">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              <p className="text-sm text-gray-400 mt-2">
                {pointsForNext > 0
                  ? t('levels.pointsNeeded', { points: pointsForNext })
                  : t('levels.maxLevel')}
              </p>
            </div>

            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
              <p className="text-blue-300">
                <strong>{t('levels.bonus')}:</strong>{' '}
                {levelService.getLevelInfo(currentLevel).bonus}% {t('levels.bonusDescription')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* All Levels */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle>{t('levels.allLevels')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {levels.map((level, index) => {
                const levelInfo = levelService.getLevelInfo(level);
                const isCurrentLevel = level === currentLevel;
                const isPassed = currentLevelIndex > index;

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isCurrentLevel
                        ? 'bg-slate-700/50 border-blue-500'
                        : isPassed
                          ? 'bg-slate-700/30 border-slate-600'
                          : 'bg-slate-700/20 border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                          style={{ backgroundColor: levelInfo.color }}
                        >
                          {level[0]}
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white">{levelInfo.name}</p>
                          <p className="text-gray-400">{levelInfo.description}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {t('levels.range', {
                              min: levelInfo.minPoints,
                              max:
                                levelInfo.maxPoints === Infinity
                                  ? t('levels.unlimited')
                                  : levelInfo.maxPoints,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={
                            isCurrentLevel
                              ? 'bg-blue-600'
                              : isPassed
                                ? 'bg-green-600'
                                : 'bg-gray-600'
                          }
                        >
                          {isCurrentLevel
                            ? t('levels.current')
                            : isPassed
                              ? t('levels.completed')
                              : t('levels.locked')}
                        </Badge>
                        <p className="text-2xl font-bold text-white mt-2">
                          +{levelInfo.bonus}%
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-8 flex gap-4">
          <Button
            onClick={() => setLocation('/dashboard')}
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-slate-900"
          >
            {t('common.back')}
          </Button>
          <Button
            onClick={() => setLocation('/tasks')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {t('levels.earnMore')}
          </Button>
        </div>
      </div>
    </div>
  );
}
