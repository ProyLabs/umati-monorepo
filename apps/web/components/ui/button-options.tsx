import React from "react";
import { Fbutton } from "./fancy-button";
import { cn } from "../../lib/utils";

type Option<T extends string | number = string | number> = {
  label: string;
  value: T;
};

type PrimitiveOption<T extends string | number> = T | Option<T>;

interface ButtonOptionsProps<T extends string | number = string | number> {
  value?: T;
  options?: PrimitiveOption<T>[];
  onChange?: (value: T) => void;
  className?: string;
  variant?: 'outline' | 'dark-outline';
}


const ButtonOptions: React.FC<ButtonOptionsProps> = ({
  options = [],
  value,
  onChange,
  className,
  variant="outline"
}) => {
  const [selectedValue, setSelectedValue] = React.useState<string | number| undefined>(value);

  React.useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  const normalizedOptions = React.useMemo<Option[]>(() => {
    return options.map((opt) =>
      typeof opt === "string" || typeof opt === "number" ? { label: String(opt), value: opt } : opt
    );
  }, [options]);

  const handleOptionClick = (optionValue: string| number) => {
    setSelectedValue(optionValue);
    onChange?.(optionValue);
  };

  return (
    <div
      className={cn(
        "grid grid-flow-col auto-cols-fr gap-2 w-full overflow-x-auto scrollbar-hide h-[110%]",
        className
      )}
    >
      {normalizedOptions.map((option, index) => (
        <Fbutton
          key={index}
          variant={selectedValue === option.value ? (variant === "dark-outline" ? "dark" : "secondary") : variant}
          className="whitespace-nowrap flex-1"
          onClick={() => handleOptionClick(option.value)}
        >
          {option.label}
        </Fbutton>
      ))}
    </div>
  );
};

export default ButtonOptions;
