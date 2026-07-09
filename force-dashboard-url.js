const fs = require("fs");

const file = "src/hirevify-app/App.tsx";
let s = fs.readFileSync(file, "utf8");

// Ensure useEffect is imported
s = s.replace(/import\s*\{([^}]+)\}\s*from\s*['"]react['"];?/m, (m, imports) => {
  const parts = imports.split(",").map(x => x.trim()).filter(Boolean);
  if (!parts.includes("useEffect")) parts.push("useEffect");
  return `import { ${parts.join(", ")} } from 'react';`;
});

// Add dashboard URL correction after currentScreen state
if (!s.includes("forceDashboardUrlAfterLogin")) {
  const marker = /const\s*\[\s*currentScreen\s*,\s*setCurrentScreen\s*\]\s*=\s*useState<Screen>\([\s\S]*?\);/m;

  if (!marker.test(s)) {
    console.error("Could not find currentScreen state in App.tsx");
    process.exit(1);
  }

  s = s.replace(marker, (match) => `${match}

  // forceDashboardUrlAfterLogin
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentScreen !== 'homepage') return;
    if (!user?.role) return;

    const dashboardScreen =
      user.role === 'recruiter'
        ? 'recruiter-dashboard'
        : user.role === 'candidate'
          ? 'candidate-dashboard'
          : null;

    if (!dashboardScreen) return;

    setCurrentScreen(dashboardScreen as Screen);

    const params = new URLSearchParams(window.location.search);
    params.set('screen', dashboardScreen);
    window.history.replaceState(null, '', \`\${window.location.pathname}?\${params.toString()}\`);
  }, [currentScreen, user?.role]);
`);
}

fs.writeFileSync(file, s, "utf8");
console.log("Forced dashboard URL fix added in App.tsx");
