export default function StickyMobileCta() {
  return (
    <div
      className="sticky-mobile-cta"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: "#f4efe6",
        borderTop: "1px solid #e3dccd",
        padding: "0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom))",
        display: "none",
      }}
    >
      <a
        href="/login"
        style={{
          display: "block",
          textAlign: "center",
          width: "100%",
          padding: ".75rem 1rem",
          borderRadius: 8,
          fontSize: ".95rem",
          fontWeight: 600,
          background: "#b4451f",
          color: "#fff",
          textDecoration: "none",
        }}
      >
        Get started free
      </a>
      <style>{`
        @media (max-width: 767px) {
          .sticky-mobile-cta { display: block !important; }
        }
      `}</style>
    </div>
  );
}
