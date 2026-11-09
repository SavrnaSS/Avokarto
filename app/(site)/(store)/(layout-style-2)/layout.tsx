import Footer10 from "@/components/footers/Footer10";
import Header7 from "@/components/headers/Header7";

export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header7 sticky={true} />
      {children}
      <Footer10 />
    </>
  );
}
