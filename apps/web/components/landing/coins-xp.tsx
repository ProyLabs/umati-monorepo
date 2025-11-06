import { RiCoinFill, RiGamepadFill } from "@remixicon/react";
import { PlusIcon } from "lucide-react";

const CoinXp = () => {
  return (
    <div className="hidden md:flex gap-4 items-center">
      <div className="bg-accent rounded-full px-2 p-1 flex items-center gap-2 relative">
        <RiGamepadFill size={24} className="text-[var(--umati-aqua)]" />
        <p className="text-base font-medium text-foreground">0 XP</p>
      </div>

      <div className="bg-accent rounded-full px-2 p-1 pr-6 flex items-center gap-2 relative">
        <RiCoinFill size={24} className="text-[var(--umati-yellow)]" />
        <p className="text-base font-medium text-foreground">0</p>
        <div className="p-0.5 size-4 rounded-full bg-blue-500 absolute cursor-pointer -right-1 flex items-center justify-center">
          <PlusIcon size={12} className="text-white" />
        </div>
      </div>
    </div>
  );
};

export default CoinXp;
