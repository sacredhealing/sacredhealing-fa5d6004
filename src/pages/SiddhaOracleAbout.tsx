import React from "react";

/**
 * Siddha Sound Alchemy Oracle landing page.
 * Embeds the full HTML landing at /siddha-oracle-landing.html
 */
const SiddhaOracleAbout = () => {
  return (
    <div className="fixed inset-0 w-full h-full bg-[#050505]">
      <iframe
        src="/siddha-oracle-landing.html"
        title="Siddha Sound Alchemy Oracle"
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

export default SiddhaOracleAbout;
