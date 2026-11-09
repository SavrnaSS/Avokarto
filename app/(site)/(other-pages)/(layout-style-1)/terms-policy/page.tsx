import Terms from "@/components/other-pages/privacy/Terms";
import { pageMetadata } from "@/lib/seo";
import Socials from "@/components/other-pages/privacy/Socials";
import BreadcrumbInner from "@/components/common/other-components/BreadcrumbInner";

import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Terms & Conditions",
  description:
    "The terms that apply when you shop at Avokarto, including orders, pricing, payments, shipping, and returns.",
  path: "/terms-policy",
});

export default function page() {
  return (
    <>
      <BreadcrumbInner title="Terms & Policy" />
      <Terms />
      <Socials />
    </>
  );
}
