import Image from "next/image";
import Link from "next/link";

// Scrolling "what we sell" ticker under the hero. Each phrase links to a
// shop search that returns real products (checked against the catalog);
// update the query alongside the label if the range changes.
const marqueeItems = [
  { label: "Pet costumes", href: "/shop?q=costume" },
  { label: "Cat outfits", href: "/shop?q=cat" },
  { label: "Dog dress-up", href: "/shop?q=dog" },
  { label: "Cozy pet carriers", href: "/shop?q=carry" },
  { label: "Grooming & care", href: "/shop?q=wash" },
  { label: "Halloween props", href: "/shop?q=horror" },
  { label: "Festive smart lights", href: "/shop?q=light" },
  { label: "Retro gadgets", href: "/shop?q=retro" },
];

export default function CategoryScroll() {
  return (
    <div className="rbt-component-area rbt-categories-scroll-area rbt-bg-color-white">
      <div className="wrapper">
        <div className="rbt-scroll-animation-container">
          <nav
            className="rbt-scroll-animation-wrapper rbt-no-overlay ptb--32 ptb_sm--16"
            aria-label="Shop by collection"
          >
            <div className="rbt-scroll-animation rbt-scroll-right-left">
              <div className="rbt-single-column-100">
                <div className="rbt-category-list">
                  {/* The list is rendered twice so the loop is seamless; the
                      copy is hidden from screen readers and keyboard focus
                      so each link is announced/tabbed once. */}
                  {[...marqueeItems, ...marqueeItems].map((item, index) => {
                    const isCopy = index >= marqueeItems.length;
                    return (
                      <Link
                        href={item.href}
                        key={`${item.label}-${index}`}
                        aria-hidden={isCopy || undefined}
                        tabIndex={isCopy ? -1 : undefined}
                      >
                        <span className="rbt-category-icon">
                          <Image
                            alt=""
                            src="/assets/images/icons/scroll-icon-01.svg"
                            width={16}
                            height={16}
                          />
                        </span>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
