import Footer7 from "@/components/footers/Footer7";
import Header9 from "@/components/headers/Header9";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      
        <Header9
          isFullWidth={false}
          headerClass="rbt-header rbt-header-9"
          sticky={true}
        />
        {children}
        <Footer7 />
      
    </>
  );
}
