const fs = require("fs");

const file = "src/hirevify-app/services/projectAssignmentsService.ts";
let s = fs.readFileSync(file, "utf8");

s = s.replace(
`      console.error('Error fetching assignment stats:', error);`,
`      console.warn('Assignment stats unavailable:', {
        message: (error as any)?.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        code: (error as any)?.code,
      });`
);

fs.writeFileSync(file, s, "utf8");
console.log("Patched assignment stats console error.");
