import { pageMetadata } from "@/lib/seo";
import { FreeShippingAmount, IfFreeShipping } from "@/components/common/FreeShipping";
import Link from "next/link";

import { Metadata } from "next";

export const metadata: Metadata = pageMetadata({
  title: "Help Center",
  description:
    "Find help with Avokarto orders, product options, free shipping, and your account, or contact the store about a purchase.",
  path: "/help-center",
});

export default function page() {
  return (
    <section className="rbt-bg-color-gray-light rbt-section-gap">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-9">
            <h1 className="rbt-title mb--16">How can we help?</h1>
            <p className="mb--32">
              Find your order, check your account details, or get a hand choosing
              something from the shop.
            </p>
            <div className="row row--16">
              <div className="col-md-6 mb--24">
                <div className="p--24 rbt-bg-color-white rbt-rounded--12 h-100">
                  <h2 className="h5">Orders and updates</h2>
                  <p>Sign in to review orders linked to your account and their current status.</p>
                  <Link href="/my-order-history">Open order history</Link>
                </div>
              </div>
              <div className="col-md-6 mb--24">
                <div className="p--24 rbt-bg-color-white rbt-rounded--12 h-100">
                  <h2 className="h5">Your account</h2>
                  <p>View and update the profile details saved to your Avokarto account.</p>
                  <Link href="/account-info">Manage account details</Link>
                </div>
              </div>
              <div className="col-md-6 mb--24">
                <div className="p--24 rbt-bg-color-white rbt-rounded--12 h-100">
                  <h2 className="h5">Shipping and shopping</h2>
                  <IfFreeShipping
                    fallback={<p>Delivery options and their charges are shown at checkout before you pay. Find more answers in our FAQ.</p>}
                  >
                    <p>
                      Orders of <FreeShippingAmount /> or more (USD), after
                      discounts, qualify for free shipping. Find more answers about
                      product options and checking out in our FAQ.
                    </p>
                  </IfFreeShipping>
                  <Link href="/faq-page-01">Read frequently asked questions</Link>
                </div>
              </div>
              <div className="col-md-6 mb--24">
                <div className="p--24 rbt-bg-color-white rbt-rounded--12 h-100">
                  <h2 className="h5">Contact the store</h2>
                  <p>
                    For product, delivery, order-change, or return questions,
                    include the product name or order number in your message.
                  </p>
                  <Link href="/contact">Contact Avokarto</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
