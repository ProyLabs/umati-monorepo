import { createContext, useContext, useEffect, useState } from "react";

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
