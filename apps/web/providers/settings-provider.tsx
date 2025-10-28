"use client";

import React, { createContext, useContext } from "react";
import { useLocalStorage } from "usehooks-ts"; // 👈 lightweight hook library

interface SettingsContextType {
  volume: number;
  musicOn: boolean;
  soundEffectsOn: boolean;
  voiceoverOn: boolean;
  autoplay: boolean;
  fullscreen: boolean;
  showHeader: boolean;
  showFooter: boolean;

  setVolume: (value: number) => void;
  toggleMusic: () => void;
  toggleSoundEffects: () => void;
  toggleVoiceover: () => void;
  toggleAutoplay: () => void;
  toggleFullscreen: () => void;
  setShowHeader: (value: boolean) => void;
  setShowFooter: (value: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType>({} as SettingsContextType);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [volume, setVolume] = useLocalStorage("volume", 0.5);
  const [musicOn, setMusicOn] = useLocalStorage("musicOn", true);
  const [soundEffectsOn, setSoundEffectsOn] = useLocalStorage("soundEffectsOn", true);
  const [voiceoverOn, setVoiceoverOn] = useLocalStorage("voiceoverOn", true);
  const [autoplay, setAutoplay] = useLocalStorage("autoplay", false);
  const [fullscreen, setFullscreen] = useLocalStorage("fullscreen", false);
  const [showHeader, setShowHeader] = useLocalStorage("showHeader", true);
  const [showFooter, setShowFooter] = useLocalStorage("showFooter", true);

  // 🔘 Toggle helpers
  const toggleMusic = () => setMusicOn((prev) => !prev);
  const toggleSoundEffects = () => setSoundEffectsOn((prev) => !prev);
  const toggleVoiceover = () => setVoiceoverOn((prev) => !prev);
  const toggleAutoplay = () => setAutoplay((prev) => !prev);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        volume,
        musicOn,
        soundEffectsOn,
        voiceoverOn,
        autoplay,
        fullscreen,
        showHeader,
        showFooter,
        setVolume,
        toggleMusic,
        toggleSoundEffects,
        toggleVoiceover,
        toggleAutoplay,
        toggleFullscreen,
        setShowHeader,
        setShowFooter,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
