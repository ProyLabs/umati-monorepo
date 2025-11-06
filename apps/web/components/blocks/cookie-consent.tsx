"use client";

import * as React from "react";
import { Check, Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getConsent, setConsent } from "@/lib/consent";
import { Fbutton } from "../ui/fancy-button";

interface CookieConsentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "small" | "mini";
  demo?: boolean;
  onAcceptCallback?: () => void;
  onDeclineCallback?: () => void;
  description?: string;
  learnMoreHref?: string;
}

const CookieConsent = React.forwardRef<HTMLDivElement, CookieConsentProps>(
  (
    {
      variant = "default",
      demo = false,
      onAcceptCallback = () => {},
      onDeclineCallback = () => {},
      className,
      description = "We use cookies to ensure you get the best experience on our website. For more information, please see our cookie policy.",
      learnMoreHref = "#",
      ...props
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [hide, setHide] = React.useState(false);

    const handleAccept = React.useCallback(() => {
      setConsent("accepted");
      setIsOpen(false);
      setTimeout(() => setHide(true), 700);
      onAcceptCallback();
    }, [onAcceptCallback]);

    const handleDecline = React.useCallback(() => {
      setConsent("declined");
      setIsOpen(false);
      setTimeout(() => setHide(true), 700);
      onDeclineCallback();
    }, [onDeclineCallback]);

    React.useEffect(() => {
      try {
        const consent = getConsent();
        if (!consent || demo) {
          setIsOpen(true);
        } else {
          setIsOpen(false);
          setTimeout(() => setHide(true), 700);
        }
      } catch (error) {
        console.warn("Cookie consent error:", error);
      }
    }, [demo]);

    if (hide) return null;

    const containerClasses = cn(
      "fixed z-100 transition-all duration-700",
      !isOpen ? "translate-y-full opacity-0" : "translate-y-0 opacity-100",
      className,
    );

    const wrapperProps = {
      ref,
      className: cn(
        containerClasses,
        variant === "mini"
          ? "left-0 right-0 sm:left-4 bottom-4 w-full sm:max-w-3xl"
          : "bottom-0 left-0 right-0 sm:left-4 sm:bottom-4 w-full sm:max-w-md",
      ),
      ...props,
    };

    const Buttons = (
      <>
        <Fbutton onClick={handleDecline} variant="secondary" className="flex-1">
          Decline
        </Fbutton>
        <Fbutton onClick={handleAccept} className="flex-1">
          Accept
        </Fbutton>
      </>
    );

    return (
      <div {...wrapperProps}>
        <Card className="m-3 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">We use cookies</CardTitle>
            <Cookie className="h-5 w-5" />
          </CardHeader>
          <CardContent className="space-y-2">
            <CardDescription className="text-sm">{description}</CardDescription>
            <p className="text-xs text-muted-foreground">
              By clicking <span className="font-medium">"Accept"</span>, you agree to our use of cookies.
            </p>
            <a
              href={learnMoreHref}
              className="text-xs text-primary underline underline-offset-4 hover:no-underline"
            >
              Learn more
            </a>
          </CardContent>
          <CardFooter className="flex gap-2 pt-2">{Buttons}</CardFooter>
        </Card>
      </div>
    );
  },
);

CookieConsent.displayName = "CookieConsent";
export { CookieConsent };
export default CookieConsent;
