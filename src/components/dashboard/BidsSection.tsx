import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

interface Bid {
  id: string;
  bid_amount: number;
  proposal_text: string;
  status: string;
  created_at: string;
  jobs: {
    title: string;
  };
}

interface BidsSectionProps {
  userId: string;
}

const BidsSection = ({ userId }: BidsSectionProps) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBids();
  }, [userId]);

  const loadBids = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bids")
      .select("*, jobs(title)")
      .eq("freelancer_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error loading bids:", error);
    } else {
      setBids(data || []);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <CardTitle>Your Bids</CardTitle>
        </div>
        <CardDescription>Recent proposals you've submitted</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-4">Loading bids...</p>
        ) : bids.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No bids yet. Start bidding on jobs!</p>
        ) : (
          <div className="space-y-4">
            {bids.map((bid) => (
              <div key={bid.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{bid.jobs.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {bid.proposal_text}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-semibold text-primary">
                      ${bid.bid_amount.toLocaleString()}
                    </div>
                    <Badge variant={getStatusColor(bid.status)} className="mt-1">
                      {bid.status}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Submitted {new Date(bid.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BidsSection;
