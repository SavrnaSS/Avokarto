import Image, { type ImageProps } from "next/image";

type AvokartoLogoIconProps = Omit<
  ImageProps,
  "src" | "alt" | "width" | "height"
> & {
  alt?: string;
  width?: ImageProps["width"];
  height?: ImageProps["height"];
};

export const AvokartoLogoIcon = ({
  alt = "Avokarto logo",
  width = 96,
  height = 96,
  ...props
}: AvokartoLogoIconProps) => (
  <Image
    src="/assets/images/logo/avokarto-logo-mark.webp"
    alt={alt}
    width={width}
    height={height}
    {...props}
  />
);
