const fs = require("fs");

const file = "src/hirevify-app/App.tsx";
let s = fs.readFileSync(file, "utf8");

// Remove refresh blank screen block added earlier
s = s.replace(
`
  const [hasMountedForScreenRestore, setHasMountedForScreenRestore] = useState(false);

  useEffect(() => {
    setHasMountedForScreenRestore(true);
  }, []);

  if (!hasMountedForScreenRestore) {
    return <div className="min-h-screen bg-slate-950" aria-hidden="true" />;
  }
`,
`
`
);

// Replace localStorage currentScreen state with initialScreen state
s = s.replace(
/const\s*\[\s*currentScreen\s*,\s*setCurrentScreen\s*\]\s*=\s*useState<Screen>\(\(\)\s*=>\s*\{\s*if\s*\(typeof window === ['"]undefined['"]\)\s*return ['"]homepage['"];\s*const savedScreen = window\.localStorage\.getItem\(['"]hirevify_current_screen['"]\) as Screen \| null;\s*return savedScreen \|\| ['"]homepage['"];\s*\}\);/m,
`const [currentScreen, setCurrentScreen] = useState<Screen>(() => initialScreen || 'homepage');`
);

// Fallback if still simple homepage state exists
s = s.replace(
/const\s*\[\s*currentScreen\s*,\s*setCurrentScreen\s*\]\s*=\s*useState<Screen>\(['"]homepage['"]\);/m,
`const [currentScreen, setCurrentScreen] = useState<Screen>(() => initialScreen || 'homepage');`
);

// Remove old localStorage screen persistence effect
s = s.replace(
/\s*useEffect\(\(\) => \{\s*if\s*\(typeof window === ['"]undefined['"]\) return;\s*if\s*\(currentScreen === ['"]homepage['"]\)\s*\{\s*window\.localStorage\.removeItem\(['"]hirevify_current_screen['"]\);\s*\}\s*else\s*\{\s*window\.localStorage\.setItem\(['"]hirevify_current_screen['"], currentScreen\);\s*\}\s*\}, \[currentScreen\]\);/m,
``
);

// Add URL sync effect after currentScreen state if not already added
if (!s.includes("params.set('screen', currentScreen);")) {
  s = s.replace(
/const\s*\[\s*currentScreen\s*,\s*setCurrentScreen\s*\]\s*=\s*useState<Screen>\(\(\)\s*=>\s*initialScreen\s*\|\|\s*['"]homepage['"]\);/m,
`const [currentScreen, setCurrentScreen] = useState<Screen>(() => initialScreen || 'homepage');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);

    if (currentScreen && currentScreen !== 'homepage') {
      params.set('screen', currentScreen);
    } else {
      params.delete('screen');
    }

    const query = params.toString();
    const nextUrl = query ? \`\${window.location.pathname}?\${query}\` : window.location.pathname;

    window.history.replaceState(null, '', nextUrl);
  }, [currentScreen]);`
  );
}

fs.writeFileSync(file, s, "utf8");
console.log("Google-style refresh restore patch applied.");
