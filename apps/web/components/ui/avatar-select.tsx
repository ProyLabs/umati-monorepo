"use client";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { getRandomAvatarUrl, cn } from "../../lib/utils";

interface AvatarSelectProps extends Omit<React.HTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  placeholder?: string;
  disabled?: boolean;
  size?: number;
  className?: string;
  value?: string | null;
  onChange?: (value: string) => void;
}

const AvatarSelect: React.FC<AvatarSelectProps> = ({
  placeholder = "",
  disabled = false,
  size = 120,
  className,
  value ="",
  onChange,
}) => {
    const [internalValue, setValue] = React.useState<string>(value || getRandomAvatarUrl());

  const handleChangeAvatar = (
  ) => {
    if (disabled) return;
    const newUrl = getRandomAvatarUrl();
    setValue(newUrl);
    if (onChange)  onChange(newUrl);
  };

  return (
       <div
              className={cn(
                "relative group flex items-center justify-center border-4 rounded-full overflow-hidden cursor-pointer",
                disabled && "opacity-60 cursor-not-allowed",
                className
              )}
              style={{ width: size, height: size }}
            >
              <Avatar
                className="size-full transition-transform duration-150 group-active:scale-95  "
                 onClick={() => handleChangeAvatar()}
              >
                <AvatarImage
                  src={internalValue}
                  alt="Avatar"
                />
                <AvatarFallback className="bg-input text-white font-semibold text-lg">
                  {placeholder}
                </AvatarFallback>
                 <button
                type="button"
                disabled={disabled}
                className="absolute bottom-0 left-0 w-full bg-black/40 py-2  px-5 text-center text-white 
                  transition-opacity focus:outline-none"
              >
                <p className="text-xs font-semibold leading-none">
                  Tap to change!
                </p>
              </button>
              </Avatar>
            </div>
  );
};

export default AvatarSelect;
