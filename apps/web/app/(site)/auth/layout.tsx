import { Button } from "../../../components/ui/button";
import { UmatiFullLogo } from "../../../components/ui/logo";
import { AuroraBackground } from "../../../components/ui/shadcn-io/aurora-background";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <AuroraBackground>
    <div className="h-screen w-screen flex flex-col items-center justify-center gap-8 relative">
     <Link href="/" className="">
         <UmatiFullLogo className="h-10 text-black dark:text-white" />
     </Link>
      {children}

      <Button asChild variant="link" size="sm">
        <a href="https://proylabs.co" className="textLink">
          &copy; {new Date().getFullYear()} Proy Interactive Labs{" "}
        </a>
      </Button>
    </div>
       </AuroraBackground>
  );
}
