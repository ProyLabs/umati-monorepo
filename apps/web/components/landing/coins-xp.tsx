'use client';
import { cn } from "@/lib/utils";
import { useModal } from "@/providers/modal-provider";
import { RiCoinFill, RiGamepadFill } from "@remixicon/react";
import { PlusIcon } from "lucide-react";
import { Fbutton } from "../ui/fancy-button";
import Image from "next/image";

const CoinXp = () => {
  const {openModal} = useModal();
  return (
    <div className="hidden md:flex gap-4 items-center">
      <div className="bg-accent rounded-full px-2 p-1 flex items-center gap-2 relative cursor-pointer" onClick={()=> {
         openModal({
                body: <XpComingSoon/>,
                containerClass: cn('bg-linear-to-b from-lime-500 to-green-600'),
              })
      }}>
        <RiGamepadFill size={24} className="text-lime-500" />
        <p className="text-base font-medium text-foreground">0 XP</p>
      </div>

      <div className="bg-accent rounded-full px-2 p-1 pr-6 flex items-center gap-2 relative cursor-pointer" onClick={()=> {
         openModal({
                body: <CoinsComingSoon/>,
                containerClass: cn('bg-linear-to-b to-amber-500 from-yellow-500'),
              })
      }}>
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


const XpComingSoon = () => {
  const {closeModal} = useModal();
  return <div className="flex flex-col items-center justify-center">
            {/* <RiGamepadFill size={80} className="text-white mb-4" /> */}
            <Image src="https://img.icons8.com/?size=150&id=RxUKiBEZAfrX&format=png&color=FFFFFF" height={150} width={150} alt=""/>

          <h6 className="text-2xl font-bold mb-8 text-center">Your Journey’s About to Get Rewarded</h6>
          <p className="mb-8 font-semibold text-sm text-center">We’re introducing Experience Points (XP) and Levels to celebrate your gameplay and victories on Umati. Soon, you’ll earn XP for your actions, level up with your friends, and show off your progress. Stay tuned for launch!</p>
          <Fbutton onClick={closeModal} variant="secondary" className="w-full">Got it</Fbutton>
  </div>
}


const CoinsComingSoon = () => {
    const {closeModal} = useModal();
  return <div className="flex flex-col items-center justify-center">
            {/* <RiGamepadFill size={80} className="text-white mb-4" /> */}
            <Image src="https://img.icons8.com/?size=150&id=42252&format=png&color=FFFFFF" height={150} width={150} alt=""/>

          <h6 className="text-2xl font-bold mb-8 text-center">Play Hard. Earn Coins.</h6>
          <p className="mb-8 font-semibold text-sm text-center">Get ready to stack Umati Coins — your in-game currency for all the fun you bring. Earn coins by playing, completing challenges, and leveling up with friends. Use them to unlock cool stuff and power up your play. Coming soon!</p>
          <Fbutton onClick={closeModal} variant="secondary" className="w-full">Got it</Fbutton>
  </div>
}
