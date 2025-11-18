"use client";

import { GlobalModal } from "../components/global-modal";
import { Toaster } from "../components/ui/sonner";
import React from "react";
import { AuthProvider } from "./auth-provider";
import { AlertDialogProvider, ModalProvider } from "./modal-provider";
import { SettingsProvider } from "./settings-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <ModalProvider>
        <AlertDialogProvider>
        <AuthProvider>
        
        {children}
        </AuthProvider>
        <Toaster position="bottom-center"/>
        <GlobalModal />
        </AlertDialogProvider>
      </ModalProvider>
    </SettingsProvider>
  );
}
