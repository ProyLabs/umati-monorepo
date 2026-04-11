import Link from "next/link";
import { UmatiWordmark } from "../umati-wordmark";
import { CurrentLocalDateTime } from "./current-local-datetime";

function Navbar() {
  return (
    <div className="py-4 w-full px-5 sticky top-0 backdrop-blur-sm z-10">
      <div className="flex items-center justify-between h-full max-w-6xl mx-auto">
        <div className="flex-1 flex gap-4 items-center">
          <Link href="/" className="flex gap-4 items-center">
            <UmatiWordmark className="h-6 w-auto sm:h-7 text-white" />
          </Link>
        </div>

        <div className="flex-1 w-full flex gap-4 items-center justify-end">
          <CurrentLocalDateTime />
        </div>
      </div>
    </div>
  );
}

export default Navbar;
