import { pageMetadata } from "@/lib/seo";
import { FreeShippingAmount, IfFreeShipping } from "@/components/common/FreeShipping";
import Link from "next/link";

import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Frequently Asked Questions",
  description:
    "Find answers about shopping at Avokarto, choosing product options, free shipping on orders of $100 or more, and getting help with an order.",
  path: "/faq-page-01",
});

export default function page() {
  return (
    <section className="rbt-bg-color-gray-light rbt-section-gap">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-9">
            <h1 className="rbt-title mb--16">Frequently asked questions</h1>
            <p className="mb--32">
              A few useful answers before you shop. For a question about your
              order, <Link href="/contact">contact our team</Link>.
            </p>
            <details className="p--24 rbt-bg-color-white rbt-rounded--12 mb--16" open>
              <summary className="rbt-text-bold">What can I find at Avokarto?</summary>
              <p className="mt--16 mb--0">
                Our collection includes pet costumes, carriers, grooming and care
                accessories, and seasonal or novelty finds for pets and their
                people. Browse <Link href="/shop-by-categories">our categories</Link>
                {" "}to see what is available.
              </p>
            </details>
            <IfFreeShipping>
            <details className="p--24 rbt-bg-color-white rbt-rounded--12 mb--16">
              <summary className="rbt-text-bold">When do I get free shipping?</summary>
              <p className="mt--16 mb--0">
                Orders of <FreeShippingAmount /> or more (USD), after
                discounts and before shipping, qualify for free shipping. The
                saving applies automatically in your cart and checkout. Below
                that amount, checkout shows the available delivery options and
                their charges.
              </p>
            </details>
            </IfFreeShipping>
            <details className="p--24 rbt-bg-color-white rbt-rounded--12 mb--16">
              <summary className="rbt-text-bold">How do I choose a size or color?</summary>
              <p className="mt--16 mb--0">
                Check the product description and the options on its product
                page before adding it to your cart. Available sizes and colors
                vary by product. If you need help choosing, send the product
                name and your question through our <Link href="/contact">contact page</Link>.
              </p>
            </details>
            <details className="p--24 rbt-bg-color-white rbt-rounded--12 mb--16">
              <summary className="rbt-text-bold">Do I need an account to order?</summary>
              <p className="mt--16 mb--0">
                You can check out as a guest or sign in to your account. An
                account gives you access to your profile and order history.
              </p>
            </details>
            <details className="p--24 rbt-bg-color-white rbt-rounded--12 mb--16">
              <summary className="rbt-text-bold">Where can I find my order?</summary>
              <p className="mt--16 mb--0">
                Sign in and open <Link href="/my-order-history">your order history</Link>
                {" "}to see orders linked to your account. If you checked out as
                a guest or need more help, contact us with your order number and
                the email address used at checkout.
              </p>
            </details>
            <details className="p--24 rbt-bg-color-white rbt-rounded--12">
              <summary className="rbt-text-bold">Who can help with an order change or return?</summary>
              <p className="mt--16 mb--0">
                <Link href="/contact">Contact Avokarto</Link> with your order
                number, the item concerned, and what you need help with. Our
                team can review your request and explain the next steps.
              </p>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}
