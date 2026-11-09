import BreadcrumbInner from "@/components/common/other-components/BreadcrumbInner";
import Socials from "@/components/other-pages/privacy/Socials";
import ReturnPolicy from "@/components/store/ReturnPolicy";

export default function ReturnPolicyPage() {
  return (
    <>
      <BreadcrumbInner title="Return Policy" />
      <ReturnPolicy />
      <Socials />
    </>
  );
}
