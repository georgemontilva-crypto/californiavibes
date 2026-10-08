import { cn } from "@/lib/utils";
import { ArrowUp } from "lucide-react";
import { useEffect, useState, type RefObject } from "react";

/**
 * A "back to top" arrow that shows up once the footer comes into view.
 *
 * It waits for the footer on purpose: the pages are long, and an arrow floating
 * over the jars the whole way down would sit on top of content it is not needed
 * for yet. On a page short enough that the footer is visible without scrolling
 * there is nowhere to go back to, so it also needs the page to have been
 * scrolled.
 */
export function BackToTop({
  footerRef,
}: {
  footerRef: RefObject<HTMLElement | null>;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      const footer = footerRef.current;
      if (!footer) return;
      const footerInView =
        footer.getBoundingClientRect().top < window.innerHeight;
      setVisible(footerInView && window.scrollY > 300);
    };
    // One measurement per frame at most, however fast scroll events arrive.
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [footerRef]);

  const goUp = () => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={goUp}
      aria-label="Back to top"
      // Stays mounted so it can fade, so while hidden it has to be out of the
      // tab order and unclickable.
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={cn(
        "btn btn-gold fixed bottom-5 right-5 z-40 h-13 min-h-0 w-13 p-0 transition-[opacity,translate,background-color] duration-200 md:bottom-8 md:right-8",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      )}
    >
      <ArrowUp className="h-6 w-6" strokeWidth={2.4} />
    </button>
  );
}
