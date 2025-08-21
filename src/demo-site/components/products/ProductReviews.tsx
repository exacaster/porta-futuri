import { useState, useMemo } from 'react';
import { Star, ThumbsUp, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ProductComment } from '@shared/types/product.types';

interface ProductReviewsProps {
  comments: ProductComment[];
  productRating?: number;
  reviewCount?: number;
}

interface ReviewCardProps {
  comment: ProductComment;
}

function ReviewCard({ comment }: ReviewCardProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="border-b border-gray-200 pb-6 last:border-0">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-semibold text-gray-900">{comment.reviewer_name}</span>
            <span className="text-sm text-gray-500">{formatDate(comment.date)}</span>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < comment.rating
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      
      <p className="text-gray-700 mb-3">{comment.comment}</p>
      
      {comment.helpful_count > 0 && (
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#6d02a3] transition-colors">
            <ThumbsUp className="w-4 h-4" />
            <span>Helpful ({comment.helpful_count})</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function ProductReviews({ comments, productRating, reviewCount }: ProductReviewsProps) {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest' | 'helpful'>('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const sortedComments = useMemo(() => {
    const sorted = [...comments];
    switch(sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case 'highest':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'lowest':
        return sorted.sort((a, b) => a.rating - b.rating);
      case 'helpful':
        return sorted.sort((a, b) => b.helpful_count - a.helpful_count);
      default:
        return sorted;
    }
  }, [comments, sortBy]);

  // Calculate rating distribution
  const ratingDistribution = useMemo(() => {
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    comments.forEach(comment => {
      if (comment.rating >= 1 && comment.rating <= 5) {
        distribution[comment.rating]++;
      }
    });
    return distribution;
  }, [comments]);

  // Calculate average rating if not provided
  const averageRating = productRating || (
    comments.length > 0
      ? comments.reduce((sum, c) => sum + c.rating, 0) / comments.length
      : 0
  );

  const totalReviews = comments.length;

  const sortOptions = [
    { value: 'newest', label: 'Most Recent' },
    { value: 'highest', label: 'Highest Rated' },
    { value: 'lowest', label: 'Lowest Rated' },
    { value: 'helpful', label: 'Most Helpful' }
  ];

  return (
    <div>
      {/* Review Summary */}
      {comments.length > 0 && (
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Average Rating */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('product.customerReviews')}</h3>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-[#6d02a3]">
                  {averageRating.toFixed(1)}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(averageRating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">Based on {totalReviews} reviews</p>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('product.ratingDistribution')}</h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(rating => {
                  const count = ratingDistribution[rating];
                  const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-8">{rating}★</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-[#6d02a3] h-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sort Options */}
      {comments.length > 1 && (
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{t('product.reviews')}</h3>
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm">Sort by: {sortOptions.find(o => o.value === sortBy)?.label}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {showSortDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {sortOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value as typeof sortBy);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      sortBy === option.value ? 'bg-gray-50 text-[#6d02a3]' : 'text-gray-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review List */}
      {sortedComments.length > 0 ? (
        <div className="space-y-6">
          {sortedComments.map((comment, index) => (
            <ReviewCard key={index} comment={comment} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('product.noReviews')}</h3>
          <p className="text-gray-600">{t('product.beFirstReview')}</p>
        </div>
      )}
    </div>
  );
}