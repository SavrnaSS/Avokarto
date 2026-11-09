import BreadcrumbInner from "@/components/common/other-components/BreadcrumbInner";
import { pageMetadata } from "@/lib/seo";
import PrivacyPolicy from "@/components/other-pages/privacy/PrivacyPolicy";
import Socials from "@/components/other-pages/privacy/Socials";

import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How Avokarto collects, uses, and protects your personal information when you browse and shop with us.",
  path: "/privacy-policy",
});

export default function page() {
  return (
    <>
      <BreadcrumbInner title="Privacy Policy" />
      <PrivacyPolicy />
      <Socials />
    </>
  );
}
