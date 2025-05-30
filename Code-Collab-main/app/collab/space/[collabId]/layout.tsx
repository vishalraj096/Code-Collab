"use client";
import { Toaster } from "@/components/ui/toaster";
import DotPattern from "@/components/dot-pattern";
import { RecoilRoot } from "recoil";
import { ny } from "@/lib/utils";

export default function Layout({ children }: { children: string }) {
  return (
    <RecoilRoot>
      <div className="absolute h-screen w-screen -z-10 flex items-center justify-center">
        <DotPattern
          width={20}
          height={20}
          cx={1}
          cy={1}
          cr={1}
          className={ny(
            "[mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)]",
            "[mask-image:linear-gradient(to_bottom_left,white,transparent,white)] ",
            "h-full w-full"
          )}
        />
      </div>
      {children}
      <Toaster />
    </RecoilRoot>
  );
}
