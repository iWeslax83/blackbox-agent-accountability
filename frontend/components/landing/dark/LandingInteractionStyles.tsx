// frontend/components/landing/dark/LandingInteractionStyles.tsx
import { ACCENT_TEXT } from "@/lib/landingTheme";

export default function LandingInteractionStyles() {
  return (
    <style>{`
      .landing-btn {
        transition: transform 100ms ease-out;
      }
      .landing-btn:active {
        transform: scale(0.97);
      }
      .landing-btn:focus-visible {
        outline: 2px solid ${ACCENT_TEXT};
        outline-offset: 3px;
      }
      .landing-link:focus-visible {
        outline: 2px solid ${ACCENT_TEXT};
        outline-offset: 2px;
        border-radius: 2px;
      }
    `}</style>
  );
}
