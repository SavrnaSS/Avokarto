import type { Metadata } from "next";
import StartStore from "@/components/seller/StartStore";
import { getSellLandingData } from "@/lib/backend/sell-landing";

// Real products for the earnings examples (the homepage's cached data).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Open your store",
  description: "Name your store, pick a theme and choose your plan. Build your branded Avokarto store and start with a 7-day free trial.",
  robots: { follow: false, index: false },
};

export default async function StartPage() {
  const data = await getSellLandingData();
  // Settings too: signed-out visitors design their store before registering.
  return <StartStore examples={data.products.slice(0, 3)} publicSettings={data.settings} />;
}
