export const footerData = [
  {
    title: "Customer Care",
    items: [
      { href: "/account-info", label: "Account Info" },
      { href: "/my-order-history", label: "Track Your Order" },
      { href: "/return-policy", label: "Returns & Exchanges" },
      { href: "/my-order-history", label: "Shipping Information" },
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms-policy", label: "Terms and Conditions" },
      { href: "/help-center", label: "Help Center" },
    ],
  },
  {
    title: "Shop",
    items: [
      { href: "/shop", label: "All Products" },
      { href: "/marketplace", label: "Marketplace" },
      { href: "/shop-by-categories", label: "Collections" },
    ],
  },
  {
    title: "Company",
    items: [
      { href: "/about", label: "About Us" },
      { href: "/contact", label: "Contact Us" },
      { href: "/how-it-works", label: "How It Works" },
      { href: "/pricing", label: "Seller Plans" },
      { href: "/guides", label: "Dropshipping Guides" },
    ],
  },
];
// Not used by any live footer (Footer7, Footer10) - the storefront doesn't
// have physical stores to locate. Kept only because several demo-only
// footer variants (Footer3/5/6/12, unreachable from the live nav) still
// import it and would fail to compile otherwise.
export const footerDataStores = {
  title: "Visit Us",
  items: [
    { href: "/about", label: "New York" },
    { href: "/about", label: "London" },
    { href: "/about", label: "Los Angeles" },
    { href: "/about", label: "Chicago" },
  ],
};

export const socialLinks = [
  { icon: "fa-twitter", href: "https://twitter.com/" },
  { icon: "fa-youtube", href: "https://www.youtube.com/" },
  { icon: "fa-facebook", href: "https://www.facebook.com/" },
  { icon: "fa-whatsapp", href: "https://wa.me/" },
  { icon: "fa-instagram", href: "https://www.instagram.com/" },
  { icon: "fa-telegram", href: "https://t.me/" },
];
