// Server-only (lib/backend). Builds the order confirmation email.

import { contrastRatio, readableOn } from "@/components/stores/storeTheme";
import { contactInfo } from "@/data/contact";
import type { OrderEmailStore } from "@/lib/backend/resellers";
import { BUNDLE_DISCOUNT_PERCENT } from "@/lib/bundleDiscount";
import { SITE_NAME, siteUrl } from "@/lib/seo";

export type OrderEmailItem = {
  name: string;
  sku?: string;
  quantity: number;
  // Unit price charged (after any bundle discount).
  unitPrice: number;
  // Regular unit price when a bundle discount applied.
  regularUnitPrice?: number;
};

export type OrderEmailData = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  placedAt: Date;
  currency: string;
  items: OrderEmailItem[];
  itemsSubtotal: number; // before bundle savings
  bundleDiscount: number;
  shippingCost: number;
  total: number;
  shippingMethod: { name: string; estimate?: string };
  shippingAddress: {
    address1?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  paymentMethod: string;
  // Set when the whole order was bought through one reseller store: the
  // email then carries that store's brand (Avokarto still fulfils it).
  store?: OrderEmailStore;
};

const BRAND = "#174d0a";
const ACCENT = "#5f8f18";
const MUTED = "#6b7280";
const BORDER = "#e6e6e6";
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";
const SERIF_THEMES = new Set(["elegant", "editorial", "organic"]);
const SQUARE_THEMES = new Set(["street", "editorial"]);

type Brand = {
  /** Header background and button colour. */
  color: string;
  /** Text on `color`. */
  onColor: string;
  /** Links and highlights on white - the store colour unless it's too pale to read. */
  link: string;
  heading: string;
  logoUrl: string | null;
  name: string;
  radius: number;
  shopLabel: string;
  shopUrl: string;
  store?: OrderEmailStore;
};

function brandFor(order: OrderEmailData): Brand {
  const store = order.store;
  if (!store) {
    return { color: BRAND, heading: SANS, link: BRAND, logoUrl: null, name: SITE_NAME, onColor: "#ffffff", radius: 16, shopLabel: "Continue shopping", shopUrl: `${siteUrl()}/shop` };
  }
  const color = /^#[0-9a-f]{6}$/i.test(store.accentColor) ? store.accentColor : BRAND;
  return {
    color,
    heading: SERIF_THEMES.has(store.theme) ? SERIF : SANS,
    link: contrastRatio(color, "#ffffff") >= 3 ? color : "#111111",
    // The store's icon endpoint always returns a PNG (logo, or initials on
    // its colour) - safe for every mail client, unlike WebP uploads.
    logoUrl: `${siteUrl()}/api/stores/icon?handle=${encodeURIComponent(store.handle)}&size=192`,
    name: store.name,
    onColor: readableOn(color),
    radius: SQUARE_THEMES.has(store.theme) ? 0 : 16,
    shopLabel: `Shop ${store.name} again`,
    shopUrl: store.domain ? `https://${store.domain}` : `${siteUrl()}/store/${encodeURIComponent(store.handle)}`,
    store,
  };
}

function whatsappUrl(number: string) {
  return `https://wa.me/${number.replace(/[^\d]/g, "")}`;
}

/** Sender display name: the store's, still honest about who sends it. Mail headers can't carry <>",\r\n. */
function senderName(store: OrderEmailStore) {
  return `${store.name.replace(/[<>"\r\n,;]/g, "").trim()} via ${SITE_NAME}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function addressLines(address: OrderEmailData["shippingAddress"]) {
  return [
    address.address1,
    [address.city, address.state, address.postcode].filter(Boolean).join(", "),
    address.country,
  ]
    .map((line) => (line ?? "").trim())
    .filter(Boolean);
}

export function buildOrderConfirmationEmail(order: OrderEmailData) {
  const fmt = (amount: number) => money(amount, order.currency);
  const firstName = order.customerName.trim().split(/\s+/)[0] || "there";
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const placed = order.placedAt.toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  });
  const historyUrl = `${siteUrl()}/my-order-history`;
  const brand = brandFor(order);
  const store = brand.store;
  const lines = addressLines(order.shippingAddress);
  const subject = `Your ${brand.name} order ${order.orderNumber} is confirmed`;
  const preheader = `Thanks, ${firstName}! We've received your order of ${itemCount} ${
    itemCount === 1 ? "item" : "items"
  } (${fmt(order.total)}).`;

  const itemRows = order.items
    .map((item) => {
      const bundle = item.regularUnitPrice !== undefined && item.regularUnitPrice > item.unitPrice;
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:#111;">
            <strong>${escapeHtml(item.name)}</strong><br>
            <span style="color:${MUTED};font-size:13px;">
              Qty ${item.quantity} &times; ${fmt(item.unitPrice)}${
                bundle
                  ? ` <s>${fmt(item.regularUnitPrice as number)}</s> <span style="color:${ACCENT};font-weight:600;">Bundle &minus;${BUNDLE_DISCOUNT_PERCENT}%</span>`
                  : ""
              }${item.sku ? ` &middot; SKU ${escapeHtml(item.sku)}` : ""}
            </span>
          </td>
          <td align="right" style="padding:12px 0;border-bottom:1px solid ${BORDER};font-size:14px;color:#111;white-space:nowrap;vertical-align:top;">
            ${fmt(item.unitPrice * item.quantity)}
          </td>
        </tr>`;
    })
    .join("");

  const totalRow = (label: string, value: string, style = "") => `
        <tr>
          <td style="padding:4px 0;font-size:14px;color:#374151;${style}">${label}</td>
          <td align="right" style="padding:4px 0;font-size:14px;color:#374151;${style}">${value}</td>
        </tr>`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f2;font-family:${SANS};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f5f2;">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:${brand.radius}px;overflow:hidden;">
      <tr><td style="background:${brand.color};padding:${brand.logoUrl ? "16px" : "20px"} 28px;color:${brand.onColor};font-family:${brand.heading};font-size:20px;font-weight:700;">${
        brand.logoUrl
          ? `<a href="${brand.shopUrl}" style="color:${brand.onColor};text-decoration:none;"><img src="${brand.logoUrl}" width="40" height="40" alt="" style="display:inline-block;width:40px;height:40px;border:0;border-radius:${Math.min(brand.radius, 10)}px;vertical-align:middle;margin-right:12px;background:#ffffff;">${escapeHtml(brand.name)}</a>`
          : escapeHtml(brand.name)
      }</td></tr>
      <tr><td style="padding:28px 28px 8px;">
        <p style="margin:0 0 6px;font-size:13px;color:${MUTED};">Order ${escapeHtml(order.orderNumber)} &middot; ${escapeHtml(placed)} UTC</p>
        <h1 style="margin:0 0 12px;font-family:${brand.heading};font-size:${store ? 24 : 22}px;line-height:1.3;color:#111;">Thanks for your order, ${escapeHtml(firstName)}!</h1>
        <p style="margin:0;font-size:15px;line-height:1.55;color:#374151;">${
          store
            ? `Thanks for shopping with ${escapeHtml(store.name)}! We've received your order and it's being packed. Here's a summary for your records.`
            : "We've received your order and we're getting it ready. Here's a summary for your records."
        }</p>
      </td></tr>

      <tr><td style="padding:20px 28px 4px;">
        <h2 style="margin:0 0 4px;font-size:15px;color:#111;">Items (${itemCount})</h2>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${itemRows}</table>
      </td></tr>

      <tr><td style="padding:12px 28px 4px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          ${totalRow("Items", fmt(order.itemsSubtotal))}
          ${
            order.bundleDiscount > 0.004
              ? totalRow(
                  `Bundle savings (${BUNDLE_DISCOUNT_PERCENT}%)`,
                  `&minus;${fmt(order.bundleDiscount)}`,
                  `color:${ACCENT};font-weight:600;`,
                )
              : ""
          }
          ${totalRow("Shipping", order.shippingCost === 0 ? "Free" : fmt(order.shippingCost))}
          <tr><td colspan="2" style="padding-top:8px;border-top:1px solid ${BORDER};"></td></tr>
          ${totalRow("Total", fmt(order.total), "font-size:17px;font-weight:700;color:#111;")}
        </table>
      </td></tr>

      <tr><td style="padding:20px 28px 8px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td valign="top" width="50%" style="padding:0 12px 16px 0;font-size:14px;line-height:1.55;color:#374151;">
              <strong style="color:#111;">Delivering to</strong><br>
              ${escapeHtml(order.customerName)}<br>
              ${lines.map(escapeHtml).join("<br>")}
            </td>
            <td valign="top" width="50%" style="padding:0 0 16px;font-size:14px;line-height:1.55;color:#374151;">
              <strong style="color:#111;">Shipping</strong><br>
              ${escapeHtml(order.shippingMethod.name)}${
                order.shippingMethod.estimate ? `<br>${escapeHtml(order.shippingMethod.estimate)}` : ""
              }<br><br>
              <strong style="color:#111;">Payment method</strong><br>
              ${escapeHtml(order.paymentMethod)}
            </td>
          </tr>
        </table>
      </td></tr>

      <tr><td style="padding:4px 28px 28px;">
        ${
          store
            ? `<a href="${brand.shopUrl}" style="display:inline-block;background:${brand.color};color:${brand.onColor};text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:${brand.radius ? 999 : 0}px;">${escapeHtml(brand.shopLabel)}</a>
        <a href="${historyUrl}" style="display:inline-block;margin-left:12px;color:${brand.link};font-weight:600;font-size:14px;">View your orders</a>`
            : `<a href="${historyUrl}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:999px;">View your orders</a>
        <a href="${brand.shopUrl}" style="display:inline-block;margin-left:12px;color:${BRAND};font-weight:600;font-size:14px;">Continue shopping</a>`
        }
      </td></tr>

      <tr><td style="padding:18px 28px;background:#f9faf7;border-top:1px solid ${BORDER};font-size:13px;line-height:1.55;color:${MUTED};">
        ${
          store
            ? `${
                store.contactEmail || store.whatsapp
                  ? `Questions for ${escapeHtml(store.name)}? ${[
                      store.contactEmail ? `<a href="mailto:${escapeHtml(store.contactEmail)}" style="color:${brand.link};">${escapeHtml(store.contactEmail)}</a>` : "",
                      store.whatsapp ? `<a href="${whatsappUrl(store.whatsapp)}" style="color:${brand.link};">WhatsApp ${escapeHtml(store.whatsapp)}</a>` : "",
                    ].filter(Boolean).join(" &middot; ")}<br>`
                  : ""
              }About delivery or returns? Reply to this email - the ${escapeHtml(SITE_NAME)} team packs and ships ${escapeHtml(store.name)} orders - or write to
        <a href="mailto:${escapeHtml(contactInfo.email)}" style="color:${brand.link};">${escapeHtml(contactInfo.email)}</a>. Please keep your order number handy.`
            : `Questions about your order? Reply to this email or contact us at
        <a href="mailto:${escapeHtml(contactInfo.email)}" style="color:${BRAND};">${escapeHtml(contactInfo.email)}</a>
        or ${escapeHtml(contactInfo.phone)}. Please keep your order number handy.`
        }
      </td></tr>
    </table>
    <p style="margin:16px 0 0;font-size:12px;color:${MUTED};">${
      store
        ? `You're receiving this email because you ordered from ${escapeHtml(store.name)}. Checkout and delivery by ${escapeHtml(SITE_NAME)}.`
        : `You're receiving this email because you placed an order at ${escapeHtml(SITE_NAME)}.`
    }</p>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    `Thanks for your order, ${firstName}!`,
    ...(store ? [`Thanks for shopping with ${store.name}.`] : []),
    "",
    `Order ${order.orderNumber} - ${placed} UTC`,
    "",
    `Items (${itemCount}):`,
    ...order.items.map(
      (item) =>
        `- ${item.name} x${item.quantity} @ ${fmt(item.unitPrice)}${
          item.regularUnitPrice !== undefined && item.regularUnitPrice > item.unitPrice
            ? ` (bundle price, regular ${fmt(item.regularUnitPrice)})`
            : ""
        } = ${fmt(item.unitPrice * item.quantity)}`,
    ),
    "",
    `Items: ${fmt(order.itemsSubtotal)}`,
    ...(order.bundleDiscount > 0.004
      ? [`Bundle savings (${BUNDLE_DISCOUNT_PERCENT}%): -${fmt(order.bundleDiscount)}`]
      : []),
    `Shipping: ${order.shippingCost === 0 ? "Free" : fmt(order.shippingCost)}`,
    `Total: ${fmt(order.total)}`,
    "",
    "Delivering to:",
    order.customerName,
    ...lines,
    "",
    `Shipping: ${order.shippingMethod.name}${
      order.shippingMethod.estimate ? ` (${order.shippingMethod.estimate})` : ""
    }`,
    `Payment method: ${order.paymentMethod}`,
    "",
    ...(store ? [`${brand.shopLabel}: ${brand.shopUrl}`] : []),
    `View your orders: ${historyUrl}`,
    "",
    ...(store && (store.contactEmail || store.whatsapp)
      ? [`Questions for ${store.name}? ${[store.contactEmail, store.whatsapp && `WhatsApp ${store.whatsapp}`].filter(Boolean).join(" / ")}`]
      : []),
    store
      ? `About delivery or returns? Reply to this email or contact ${contactInfo.email} (${SITE_NAME} packs and ships ${store.name} orders).`
      : `Questions? Reply to this email or contact ${contactInfo.email} / ${contactInfo.phone}.`,
  ].join("\n");

  return { fromName: store ? senderName(store) : undefined, subject, html, text };
}
