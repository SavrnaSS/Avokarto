import Footer10 from "@/components/footers/Footer10";
import Header2 from "@/components/headers/Header2";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      
        <Header2 sticky={true} />
        {children}
        <Footer10 />
      
    </>
  );
}
