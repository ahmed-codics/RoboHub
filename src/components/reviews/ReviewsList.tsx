import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_id: string;
}

interface ReviewsListProps {
  userId: string;
}

const ReviewsList = ({ userId }: ReviewsListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    loadReviews();
  }, [userId]);

  const loadReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("reviewee_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading reviews:", error);
      setLoading(false);
      return;
    }

    // Fetch reviewer names separately
    const reviewsWithNames = await Promise.all(
      (data || []).map(async (review) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", review.reviewer_id)
          .single();
        return { ...review, reviewerName: profile?.name || "Unknown" };
      })
    );

    setReviews(reviewsWithNames as any);
    
    if (data && data.length > 0) {
      const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
      setAverageRating(Math.round(avg * 10) / 10);
    }
    
    setLoading(false);
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading reviews...</div>;
  }

  return (
    <div className="space-y-4">
      {reviews.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 fill-primary text-primary" />
            <span className="font-semibold text-lg">{averageRating}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
          </span>
        </div>
      )}
      
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium">{(review as any).reviewerName}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "fill-primary text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground mt-2">
                  {review.comment}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsList;
