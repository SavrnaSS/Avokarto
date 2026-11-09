import DescriptionTab1 from "./DescriptionTab1";
import { Product } from "@/types";

export default function Description2({ product }: { product?: Product }) {
  return (
    <div className="rbt-component-area rbt-section-gap pt--0">
      <div className="container">
        <div className="row row--12 mt_dec--24">
          <div className="col-xl-9 mt--24">
            <DescriptionTab1 product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
