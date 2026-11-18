import { Base } from "../../_includes/components/Base.tsx";
import { Footer } from "../../_includes/components/Footer.tsx";

export const data = { permalink: "/liability-waiver/complete/" };

const SLIDES = [
  ["DSC_7336.jpg", "Eugene Fusion dancers"],
  ["DSC_7428.jpg", "Eugene Fusion dance floor"],
  ["DSC_7472.jpg", "Eugene Fusion evening"],
  ["DSC_8032.jpg", "Eugene Fusion gathering"],
  ["DSC_8091.jpg", "Eugene Fusion dance"],
] as const;

export default function LiabilityWaiverComplete() {
  return (
    <Base
      title="Liability Waiver Complete - Harmonic Fusion"
      analytics={false}
      stylesheets={["/site.css", "/learning.css", "/home.css"]}
      scripts={["home"]}
    >
      <div className="container">
        <header className="page-header">
          <h1>Liability Waiver Complete 🎉</h1>
          <p className="lede">
            Thank you. Your liability waiver has been submitted successfully.
          </p>
        </header>

        <div
          className="carousel"
          data-carousel
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Eugene Fusion photos"
        >
          <div className="carousel-viewport">
            <div className="carousel-track" data-carousel-track>
              {SLIDES.map(([file, alt]) => (
                <div className="carousel-slide" data-carousel-slide key={file}>
                  <img
                    src={`/images/eugene/web/${file}`}
                    alt={alt}
                    loading="lazy"
                    width="1200"
                    height="800"
                  />
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="carousel-btn prev"
            data-carousel-prev
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            type="button"
            className="carousel-btn next"
            data-carousel-next
            aria-label="Next photo"
          >
            ›
          </button>
          <div
            className="carousel-dots"
            data-carousel-dots
            role="tablist"
            aria-label="Slide indicators"
          ></div>
        </div>

        <Footer />
      </div>
    </Base>
  );
}
