# Blog Comment System Documentation

## Overview
The Luna Let's Go blog has a comment system that allows authenticated users to post comments on blog posts. Comments are auto-approved and display the user's name from their profile.

## Database Schema

### Table: `blog_comments`
```sql
CREATE TABLE blog_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_slug TEXT NOT NULL,
  user_id UUID NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_approved BOOLEAN DEFAULT true
);

-- Indexes
CREATE INDEX idx_blog_comments_post_slug ON blog_comments(post_slug);
CREATE INDEX idx_blog_comments_created_at ON blog_comments(created_at DESC);
```

### CRITICAL: Foreign Key Configuration

**❌ WRONG (will break Supabase client joins):**
```sql
-- DO NOT DO THIS
ALTER TABLE blog_comments
ADD CONSTRAINT blog_comments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id);
```

**✅ CORRECT (enables Supabase client joins):**
```sql
-- ALWAYS DO THIS
ALTER TABLE blog_comments
ADD CONSTRAINT blog_comments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE CASCADE;
```

**Why this matters:**
- The Supabase JS client uses foreign key metadata to auto-join tables
- If the FK points to `auth.users`, the client can't join to `profiles` to get user names
- The FK MUST point directly to `profiles(id)` for `.select('profiles(full_name)')` to work
- This was the root cause of comments not displaying (April 2026 bug fix)

## RLS Policies

### Public Read Access (Approved Comments)
```sql
CREATE POLICY "Anyone can read approved comments"
ON blog_comments FOR SELECT
TO public
USING (is_approved = true);
```

### Authenticated Users Can Insert
```sql
CREATE POLICY "Users can insert own comments"
ON blog_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

### Users Can Read Their Own Comments
```sql
CREATE POLICY "Users can read own comments"
ON blog_comments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

### Public Read Access to Profiles (For Comment Authors)
```sql
CREATE POLICY "profiles_select_all_public"
ON profiles FOR SELECT
TO public
USING (true);
```

**Note:** Profiles must be publicly readable so comment author names can be displayed to all users.

## Frontend Components

### Component Structure
```
CommentsSection (main wrapper)
├── CommentForm (submission form)
└── CommentsList (display comments)
```

### Location
- `components/blog/CommentsSection.tsx`
- `components/blog/CommentForm.tsx`
- `components/blog/CommentsList.tsx`

### Usage in Blog Posts
```tsx
import CommentsSection from '@/components/blog/CommentsSection';

export default function BlogPost() {
  return (
    <>
      {/* Blog post content */}
      
      <CommentsSection 
        postSlug="fiji-oct-2024" 
        postTitle="Fiji Travel Guide 2026" 
      />
    </>
  );
}
```

## Supabase Query Syntax

### Fetching Comments with User Names
```typescript
const { data, error } = await supabase
  .from('blog_comments')
  .select(`
    id,
    comment_text,
    created_at,
    profiles (
      full_name
    )
  `)
  .eq('post_slug', postSlug)
  .eq('is_approved', true)
  .order('created_at', { ascending: false });
```

**Key points:**
- `profiles (full_name)` - follows the FK to get profile data
- Works because FK points to `profiles(id)`, not `auth.users(id)`
- Returns nested structure: `comment.profiles.full_name`

### Inserting Comments
```typescript
const { data: { user } } = await supabase.auth.getUser();

const { error } = await supabase
  .from('blog_comments')
  .insert({
    post_slug: postSlug,
    user_id: user.id,
    comment_text: comment.trim(),
    is_approved: true  // Auto-approve
  });
```

## Behavior

### Auto-Approval
- Comments are auto-approved (`is_approved: true`)
- No manual moderation required in current implementation
- Comments appear immediately after posting

### Authentication
- Users must be logged in to post comments
- Unauthenticated users see "Sign In to Comment" CTA
- Redirect back to blog post after login via `luna_redirect_after_login`

### Refresh Mechanism
- Uses `refreshKey` prop to trigger re-fetch after comment submission
- Increments key in parent component → triggers useEffect in CommentsList
- No page reload required

## Common Issues and Fixes

### Issue: Comments Not Showing
**Root Cause:** Foreign key points to `auth.users` instead of `profiles`

**Fix:**
```sql
ALTER TABLE blog_comments DROP CONSTRAINT blog_comments_user_id_fkey;
ALTER TABLE blog_comments
ADD CONSTRAINT blog_comments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
```

### Issue: "Could not load comments" Error
**Possible causes:**
1. RLS policies blocking access
2. Missing public read policy on profiles
3. Foreign key misconfiguration

**Debugging:**
```typescript
// Add console logs to CommentsList
console.log('Fetch result:', { data, error });
```

## SEO Integration

Comments are part of the blog SEO strategy:
- Increases engagement metrics (time on page)
- Provides user-generated content
- Shows social proof for destinations
- Integrated with overall blog schema markup

## Future Enhancements (Not Yet Implemented)

Potential features for future consideration:
- Comment moderation dashboard
- Reply threading
- Upvotes/helpful markers
- Spam detection/filtering
- Email notifications for new comments
- Comment editing (within time limit)

## Testing Checklist

When deploying comment system to a new blog post:

- [ ] Verify FK points to `profiles(id)` not `auth.users(id)`
- [ ] Check RLS policies are enabled on `blog_comments`
- [ ] Verify `profiles` table has public read policy
- [ ] Test unauthenticated view (should see existing comments, CTA to sign in)
- [ ] Test authenticated view (should see comment form)
- [ ] Post test comment, verify it appears immediately
- [ ] Verify user name displays correctly
- [ ] Check mobile responsive layout
- [ ] Verify login redirect works (`luna_redirect_after_login`)

## Migration History

- **2026-04-10:** Initial blog_comments table creation
- **2026-04-10:** Fixed FK from `auth.users` to `profiles` (critical bug fix)
- **2026-04-10:** Added public read policy on profiles for comment authors

---

**Last Updated:** April 10, 2026  
**Status:** ✅ Production-ready
