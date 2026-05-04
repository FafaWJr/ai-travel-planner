'use client';

// components/place-preview/PlacePreviewSkeleton.tsx
// Shimmer skeleton that mirrors the PlacePreviewCard layout.
// Shown immediately on hover/tap before data arrives.

const SHIMMER_KEYFRAMES = `
@keyframes placePreviewShimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
`;

const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, #F0F0F0 25%, #E8E8E8 50%, #F0F0F0 75%)',
  backgroundSize: '800px 100%',
  animation: 'placePreviewShimmer 1.5s ease-in-out infinite',
  borderRadius: 4,
};

export function PlacePreviewSkeleton() {
  return (
    <div
      style={{
        width: 320,
        borderRadius: 12,
        overflow: 'hidden',
        background: '#FFFFFF',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        border: '1px solid #E8E8E8',
      }}
    >
      <style>{SHIMMER_KEYFRAMES}</style>

      {/* Photo placeholder */}
      <div style={{ ...shimmerStyle, width: '100%', height: 200, borderRadius: 0 }} />

      {/* Content area */}
      <div style={{ padding: '12px 16px 16px' }}>
        {/* Name */}
        <div style={{ ...shimmerStyle, width: '65%', height: 18, marginBottom: 8 }} />
        {/* Rating + type */}
        <div style={{ ...shimmerStyle, width: '45%', height: 14, marginBottom: 8 }} />
        {/* Address */}
        <div style={{ ...shimmerStyle, width: '80%', height: 13, marginBottom: 8 }} />
        {/* Summary line 1 */}
        <div style={{ ...shimmerStyle, width: '90%', height: 13, marginBottom: 4 }} />
        {/* Summary line 2 */}
        <div style={{ ...shimmerStyle, width: '60%', height: 13 }} />
      </div>
    </div>
  );
}
