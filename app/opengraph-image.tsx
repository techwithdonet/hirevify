import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#082014",
          color: "#f6fff1",
          display: "flex",
          fontFamily: "Inter, Arial, sans-serif",
          padding: "58px 74px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, #244830 0 78px, transparent 78px), radial-gradient(circle at 82% 20%, rgba(154,255,28,.16), transparent 28%), radial-gradient(circle at 18% 82%, rgba(86,169,72,.2), transparent 30%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            width: "52%",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 86 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                background: "#9cff1c",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#082014",
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              H
            </div>
            <div style={{ display: "flex", fontSize: 18, fontWeight: 800 }}>
              Hire<span style={{ color: "#9cff1c" }}>Vify</span>
            </div>
          </div>
          <div
            style={{
              color: "#9cff1c",
              fontSize: 16,
              letterSpacing: 2,
              fontWeight: 800,
              marginBottom: 18,
              textTransform: "uppercase",
            }}
          >
            AI-powered skills hiring
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 68, lineHeight: 1.02 }}>
            <span>Hire Smarter.</span>
            <span style={{ color: "#9cff1c", fontWeight: 850 }}>Grow Talent.</span>
          </div>
          <div style={{ color: "#c8d7ca", fontSize: 21, lineHeight: 1.55, marginTop: 26, width: 470 }}>
            A project-based hiring platform where recruiters evaluate real work and candidates prove
            skills beyond keywords.
          </div>
          <div style={{ display: "flex", gap: 36, marginTop: 42, color: "#f6fff1", fontSize: 15 }}>
            <span style={{ display: "flex" }}>
              <b>92%</b> match accuracy
            </span>
            <span style={{ display: "flex" }}>
              <b>3x</b> faster shortlisting
            </span>
          </div>
        </div>
        <div
          style={{
            position: "relative",
            display: "flex",
            width: "48%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 410,
              background: "#fbfff8",
              color: "#1d3424",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 28px 80px rgba(0,0,0,.32)",
              border: "1px solid #dbe8d4",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 26, fontWeight: 850 }}>Skill Match</span>
                <span style={{ color: "#6c7f70", fontSize: 13 }}>Save time. Hire with proof.</span>
              </div>
              <span style={{ background: "#9cff1c", color: "#082014", padding: "8px 12px", fontSize: 12, fontWeight: 850 }}>
                LIVE
              </span>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              {[
                ["92%", "Match score"],
                ["18", "Projects live"],
                ["7", "Interviews"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  style={{
                    flex: 1,
                    border: "1px solid #dce8d6",
                    background: "#ffffff",
                    padding: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                  }}
                >
                  <span style={{ color: "#244830", fontSize: 24, fontWeight: 850 }}>{value}</span>
                  <span style={{ color: "#7d8b80", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ background: "#f3f8ef", marginTop: 18, padding: 16, display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 16, fontWeight: 850 }}>Candidate Proof Board</span>
              {[98, 89, 84].map((score) => (
                <div
                  key={score}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "#ffffff",
                    border: "1px solid #dce8d6",
                    padding: 10,
                    marginTop: 10,
                  }}
                >
                  <div style={{ width: 30, height: 30, background: "#79c94b" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
                    <div style={{ height: 7, width: 150, background: "#17311f" }} />
                    <div style={{ height: 7, width: 210, background: "#b9d4ae" }} />
                  </div>
                  <span style={{ background: "#dfffba", color: "#5b9d28", padding: "5px 9px", fontSize: 12, fontWeight: 850 }}>
                    {score}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
