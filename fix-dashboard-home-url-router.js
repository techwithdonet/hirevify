const fs = require("fs");

const file = "src/hirevify-app/components/AppRouter.tsx";
let s = fs.readFileSync(file, "utf8");

// Add useEffect import safely
if (!/useEffect/.test(s.split("\n").slice(0, 20).join("\n"))) {
  s = s.replace(/import\s+React\s*,?\s*\{([^}]*)\}\s+from\s+['"]react['"];?/m, (m, imports) => {
    const parts = imports.split(",").map(x => x.trim()).filter(Boolean);
    if (!parts.includes("useEffect")) parts.push("useEffect");
    return `import React, { ${parts.join(", ")} } from 'react';`;
  });

  // If file has only: import React from 'react';
  s = s.replace(/import\s+React\s+from\s+['"]react['"];?/m, `import React, { useEffect } from 'react';`);
}

// Find AppRouter function body and inject effect after props destructuring block
if (!s.includes("dashboardHomeUrlGuardApplied")) {
  const marker = /(\}\s*:\s*AppRouterProps\)\s*=>\s*\{)/m;

  if (!marker.test(s)) {
    console.error("Could not find AppRouter function start. Send lines 180-240 of AppRouter.tsx.");
    process.exit(1);
  }

  s = s.replace(marker, `$1
  // dashboardHomeUrlGuardApplied
  useEffect(() => {
    if (currentScreen !== 'homepage') return;
    if (!user?.role) return;

    const dashboardScreen =
      user.role === 'recruiter'
        ? 'recruiter-dashboard'
        : user.role === 'candidate'
          ? 'candidate-dashboard'
          : null;

    if (!dashboardScreen) return;

    setCurrentScreen(dashboardScreen as Screen, { replace: true });

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('screen', dashboardScreen);
      window.history.replaceState(null, '', \`\${window.location.pathname}?\${params.toString()}\`);
    }
  }, [currentScreen, user?.role, setCurrentScreen]);

`);
}

fs.writeFileSync(file, s, "utf8");
console.log("Dashboard homepage URL guard applied.");
