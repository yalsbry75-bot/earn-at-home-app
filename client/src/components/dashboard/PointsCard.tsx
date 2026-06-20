/**
 * Points Card Component
 * Displays user points information
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap } from 'lucide-react';
import { levelService } from '../../services/walletService';

interface PointsCardProps {
  points: number;
  isLoading?: boolean;
}

export default function PointsCard({ points, isLoading }: PointsCardProps) {
  const pointsToUSD = (points: number) => (points / 1000).toFixed(2);
  const nextLevelPoints = levelService.getPointsForNextLevel(points);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">النقاط</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">النقاط</CardTitle>
        <Zap className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{points.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">
          ≈ ${pointsToUSD(points)} USD
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {nextLevelPoints > 0 ? `${nextLevelPoints} نقطة للمستوى التالي` : 'وصلت للمستوى الأقصى'}
        </p>
      </CardContent>
    </Card>
  );
}
