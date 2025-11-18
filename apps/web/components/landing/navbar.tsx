import React from "react";
import UmatiLogo from "../ui/logo";
import UserAvatar from "./user-avatar";
import SettingsBar from "./settings-bar";
import CoinXp from "./coins-xp";
import Link from "next/link";

function Navbar() {
  return (
    <div className="py-4 w-full px-5 sticky top-0 backdrop-blur-sm z-10">
      <div className="flex items-center justify-evenly h-full max-w-6xl mx-auto">
        <div className="flex-1 flex gap-4 items-center">
          <Link href="/" className="flex gap-4 items-center">
            <UmatiLogo className="size-8 text-black dark:text-white md:hidden" />
            <p className="text-xl font-bold hidden md:block">UMATI</p>
          </Link>
        </div>
        <Link href="/">
          <UmatiLogo className="size-12 text-black dark:text-white hidden md:block" />
        </Link>
        <div className="flex-1 w-full flex gap-4 items-center justify-end">
          <CoinXp />
          <SettingsBar />
          {/* <UserAvatar /> */}
        </div>
      </div>
    </div>
  );
}

export default Navbar;
