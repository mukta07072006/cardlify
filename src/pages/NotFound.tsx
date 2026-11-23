import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Eyebrow, Wordmark } from "@/components/studio";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-5 py-6 sm:px-6">
        <Link to="/" aria-label="Cardlify home">
          <Wordmark />
        </Link>
        <span className="mono-label text-[10px] text-foreground/35">404</span>
      </header>

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-5 pb-20 sm:px-6">
        <Eyebrow>Page not found</Eyebrow>
        <h1 className="display-xl mt-6">
          This card
          <br />
          was <span className="serif text-[1.05em]">never printed.</span>
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-foreground/55">
          The page at <span className="font-mono text-sm text-foreground/70">{location.pathname}</span> does
          not exist. It may have been renamed, or the link may have a typo.
        </p>
        <div className="mt-9">
          <Link
            to="/"
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-paper transition hover:-translate-y-0.5"
          >
            Back to the studio
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
