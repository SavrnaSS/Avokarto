"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

const reviews = [
  {
    id: 1,
    name: "Maya Roberts",
    text: `The fit was accurate, the fabric feels premium, and the styling works for weekday outfits.`,
  },
  {
    id: 2,
    name: "Avery Chen",
    text: `Clean stitching, fast delivery, and the colors looked just like the product photos.`,
  },
  {
    id: 3,
    name: "Jordan Lee",
    text: `Comfortable pieces that are easy to dress up or down. I reordered in another color.`,
  },
  {
    id: 4,
    name: "Priya Shah",
    text: `The size guide helped me pick the right fit, and the return information was clear.`,
  },
];

export default function ReviewSlider() {
  return (
    <div className="rbt-login-form-bottom rbt-swiper-container-pagination position-relative">
      <Swiper
        slidesPerView={1}
        spaceBetween={24}
        loop={true}
        speed={1000}
        autoplay={{
          delay: 3000,
        }}
        pagination={{
          el: ".rbt-swiper-progress",
          clickable: true,
        }}
        modules={[Autoplay, Pagination]}
        className="rbt-log-slide-activation pb--40"
      >
        {reviews.map((review) => (
          <SwiperSlide key={review.id}>
            <div className="rbt-client-review">
              <ul className="rbt-rating-icon-list d-flex justify-content-center">
                {[...Array(5)].map((_, idx) => (
                  <li key={idx}>
                    <i className="fa-solid fa-star rbt-rated-icon" />
                  </li>
                ))}
              </ul>
              <p className="rbt-review-text mt--8 mb--12">
                &quot;{review.text}&quot;
              </p>
              <div className="d-flex flex-wrap justify-content-center rbt-gap--8">
                <h6 className="mb--0">{review.name}</h6>
                <div className="rbt-verified-badge badge-rounded">
                  <i className="fa-sharp fa-solid fa-shield-check" />
                  Verified Reviewer
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
        <div className="swiper-pagination rbt-swiper-progress rbt-swiper-pagination-dot-extend" />
      </Swiper>
    </div>
  );
}
