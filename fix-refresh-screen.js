const fs = require("fs");

const appPath = "src/hirevify-app/App.tsx";
const navPath = "src/hirevify-app/hooks/useAppNavigation.ts";

let app = fs.readFileSync(appPath, "utf8");

// Ensure useEffect is imported from react
app = app.replace(/import\s*\{([^}]+)\}\s*from\s*['"]react['"];?/m, (match, imports) => {
  const parts = imports.split(",").map(s => s.trim()).filter(Boolean);
  if (!parts.includes("useEffect")) parts.push("useEffect");
  return `import { ${parts.join(", ")} } from 'react';`;
});

// Replace currentScreen state initialization
const currentScreenRegex =
  /const\s*\[\s*currentScreen\s*,\s*setCurrentScreen\s*\]\s*=\s*useState<Screen>\(\s*['"]homepage['"]\s*\);/m;

if (!currentScreenRegex.test(app)) {
  console.error("Could not find: const [currentScreen, setCurrentScreen] = useState<Screen>('homepage');");
  console.error("No changes made to App.tsx.");
  process.exit(1);
}

app = app.replace(
  currentScreenRegex,
`const [currentScreen, setCurrentScreen] = useState<Screen>(() => {
    if (typeof window === 'undefined') return 'homepage';

    const savedScreen = window.localStorage.getItem('hirevify_current_screen') as Screen | null;

    return savedScreen || 'homepage';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (currentScreen === 'homepage') {
      window.localStorage.removeItem('hirevify_current_screen');
    } else {
      window.localStorage.setItem('hirevify_current_screen', currentScreen);
    }
  }, [currentScreen]);`
);

fs.writeFileSync(appPath, app, "utf8");

// Patch logout to clear saved screen
let nav = fs.readFileSync(navPath, "utf8");

const logoutTarget = "setCurrentScreen('homepage', { replace: true });";
const logoutPatch =
`if (typeof window !== 'undefined') {
      window.localStorage.removeItem('hirevify_current_screen');
    }

    setCurrentScreen('homepage', { replace: true });`;

if (nav.includes(logoutTarget) && !nav.includes("window.localStorage.removeItem('hirevify_current_screen')")) {
  nav = nav.replace(logoutTarget, logoutPatch);
  fs.writeFileSync(navPath, nav, "utf8");
}

console.log("Refresh screen persistence patch applied successfully.");
