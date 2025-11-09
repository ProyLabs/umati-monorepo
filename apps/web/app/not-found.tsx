import Navbar from "@/components/landing/navbar";
import { Fbutton } from "@/components/ui/fancy-button";
import { BubbleBackground } from "@/components/ui/shadcn-io/bubble-background";
import Link from "next/link";

export default async function NotFound() {
  return (
    <section className="fixed h-dvh w-full flex flex-col">
      <Navbar />
      <div className="relative m-auto z-10 pb-20 max-w-sm w-full text-center ">
        <h2 className="text-4xl md:text-5xl font-bold mb-2">Not Found!</h2>
        <p className="mb-8">We could not find the resource you requested for</p>
        <Link href="/">
          <Fbutton  variant="secondary" className="max-w-4/5 mx-auto w-full">
            Back to Home
          </Fbutton>
        </Link>
      </div>
      <BubbleBackground className="absolute inset-0 flex items-center justify-center rounded-xl !z-0" />
    </section>
  );
}
