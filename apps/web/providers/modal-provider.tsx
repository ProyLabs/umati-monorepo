import { createContext, useContext, useCallback, useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ModalConfig = {
  type?: "default" | "success";
  title?: string;
  description?: string;
  body?: React.ReactNode;
  actionText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  bodyClass?: string;
  containerClass?: string;
  isBottomSheetOnMobile?: boolean;
  dismissible?: boolean;
};

const ModalContext = createContext<{
  openModal: (config: ModalConfig) => void;
  closeModal: () => void;
  config: ModalConfig | null;
  isOpen: boolean;
  shouldRender: boolean;
}>({
  openModal: () => {},
  closeModal: () => {},
  config: null,
  isOpen: false,
  shouldRender: false,
});

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [config, setConfig] = useState<ModalConfig | null>(null);

  const openModal = (newConfig: ModalConfig) => {
    setConfig(newConfig);
    setShouldRender(true);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  // 💡 Delay unmount after close
  useEffect(() => {
    if (!isOpen && config) {
      const timeout = setTimeout(() => {
        setShouldRender(false);
        setConfig(null);
      }, 300); // match the transition duration
      return () => clearTimeout(timeout);
    }
  }, [isOpen, config]);

  return (
    <ModalContext.Provider
      value={{ openModal, closeModal, config, isOpen, shouldRender }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);

type AlertDialogOptions = {
  title: string;
  description?: string;
  actionLabel?: string;
  cancelLabel?: string;
  onAction?: () => void | Promise<void>;
};

type AlertDialogContextType = {
  alertDialog: (options: AlertDialogOptions) => void;
};

const AlertDialogContext = createContext<AlertDialogContextType | null>(null);

export function AlertDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogs, setDialogs] = useState<
    Array<AlertDialogOptions & { id: number }>
  >([]);

  const alertDialog = useCallback((options: AlertDialogOptions) => {
    setDialogs((prev) => [...prev, { ...options, id: Date.now() }]);
  }, []);

  const closeDialog = (id: number) => {
    setDialogs((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <AlertDialogContext.Provider value={{ alertDialog }}>
      {children}

      {dialogs.map((dialog) => (
        <AlertDialog open key={dialog.id}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dialog.title}</AlertDialogTitle>
              {dialog.description && (
                <AlertDialogDescription>
                  {dialog.description}
                </AlertDialogDescription>
              )}
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => closeDialog(dialog.id)}>
                {dialog.cancelLabel ?? "Cancel"}
              </AlertDialogCancel>

              <AlertDialogAction
                onClick={async () => {
                  await dialog.onAction?.();
                  closeDialog(dialog.id);
                }}
              >
                {dialog.actionLabel ?? "OK"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ))}
    </AlertDialogContext.Provider>
  );
}

export function useAlertDialog() {
  const ctx = useContext(AlertDialogContext);
  if (!ctx) {
    throw new Error("useAlertDialog must be used within <AlertDialogProvider>");
  }
  return ctx.alertDialog;
}

