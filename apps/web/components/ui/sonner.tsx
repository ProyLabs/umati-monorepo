"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { animate } from "motion";
import { useReducedMotion } from "motion/react";
import { useTheme } from "next-themes"
import { useEffect } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner"

const toastIconBase =
  "flex size-10 items-center justify-center rounded-xl border shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-transform duration-300 group-hover:scale-105";

const enteredContent = new WeakSet<HTMLElement>();
const exitedContent = new WeakSet<HTMLElement>();

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const animateContentIn = (toastElement: Element) => {
      const contentElement = toastElement.querySelector("[data-content]");

      if (
        !(contentElement instanceof HTMLElement) ||
        enteredContent.has(contentElement)
      ) {
        return;
      }

      enteredContent.add(contentElement);
      exitedContent.delete(contentElement);

      animate(
        contentElement,
        {
          opacity: [0, 1],
          x: [-16, 0],
          scaleX: [0.72, 1],
          filter: ["blur(6px)", "blur(0px)"],
        },
        {
          duration: 0.32,
          delay: 0.11,
          ease: [0.16, 1, 0.3, 1],
        },
      );
    };

    const animateContentOut = (toastElement: Element) => {
      const contentElement = toastElement.querySelector("[data-content]");

      if (
        !(contentElement instanceof HTMLElement) ||
        exitedContent.has(contentElement)
      ) {
        return;
      }

      exitedContent.add(contentElement);

      animate(
        contentElement,
        {
          opacity: [1, 0],
          x: [0, -10],
          scaleX: [1, 0.7],
          filter: ["blur(0px)", "blur(4px)"],
        },
        {
          duration: 0.15,
          ease: [0.4, 0, 1, 1],
        },
      );
    };

    const syncToastAnimation = (toastElement: Element) => {
      const isRemoved = toastElement.getAttribute("data-removed") === "true";
      const isMounted = toastElement.getAttribute("data-mounted") === "true";

      if (isRemoved) {
        animateContentOut(toastElement);
        return;
      }

      if (isMounted) {
        animateContentIn(toastElement);
      }
    };

    const scanToasts = (root: ParentNode) => {
      root.querySelectorAll("[data-sonner-toast]").forEach(syncToastAnimation);
    };

    scanToasts(document);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (!(node instanceof Element)) {
              return;
            }

            if (node.matches("[data-sonner-toast]")) {
              syncToastAnimation(node);
            }

            scanToasts(node);
          });

          return;
        }

        if (
          mutation.type === "attributes" &&
          mutation.target instanceof Element
        ) {
          syncToastAnimation(mutation.target);
        }
      });
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-mounted", "data-removed"],
    });

    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <span
            className={`${toastIconBase} border-emerald-300/35 bg-emerald-400/18 text-emerald-100`}
          >
            <CircleCheckIcon className="size-4" />
          </span>
        ),
        info: (
          <span
            className={`${toastIconBase} border-sky-300/35 bg-sky-400/18 text-sky-100`}
          >
            <InfoIcon className="size-4" />
          </span>
        ),
        warning: (
          <span
            className={`${toastIconBase} border-amber-300/35 bg-amber-300/18 text-amber-50`}
          >
            <TriangleAlertIcon className="size-4" />
          </span>
        ),
        error: (
          <span
            className={`${toastIconBase} border-rose-300/35 bg-rose-400/18 text-rose-100`}
          >
            <OctagonXIcon className="size-4" />
          </span>
        ),
        loading: (
          <span
            className={`${toastIconBase} border-fuchsia-300/35 bg-fuchsia-400/18 text-fuchsia-100`}
          >
            <Loader2Icon className="size-4 animate-spin" />
          </span>
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            "group/toast relative overflow-clip rounded-[1rem] border text-white shadow-[0_26px_80px_rgba(0,0,0,0.26)] backdrop-blur-xl transition-[transform,box-shadow,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[swiped=true]:opacity-40",
          title: "text-sm font-black tracking-[0.01em] text-white",
          description: "text-[13px] leading-5 text-white/78",
          icon: "origin-bottom will-change-transform motion-reduce:transition-none group-data-[mounted=true]/toast:animate-[toast-icon-rise_280ms_cubic-bezier(0.16,1,0.3,1)_both] group-data-[removed=true]/toast:animate-[toast-icon-drop_220ms_cubic-bezier(0.4,0,1,1)_both]",
          content:
            "gap-1 ml-6 overflow-hidden pl-1 origin-left will-change-[transform,opacity,filter] motion-reduce:transition-none",
          actionButton:
            "rounded-lg border border-black/10 bg-black/12 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white transition-all duration-200 hover:scale-[1.02] hover:bg-black/18 active:scale-[0.98]",
          cancelButton:
            "rounded-lg border border-black/10 bg-black/18 px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white/80 transition-all duration-200 hover:scale-[1.02] hover:bg-black/26 active:scale-[0.98]",
          closeButton:
            "rounded-md border border-black/10 bg-black/12 text-white/72 transition-all duration-200 hover:scale-105 hover:bg-black/18 hover:text-white",
          success:
            "border-emerald-300/18 bg-[linear-gradient(145deg,rgba(3,61,45,0.96),rgba(5,40,31,0.98))] text-emerald-50 [--toast-accent:rgba(52,211,153,0.24)] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,var(--toast-accent),transparent_38%)] before:content-['']",
          error:
            "border-rose-300/18 bg-[linear-gradient(145deg,rgba(86,16,34,0.97),rgba(58,10,23,0.98))] text-rose-50 [--toast-accent:rgba(251,113,133,0.24)] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,var(--toast-accent),transparent_38%)] before:content-['']",
          warning:
            "border-amber-300/18 bg-[linear-gradient(145deg,rgba(98,48,8,0.97),rgba(68,31,6,0.98))] text-amber-50 [--toast-accent:rgba(251,191,36,0.22)] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,var(--toast-accent),transparent_38%)] before:content-['']",
          info: "border-sky-300/18 bg-[linear-gradient(145deg,rgba(8,63,94,0.97),rgba(6,42,69,0.98))] text-sky-50 [--toast-accent:rgba(125,211,252,0.22)] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,var(--toast-accent),transparent_38%)] before:content-['']",
          loading:
            "border-fuchsia-300/18 bg-[linear-gradient(145deg,rgba(72,18,96,0.97),rgba(46,10,67,0.98))] text-fuchsia-50 [--toast-accent:rgba(240,171,252,0.22)] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,var(--toast-accent),transparent_38%)] before:content-['']",
        },
      }}
      style={
        {
          "--normal-bg": "rgba(13, 22, 44, 0.96)",
          "--normal-text": "rgba(255,255,255,0.98)",
          "--normal-border": "rgba(163, 184, 255, 0.12)",
          "--success-bg": "rgba(4, 52, 39, 0.97)",
          "--success-border": "rgba(52, 211, 153, 0.22)",
          "--success-text": "rgba(236, 253, 245, 0.98)",
          "--error-bg": "rgba(82, 14, 34, 0.97)",
          "--error-border": "rgba(251, 113, 133, 0.22)",
          "--error-text": "rgba(255, 241, 242, 0.98)",
          "--warning-bg": "rgba(91, 42, 7, 0.97)",
          "--warning-border": "rgba(251, 191, 36, 0.22)",
          "--warning-text": "rgba(255, 251, 235, 0.98)",
          "--info-bg": "rgba(8, 58, 88, 0.97)",
          "--info-border": "rgba(125, 211, 252, 0.22)",
          "--info-text": "rgba(240, 249, 255, 0.98)",
          "--toast-width": "360px",
          "--border-radius": "1rem",
        } as React.CSSProperties
      }
      richColors
      expand
      gap={14}
      visibleToasts={4}
      offset={20}
      mobileOffset={16}
      position="bottom-right"
      {...props}
    />
  );
}

export { Toaster }
