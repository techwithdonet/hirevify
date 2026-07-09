const fs = require("fs");

const file = "src/hirevify-app/hooks/useAppNavigation.ts";
let s = fs.readFileSync(file, "utf8");

s = s.replace(
`    setCurrentScreen('recruiter-dashboard', { replace: true });`,
`    setCurrentScreen('recruiter-dashboard', { replace: true });

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('screen', 'recruiter-dashboard');
      window.history.replaceState(null, '', \`\${window.location.pathname}?\${params.toString()}\`);
    }`
);

s = s.replace(
`    setCurrentScreen('candidate-dashboard', { replace: true });`,
`    setCurrentScreen('candidate-dashboard', { replace: true });

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set('screen', 'candidate-dashboard');
      window.history.replaceState(null, '', \`\${window.location.pathname}?\${params.toString()}\`);
    }`
);

fs.writeFileSync(file, s, "utf8");
console.log("Dashboard URL fix applied.");
