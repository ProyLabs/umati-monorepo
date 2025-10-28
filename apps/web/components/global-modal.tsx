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

  if (config.isBottomSheetOnMobile && isMobile) {
    return (
      <Drawer
        open={isOpen}
        onOpenChange={closeModal}
        dismissible={config.dismissible !== false}
      >
        <DrawerContent
          className={cn(
            "data-[vaul-drawer-direction=bottom]:max-h-[90vh] px-4 pb-4 flex flex-col",
            { "items-center text-center": config.type === "success" },
            config.containerClass
          )}
        >
          {config.type === "success" && (
            <img src="/success.gif" className="max-h-35 mx-auto" alt="" />
          )}

          {(config.title || config.description) && (
            <DrawerHeader className="mb-4">
              {config.title && <DrawerTitle>{config.title}</DrawerTitle>}
              {config.description && (
                <DrawerDescription>{config.description}</DrawerDescription>
              )}
            </DrawerHeader>
          )}

          {config.body && (
            <div
              className={cn(
                "overflow-y-scroll overflow-x-hidden",
                config.bodyClass
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
          "sm:max-w-md flex flex-col",
          { "items-center text-center": config.type === "success" },
          config.containerClass
        )}
        showCloseButton={config.dismissible}
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

        {config.body &&
          (config.bodyClass ? (
            config.body
          ) : (
            <div className={cn(config.bodyClass)}>{config.body}</div>
          ))}

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
