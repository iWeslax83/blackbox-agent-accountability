// frontend/components/BrandMark.tsx
export default function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" stroke="#b4451f" strokeWidth="1.6" />
      <path d="M7.5 12L10.2 14.6L16 8.4" stroke="#f4efe6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
