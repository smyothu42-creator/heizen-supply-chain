"use client";

import { useEffect, useState } from "react";

/**
 * Whether the masthead should be showing.
 *
 * Scrolling down hides it, scrolling up brings it back, and it is always shown
 * within the first screen. That is the standard behaviour and it is worth
 * saying why it suits this product specifically: Research Full runs three to
 * four screens and the six surface tabs are irrelevant while you are reading
 * one of them — but the moment a consultant scrolls *up*, they are looking for
 * something, and what they are most often looking for is another surface.
 *
 * Three details that make the difference between this and a header that
 * flickers:
 *
 * - **A threshold.** Sub-pixel and elastic scrolls fire constantly; reversing
 *   on every one of them makes the header twitch. `DELTA` ignores anything
 *   under 8px.
 * - **`TOP` is not zero.** The header stays put for the first 80px so that a
 *   small nudge down from the top does not hide it before you have read
 *   anything.
 * - **`passive: true`.** This listener runs on every scroll frame; a
 *   non-passive one lets the browser assume it might `preventDefault` and
 *   costs scroll smoothness on exactly the long documents this exists for.
 *
 * Reduced motion is handled where the transform is, not here — the hiding is
 * still correct, it just stops being animated.
 */
const DELTA = 8;
const TOP = 80;

export function useMastheadVisible() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let last = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const moved = y - last;
      if (Math.abs(moved) < DELTA) return;
      last = y;
      setVisible(y < TOP || moved < 0);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return visible;
}
