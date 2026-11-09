import { permanentRedirect } from "next/navigation";

// "Sell on Avokarto" is the homepage now; old /sell links land there.
export default function SellPage() {
  permanentRedirect("/");
}
