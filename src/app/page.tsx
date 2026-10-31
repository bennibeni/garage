import "@/components/iso/iso.css";
import { GarageFigure } from "@/components/garage/figure";

export default function HomePage() {
  return (
    <div className="iso app-shell" data-theme="light">
      <main id="contenuto" className="app-main">
        <GarageFigure />
      </main>
      <footer className="projects-footer">
        <a href="https://links-page-bennibeni.vercel.app/">
          <span aria-hidden="true">← </span>All projects
        </a>
      </footer>
    </div>
  );
}
