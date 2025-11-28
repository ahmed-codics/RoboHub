import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";

interface PaymentIntent {
  id: string;
  job_id: string;
  amount: number;
  platform_fee: number;
  total_amount: number;
  payment_status: string;
  created_at: string;
  completed_at: string | null;
  jobs: {
    title: string;
  };
}

interface PaymentStatusCardProps {
  userId: string;
}

const PaymentStatusCard = ({ userId }: PaymentStatusCardProps) => {
  const [recentPayments, setRecentPayments] = useState<PaymentIntent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentPayments();
  }, [userId]);

  const loadRecentPayments = async () => {
    const { data, error } = await supabase
      .from("job_payment_intents")
      .select(`
        *,
        jobs(title)
      `)
      .eq("client_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error loading payments:", error);
    } else {
      setRecentPayments((data as any) || []);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            {status}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Loading payment history...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (recentPayments.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Payments</CardTitle>
        <CardDescription>Your latest platform fee payments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentPayments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex-1">
                <p className="font-medium text-sm">{payment.jobs?.title || "Job Payment"}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(payment.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold">${payment.total_amount}</p>
                  <p className="text-xs text-muted-foreground">
                    (Fee: ${payment.platform_fee})
                  </p>
                </div>
                {getStatusBadge(payment.payment_status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentStatusCard;
