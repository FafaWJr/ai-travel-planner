# Claude Code Prompt: Apply SEO Skill to Fiji Blog Post

## Context

You are working on the Luna Let's Go project (repo: `FafaWJr/ai-travel-planner`, Next.js 16.1.6 App Router). The blog post for Fiji exists at `https://www.lunaletsgo.com/blog/fiji-oct-2024`.

A comprehensive SEO skill has been created (`luna-blog-seo-writer-SKILL.md`) that must be applied to this post and all future blog posts.

## Objective

Apply the complete SEO skill to the Fiji blog post to ensure it is:
- SEO-optimized for Google rankings
- GEO-optimized for AI overviews (ChatGPT, Perplexity, Google AI)
- Internally linked with CTAs to Luna features and related posts
- Equipped with a comment section for logged-in users
- Schema markup complete (Article, TouristDestination, FAQPage, Breadcrumbs)
- Brand-consistent with Luna's voice and design

## Implementation Tasks

### 1. Review Current Fiji Post Structure

First, locate and review the Fiji blog post file:
- Expected location: `app/blog/fiji-oct-2024/page.tsx` or similar
- Identify current structure, content, and missing elements

### 2. Apply Meta Tags Optimization

Update the page metadata to follow SEO best practices:

```tsx
export const metadata: Metadata = {
  title: "Fiji Travel Guide 2026: Best Islands, Itineraries & Budget Tips | Luna Let's Go",
  description: "Plan your dream Fiji vacation with our complete 2026 guide. Discover the best islands, sample itineraries, budget tips, and insider advice. Start planning with Luna's AI travel planner today.",
  openGraph: {
    title: "Fiji Travel Guide 2026: Best Islands, Itineraries & Budget Tips | Luna Let's Go",
    description: "Plan your dream Fiji vacation with our complete 2026 guide. Discover the best islands, sample itineraries, budget tips, and insider advice.",
    url: "https://www.lunaletsgo.com/blog/fiji-oct-2024",
    images: [
      {
        url: "/blog/fiji-featured.jpg",
        width: 1200,
        height: 630,
        alt: "Aerial view of Yasawa Islands in Fiji with turquoise lagoons"
      }
    ],
    type: "article"
  },
  twitter: {
    card: "summary_large_image",
    title: "Fiji Travel Guide 2026: Best Islands, Itineraries & Budget Tips",
    description: "Plan your dream Fiji vacation with our complete 2026 guide.",
    images: ["/blog/fiji-featured.jpg"]
  },
  alternates: {
    canonical: "https://www.lunaletsgo.com/blog/fiji-oct-2024"
  }
};
```

### 3. Add Schema Markup

Create a schema component or add schema directly to the page. Place this in the page component:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": "Fiji Travel Guide 2026: Best Islands, Itineraries & Budget Tips",
      "description": "Plan your dream Fiji vacation with our complete 2026 guide.",
      "image": "https://www.lunaletsgo.com/blog/fiji-featured.jpg",
      "author": {
        "@type": "Organization",
        "name": "Luna Let's Go"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Luna Let's Go",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.lunaletsgo.com/LUNA-LOGO.svg"
        }
      },
      "datePublished": "2024-10-15",
      "dateModified": new Date().toISOString().split('T')[0]
    })
  }}
/>

<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "TouristDestination",
      "name": "Fiji",
      "description": "Tropical paradise with pristine beaches, vibrant coral reefs, and warm Fijian hospitality.",
      "url": "https://www.lunaletsgo.com/blog/fiji-oct-2024"
    })
  }}
/>
```

### 4. Add Breadcrumbs Component

Create a reusable breadcrumbs component at `components/BlogBreadcrumbs.tsx`:

```tsx
import Link from 'next/link';

interface BreadcrumbsProps {
  postTitle: string;
  postSlug: string;
}

export default function BlogBreadcrumbs({ postTitle, postSlug }: BreadcrumbsProps) {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.lunaletsgo.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://www.lunaletsgo.com/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": postTitle,
        "item": `https://www.lunaletsgo.com/blog/${postSlug}`
      }
    ]
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li>
            <Link href="/" className="text-[#00447B] hover:underline">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/blog" className="text-[#00447B] hover:underline">
              Blog
            </Link>
          </li>
          <li>/</li>
          <li aria-current="page" className="text-gray-600">
            {postTitle}
          </li>
        </ol>
      </nav>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema)
        }}
      />
    </>
  );
}
```

Use in the Fiji post:
```tsx
<BlogBreadcrumbs postTitle="Fiji Travel Guide 2026" postSlug="fiji-oct-2024" />
```

### 5. Add Quick Facts Box

Add this styled component near the top of the content:

```tsx
<div className="bg-[#FFBD59] border-l-4 border-[#FF8210] p-6 my-8 rounded-lg">
  <h3 className="text-[#00447B] text-xl font-semibold mb-4">Quick Facts: Fiji</h3>
  <ul className="space-y-2">
    <li><strong>Best Time to Visit:</strong> May to October (dry season)</li>
    <li><strong>Budget:</strong> $100-300 per day (depending on island and accommodation)</li>
    <li><strong>Must-See:</strong> Yasawa Islands, Cloud 9, Mamanuca Islands</li>
    <li><strong>Ideal Trip Length:</strong> 7-10 days</li>
    <li><strong>Getting Around:</strong> Island hopper flights, ferries, or seaplanes</li>
  </ul>
</div>
```

### 6. Add Internal Links and CTAs

Add these throughout the content:

**Early CTA (after introduction):**
```tsx
<div className="bg-gradient-to-br from-[#FF8210] to-[#FFBD59] p-8 my-12 rounded-xl text-center">
  <h3 className="text-white text-2xl font-bold mb-4">Ready to Plan Your Fiji Adventure?</h3>
  <p className="text-white text-base mb-6">
    Let Luna create a personalized, day-by-day itinerary tailored to your style, budget, and dates in seconds.
  </p>
  <Link 
    href="/plan" 
    className="inline-block bg-white text-[#FF8210] px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-50 transition"
  >
    Start Planning with Luna →
  </Link>
</div>
```

**Mid-content CTA (related posts):**
```tsx
<div className="bg-gray-50 p-6 my-8 rounded-lg">
  <h3 className="text-[#00447B] text-xl font-semibold mb-4">Related Articles</h3>
  <ul className="space-y-3">
    <li>
      🔗 <Link href="/trip-ideas" className="text-[#FF8210] font-semibold hover:underline">
        Explore More Tropical Destinations
      </Link>
    </li>
    <li>
      🔗 <Link href="/plan" className="text-[#FF8210] font-semibold hover:underline">
        Build Your Custom Fiji Itinerary
      </Link>
    </li>
  </ul>
</div>
```

**Affiliate CTAs:**
```tsx
<div className="border-2 border-[#FF8210] p-6 my-8 rounded-lg">
  <h4 className="text-[#00447B] text-lg font-semibold mb-3">🏨 Find Your Perfect Fiji Hotel</h4>
  <p className="text-gray-700 mb-4">
    Search thousands of hotels in Fiji with free cancellation and best price guarantee.
  </p>
  <a 
    href="https://www.awin1.com/cread.php?awinmid=18118&awinaffid=2825924&campaign=LifecycleOnboarding"
    target="_blank"
    rel="noopener noreferrer sponsored"
    className="inline-block bg-[#FF8210] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e67310] transition"
  >
    Browse Hotels on Booking.com →
  </a>
</div>

<div className="border-2 border-[#FF8210] p-6 my-8 rounded-lg">
  <h4 className="text-[#00447B] text-lg font-semibold mb-3">🎯 Book Fiji Tours & Activities</h4>
  <p className="text-gray-700 mb-4">
    Discover snorkeling, island hopping, cultural experiences, and adventure activities.
  </p>
  <a 
    href="https://affiliate.klook.com/redirect?aid=117089&aff_adid=1248864&k_site=https%3A%2F%2Fwww.klook.com%2F"
    target="_blank"
    rel="noopener noreferrer sponsored"
    className="inline-block bg-[#FF8210] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#e67310] transition"
  >
    Explore Activities on Klook →
  </a>
</div>
```

### 7. Add FAQ Section

Create a FAQ component or add directly to the page:

```tsx
<section className="mt-16 mb-12">
  <h2 className="text-[#00447B] text-3xl font-bold mb-8">Frequently Asked Questions</h2>
  
  <div className="space-y-4">
    <details className="bg-gray-50 p-6 rounded-lg">
      <summary className="font-semibold text-[#00447B] cursor-pointer">
        What is the best time to visit Fiji?
      </summary>
      <p className="mt-4 text-gray-700">
        The best time to visit Fiji is during the dry season from May to October. You'll enjoy sunny days, calm seas, and lower humidity, perfect for beach activities and island hopping.
      </p>
    </details>

    <details className="bg-gray-50 p-6 rounded-lg">
      <summary className="font-semibold text-[#00447B] cursor-pointer">
        How much does a trip to Fiji cost?
      </summary>
      <p className="mt-4 text-gray-700">
        A budget trip to Fiji costs around $100-150 per day (hostels, local food, budget activities). Mid-range travelers should budget $200-300 per day, while luxury resorts can exceed $500+ per day.
      </p>
    </details>

    <details className="bg-gray-50 p-6 rounded-lg">
      <summary className="font-semibold text-[#00447B] cursor-pointer">
        Which Fiji islands should I visit?
      </summary>
      <p className="mt-4 text-gray-700">
        The Mamanuca and Yasawa Islands are the most popular for their stunning beaches and clear waters. Taveuni is great for divers and nature lovers. Viti Levu has the capital and main airport.
      </p>
    </details>

    <details className="bg-gray-50 p-6 rounded-lg">
      <summary className="font-semibold text-[#00447B] cursor-pointer">
        Do I need a visa to visit Fiji?
      </summary>
      <p className="mt-4 text-gray-700">
        Most visitors get a free 4-month tourist visa on arrival. Check Fiji's immigration website for your specific country's requirements before traveling.
      </p>
    </details>

    <details className="bg-gray-50 p-6 rounded-lg">
      <summary className="font-semibold text-[#00447B] cursor-pointer">
        Is Fiji safe for travelers?
      </summary>
      <p className="mt-4 text-gray-700">
        Yes, Fiji is generally very safe for tourists. The Fijian people are known for their warm hospitality. Use common sense, secure your belongings, and follow local advice, especially in Suva and Nadi.
      </p>
    </details>
  </div>

  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is the best time to visit Fiji?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The best time to visit Fiji is during the dry season from May to October. You'll enjoy sunny days, calm seas, and lower humidity, perfect for beach activities and island hopping."
            }
          },
          {
            "@type": "Question",
            "name": "How much does a trip to Fiji cost?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "A budget trip to Fiji costs around $100-150 per day (hostels, local food, budget activities). Mid-range travelers should budget $200-300 per day, while luxury resorts can exceed $500+ per day."
            }
          },
          {
            "@type": "Question",
            "name": "Which Fiji islands should I visit?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The Mamanuca and Yasawa Islands are the most popular for their stunning beaches and clear waters. Taveuni is great for divers and nature lovers. Viti Levu has the capital and main airport."
            }
          },
          {
            "@type": "Question",
            "name": "Do I need a visa to visit Fiji?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Most visitors get a free 4-month tourist visa on arrival. Check Fiji's immigration website for your specific country's requirements before traveling."
            }
          },
          {
            "@type": "Question",
            "name": "Is Fiji safe for travelers?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, Fiji is generally very safe for tourists. The Fijian people are known for their warm hospitality. Use common sense, secure your belongings, and follow local advice, especially in Suva and Nadi."
            }
          }
        ]
      })
    }}
  />
</section>
```

### 8. Create Comment Section System

**Step 8.1: Create Supabase table**

Run this migration in Supabase:

```sql
CREATE TABLE blog_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_slug TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_approved BOOLEAN DEFAULT false,
  CONSTRAINT blog_comments_post_slug_fkey FOREIGN KEY (post_slug) REFERENCES blog_posts(slug) ON DELETE CASCADE
);

-- Add index for faster queries
CREATE INDEX idx_blog_comments_post_slug ON blog_comments(post_slug);
CREATE INDEX idx_blog_comments_created_at ON blog_comments(created_at DESC);

-- Enable RLS
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read approved comments
CREATE POLICY "Anyone can read approved comments"
ON blog_comments FOR SELECT
USING (is_approved = true);

-- Policy: Authenticated users can insert their own comments
CREATE POLICY "Users can insert own comments"
ON blog_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can read their own comments (even if not approved)
CREATE POLICY "Users can read own comments"
ON blog_comments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

**Step 8.2: Create comment components**

Create `components/blog/CommentForm.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface CommentFormProps {
  postSlug: string;
  onCommentAdded: () => void;
}

export default function CommentForm({ postSlug, onCommentAdded }: CommentFormProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in to comment');
      setIsSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('blog_comments')
      .insert({
        post_slug: postSlug,
        user_id: user.id,
        comment_text: comment.trim(),
        is_approved: false // Manual moderation
      });

    if (insertError) {
      setError('Failed to post comment. Please try again.');
      setIsSubmitting(false);
      return;
    }

    setComment('');
    setIsSubmitting(false);
    onCommentAdded();
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8">
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience or ask a question..."
        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8210] resize-none"
        rows={4}
        maxLength={1000}
        required
      />
      <div className="flex justify-between items-center mt-3">
        <span className="text-sm text-gray-500">{comment.length}/1000 characters</span>
        <button
          type="submit"
          disabled={isSubmitting || comment.trim().length < 10}
          className="bg-[#FF8210] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#e67310] transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      <p className="text-xs text-gray-500 mt-2">
        Your comment will be reviewed before appearing publicly.
      </p>
    </form>
  );
}
```

Create `components/blog/CommentsList.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
  };
}

interface CommentsListProps {
  postSlug: string;
  refreshTrigger?: number;
}

export default function CommentsList({ postSlug, refreshTrigger = 0 }: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchComments();
  }, [postSlug, refreshTrigger]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('blog_comments')
      .select(`
        id,
        comment_text,
        created_at,
        user_id,
        profiles (
          full_name
        )
      `)
      .eq('post_slug', postSlug)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setComments(data);
    }
    setLoading(false);
  };

  if (loading) {
    return <p className="text-gray-500">Loading comments...</p>;
  }

  if (comments.length === 0) {
    return <p className="text-gray-500 italic">No comments yet. Be the first to share your experience!</p>;
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div key={comment.id} className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#00447B] text-white flex items-center justify-center font-semibold">
                {comment.profiles?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {comment.profiles?.full_name || 'Traveler'}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(comment.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed">{comment.comment_text}</p>
        </div>
      ))}
    </div>
  );
}
```

Create `components/blog/CommentsSection.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import CommentForm from './CommentForm';
import CommentsList from './CommentsList';

interface CommentsSectionProps {
  postSlug: string;
  postTitle: string;
}

export default function CommentsSection({ postSlug, postTitle }: CommentsSectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useState(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const handleCommentAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (isAuthenticated === null) {
    return null; // Loading state
  }

  return (
    <section className="mt-16 pt-12 border-t-2 border-gray-200">
      <h2 className="text-[#00447B] text-3xl font-bold mb-4">
        Share Your {postTitle.includes('Fiji') ? 'Fiji' : ''} Experience
      </h2>
      <p className="text-gray-600 mb-8">
        Have you been to {postTitle.includes('Fiji') ? 'Fiji' : 'this destination'}? Share your tips, recommendations, or questions below!
      </p>

      {isAuthenticated ? (
        <>
          <CommentForm postSlug={postSlug} onCommentAdded={handleCommentAdded} />
          <div className="mt-12">
            <h3 className="text-[#00447B] text-xl font-semibold mb-6">Traveler Comments</h3>
            <CommentsList postSlug={postSlug} refreshTrigger={refreshTrigger} />
          </div>
        </>
      ) : (
        <div className="bg-gray-50 p-10 text-center rounded-lg">
          <p className="text-gray-700 mb-5">
            Sign in to share your travel stories and connect with fellow travelers!
          </p>
          <Link
            href={`/auth/returning?luna_redirect_after_login=/blog/${postSlug}`}
            className="inline-block bg-[#FF8210] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#e67310] transition"
          >
            Sign In to Comment
          </Link>
        </div>
      )}
    </section>
  );
}
```

**Step 8.3: Add to Fiji post**

In the Fiji post page, add at the bottom before the footer:

```tsx
import CommentsSection from '@/components/blog/CommentsSection';

// Inside the page component, at the end:
<CommentsSection postSlug="fiji-oct-2024" postTitle="Fiji Travel Guide 2026" />
```

### 9. Add Affiliate Disclosure

Add this at the very end of the post (before comments section):

```tsx
<p className="text-xs text-gray-600 mt-12 pt-8 border-t border-gray-200 italic">
  <strong>Disclosure:</strong> Luna Let's Go may earn a commission when you book through our affiliate partners (Booking.com, Klook, etc.). This helps us keep our AI travel planner free and support our small team. Your travel decisions and trust mean everything to us. Thank you for your support!
</p>
```

### 10. Optimize Images

For all images in the Fiji post:

```tsx
import Image from 'next/image';

// Update all image tags:
<Image 
  src="/blog/fiji-yasawa-sunset.jpg" 
  alt="Sunset view over Yasawa Islands in Fiji with traditional bure accommodation" 
  width={1200} 
  height={800}
  className="rounded-lg"
  priority={false}
/>

<Image 
  src="/blog/fiji-snorkeling.jpg" 
  alt="Snorkeling in crystal-clear waters of Fiji's Mamanuca Islands with colorful coral reefs" 
  width={1200} 
  height={800}
  className="rounded-lg my-8"
/>
```

Ensure all image filenames are descriptive:
- `IMG_1234.jpg` → `fiji-yasawa-islands-beach.jpg`
- `photo.png` → `fiji-cloud-9-floating-bar.jpg`

### 11. Final Heading Structure Review

Ensure proper hierarchy:

```tsx
<h1>Complete Fiji Travel Guide 2026: Best Islands, Itineraries & Budget Tips</h1>

<h2>Best Time to Visit Fiji</h2>
  <h3>Fiji Weather by Season</h3>
  
<h2>Top Fiji Islands to Visit</h2>
  <h3>Mamanuca Islands</h3>
  <h3>Yasawa Islands</h3>
  
<h2>Fiji Budget Breakdown</h2>
  <h3>Accommodation Costs</h3>
  <h3>Food & Dining</h3>
  
<h2>Sample Fiji Itineraries</h2>
  <h3>5-Day Quick Escape</h3>
  <h3>7-Day Island Hopper</h3>
  <h3>10-Day Ultimate Experience</h3>
  
<h2>Top Things to Do in Fiji</h2>
  <h3>Water Activities</h3>
  <h3>Cultural Experiences</h3>
  
<h2>Practical Fiji Travel Tips</h2>
  <h3>Getting Around</h3>
  <h3>What to Pack</h3>
  
<h2>Frequently Asked Questions</h2>
```

Never skip levels (H1 → H3 is wrong).

### 12. Add Final CTA Before Conclusion

Right before the conclusion section:

```tsx
<div className="bg-gradient-to-br from-[#FF8210] to-[#FFBD59] p-10 my-16 rounded-xl text-center">
  <h3 className="text-white text-2xl font-bold mb-4">Your Fiji Adventure Starts Here</h3>
  <p className="text-white text-lg mb-6">
    Skip the endless research. Let Luna build your perfect Fiji itinerary with personalized recommendations, budget planning, and day-by-day activities in seconds.
  </p>
  <Link 
    href="/plan" 
    className="inline-block bg-white text-[#FF8210] px-10 py-4 rounded-lg font-bold text-lg hover:bg-gray-50 transition shadow-lg"
  >
    Plan My Fiji Trip with Luna →
  </Link>
  <p className="text-white text-sm mt-4">100% free. No credit card required.</p>
</div>
```

## Implementation Checklist

After applying all changes, verify:

- [ ] Meta tags updated (title, description, Open Graph, Twitter Card)
- [ ] Canonical URL set
- [ ] Schema markup added (Article, TouristDestination, FAQPage, Breadcrumbs)
- [ ] Breadcrumbs component added at the top
- [ ] Quick Facts box added after introduction
- [ ] All images have descriptive alt text
- [ ] Image filenames are descriptive (no IMG_1234.jpg)
- [ ] Heading hierarchy is correct (one H1, proper H2/H3 nesting)
- [ ] 3+ CTAs placed strategically (early, mid, final)
- [ ] Internal links to Luna features (plan, trip-ideas, deals)
- [ ] Related blog posts linked (if available)
- [ ] Affiliate CTAs added (Booking.com, Klook)
- [ ] Affiliate disclosure at the end
- [ ] FAQ section with 5+ questions and schema
- [ ] Comment section implemented (Supabase + components)
- [ ] All content uses semantic HTML (lists, tables, bold for key facts)
- [ ] Mobile-responsive formatting verified
- [ ] Brand colors used correctly (#FF8210 orange, #00447B navy)

## Testing

Before committing:

1. **Mobile check:** View on mobile breakpoint (375px width)
2. **Schema validation:** Use Google's Rich Results Test (https://search.google.com/test/rich-results)
3. **Meta tags preview:** Check Open Graph tags with https://www.opengraph.xyz/
4. **Links check:** Test all internal and affiliate links
5. **Comment functionality:** Test comment submission (logged in + logged out states)
6. **Lighthouse audit:** Run in Chrome DevTools (aim for 90+ SEO score)

## Deployment

After testing:

```bash
git add .
git commit -m "SEO optimization: Fiji blog post with schema, CTAs, comments, and internal linking"
git push
```

Vercel will auto-deploy. Monitor deployment logs for any errors.

## Post-Deployment Verification

1. Visit https://www.lunaletsgo.com/blog/fiji-oct-2024
2. Check all CTAs and links work
3. Test comment form (both authenticated and unauthenticated states)
4. Verify schema markup with Rich Results Test
5. Check mobile rendering
6. Monitor Google Search Console for any indexing issues

---

**Note:** This prompt applies the comprehensive SEO skill to the Fiji post. All future blog posts should follow this same structure from the start by referencing the `luna-blog-seo-writer-SKILL.md` file.
