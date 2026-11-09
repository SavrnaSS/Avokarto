import Image from "next/image";
import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";

const instaPostItems = [
  { src: "/assets/images/insta-posts/insta-post-d-01.webp", order: 1 },
  { src: "/assets/images/insta-posts/insta-post-d-02.webp", order: 2 },
  { src: "/assets/images/insta-posts/insta-post-d-03.webp", order: 3 },
  { src: "/assets/images/insta-posts/insta-post-d-04.webp", order: 4 },
  { src: "/assets/images/insta-posts/insta-post-d-05.webp", order: 5 },
  { src: "/assets/images/insta-posts/insta-post-d-06.webp", order: 6 },
];

export default function Socials() {
  return (
    <div className="rbt-component-area rbt-instapost-area rbt-section-gap rbt-bg-color-white">
      <div className="wrapper plr--20">
        {/* Start Instagram Posts Area */}
        <div className="row row--12">
          <div className="col-lg-12">
            <div className="rbt-instapost-grp style--one rbt-mobile-row">
              {instaPostItems.slice(0, 3).map((item) => (
                <div
                  className={`rbt-instapost text-center rbt-instapost-style-one rbt-scroll-trigger fade_in animation-order-${item.order}`}
                  key={item.src}
                >
                  <div className="inner">
                    <ModalTriggerButton
                      openModalName="instaModal"
                      className="instapost-img"
                    >
                      <Image
                        className={`rbt-scroll-trigger zoom_in animation-order-${item.order}`}
                        alt="Ecommerce Brand Images"
                        src={item.src}
                        width={400}
                        height={400}
                      />
                    </ModalTriggerButton>
                    <div className="instapost-content">
                      <span className="insta-icon">
                        <i className="fa-brands fa-instagram" />
                      </span>
                      <ModalTriggerButton
                        openModalName="instaModal"
                        className="rbt-btn-link"
                      >
                        View Product
                      </ModalTriggerButton>
                    </div>
                  </div>
                </div>
              ))}
              <div className="rbt-instapost-social-area text-center rbt-scroll-trigger fade_in animation-order-1">
                <h3 className="title">
                  Follow Us On <span>@instagram</span>
                </h3>
                <p className="desc">Find out what is happening with us</p>
                <ul className="social-icon rbt-social-default with-bg-primary">
                  <li>
                    <a href="https://www.tiktok.com/">
                      <i className="fa-brands fa-tiktok" />
                    </a>
                  </li>
                  <li>
                    <a href="https://www.facebook.com">
                      <i className="fa-brands fa-facebook" />
                    </a>
                  </li>
                  <li>
                    <a href="https://www.instagram.com/">
                      <i className="fa-brands fa-instagram" />
                    </a>
                  </li>
                </ul>
              </div>
              {instaPostItems.slice(3).map((item) => (
                <div
                  className={`rbt-instapost text-center rbt-instapost-style-one rbt-scroll-trigger fade_in animation-order-${item.order}`}
                  key={item.src}
                >
                  <div className="inner">
                    <ModalTriggerButton
                      openModalName="instaModal"
                      className="instapost-img"
                    >
                      <Image
                        className={`rbt-scroll-trigger zoom_in animation-order-${item.order}`}
                        alt="Ecommerce Brand Images"
                        src={item.src}
                        width={400}
                        height={400}
                      />
                    </ModalTriggerButton>
                    <div className="instapost-content">
                      <span className="insta-icon">
                        <i className="fa-brands fa-instagram" />
                      </span>
                      <ModalTriggerButton
                        openModalName="instaModal"
                        className="rbt-btn-link"
                      >
                        View Product
                      </ModalTriggerButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* End Instagram Posts Area */}
      </div>
    </div>
  );
}
