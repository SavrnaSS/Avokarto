import Signup from "@/components/other-pages/Signup";
import { pageMetadata } from "@/lib/seo";

import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Create an Account",
  description:
    "Create an Avokarto account to track orders, save favorites, and check out faster.",
  noindex: true,
});

export default function page() {
  return (
    <>
      <Signup />
    </>
  );
}
