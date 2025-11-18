'use client';
import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";
import { Fbutton } from "../ui/fancy-button";

export default function Loading({size=128, className}: {size?: number, className?: string}) {
  const [showRefresh, setShowRefresh] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowRefresh(true), 15000);
    return () => clearTimeout(timer);
  }, []);

  function handleRefresh() {
    window.location.reload();
  }
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="flex flex-col items-center justify-center m-auto">
    <svg height={size} width={size} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className={cn("animate-pulsec", className)}>
      <rect
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="15"
        strokeLinejoin="round"
        width="30"
        height="30"
        x="85"
        y="85"
        rx="0"
        ry="0"
      >
        <animate
          attributeName="rx"
          calcMode="spline"
          dur="2"
          values="15;15;5;15;15"
          keySplines=".5 0 .5 1;.8 0 1 .2;0 .8 .2 1;.5 0 .5 1"
          repeatCount="indefinite"
        ></animate>
        <animate
          attributeName="ry"
          calcMode="spline"
          dur="2"
          values="15;15;10;15;15"
          keySplines=".5 0 .5 1;.8 0 1 .2;0 .8 .2 1;.5 0 .5 1"
          repeatCount="indefinite"
        ></animate>
        <animate
          attributeName="height"
          calcMode="spline"
          dur="2"
          values="30;30;1;30;30"
          keySplines=".5 0 .5 1;.8 0 1 .2;0 .8 .2 1;.5 0 .5 1"
          repeatCount="indefinite"
        ></animate>
        <animate
          attributeName="y"
          calcMode="spline"
          dur="2"
          values="40;170;40;"
          keySplines=".6 0 1 .4;0 .8 .2 1"
          repeatCount="indefinite"
        ></animate>
      </rect>
    </svg>
    <p className="text-xl animate-pulse">Loading..</p>
    {/* {showRefresh && ( */}
        <Fbutton
        variant="outline"
          onClick={handleRefresh}
          className="mt-4 max-w-md w-full"
        >
          Refresh
        </Fbutton>
      {/* )} */}
    </div>
  );
}


// export const LoadingFull = () => {
//   return ()
// };