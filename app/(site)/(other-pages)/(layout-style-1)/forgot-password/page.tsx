import ForgotPassword from "@/components/other-pages/ForgotPassword";
import { pageMetadata } from "@/lib/seo";

import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Reset Your Password",
  description:
    "Reset your Avokarto account password.",
  noindex: true,
});

export default function page() {
  return (
    <>
      <ForgotPassword />
    </>
  );
}
