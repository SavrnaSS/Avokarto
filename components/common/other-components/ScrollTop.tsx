"use client";
import { ScrollTopIcon } from "../../svg-icons/ScrollTopIcon";
import { useEffect, useState } from "react";

export default function ScrollTop() {
  const [{ scrolled, scrollHeight }, setProgress] = useState({
    scrolled: 0,
    scrollHeight: 1,
  });

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // You can use 'auto' or 'instant' as well
    });
  };

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const scrolled = window.scrollY;
      const scrollHeight = Math.max(
        document.documentElement.scrollHeight - document.documentElement.clientHeight,
        1,
      );
      setProgress((previous) =>
        previous.scrolled === scrolled && previous.scrollHeight === scrollHeight
          ? previous
          : { scrolled, scrollHeight },
      );
    };
    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(document.body);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      className={`rbt-progress-parent ${
        scrolled > 150 ? "rbt-backto-top-active" : ""
      }`}
      onClick={() => scrollToTop()}
    >
      <ScrollTopIcon scrolled={scrolled} scrollHeight={scrollHeight} />
    </div>
  );
}
