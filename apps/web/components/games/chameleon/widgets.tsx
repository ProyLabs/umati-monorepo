import React, { useEffect, useState } from "react";

export const Setup = () => {
  const categories = "Languages";

   const [trigger, setTrigger] = useState(0);
  const [d9, setD9] = useState(1);
  const [d6, setD6] = useState(6);

  const handleRoll = () => {
    // simulate server roll
    const newD9 = Math.floor(Math.random() * 9) + 1;
    const newD6 = Math.floor(Math.random() * 6) + 1;

    setD9(newD9);
    setD6(newD6);
    setTrigger(trigger + 1);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-16">
      <h1 className="text-6xl font-bold mb-8 text-center max-w-4xl mx-auto w-full">
        {categories}
      </h1>

      <GridCard />

     <div className="flex gap-4">
        <D9Dice value={d9} trigger={trigger} color="bg-yellow-500" />
        <D6Dice value={d6} trigger={trigger} color="bg-blue-500" />
      </div>
    </div>
  );
};

export const GridCard = () => {
  const grid = [
    ["English", "French", "Spanish", "German"],
    ["Japanese", "Korean", "Arabic", "Russian"],
    ["Mandarin", "Hindi", "Italian", "Portuguese"],
    ["Greek", "Dutch", "Swedish", "Turkish"],
  ];
  return (
    <div className="bg-white rounded-2xl p-4">
      <div className="grid grid-cols-4 grid-rows-4">
        {grid.map((group, i) => {
          return group.map((item, j) => {
            return (
              <div
                data-even={(i + j + 1) % 2}
                className="text-black h-18 aspect-video flex flex-col items-center justify-center text-center data-[even=0]:bg-lime-800 data-[even=0]:text-white"
                key={i + "-" + j}
              >
                <p className="font-semibold text-sm">{item}</p>
              </div>
            );
          });
        })}
      </div>
    </div>
  );
};

interface D6DiceProps {
  value: number;        // final rolled value (1–6)
  trigger?: number;     // re-trigger flicker when this changes
  duration?: number;    // ms for flicker
  color?: string;       // Tailwind color
}

export const D6Dice: React.FC<D6DiceProps> = ({
  value,
  trigger = 0,
  duration = 800,
  color = "bg-gray-800",
}) => {
  const [face, setFace] = useState(value);

  useEffect(() => {
    // Flicker animation by changing the face rapidly
    const interval = setInterval(() => {
      const random = Math.floor(Math.random() * 6) + 1;
      setFace(random);
    }, 80);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setFace(value);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [value, trigger, duration]);

  // Tailwind layout for each face
  const renderPips = () => {
    const pip = <span className="w-3 h-3 bg-white rounded-full"></span>;

    switch (face) {
      case 1:
        return (
          <div className="flex items-center justify-center h-full w-full">
            {pip}
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col justify-between h-full p-2 w-full">
            <div className="flex justify-start">{pip}</div>
            <div className="flex justify-end">{pip}</div>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col justify-between h-full p-2 w-full">
            <div className="flex justify-start">{pip}</div>
            <div className="flex justify-center">{pip}</div>
            <div className="flex justify-end">{pip}</div>
          </div>
        );

      case 4:
        return (
          <div className="flex flex-col justify-between h-full p-2 w-full">
            <div className="flex justify-between">
              {pip}
              {pip}
            </div>
            <div className="flex justify-between">
              {pip}
              {pip}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="flex flex-col justify-between h-full p-2 w-full">
            <div className="flex justify-between">
              {pip}
              {pip}
            </div>
            <div className="flex justify-center">{pip}</div>
            <div className="flex justify-between">
              {pip}
              {pip}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="flex flex-col justify-between h-full p-2 w-full">
            <div className="flex justify-between">
              {pip}
              {pip}
            </div>
            <div className="flex justify-between">
              {pip}
              {pip}
            </div>
            <div className="flex justify-between">
              {pip}
              {pip}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`${color} w-16 h-16 rounded-lg shadow-lg flex items-center justify-center`}
    >
      {renderPips()}
    </div>
  );
};

interface D9DiceProps {
  value: number;        // final rolled value (1–9)
  trigger?: number;     // change to re-trigger flicker
  duration?: number;    // ms for flicker
  color?: string;       // Tailwind background
}

export const D9Dice: React.FC<D9DiceProps> = ({
  value,
  trigger = 0,
  duration = 800,
  color = "bg-yellow-600",
}) => {
  const [face, setFace] = useState(value);

  useEffect(() => {
    const interval = setInterval(() => {
      const random = Math.floor(Math.random() * 9) + 1;
      setFace(random);
    }, 80);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setFace(value);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [value, trigger, duration]);

  return (
    <div
      className={`${color} w-16 h-16 rounded-lg shadow-lg flex items-center justify-center text-white text-3xl font-bold`}
    >
      {face}
    </div>
  );
};