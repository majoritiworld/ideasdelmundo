import { cn } from "@/lib/utils";
import Image, { ImageProps } from "next/image";
import { Typography } from "./typography";
import Link from "next/link";
import WEB_ROUTES from "@/constants/web-routes.constants";

const LOGO_URL = "/brand/logo.png";

type Props = {
  size?: number;
  alt?: string;
  className?: string;
  withText?: boolean;
  clickable?: boolean;
};

const Logo = ({
  size = 45,
  alt = "logo",
  className,
  withText = false,
  clickable = false,
  ...props
}: Props & Omit<ImageProps, "src" | "alt" | "className">) => {
  const AppLogo = (
    <div className="flex items-center gap-2">
      <Image
        src={LOGO_URL}
        height={size}
        width={size}
        alt={alt}
        className={cn("rounded-xl", className)}
        {...props}
      />
      {withText && (
        <Typography variant="h6" as="p" className="text-primary font-bold">
          Underwritly
        </Typography>
      )}
    </div>
  );

  return (
    <>
      {clickable ? (
        <Link href={WEB_ROUTES.HOME} className="cursor-pointer">
          {AppLogo}
        </Link>
      ) : (
        AppLogo
      )}
    </>
  );
};

export default Logo;
