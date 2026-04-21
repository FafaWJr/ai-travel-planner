# Luna Let's Go — Blog Post Template & Standards
## Canonical Reference (based on Fiji, Rio, Japan Part 1 live posts)

> This document is the authoritative reference for all future blog posts.
> Always copy `japan-may-2025-part-1/page.tsx` as the base file for any new post.

---

## 1. Page File Location

```
app/[locale]/blog/[post-slug]/page.tsx
```

---

## 2. Page-Level Metadata

```tsx
export const metadata: Metadata = {
  title: "[Post Title] | Luna Let's Go Blog",
  description: "[130-155 char description with keyword, value prop and CTA]",
  openGraph: {
    title: "[Post Title]",
    description: "[OG description]",
    url: "https://www.lunaletsgo.com/blog/[slug]",
    type: "article",
  },
};
```

---

## 3. JSON-LD Schema (inside page JSX)

Two schemas required:

### BreadcrumbList
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.lunaletsgo.com" },
    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.lunaletsgo.com/blog" },
    { "@type": "ListItem", "position": 3, "name": "[Post Title]", "item": "https://www.lunaletsgo.com/blog/[slug]" }
  ]
}
```

### BlogPosting
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "[Post Title]",
  "description": "[Description]",
  "image": "https://www.lunaletsgo.com/blog/[folder]/Hero.jpeg",
  "author": { "@type": "Person", "name": "Wilson & Fatima", "url": "https://www.lunaletsgo.com/about" },
  "publisher": {
    "@type": "Organization",
    "name": "Luna Let's Go",
    "logo": { "@type": "ImageObject", "url": "https://www.lunaletsgo.com/lunaletsgo-logo.jpeg" }
  },
  "datePublished": "YYYY-MM-DD",
  "dateModified": "YYYY-MM-DD",
  "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.lunaletsgo.com/blog/[slug]" }
}
```

---

## 4. Page Structure (top-level JSX)

```
<main style="padding-top:68px; min-height:100vh; background:#F7F8FA; font-family:'Inter',sans-serif">
  <div style="max-width:1100px; margin:0 auto; padding:3rem 1.5rem 5rem">

    [BREADCRUMB NAV + schema]

    [HEADER SECTION]

    [HERO IMAGE — class="blog-hero-img"]

    <div class="blog-layout" style="display:grid; grid-template-columns:1fr 320px; gap:3rem; align-items:start">
      <article>
        [HIGHLIGHTS BOX]
        [DAY SECTIONS]
        [TIPS SECTION]
        [FAQ SECTION]
        [READ ALSO SECTION]
        [FINAL CTA BLOCK]
        [AFFILIATE DISCLAIMER paragraph — inside article, before </article>]
      </article>
      <aside>
        [TRIP SNAPSHOT card]
        [DON'T MISS card]
        [WHERE WE STAYED card]
        [GETTING AROUND card]  (optional, destination-specific)
        [PLAN CTA button]
      </aside>
    </div>

  </div>

  [COMMENTS DIV — empty div, client-side rendered]
  [DISCLOSURE BAR — gray #f0f0f0 banner]
  [MOBILE CSS <style> block]

</main>
```

---

## 5. Header Section

```tsx
<header style={{marginBottom:'2.5rem'}}>
  {/* Category pill + country flag */}
  <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:'1.2rem', flexWrap:'wrap'}}>
    <span style={{background:'rgba(255,130,16,0.12)', color:'#FF8210', fontFamily:"'Poppins',sans-serif",
      fontSize:12, fontWeight:700, letterSpacing:'1.2px', textTransform:'uppercase',
      padding:'5px 14px', borderRadius:20}}>
      [Category] · Travel Story
    </span>
    <div style={{display:'inline-flex', alignItems:'center', gap:6,
      background:'rgba(0,68,123,0.07)', padding:'5px 12px', borderRadius:20}}>
      <span style={{fontSize:14}}>🇯🇵</span>  {/* country flag emoji */}
      <span style={{fontFamily:"'Poppins',sans-serif", fontSize:12, fontWeight:600, color:'#00447B'}}>
        Japan
      </span>
    </div>
  </div>

  {/* H1 */}
  <h1 style={{fontFamily:"'Poppins',sans-serif", fontWeight:700,
    fontSize:'clamp(1.8rem, 4vw, 2.8rem)', color:'#00447B', lineHeight:1.2,
    marginBottom:'1rem', maxWidth:780}}>
    [Post Title]
  </h1>

  {/* Subtitle/tagline */}
  <p style={{fontSize:'1.15rem', color:'#6C6D6F', lineHeight:1.65,
    maxWidth:680, marginBottom:'1.5rem', fontStyle:'italic'}}>
    [Subtitle]
  </p>

  {/* Author + meta row */}
  <div style={{display:'flex', alignItems:'center', gap:20, flexWrap:'wrap'}}>
    <div style={{display:'flex', alignItems:'center', gap:10}}>
      <div style={{width:36, height:36, borderRadius:'50%', background:'#00447B',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:"'Poppins',sans-serif", fontSize:13, fontWeight:700, color:'#fff'}}>
        WF
      </div>
      <div>
        <div style={{fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:14, color:'#00447B'}}>
          Wilson &amp; Fatima
        </div>
        <div style={{fontFamily:"'Poppins',sans-serif", fontSize:12, color:'#6C6D6F'}}>
          [Date] · [X] min read
        </div>
      </div>
    </div>
  </div>
</header>
```

---

## 6. Hero Image

```tsx
<div className="blog-hero-img"
  style={{position:'relative', width:'100%', height:420,
    borderRadius:20, overflow:'hidden', marginBottom:12}}>
  <Image
    src="/blog/[folder]/Hero.jpeg"
    alt="[Descriptive alt text with keyword]"
    fill
    priority
    style={{objectFit:'cover'}}
    sizes="(max-width: 768px) 100vw, 1100px"
  />
</div>
<p style={{fontFamily:"'Inter',sans-serif", fontSize:13, color:'#6C6D6F',
  textAlign:'center', fontStyle:'italic', marginBottom:'2.5rem'}}>
  [Hero caption]
</p>
```

---

## 7. Highlights Box ("What's in this post")

**REQUIRED at the top of every article, before Day 1.**

```tsx
<div style={{
  background:'linear-gradient(135deg, #00447B 0%, #005fa3 60%, #0077b6 100%)',
  borderRadius:16, padding:'1.75rem 2rem', marginBottom:'2.5rem',
  position:'relative', overflow:'hidden'
}}>
  <div style={{position:'absolute', top:-30, right:-20, width:120, height:120,
    background:'rgba(255,255,255,0.05)', borderRadius:'50%'}} />
  <h3 style={{fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:'1rem',
    color:'#FFBD59', marginBottom:'1rem', textTransform:'uppercase', letterSpacing:'0.06em'}}>
    What's in this post
  </h3>
  <ul style={{listStyle:'none', padding:0, margin:0,
    display:'flex', flexDirection:'column', gap:8}}>
    {['Bullet 1', 'Bullet 2', 'Bullet 3'].map(item => (
      <li key={item} style={{display:'flex', alignItems:'flex-start', gap:10,
        fontSize:'0.92rem', color:'rgba(255,255,255,0.88)', lineHeight:1.6}}>
        <span style={{width:6, height:6, borderRadius:'50%', background:'#FFBD59',
          marginTop:7, flexShrink:0}} />
        {item}
      </li>
    ))}
  </ul>
</div>
```

---

## 8. Day Section Structure

**Order: day badge FIRST, then H2 with descriptive section title.**

```tsx
{/* Day badge — orange pill */}
<div style={{display:'inline-flex', alignItems:'center', gap:8,
  background:'rgba(255,130,16,0.12)', borderRadius:20, padding:'5px 16px',
  marginBottom:12}}>
  <span style={{width:8, height:8, borderRadius:'50%', background:'#FF8210', flexShrink:0}} />
  <span style={{fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:12,
    color:'#FF8210', letterSpacing:'1px', textTransform:'uppercase'}}>
    Day 1 - January 22
  </span>
</div>

{/* H2 — descriptive section title, NOT "Day X: Title" */}
<h2 style={{fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:'1.4rem',
  color:'#00447B', margin:'2.5rem 0 1rem', position:'relative', paddingLeft:'1.1rem'}}>
  <span style={{position:'absolute', left:0, top:'0.2em', bottom:'0.2em',
    width:4, background:'#FF8210', borderRadius:2}} />
  Scooters Along Copacabana, Caipirinhas at Ipanema and Samba in Lapa
</h2>

{/* Body paragraphs */}
<p style={{fontSize:'1.05rem', lineHeight:1.85, color:'#2a2a3e', marginBottom:'1.5rem'}}>
  [Paragraph text]
</p>
```

**Body text standards:**
- `fontSize: '1.05rem'`
- `lineHeight: 1.85`
- `color: '#2a2a3e'`
- `marginBottom: '1.5rem'`

---

## 9. Photo Containers

### Single landscape photo (16:9)
```tsx
<div style={{position:'relative', width:'100%', aspectRatio:'16/9',
  borderRadius:14, overflow:'hidden', marginTop:'2rem', marginBottom:8}}>
  <Image src="/blog/[folder]/photo.jpeg" alt="[Alt text]" fill
    style={{objectFit:'cover'}} sizes="700px" />
</div>
<p style={{fontSize:'0.8rem', color:'#6C6D6F', textAlign:'center', margin:'4px 0 24px'}}>
  <em>[Caption]</em>
</p>
```

### Single portrait/vertical photo (3:4)
```tsx
<div style={{position:'relative', width:'100%', aspectRatio:'3/4',
  borderRadius:14, overflow:'hidden', marginTop:'2rem', marginBottom:8}}>
  <Image src="/blog/[folder]/photo.jpeg" alt="[Alt text]" fill
    style={{objectFit:'cover'}} sizes="700px" />
</div>
<p style={{fontSize:'0.8rem', color:'#6C6D6F', textAlign:'center', margin:'4px 0 24px'}}>
  <em>[Caption]</em>
</p>
```

### Photo duo (2 side-by-side) — landscape pair
```tsx
<div className="blog-photo-duo"
  style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, margin:'2rem 0'}}>
  <div style={{position:'relative', aspectRatio:'4/3', borderRadius:10, overflow:'hidden'}}>
    <Image src="/blog/[folder]/photo1.jpeg" alt="[Alt 1]" fill
      style={{objectFit:'cover'}} sizes="340px" />
  </div>
  <div style={{position:'relative', aspectRatio:'4/3', borderRadius:10, overflow:'hidden'}}>
    <Image src="/blog/[folder]/photo2.jpeg" alt="[Alt 2]" fill
      style={{objectFit:'cover'}} sizes="340px" />
  </div>
</div>
<p style={{fontSize:'0.8rem', color:'#6C6D6F', textAlign:'center', margin:'4px 0 24px'}}>
  <em>[Shared caption]</em>
</p>
```

### Photo duo (2 side-by-side) — portrait pair
Same as above but `aspectRatio:'3/4'` for each cell.

### Photo trio (3 side-by-side)
```tsx
<div className="blog-photo-duo"
  style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, margin:'2rem 0'}}>
  {/* three cells, each aspectRatio:'3/4' or '4/3' */}
</div>
```

---

## 10. Mid-Article CTA Block

Placed approximately halfway through the article, between day sections.

```tsx
<div style={{
  background:'linear-gradient(135deg, #00447B 0%, #005fa3 100%)',
  borderRadius:16, padding:'2rem', margin:'3rem 0', color:'#fff', textAlign:'center'
}}>
  <div style={{fontFamily:"'Poppins',sans-serif", fontWeight:700,
    fontSize:'1.2rem', marginBottom:'0.6rem', lineHeight:1.3}}>
    Planning your own [Destination] trip?
  </div>
  <p style={{fontFamily:"'Inter',sans-serif", fontSize:'0.95rem',
    opacity:0.88, lineHeight:1.6, marginBottom:'1.4rem'}}>
    Luna builds personalised itineraries in seconds.
  </p>
  <a href="/start" style={{display:'inline-block', background:'#FF8210',
    color:'#fff', fontFamily:"'Poppins',sans-serif", fontWeight:700,
    fontSize:14, padding:'12px 28px', borderRadius:10, textDecoration:'none'}}>
    Plan my [Destination] trip with Luna
  </a>
</div>
```

---

## 11. Practical Tips Section

```tsx
{/* Warning tip box */}
<div style={{background:'#FFF8F0', borderLeft:'4px solid #FF8210',
  padding:'20px 24px', margin:'32px 0', borderRadius:8}}>
  <strong style={{fontFamily:"'Poppins',sans-serif", color:'#FF8210',
    display:'block', marginBottom:8}}>
    [Tip Title]
  </strong>
  <p style={{fontSize:'0.95rem', color:'#2a2a3e', lineHeight:1.7, margin:0}}>
    [Tip content]
  </p>
</div>

{/* Regular tip */}
<p style={{fontSize:'1.05rem', lineHeight:1.85, color:'#2a2a3e', marginBottom:'1.5rem'}}>
  <strong>[Tip Label].</strong> [Tip text]
</p>
```

---

## 12. FAQ Section

```tsx
<h2 style={{fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:'1.4rem',
  color:'#00447B', margin:'2.5rem 0 1rem', position:'relative', paddingLeft:'1.1rem'}}>
  <span style={{position:'absolute', left:0, top:'0.2em', bottom:'0.2em',
    width:4, background:'#FF8210', borderRadius:2}} />
  Frequently Asked Questions
</h2>
<div style={{display:'flex', flexDirection:'column', gap:'1.2rem', marginBottom:'2.5rem'}}>
  <details style={{background:'#fff', borderRadius:12,
    border:'1px solid rgba(0,68,123,0.10)', padding:'1rem 1.25rem'}}>
    <summary style={{fontFamily:"'Poppins',sans-serif", fontWeight:600,
      fontSize:'0.95rem', color:'#00447B', cursor:'pointer', listStyle:'none'}}>
      [Question?] +
    </summary>
    <p style={{fontSize:'0.9rem', lineHeight:1.7, color:'#444',
      marginTop:'0.8rem', paddingTop:'0.8rem',
      borderTop:'1px solid rgba(0,68,123,0.08)', marginBottom:0}}>
      [Answer]
    </p>
  </details>
  {/* Repeat for each Q&A */}
</div>
```

---

## 13. Read Also Section

```tsx
<h2 style={{...same H2 style...}}>Read Also</h2>
<div style={{display:'flex', flexDirection:'column', gap:'0.75rem', marginBottom:'2.5rem'}}>
  {[
    { href:'/blog/japan-may-2025-part-1', label:'Japan Part 1: Osaka, Kyoto, Nara & Hiroshima' },
    { href:'/blog/fiji-oct-2024', label:'Fiji October 2024: Islands and Slow Travel' },
    { href:'/blog/rio-de-janeiro-5-days', label:'Rio de Janeiro in 5 Days' },
  ].map(link => (
    <a key={link.href} href={link.href}
      style={{display:'flex', alignItems:'center', gap:10,
        padding:'0.85rem 1rem', background:'#fff', borderRadius:10,
        border:'1px solid rgba(0,68,123,0.10)', textDecoration:'none',
        fontFamily:"'Poppins',sans-serif", fontSize:'0.9rem',
        fontWeight:600, color:'#00447B'}}>
      <span style={{width:6, height:6, borderRadius:'50%',
        background:'#FF8210', flexShrink:0}} />
      {link.label}
    </a>
  ))}
</div>
```

---

## 14. Final CTA Block

```tsx
<div style={{
  background:'linear-gradient(135deg, #FF8210 0%, #e07010 100%)',
  borderRadius:16, padding:'2rem', margin:'2rem 0', textAlign:'center', color:'#fff'
}}>
  <div style={{fontFamily:"'Poppins',sans-serif", fontWeight:700,
    fontSize:'1.2rem', marginBottom:'0.6rem', lineHeight:1.3}}>
    [Destination] inspired you. Now make it happen.
  </div>
  <p style={{fontFamily:"'Inter',sans-serif", fontSize:'0.9rem',
    opacity:0.9, lineHeight:1.6, marginBottom:'1.4rem', maxWidth:480, margin:'0 auto 1.4rem'}}>
    Luna plans your full [Destination] trip, personalised to your travel style, budget and group.
  </p>
  <a href="/start" style={{display:'inline-block', background:'#fff',
    color:'#FF8210', fontFamily:"'Poppins',sans-serif", fontWeight:700,
    fontSize:14, padding:'12px 28px', borderRadius:10, textDecoration:'none'}}>
    Build my [Destination] itinerary
  </a>
</div>
```

---

## 15. Affiliate Disclaimer (inside article, before `</article>`)

```tsx
<p style={{fontFamily:"'Inter',sans-serif", fontSize:'0.78rem', color:'#9CA3AF',
  lineHeight:1.6, marginTop:'3rem', paddingTop:'1.5rem',
  borderTop:'1px solid #f0f0f0', marginBottom:0}}>
  Some links in this post are affiliate links. If you book through them, Luna Let's Go
  earns a small commission at no extra cost to you. We only link to experiences and hotels
  we actually used.
</p>
```

---

## 16. Sidebar Cards

The `<aside>` is inside the `blog-layout` grid. All cards use the same base style:

**Card wrapper:**
```tsx
<div style={{
  background:'#fff', borderRadius:16, padding:'1.5rem',
  boxShadow:'0 2px 16px rgba(0,68,123,0.08)',  /* shadow, NO border */
  marginBottom:'1.5rem'
}}>
```

**Card header:**
```tsx
<div style={{
  fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:14, color:'#00447B',
  marginBottom:'1rem', paddingBottom:'0.75rem',
  borderBottom:'2px solid #FF8210'   /* solid orange, not faded rgba */
}}>
  Card Title
</div>
```

### 16a. Trip Snapshot Card

Uses flex key-value rows (NOT `<ul><li>` list):

```tsx
{[
  { label:'Destinations', value:'Osaka, Kyoto, Nara, Hiroshima' },
  { label:'Duration', value:'7 days' },
  { label:'When', value:'May 2025' },
  { label:'Dates', value:'Apr 30 to May 6' },
  { label:'Travellers', value:'Couple' },
  { label:'Currency', value:'Japanese Yen (JPY)' },
].map(row => (
  <div key={row.label} style={{display:'flex', justifyContent:'space-between',
    alignItems:'center', padding:'9px 0', borderBottom:'1px solid #f0f0f0', fontSize:13}}>
    <span style={{color:'#6C6D6F'}}>{row.label}</span>
    <span style={{fontFamily:"'Poppins',sans-serif", fontWeight:600,
      color:'#00447B', textAlign:'right', maxWidth:'60%'}}>
      {row.value}
    </span>
  </div>
))}
{/* Trip Style tags */}
<div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start',
  padding:'9px 0', fontSize:13}}>
  <span style={{color:'#6C6D6F', paddingTop:2}}>Trip Style</span>
  <div style={{display:'flex', flexWrap:'wrap', gap:5, justifyContent:'flex-end', maxWidth:'60%'}}>
    {['Food','Culture','City'].map(tag => (
      <span key={tag} style={{background:'rgba(0,68,123,0.08)', color:'#00447B',
        fontFamily:"'Poppins',sans-serif", fontSize:11, fontWeight:600,
        padding:'3px 8px', borderRadius:10, whiteSpace:'nowrap'}}>{tag}</span>
    ))}
  </div>
</div>

{/* Plan CTA button */}
<a href="/start" style={{display:'block', background:'#FF8210', color:'#fff',
  textAlign:'center', padding:'0.85rem', borderRadius:10,
  fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:14,
  textDecoration:'none', marginTop:'1.25rem'}}>
  Plan your [Destination] trip
</a>
```

### 16b. Don't Miss Card (highlights)

Plain text bullets (no links unless linking to a bookable activity):

```tsx
<ul style={{listStyle:'none', padding:0, margin:0}}>
  {['Highlight 1','Highlight 2','Highlight 3'].map((item, i, arr) => (
    <li key={item} style={{display:'flex', alignItems:'flex-start', gap:10,
      padding:'8px 0',
      borderBottom: i < arr.length-1 ? '1px solid #f0f0f0' : 'none',
      fontSize:13, color:'#2a2a3e'}}>
      <span style={{width:8, height:8, borderRadius:'50%', background:'#FF8210',
        marginTop:5, flexShrink:0}} />
      {item}
    </li>
  ))}
</ul>
```

### 16c. Where We Stayed Card

Simple name + dates + orange button (not heavy bordered cards):

```tsx
<div style={{display:'flex', flexDirection:'column', gap:12}}>
  {hotels.map((hotel, i) => (
    <div key={hotel.name} style={{
      ...(i > 0 ? {borderTop:'1px solid #f0f0f0', paddingTop:12} : {})
    }}>
      <div style={{fontFamily:"'Poppins',sans-serif", fontWeight:600,
        fontSize:13, color:'#00447B', marginBottom:4}}>
        {hotel.name}
      </div>
      <div style={{fontSize:12, color:'#6C6D6F', marginBottom:8}}>
        {hotel.city} · {hotel.nights}
      </div>
      <a href={hotel.bookingUrl} target="_blank" rel="nofollow sponsored noopener"
        style={{display:'inline-block', background:'#FF8210', color:'#fff',
          fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:12,
          padding:'8px 14px', borderRadius:8, textDecoration:'none'}}>
        Check on Booking.com
      </a>
    </div>
  ))}
</div>

{/* Affiliate badge */}
<div style={{display:'flex', alignItems:'center', gap:5,
  background:'rgba(0,100,180,0.08)', borderRadius:6, padding:'5px 8px',
  fontFamily:"'Poppins',sans-serif", fontSize:10, fontWeight:600,
  color:'#00448b', marginTop:12}}>
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <circle cx="6" cy="6" r="5" stroke="#00448b" strokeWidth="1.2"/>
    <path d="M4 6l1.5 1.5L8 4" stroke="#00448b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
  Links open on Booking.com via affiliate
</div>
```

### 16d. Getting Around Card (optional)

Plain list with bold labels:
```tsx
<ul style={{listStyle:'none', padding:0, margin:0,
  fontFamily:"'Inter',sans-serif", fontSize:'0.88rem', color:'#444', lineHeight:1.9}}>
  <li><strong style={{color:'#00447B'}}>Label:</strong> Value</li>
</ul>
```

---

## 17. Comments Section

**After `</div>` closing the `blog-layout` grid and before the disclosure bar:**

```tsx
{/* Empty div — client-side CommentsSection renders here */}
<div style={{maxWidth:1100, margin:'0 auto', padding:'0 1.5rem 5rem'}}>
  {/* CommentsSection component renders inside this */}
</div>
```

In the TSX, this should use the `CommentsSection` component:
```tsx
<div style={{maxWidth:1100, margin:'0 auto', padding:'0 1.5rem 5rem'}}>
  <CommentsSection postSlug="[post-slug]" />
</div>
```

**CommentsSection behaviour:**
- Logged-in users: can submit a comment (name pre-filled from profile)
- Logged-out users: see "Sign in to leave a comment" prompt
- Uses `blog_comments` table in Supabase, FK to `profiles(id)`
- Auto-approve (`is_approved: true`) on insert
- Query pattern: `.select('id,comment_text,created_at,profiles(full_name)').eq('is_approved',true)`

---

## 18. Disclosure Bar

**Immediately after the comments div, before the `<style>` block:**

```tsx
<div style={{background:'#f0f0f0', padding:'1rem 2rem', textAlign:'center'}}>
  <p style={{fontFamily:"'Poppins',sans-serif", fontSize:'0.72rem', color:'#6C6D6F',
    maxWidth:700, margin:'0 auto'}}>
    <strong>Disclosure:</strong> Luna Let's Go earns a small commission when you book through
    affiliate links (Booking.com, Klook, GoWithGuide) at no extra cost to you. We only link
    to places and services we have actually used or genuinely recommend. Thank you for
    supporting our small team.
  </p>
</div>
```

---

## 19. Mobile CSS `<style>` Block

**Required at the end of `<main>`, before `</main>`:**

```tsx
<style>{`
  @media (max-width: 768px) {
    main > div {
      padding: 1.5rem 1rem 3rem !important;
    }
    .blog-hero-img {
      height: 220px !important;
      border-radius: 12px !important;
    }
    .blog-layout {
      display: flex !important;
      flex-direction: column !important;
      gap: 2rem !important;
    }
    .blog-layout > article {
      width: 100%;
      min-width: 0;
    }
    .blog-layout > aside {
      width: 100%;
    }
    blockquote {
      padding: 1rem 1.1rem !important;
      margin: 1.5rem 0 !important;
    }
    blockquote p {
      font-size: 1rem !important;
    }
    .blog-photo-duo {
      grid-template-columns: 1fr !important;
    }
    .blog-photo-trio {
      grid-template-columns: 1fr !important;
    }
  }
  @media (max-width: 480px) {
    .blog-photo-duo {
      display: flex !important;
      flex-direction: column !important;
    }
  }
`}</style>
```

---

## 20. Affiliate Link Rules

| Partner | Use Case | Link Format |
|---------|----------|-------------|
| Booking.com (Awin) | Hotels | `https://www.awin1.com/cread.php?awinmid=18118&awinaffid=2825924&campaign=LifecycleOnboarding&ued=[encoded-hotel-url]` |
| Klook | Tours, tickets, experiences | `https://affiliate.klook.com/redirect?aid=117089&aff_adid=1248864&k_site=[encoded-klook-url]` |
| GoWithGuide | Guided local tours | `https://tidd.ly/4s8kRkI` |
| Xcaret | Mexico parks only | `https://tidd.ly/4sH1xfw` |

All affiliate links: `target="_blank" rel="nofollow sponsored noopener"`

**Placement:**
- Hotels: in the Where We Stayed sidebar card AND inline in article when hotel is first mentioned
- Activities: inline in article text at the natural moment of mention (Klook or GoWithGuide)
- Klook sidebar "Don't Miss" items: wrap in `<a>` with Klook affiliate link

---

## 21. SEO Checklist (per post)

- [ ] Unique meta title (50-60 chars) containing destination keyword
- [ ] Meta description (130-155 chars) with keyword + value prop
- [ ] BreadcrumbList JSON-LD
- [ ] BlogPosting JSON-LD
- [ ] One H1 (post title in header)
- [ ] H2s for each day section and tips/FAQ
- [ ] Hero image with descriptive alt text containing keyword
- [ ] All images have descriptive alt text
- [ ] Internal links to related posts in "Read Also"
- [ ] Internal link to `/start` in CTA blocks
- [ ] Canonical URL set in metadata
- [ ] Open Graph tags complete

---

## 22. GEO (AI Search) Checklist

- [ ] "What's in this post" highlights box (structured summary for AI extraction)
- [ ] FAQ section with `<details>` accordion pattern
- [ ] Tips in clear paragraph format with bold labels
- [ ] Short paragraphs (3-4 sentences max)
- [ ] Disclosure of affiliate relationships

---

## 23. CSS Classes Used

| Class | Purpose |
|-------|---------|
| `blog-layout` | Main 2-column grid (article + aside) |
| `blog-hero-img` | Hero image container (height:420px desktop, 220px mobile) |
| `blog-photo-duo` | 2-column photo grid |
| `blog-photo-trio` | 3-column photo grid |
| `highlights-grid` | Highlights grid (used in some posts) |
