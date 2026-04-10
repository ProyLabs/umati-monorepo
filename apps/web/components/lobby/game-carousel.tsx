"use client";
import { cn } from "@/lib/utils";
import { useLobbyHost } from "@/providers/lobby-host-provider";
import { useModal } from "@/providers/modal-provider";
import { Games } from "@umati/ws/src/games";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import React, {
  ComponentPropsWithRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Fbutton } from "../ui/fancy-button";
import GameConfig from "./game-configs";
import { GameCard } from "./widgets";

type GameCarouselProps = {
  games?: Array<(typeof Games)[0]>;
};

const GAME_ORDER = [
  "trivia",
  "herdmentality",
  "chameleon",
  "quizzer",
  "drawit",
  "friendfacts",
  "jaroflies",
] as const;

const GameCarousel: React.FC<GameCarouselProps> = ({ games = Games }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const orderedGames = [...games].sort((a, b) => {
    const aIndex = GAME_ORDER.indexOf(a.id as (typeof GAME_ORDER)[number]);
    const bIndex = GAME_ORDER.indexOf(b.id as (typeof GAME_ORDER)[number]);

    return (
      (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) -
      (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex)
    );
  });

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = useHorizontalScrollButtons(scrollRef);

  const { openModal, closeModal } = useModal();
  const { setupGame, players } = useLobbyHost();

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-visible scroll-smooth py-2 scrollbar-hide"
      >
        {orderedGames.map((game, index) => (
          <div className="snap-start" key={index}>
            <GameCard
              key={game.id}
              variant={game.color as any}
              className="h-72 w-80 shrink-0"
              game={game}
              onClick={() => {
                if (!game.playable) return;

                if (game.min && players.length < game.min) {
                  openModal({
                    title: `${game.title}`,
                    body: (
                      <p className="text-center font-medium py-6">
                        You don't have enough players in the lobby to play this
                        game.
                      </p>
                    ),
                    containerClass: cn("bg-gradient-to-b", game.className),
                  });
                  return;
                }

                openModal({
                  title: `Configure ${game.title}`,
                  body: (
                    <GameConfig
                      game={game}
                      action={(options: any) => {
                        setupGame(game.id, options);
                        closeModal();
                      }}
                    />
                  ),
                  containerClass: cn(
                    "bg-gradient-to-b",
                    game.className,
                    game.id === "quizzer" && "sm:max-w-6xl",
                  ),
                });
              }}
            />
          </div>
        ))}
      </div>

      <div className="absolute z-50 -left-8 top-1/2 transform -translate-y-1/2">
        <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
      </div>

      <div className="absolute z-50 -right-8 top-1/2 transform -translate-y-1/2">
        <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
      </div>
    </div>
  );
};

export default GameCarousel;

type UseHorizontalScrollButtonsType = {
  prevBtnDisabled: boolean;
  nextBtnDisabled: boolean;
  onPrevButtonClick: () => void;
  onNextButtonClick: () => void;
};

export const useHorizontalScrollButtons = (
  scrollRef: React.RefObject<HTMLDivElement | null>,
): UseHorizontalScrollButtonsType => {
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const updateButtons = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;

    const maxScrollLeft = node.scrollWidth - node.clientWidth;
    setPrevBtnDisabled(node.scrollLeft <= 0);
    setNextBtnDisabled(node.scrollLeft >= maxScrollLeft - 1);
  }, [scrollRef]);

  const onPrevButtonClick = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollBy({ left: -node.clientWidth * 0.8, behavior: "smooth" });
  }, [scrollRef]);

  const onNextButtonClick = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollBy({ left: node.clientWidth * 0.8, behavior: "smooth" });
  }, [scrollRef]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    updateButtons();
    node.addEventListener("scroll", updateButtons, { passive: true });
    window.addEventListener("resize", updateButtons);

    return () => {
      node.removeEventListener("scroll", updateButtons);
      window.removeEventListener("resize", updateButtons);
    };
  }, [scrollRef, updateButtons]);

  return {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  };
};

type CarouselButtonPropType = ComponentPropsWithRef<"button">;

export const PrevButton: React.FC<CarouselButtonPropType> = (props) => {
  const { children, ...restProps } = props;

  return (
    <Fbutton
      variant="secondary"
      size="icon"
      rounded
      type="button"
      {...restProps}
    >
      <ChevronLeftIcon />
      {children}
    </Fbutton>
  );
};

export const NextButton: React.FC<CarouselButtonPropType> = (props) => {
  const { children, ...restProps } = props;

  return (
    <Fbutton
      variant="secondary"
      size="icon"
      rounded
      type="button"
      {...restProps}
    >
      <ChevronRightIcon />
      {children}
    </Fbutton>
  );
};
