import "@/components/iso/iso.css";
import { GarageFigure } from "@/components/garage/figure";

import { CarPreview } from "@/components/car-preview/preview";

export default function HomePage() {
  return (
    <div className="iso app-shell" data-theme="light">
      <main id="contenuto" className="app-main">
        <GarageFigure />
        <CarPreview />
      </main>
      <footer className="projects-footer">
        <a href="https://links-page-bennibeni.vercel.app/">
          <span aria-hidden="true">← </span>All projects
        </a>
      </footer>
    </div>
  );
}
