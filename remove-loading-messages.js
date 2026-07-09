const fs = require("fs");

const file = "src/hirevify-app/App.tsx";
let s = fs.readFileSync(file, "utf8");

s = s.replace(
`  if (!hasMountedForScreenRestore) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <p className="text-sm text-white/70">Restoring your dashboard...</p>
        </div>
      </div>
    );
  }`,
`  if (!hasMountedForScreenRestore) {
    return <div className="min-h-screen bg-slate-950" aria-hidden="true" />;
  }`
);

s = s.replace(
`<p className="text-sm text-white/70">Restoring your dashboard...</p>`,
``
);

s = s.replace(
`<p className="text-sm text-white/70">Loading HireVify...</p>`,
``
);

fs.writeFileSync(file, s, "utf8");
console.log("Removed visible loading messages.");
