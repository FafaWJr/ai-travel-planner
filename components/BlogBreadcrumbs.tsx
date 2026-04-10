import Link from 'next/link';

interface BlogBreadcrumbsProps {
  postTitle: string;
  postSlug: string;
}

export default function BlogBreadcrumbs({ postTitle, postSlug }: BlogBreadcrumbsProps) {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.lunaletsgo.com' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.lunaletsgo.com/blog' },
      { '@type': 'ListItem', position: 3, name: postTitle, item: `https://www.lunaletsgo.com/blog/${postSlug}` },
    ],
  };

  return (
    <>
      <nav aria-label="Breadcrumb">
        <ol style={{
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0 6px',
          listStyle: 'none', padding: 0, margin: 0,
          fontFamily: "'Poppins', sans-serif", fontSize: 13, color: '#6C6D6F',
        }}>
          <li><Link href="/" style={{ color: '#00447B', textDecoration: 'none' }}>Home</Link></li>
          <li style={{ color: '#C0C0C0' }}>/</li>
          <li><Link href="/blog" style={{ color: '#00447B', textDecoration: 'none' }}>Blog</Link></li>
          <li style={{ color: '#C0C0C0' }}>/</li>
          <li aria-current="page" style={{ color: '#6C6D6F' }}>{postTitle}</li>
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
