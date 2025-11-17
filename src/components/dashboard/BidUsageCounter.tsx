import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Zap } from "lucide-react";

interface BidUsageCounterProps {
  bidsThisMonth: number;
  maxBids: number;
  isPremium: boolean;
}

const BidUsageCounter = ({ bidsThisMonth, maxBids, isPremium }: BidUsageCounterProps) => {
  const bidsRemaining = isPremium ? "Unlimited" : `${maxBids - bidsThisMonth}`;
  const percentage = isPremium ? 100 : (bidsThisMonth / maxBids) * 100;
  const isLowOnBids = !isPremium && bidsThisMonth >= maxBids * 0.8;

  return (
    <Card className={isLowOnBids ? "border-warning" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Bid Usage</CardTitle>
          {isPremium && (
            <Badge variant="default" className="gap-1">
              <Zap className="h-3 w-3" />
              Premium
            </Badge>
          )}
        </div>
        <CardDescription>
          {isPremium ? "Unlimited bids available" : "Monthly bid allowance"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Bids Used</span>
            <span className="font-semibold">
              {bidsThisMonth} {!isPremium && `/ ${maxBids}`}
            </span>
          </div>
          {!isPremium && (
            <Progress value={percentage} className="h-2" />
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">Remaining</span>
          <span className="text-lg font-bold text-primary">
            {bidsRemaining}
          </span>
        </div>

        {isLowOnBids && !isPremium && (
          <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-md border border-warning/20">
            <TrendingUp className="h-4 w-4 text-warning mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-warning">Running low on bids</p>
              <p className="text-muted-foreground mt-1">
                Upgrade to Premium for unlimited bids
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BidUsageCounter;
