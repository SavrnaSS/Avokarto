import Footer10 from "@/components/footers/Footer10";
import Header2 from "@/components/headers/Header2";

export default function Layout({ children }: { children: React.ReactNode }) {
  // Catalog pages validate their category/page before the response streams.
  // A loading.tsx here would flush HTTP 200 before notFound() can set 404.
  // Live catalog updates retain their component-level loading boundaries.
  return (
    <>
      <Header2 sticky={true} />
      {children}
      <Footer10 />
    </>
  );
}
