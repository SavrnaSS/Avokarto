import Footer3 from "@/components/footers/Footer3";
import Header3 from "@/components/headers/Header3";
import Banner from "@/components/homes/home-fashion/Banner";
import Categories from "@/components/homes/home-fashion/Categories";
import CategoryScroll from "@/components/homes/home-fashion/CategoryScroll";
import Hero from "@/components/homes/home-fashion/Hero";
import LookbookProducts from "@/components/homes/home-fashion/LookbookProducts";
import Products1 from "@/components/homes/home-fashion/Products1";
import Products2 from "@/components/homes/home-fashion/Products2";
import Products3 from "@/components/homes/home-fashion/Products3";
import SingleProduct from "@/components/homes/home-fashion/SingleProduct";
import VideosSection from "@/components/homes/home-fashion/VideosSection";

export default function HomeFashionPage() {
  return (
    <>
      <Header3 sticky={true} showNewIn={false} />
      {/* Keep a page heading for assistive technology without shifting the hero. */}
      <h1 className="visually-hidden">Pet accessories, gadgets &amp; playful finds</h1>
      <Hero />
      <CategoryScroll />
      <Categories />
      <Products1 />
      <Banner />
      <Products2 />
      <SingleProduct />
      <LookbookProducts />
      <Products3 />
      <VideosSection />
      <Footer3 />
    </>
  );
}
