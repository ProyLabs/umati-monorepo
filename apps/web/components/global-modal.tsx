import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import { Separator } from "./ui/separator";
import useMediaQuery from "../hooks/use-media-query";
import { cn } from "../lib/utils";
import { useModal } from "../providers/modal-provider";

export const GlobalModal = () => {
  const { config, isOpen, shouldRender, closeModal } = useModal();
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (!config || !shouldRender) return null;

  const handleConfirm = () => {
    config.onConfirm?.();
    closeModal();
  };

  if (config.isBottomSheetOnMobile !== false && isMobile) {
    return (
      <Drawer
        open={isOpen}
        onOpenChange={closeModal}
        dismissible={config.dismissible !== false}
      >
        <DrawerContent
          className={cn(
            "px-4 pb-4 flex max-h-[80vh] flex-col",
            { "items-center text-center": config.type === "success" },
            config.containerClass,
          )}
          dismissible={config.dismissible !== false}
        >
          {config.type === "success" && (
            <img src="/success.gif" className="max-h-35 mx-auto" alt="" />
          )}

          {(config.title || config.description) && (
            <DrawerHeader className="mb-4">
              {config.title && (
                <DrawerTitle className={config.titleClass}>
                  {config.title}
                </DrawerTitle>
              )}
              {config.description && (
                <DrawerDescription>{config.description}</DrawerDescription>
              )}
            </DrawerHeader>
          )}

          {config.body && (
            <div
              className={cn(
                "min-h-0 overflow-y-auto overflow-x-hidden",
                config.bodyClass,
              )}
            >
              {config.body}
            </div>
          )}
          {!config.body && <Separator className="my-2" />}
          {!config.body && (
            <DrawerFooter>
              {config.onConfirm && (
                <Button className="w-full" onClick={handleConfirm}>
                  {config.actionText || "Confirm"}
                </Button>
              )}
              {config.dismissible !== false && (
                <Button
                  className="w-full"
                  variant={config.onConfirm ? "ghost" : "default"}
                  onClick={closeModal}
                >
                  {config.cancelText || "Cancel"}
                </Button>
              )}
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent
        className={cn(
          "flex max-h-[80vh] flex-col sm:max-w-md",
          { "items-center text-center": config.type === "success" },
          config.containerClass,
        )}
        showCloseButton={config.dismissible !== false}
        dismissible={config.dismissible}
      >
        {config.type === "success" && (
          <img src="/success.gif" className="max-h-35 mx-auto" alt="" />
        )}
        <DialogHeader
          className={cn(!config.title || !config.description ? "hidden" : "", {
            "items-center text-center": config.type === "success",
          })}
        >
          <DialogTitle className="text-foreground font-semibold ">
            {config.title}
          </DialogTitle>
          {config.description && (
            <p className="text-sm text-[#2B2B2B] opacity-60">
              {config.description}
            </p>
          )}
        </DialogHeader>

        {config.body ? (
          <div className={cn("min-h-0 overflow-y-auto", config.bodyClass)}>
            {config.body}
          </div>
        ) : null}

        {!config.body && <Separator className="my-2" />}
        {!config.body && (
          <DialogFooter>
            {config.onConfirm && (
              <Button onClick={handleConfirm}>
                {config.actionText || "Confirm"}
              </Button>
            )}
            {config.dismissible !== false && (
              <Button
                className={config?.type === "success" ? "w-full" : ""}
                variant={config.onConfirm ? "ghost" : "default"}
                onClick={closeModal}
              >
                {config.cancelText || "Cancel"}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
