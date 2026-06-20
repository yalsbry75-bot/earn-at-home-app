/**
 * Tasks Page
 * Display available tasks and manage task completion
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { tasksService } from '../../services/tasksService';
import { rewardsService, AD_REWARD_POINTS, type AdRewardStatus, type AdRewardSessionResult } from '../../services/rewardsService';
import type { Task, TaskType, TaskStats } from '../../types/tasks';

type ActiveAdSession = Required<Pick<AdRewardSessionResult, 'sessionId' | 'adUrl' | 'startedAt' | 'canClaimAt' | 'expiresAt'>> & {
  localStartedAtMs: number;
};

export default function TasksPage() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading, refreshUserProfile } = useAuth();
  const [, setLocation] = useLocation();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [selectedType, setSelectedType] = useState<TaskType | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [adStatus, setAdStatus] = useState<AdRewardStatus | null>(null);
  const [adSession, setAdSession] = useState<ActiveAdSession | null>(null);
  const [isStartingAd, setIsStartingAd] = useState(false);
  const [isClaimingAd, setIsClaimingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(0);
  const [visibilityLossCount, setVisibilityLossCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Subscribe to tasks
      const unsubscribe = tasksService.subscribeTasks({}, (tasks) => {
        setTasks(tasks);
        setIsLoading(false);
      });

      // Get stats
      tasksService.getTaskStats(user.id).then((stats) => {
        setStats(stats);
      });

      // Check daily login reward eligibility through backend reward status
      rewardsService.getRewardStatus()
        .then((status) => {
          setCanClaimDaily(status.canClaimDaily);
        })
        .catch((rewardError) => {
          console.warn('Reward status could not be loaded:', rewardError);
        });

      // Check rewarded advertising eligibility through backend status
      rewardsService.getAdRewardStatus()
        .then((status) => {
          setAdStatus(status);
        })
        .catch((adRewardError) => {
          console.warn('Ad reward status could not be loaded:', adRewardError);
        });

      return () => unsubscribe();
    } catch (error: any) {
      toast.error(error.message || t('errors.serverError'));
      setIsLoading(false);
    }
  }, [user, t]);

  // Filter tasks by type
  useEffect(() => {
    if (selectedType === 'all') {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter((t) => t.type === selectedType));
    }
  }, [tasks, selectedType]);

  // Track when the user leaves the page to interact with the opened advertisement tab/window.
  useEffect(() => {
    if (!adSession) return undefined;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setVisibilityLossCount((count) => count + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [adSession]);

  // Countdown until the server-side minimum interaction window can be claimed.
  useEffect(() => {
    if (!adSession?.canClaimAt) {
      setAdCountdown(0);
      return undefined;
    }

    const updateCountdown = () => {
      const secondsLeft = Math.max(0, Math.ceil((new Date(adSession.canClaimAt).getTime() - Date.now()) / 1000));
      setAdCountdown(secondsLeft);
    };

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [adSession]);

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

  const taskTypes: { value: TaskType | 'all'; label: string }[] = [
    { value: 'all', label: 'جميع المهام' },
    { value: 'ads', label: 'الإعلانات' },
    { value: 'daily_login', label: 'تسجيل يومي' },
    { value: 'app_install', label: 'تطبيقات' },
    { value: 'survey', label: 'استطلاعات' },
    { value: 'offerwall', label: 'عروض' },
    { value: 'referral', label: 'إحالات' },
    { value: 'achievement', label: 'إنجازات' },
  ];

  const showAdTaskCard = selectedType === 'all' || selectedType === 'ads';

  const getTaskTypeColor = (type: TaskType): string => {
    const colors: Record<TaskType, string> = {
      ads: 'bg-blue-100 text-blue-800',
      daily_login: 'bg-green-100 text-green-800',
      app_install: 'bg-purple-100 text-purple-800',
      survey: 'bg-yellow-100 text-yellow-800',
      offerwall: 'bg-pink-100 text-pink-800',
      referral: 'bg-orange-100 text-orange-800',
      achievement: 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getTaskTypeLabel = (type: TaskType): string => {
    const labels: Record<TaskType, string> = {
      ads: 'إعلان',
      daily_login: 'تسجيل يومي',
      app_install: 'تطبيق',
      survey: 'استطلاع',
      offerwall: 'عرض',
      referral: 'إحالة',
      achievement: 'إنجاز',
    };
    return labels[type] || type;
  };

  const formatTime = (isoDate?: string | null) => {
    if (!isoDate) return '';
    return new Date(isoDate).toLocaleString();
  };

  const getAdStatusMessage = () => {
    if (!adStatus) return 'Reward is processed securely through Firebase Functions.';
    if (!adStatus.canStart && adStatus.nextEligibleAt) {
      return `Next eligible time: ${formatTime(adStatus.nextEligibleAt)}`;
    }
    return `Daily progress: ${adStatus.dailyCount}/${adStatus.dailyLimit} rewarded advertisements claimed.`;
  };

  const refreshAdRewardStatus = async () => {
    const status = await rewardsService.getAdRewardStatus();
    setAdStatus(status);
  };

  const refreshTaskStats = async () => {
    if (!user) return;
    const updatedStats = await tasksService.getTaskStats(user.id);
    setStats(updatedStats);
  };

  const handleClaimDailyReward = async () => {
    try {
      const reward = await rewardsService.claimDailyLoginBonus();
      if (reward.granted) {
        toast.success(`تمت إضافة ${reward.points} نقاط إلى محفظتك`);
        setCanClaimDaily(false);
        await refreshUserProfile();
        await refreshTaskStats();
      } else {
        toast.info('تمت المطالبة بمكافأة تسجيل الدخول خلال آخر 24 ساعة');
        setCanClaimDaily(false);
      }
    } catch (error: any) {
      toast.error(error.message || t('errors.serverError'));
    }
  };

  const handleWatchAdvertisement = async () => {
    if (isStartingAd || isClaimingAd) return;

    setIsStartingAd(true);
    setVisibilityLossCount(0);
    const adWindow = window.open('about:blank', '_blank');

    try {
      const session = await rewardsService.startAdRewardSession();

      if (!session.started || !session.sessionId || !session.adUrl || !session.startedAt || !session.canClaimAt || !session.expiresAt) {
        if (adWindow) adWindow.close();
        if (session.reason === 'ad_reward_cooldown' && session.nextEligibleAt) {
          toast.info(`Please wait until ${formatTime(session.nextEligibleAt)} before claiming another advertisement reward.`);
        } else if (session.reason === 'daily_ad_reward_limit_reached') {
          toast.info('Daily advertisement reward limit reached. Try again tomorrow.');
        } else {
          toast.error('Advertisement reward session could not be started.');
        }
        await refreshAdRewardStatus();
        return;
      }

      setAdSession({
        sessionId: session.sessionId,
        adUrl: session.adUrl,
        startedAt: session.startedAt,
        canClaimAt: session.canClaimAt,
        expiresAt: session.expiresAt,
        localStartedAtMs: Date.now(),
      });

      if (adWindow) {
        adWindow.opener = null;
        adWindow.location.href = session.adUrl;
      } else {
        window.open(session.adUrl, '_blank', 'noopener,noreferrer');
      }

      toast.success(`Advertisement opened. Keep it open for at least ${session.minInteractionSeconds || 30} seconds, then return to claim ${AD_REWARD_POINTS} points.`);
    } catch (error: any) {
      if (adWindow) adWindow.close();
      toast.error(error.message || t('errors.serverError'));
    } finally {
      setIsStartingAd(false);
    }
  };

  const handleClaimAdvertisementReward = async () => {
    if (!adSession || isClaimingAd || adCountdown > 0) return;

    setIsClaimingAd(true);
    try {
      const reward = await rewardsService.completeAdRewardSession({
        sessionId: adSession.sessionId,
        clientInteractionMs: Date.now() - adSession.localStartedAtMs,
        visibilityLossCount,
      });

      if (reward.granted) {
        toast.success(`تمت إضافة ${reward.points} نقاط إلى محفظتك مقابل مشاهدة الإعلان`);
        setAdSession(null);
        setVisibilityLossCount(0);
        await Promise.all([
          refreshUserProfile(),
          refreshTaskStats(),
          refreshAdRewardStatus(),
        ]);
      } else if (reward.reason === 'insufficient_interaction_time' && reward.nextEligibleAt) {
        toast.info(`Please wait until ${formatTime(reward.nextEligibleAt)} before claiming the advertisement reward.`);
      } else if (reward.reason === 'duplicate_reward') {
        toast.info('This advertisement reward was already processed.');
        setAdSession(null);
        await refreshAdRewardStatus();
      } else if (reward.reason === 'ad_reward_cooldown' && reward.nextEligibleAt) {
        toast.info(`Please wait until ${formatTime(reward.nextEligibleAt)} before claiming another advertisement reward.`);
        setAdSession(null);
        await refreshAdRewardStatus();
      } else {
        toast.error(reward.reason || 'Advertisement reward verification failed.');
      }
    } catch (error: any) {
      toast.error(error.message || t('errors.serverError'));
    } finally {
      setIsClaimingAd(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">المهام</h1>
          <p className="text-muted-foreground mt-1">أكمل المهام واكسب نقاط وأموال</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">إجمالي المهام</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTasks + 1}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">مهام متاحة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.availableTasks + 1}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">مهام مكتملة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.completedTasks}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">إجمالي الأرباح</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  ${stats.totalEarnings.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Task Filters */}
        <div className="mb-8">
          <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as TaskType | 'all')}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
              {taskTypes.map((type) => (
                <TabsTrigger key={type.value} value={type.value}>
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Rewarded Advertisement Task */}
        {showAdTaskCard && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-blue-950">Watch Advertisement</CardTitle>
                <Badge className="bg-blue-100 text-blue-800">Advertisement</Badge>
              </div>
              <CardDescription className="text-blue-800">
                Watch advertisements and earn reward points.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-blue-950">Reward: {AD_REWARD_POINTS} Points</p>
                  <p className="text-blue-800">{getAdStatusMessage()}</p>
                  {adSession && (
                    <p className="text-blue-800">
                      Session expires at: {formatTime(adSession.expiresAt)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  {!adSession ? (
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleWatchAdvertisement}
                      disabled={isStartingAd || adStatus?.canStart === false}
                    >
                      {isStartingAd ? 'Starting...' : 'Watch Advertisement and Earn Points'}
                    </Button>
                  ) : (
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleClaimAdvertisementReward}
                      disabled={isClaimingAd || adCountdown > 0}
                    >
                      {isClaimingAd
                        ? 'Verifying...'
                        : adCountdown > 0
                          ? `Claim available in ${adCountdown}s`
                          : `Verify and Claim ${AD_REWARD_POINTS} Points`}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daily Login */}
        {canClaimDaily && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">تسجيل الدخول اليومي</CardTitle>
              <CardDescription className="text-green-700">
                يمكنك الآن المطالبة بمكافأة تسجيل الدخول اليومية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleClaimDailyReward}>
                المطالبة بالمكافأة
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            !showAdTaskCard && (
              <Card>
                <CardContent className="pt-8 text-center">
                  <p className="text-muted-foreground">لا توجد مهام متاحة حالياً</p>
                </CardContent>
              </Card>
            )
          ) : (
            filteredTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{task.title.ar}</h3>
                        <Badge className={getTaskTypeColor(task.type)}>
                          {getTaskTypeLabel(task.type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {task.description.ar}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">
                          المكافأة: {task.rewardPoints.toLocaleString()} نقطة
                        </span>
                        <span className="text-green-600 font-bold">
                          ${task.rewardUSD.toFixed(2)}
                        </span>
                        {task.provider && (
                          <span className="text-muted-foreground">
                            {task.provider}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button className="whitespace-nowrap">
                      ابدأ المهمة
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
