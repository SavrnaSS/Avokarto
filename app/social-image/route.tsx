import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";
import { PLANS, TRIAL_DAYS } from "@/lib/billing/plans";

export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f0f7e8", color: "#174d0a", padding: "64px 80px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", fontSize: 32, fontWeight: 700 }}>
        <span style={{ display: "flex", width: 20, height: 20, marginRight: 14, background: "#80aa46", borderRadius: 20 }} />
        The all-in-one dropshipping platform
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 112, fontWeight: 700, letterSpacing: -6 }}>{SITE_NAME}</span>
        <span style={{ fontSize: 36, marginTop: 14, color: "#436a32" }}>Pick winning products. Launch your store. We ship.</span>
      </div>
      <div style={{ display: "flex", fontSize: 26, borderTop: "2px solid #c6ddb1", paddingTop: 26 }}>{TRIAL_DAYS}-day free trial · Plans from ${PLANS.starter.price}/month · No inventory</div>
    </div>,
    { width: 1200, height: 630 },
  );
}
