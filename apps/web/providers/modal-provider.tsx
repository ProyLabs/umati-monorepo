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
import { fbuttonVariants } from "@/components/ui/fancy-button";

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

type AlertOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  closeText?: string;
  onConfirm?: () => void | Promise<void>;
  onClose?: () => void;
};

type AlertDialogEntry = AlertOptions & { id: number };

type AlertContextType = {
  showAlert: (options: AlertOptions) => number;
  closeAlert: () => void;
};

const AlertDialogContext = createContext<AlertContextType | null>(null);

export function AlertDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogs, setDialogs] = useState<AlertDialogEntry[]>([]);

  const closeDialogById = useCallback((id: number) => {
    setDialogs((prev) => prev.filter((dialog) => dialog.id !== id));
  }, []);

  const showAlert = useCallback((options: AlertOptions) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setDialogs((prev) => [...prev, { ...options, id }]);
    return id;
  }, []);

  const closeAlert = useCallback(() => {
    setDialogs((prev) => prev.slice(0, -1));
  }, []);

  const handleClose = useCallback(
    (dialog: AlertDialogEntry) => {
      dialog.onClose?.();
      closeDialogById(dialog.id);
    },
    [closeDialogById],
  );

  return (
    <AlertDialogContext.Provider value={{ showAlert, closeAlert }}>
      {children}

      {dialogs.map((dialog) => (
        <AlertDialog
          open
          key={dialog.id}
          onOpenChange={(open) => {
            if (!open) handleClose(dialog);
          }}
        >
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
              <AlertDialogCancel
                className={fbuttonVariants({ variant: "outline" })}
                onClick={() => handleClose(dialog)}
              >
                {dialog.closeText ?? "Cancel"}
              </AlertDialogCancel>

              <AlertDialogAction
                className={fbuttonVariants({ variant: "default" })}
                onClick={async () => {
                  await dialog.onConfirm?.();
                  closeDialogById(dialog.id);
                }}
              >
                {dialog.confirmText ?? "OK"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ))}
    </AlertDialogContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertDialogContext);
  if (!ctx) {
    throw new Error("useAlert must be used within <AlertDialogProvider>");
  }
  return ctx;
}

export function useAlertDialog() {
  const { showAlert } = useAlert();
  return useCallback(
    (options: {
      title: string;
      description?: string;
      actionLabel?: string;
      cancelLabel?: string;
      onAction?: () => void | Promise<void>;
    }) =>
      showAlert({
        title: options.title,
        description: options.description,
        confirmText: options.actionLabel,
        closeText: options.cancelLabel,
        onConfirm: options.onAction,
      }),
    [showAlert],
  );
}
