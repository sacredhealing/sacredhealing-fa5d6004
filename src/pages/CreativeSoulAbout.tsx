import React from "react";

/**
 * Creative Soul Studio landing page.
 * Embeds the full HTML landing at /creative-soul-landing.html
 */
const CreativeSoulAbout = () => {
  return (
    <div className="fixed inset-0 w-full h-full bg-[#050505]">
      <iframe
        src="/creative-soul-landing.html"
        title="Creative Soul Studio"
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

export default CreativeSoulAbout;
