/**
 * Level Badge Component
 * Displays user level and progress
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Crown } from 'lucide-react';
import { levelService } from '../../services/walletService';

interface LevelBadgeProps {
  level: string;
  points: number;
  isLoading?: boolean;
}

export default function LevelBadge({ level, points, isLoading }: LevelBadgeProps) {
  const levelInfo = levelService.getLevelInfo(level);
  const progress = levelService.getLevelProgress(points);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">المستوى</CardTitle>
          <Crown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-2 w-full mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">المستوى</CardTitle>
        <Crown className="h-4 w-4" style={{ color: levelInfo.color }} />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: levelInfo.color }}
          >
            {level[0]}
          </div>
          <div>
            <div className="text-lg font-bold">{levelInfo.name}</div>
            <p className="text-xs text-muted-foreground">{levelInfo.description}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span>التقدم</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
