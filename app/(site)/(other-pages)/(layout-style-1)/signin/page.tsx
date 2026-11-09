import Signin from "@/components/other-pages/Signin";
import { pageMetadata } from "@/lib/seo";

import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Sign In",
  description:
    "Sign in to your Avokarto account to track orders, manage your wishlist, and check out faster.",
  noindex: true,
});

export default function page() {
  return (
    <>
      <Signin />
    </>
  );
}
