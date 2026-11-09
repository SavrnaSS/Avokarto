"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useCustomerSession } from "@/hooks/use-customer-session";
import { avatarHueFor, initialsFor } from "@/lib/customerAvatar";

const primaryNavItems = [
  {
    href: "/my-order-history",
    iconClass: "fa-regular fa-cart-shopping-fast mr--4",
    label: "Orders",
  },
  {
    href: "/my-wishlist",
    iconClass: "fa-regular fa-heart mr--4",
    label: "Wishlist",
  },
  {
    href: "/my-payment-methods",
    iconClass: "fa-regular fa-money-bill mr--4",
    label: "Payment Methods",
  },
  {
    href: "/my-reviews",
    iconClass: "fa-regular fa-star-sharp-half-stroke mr--4",
    label: "My reviews",
  },
  {
    // Seller dashboard; it sends people without a store to the homepage (selling on Avokarto).
    href: "/seller",
    iconClass: "fa-regular fa-store mr--4",
    label: "My store",
  },
];

const manageAccountItems = [
  {
    href: "/account-info",
    iconClass: "fa-regular fa-user-vneck mr--4",
    label: "Personal info",
  },
  {
    href: "/account-notifications",
    iconClass: "fa-regular fa-cowbell mr--4",
    label: "Notifications",
  },
];

const customerServiceItems = [
  {
    href: "/help-center",
    iconClass: "fa-regular fa-circle-question mr--4",
    label: "Help",
  },
  {
    href: "/terms-policy",
    iconClass: "fa-regular fa-circle-info mr--4",
    label: "Terms and conditions",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const customer = useCustomerSession((state) => state.customer);
  const logout = useCustomerSession((state) => state.logout);

  async function handleLogout() {
    await logout();
    router.push("/signin");
  }

  return (
    <aside className="rbt-profile-sidebar sticky-top">
      <div className="rbt-user-profile">
        <figure
          className="rbt-user-profile-img d-flex align-items-center justify-content-center"
          style={
            customer
              ? {
                  background: `hsl(${avatarHueFor(customer.sub)}, 55%, 90%)`,
                  color: `hsl(${avatarHueFor(customer.sub)}, 45%, 32%)`,
                  fontWeight: 600,
                }
              : { background: "var(--color-gray-200)", color: "var(--color-body)" }
          }
        >
          {customer ? (
            initialsFor(customer.name)
          ) : (
            <i className="fa-regular fa-user" />
          )}
        </figure>
        <div className="pl--12">
          <h5 className="h6 mb-1">{customer?.name ?? "Guest"}</h5>
          {customer ? (
            <p className="mb--0 b3 text-truncate">{customer.email}</p>
          ) : (
            <p className="mb--0 b3">Not signed in</p>
          )}
        </div>
      </div>
      <hr className="mb--8 mt--20" />
      <div className="rbt-sidebar-widgets">
        <div className="rbt-sidebar-single-widget">
          <nav className="rbt-sidebar-nav-list list-group">
            {primaryNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={pathname === item.href ? "active" : ""}
              >
                <span>
                  <i className={item.iconClass} />
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="rbt-sidebar-single-widget">
          <h6 className="rbt-title">Manage account</h6>
          <nav className="rbt-sidebar-nav-list list-group">
            {manageAccountItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={pathname === item.href ? "active" : ""}
              >
                <span>
                  <i className={item.iconClass} />
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="rbt-sidebar-single-widget">
          <h6 className="rbt-title">Customer service</h6>
          <nav className="rbt-sidebar-nav-list list-group">
            {customerServiceItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={pathname === item.href ? "active" : ""}
              >
                <span>
                  <i className={item.iconClass} />
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
        </div>
        {customer ? (
          <>
            <hr />
            <nav className="rbt-sidebar-nav-list list-group">
              <button
                className="btn btn-link text-start p-0 border-0 w-100"
                onClick={() => void handleLogout()}
                type="button"
              >
                <span>
                  <i className="fa-regular fa-right-from-bracket mr--4" />
                  Log out
                </span>
              </button>
            </nav>
          </>
        ) : null}
      </div>
    </aside>
  );
}
