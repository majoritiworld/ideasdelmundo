"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import IkigaiFigure from "@/components/IkigaiFigure";
import {
  JourneyHero,
  JourneyScreen,
  JourneyScreenMain,
  journeyPrimaryButtonClassName,
} from "@/components/journey/screen-layout";
import { buildWhatsappInviteUrl } from "@/lib/app-config";

export default function Welcome() {
  const t = useTranslations("home.invite");

  return (
    <JourneyScreen>
      <JourneyScreenMain>
        <JourneyHero>
          <div className="welcome-ikigai-listening">
            <IkigaiFigure size={160} />
          </div>
          <div className="flex flex-col items-center gap-4">
            <h1 className="font-['ArizonaFlare'] text-[32px] leading-tight font-medium text-[#0F1B2D] sm:text-[46px]">
              {t("title")}
            </h1>
            <p className="max-w-2xl text-[15px] leading-[1.65] text-[#5A6B82] sm:text-[20px]">
              {t("body")}
            </p>
          </div>
        </JourneyHero>

        <div className="mx-auto w-full max-w-[21rem] text-center">
          <Button asChild className={journeyPrimaryButtonClassName}>
            <a
              href={buildWhatsappInviteUrl(t("whatsappMessage"))}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("cta")}
            </a>
          </Button>
        </div>
      </JourneyScreenMain>
      <style jsx>{`
        :global(.welcome-ikigai-listening) {
          animation: welcome-ikigai-listening-pulse 1.9s ease-in-out infinite;
          transform-origin: center;
          will-change: transform;
        }

        :global(.welcome-ikigai-listening svg circle) {
          animation: welcome-ikigai-listening-presence 1.9s ease-in-out infinite;
        }

        :global(.welcome-ikigai-listening svg circle:nth-of-type(2)) {
          animation-delay: -0.18s;
        }

        :global(.welcome-ikigai-listening svg circle:nth-of-type(3)) {
          animation-delay: -0.36s;
        }

        :global(.welcome-ikigai-listening svg circle:nth-of-type(4)) {
          animation-delay: -0.54s;
        }

        @keyframes welcome-ikigai-listening-pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.06);
          }
        }

        @keyframes welcome-ikigai-listening-presence {
          0%,
          100% {
            opacity: 0.28;
          }
          50% {
            opacity: 0.42;
          }
        }
      `}</style>
    </JourneyScreen>
  );
}
