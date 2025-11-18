"use client";
import { cn } from "@/lib/utils";
import { useLobbyHost } from "@/providers/lobby-host-provider";
import { useModal } from "@/providers/modal-provider";
import { Games } from "@umati/ws/src/games";
import { EmblaCarouselType, EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import React, {
  ComponentPropsWithRef,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Fbutton } from "../ui/fancy-button";
import GameConfig from "./game-configs";
import { GameCard } from "./widgets";

type EmblaCarouselPropType = {
  games?: Array<(typeof Games)[0]>;
  options?: EmblaOptionsType;
};

const GameCarousel: React.FC<EmblaCarouselPropType> = (props) => {
  const { games = Games, options = { align: "start", loop: true } } = props;
  const [emblaRef, emblaApi] = useEmblaCarousel(options);

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  const { openModal, closeModal } = useModal();
  const { setupGame, players } = useLobbyHost();

  return (
    <section className="embla relative">
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {games.map((game, index) => (
            <div className="embla__slide" key={index}>
              <GameCard
                key={game.id}
                variant={game.color as any}
                className="mx-2 flex-shrink-0"
                game={game}
                onClick={() => {
                  if (game.min && players.length < game.min) {
                    openModal({
                      title: `${game.title}`,
                      body: (
                        <p className="text-center font-medium py-6">
                          You don't have enough players in the lobby to play
                          this game.
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
                    containerClass: cn("bg-gradient-to-b", game.className),
                  });
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -left-8 top-1/2 transform -translate-y-1/2">
        <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
      </div>

      <div className="absolute -right-8 top-1/2 transform -translate-y-1/2">
        <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
      </div>
    </section>
  );
};

export default GameCarousel;

type UsePrevNextButtonsType = {
  prevBtnDisabled: boolean;
  nextBtnDisabled: boolean;
  onPrevButtonClick: () => void;
  onNextButtonClick: () => void;
};

export const usePrevNextButtons = (
  emblaApi: EmblaCarouselType | undefined
): UsePrevNextButtonsType => {
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const onPrevButtonClick = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollPrev();
  }, [emblaApi]);

  const onNextButtonClick = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect(emblaApi);
    emblaApi.on("reInit", onSelect).on("select", onSelect);
  }, [emblaApi, onSelect]);

  return {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  };
};

type EmblaCarouselButtonPropType = ComponentPropsWithRef<"button">;

export const PrevButton: React.FC<EmblaCarouselButtonPropType> = (props) => {
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

export const NextButton: React.FC<EmblaCarouselButtonPropType> = (props) => {
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
