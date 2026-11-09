import Link from "next/link";

export default function Terms() {
  return (
    <div className="rbt-privacy-area rbt-bg-color-gray-light rbt-section-gap">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="rbt-article-content-wrapper">
              <div className="content">
                <h2>Welcome to Avokarto Terms Policy</h2>
                <p>
                  Welcome to Avokarto! By accessing and using our website, you
                  agree to comply with and be bound by the following terms and
                  policies. Please read these terms carefully before using our
                  services. These terms govern your access to and use of
                  Avokarto’s online platform, including any content,
                  functionality, and services offered through the website. If
                  you do not agree with any part of these terms, please refrain
                  from using our website.
                </p>
                <h5>1. General Terms</h5>
                <p>
                  These Terms &amp; Policies govern the use of Avokarto’s
                  website, services, and products. By using our site, you
                  acknowledge and accept these terms in their entirety. If you
                  do not agree with any part of the terms, you should
                  immediately discontinue the use of our services. We reserve
                  the right to modify these terms at any time, and changes will
                  be effective as soon as they are posted on this page. Please
                  check this page regularly for updates.
                </p>
                <h5>2. Product Information</h5>
                <p>
                  We make every effort to ensure that all product descriptions,
                  images, and pricing on our site are accurate and up-to-date.
                  However, we cannot guarantee that every product detail, such
                  as images, color representation, or availability, is
                  completely accurate. Prices and product availability are
                  subject to change without notice. We reserve the right to
                  correct any errors and modify product details at any time
                  without prior notice.
                </p>
                <h5>3. User Account</h5>
                <p>
                  To purchase items from Avokarto, you may be required to create
                  a user account. When creating your account, you agree to
                  provide accurate, complete, and up-to-date information. You
                  are responsible for keeping your account details, including
                  your username and password, confidential. If you suspect any
                  unauthorized use of your account, you must notify us
                  immediately. You also agree to keep your account information
                  updated to ensure that we can reach you in case of issues with
                  your order.
                </p>
                <h5>4. Orders &amp; Payments</h5>
                <p>
                  When you place an order with Avokarto, you are offering to
                  purchase the item(s) in accordance with our terms and
                  conditions. Orders will be processed and confirmed based on
                  availability, payment verification, and our shipping terms. We
                  accept various payment methods, including major credit/debit
                  cards and secure online payment systems. All payments are
                  processed through encrypted and secure payment gateways. By
                  placing an order, you authorize us to charge the total amount
                  for the items and shipping fees to your chosen payment method.
                </p>
                <h5>5. Shipping &amp; Delivery</h5>
                <p>
                  At Avokarto, we strive to deliver your orders promptly and
                  efficiently. Shipping times vary depending on the destination
                  and chosen shipping method. We aim to process and ship all
                  orders within the time frames listed on our site, but delivery
                  dates may vary depending on factors such as weather, holidays,
                  and third-party carrier delays. Please be aware that any
                  delivery issues beyond our control, such as shipping delays by
                  carriers or customs, are not the responsibility of Avokarto.
                </p>
                <h5>6. Returns &amp; Refunds</h5>
                <p>
                  We want you to be satisfied with your purchase. If for any
                  reason you&apos;re not completely happy with your order, you
                  may return it within 30 days of delivery for a refund or
                  exchange. To qualify for a return, the item must be unused and
                  in its original packaging. Please note that some items, such
                  as gift cards or personalized products, may not be eligible
                  for return. For more detailed instructions on how to initiate
                  a return or refund, please visit our
                  <Link href={`/return-policy`}>Return Policy</Link> page.
                </p>
                <h5>7. Privacy Policy</h5>
                <p>
                  Your privacy is very important to us. We are committed to
                  protecting your personal information and ensuring that it is
                  used responsibly. Our Privacy Policy explains how we collect,
                  store, and use your personal data, and it outlines the steps
                  we take to safeguard your information. By using our services,
                  you consent to the collection and use of your personal data as
                  outlined in our
                  <Link href={`/privacy-policy`}>Privacy Policy</Link>.
                </p>
                <h5>8. Prohibited Activities</h5>
                <p>
                  When using Avokarto’s website, you agree not to engage in any
                  activities that are unlawful, harmful, or disruptive. These
                  activities include, but are not limited to, engaging in
                  fraudulent transactions, spreading malware or viruses,
                  interfering with our website’s operations, or attempting to
                  gain unauthorized access to our systems. Any such activities
                  may result in the suspension or termination of your account,
                  and legal action may be taken if necessary.
                </p>
                <h5>9. Limitation of Liability</h5>
                <p>
                  Avokarto makes every effort to provide accurate information and
                  ensure the smooth functioning of the website. However, we
                  cannot be held liable for any direct, indirect, incidental, or
                  consequential damages arising from the use of our website or
                  services. This includes any errors or omissions in content,
                  delays, or interruptions in service, and any losses or damages
                  incurred due to reliance on the information provided on our
                  site. We strongly recommend that users verify the details
                  before making any decisions based on the content on our site.
                </p>
                <h5>10. Changes to Terms</h5>
                <p>
                  Avokarto reserves the right to modify, update, or amend these
                  Terms &amp; Policies at any time. We will notify users of
                  significant changes by posting the updated terms on this page.
                  It is your responsibility to review these terms periodically
                  to stay informed of any updates. Continued use of the website
                  after changes have been posted constitutes your acceptance of
                  the revised terms.
                </p>
                <h5>11. Governing Law</h5>
                <p>
                  These Terms &amp; Policies are governed by and construed in
                  accordance with the laws of [Your Country]. Any disputes
                  arising from the use of the site will be subject to the
                  jurisdiction of the courts in [Your Country]. By using
                  Avokarto, you consent to the exclusive jurisdiction of these
                  courts to resolve any disputes.
                </p>
                <h5>12. Contact Us</h5>
                <p>
                  If you have any questions, concerns, or feedback regarding
                  these Terms &amp; Policies, please feel free to contact our
                  customer service team. We are here to assist you with any
                  inquiries or issues you may have:
                </p>
                <p>
                  Email:
                  <a href="mailto:support@avokarto.com">support@avokarto.com</a>
                </p>
                <p>
                  Phone: <a href="tel:+11234567890">+1 123 456 7890</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
