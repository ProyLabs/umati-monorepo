
import React, {
  ComponentPropsWithRef,
  useCallback,
  useEffect,
  useState
} from 'react'
import { EmblaCarouselType } from 'embla-carousel'
import { EmblaOptionsType } from 'embla-carousel'
import useEmblaCarousel from 'embla-carousel-react'
import { Fbutton } from '../ui/fancy-button'
import { GameCard } from './widgets'
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useModal } from '../../providers/modal-provider'
import GameConfig from './game-configs'
import { cn } from '../../lib/utils'

const Games = [
  {id: "trivia", title: 'Trivia', color: 'red', className: 'from-[#FE566B] to-[var(--umati-red)]' },
  {id: "drawit", title: 'Draw It!', color: 'purple', className: 'from-[#9856FE] to-[var(--umati-purple)]' },
  {id: "oddoneout", title: 'Odd One Out', color: 'sky', className: 'from-[var(--umati-sky)] to-[#3A6EE4]' },
  {id: "game4", title: 'Game 4', color: 'aqua', className: 'from-[var(--umati-aqua)] to-[#00D9D5] text-black' },
  {id: "game-5", title: 'Game 5', color: 'blue', className: 'from-[var(--umati-blue)] to-[#446BF5]' },
]

type EmblaCarouselPropType = {
  games?: Array<typeof Games[0]>
  options?: EmblaOptionsType
}

const GameCarousel: React.FC<EmblaCarouselPropType> = (props) => {
  const { games = Games, options = {align: 'start', loop: true} } = props
  const [emblaRef, emblaApi] = useEmblaCarousel(options)

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick
  } = usePrevNextButtons(emblaApi)

  const {openModal} = useModal();
  

  return (
    <section className="embla relative">
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {games.map((game, index) => (
            <div className="embla__slide" key={index}>
           <GameCard key={game.id} variant={game.color as any} className="mx-2 flex-shrink-0"
            title={game.title} onClick={()=> {
              openModal({
                title: `Configure ${game.title}`,
                body: <GameConfig game={game} />,
                containerClass: cn('bg-gradient-to-b', game.className),
              })
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
  )
}

export default GameCarousel



type UsePrevNextButtonsType = {
  prevBtnDisabled: boolean
  nextBtnDisabled: boolean
  onPrevButtonClick: () => void
  onNextButtonClick: () => void
}

export const usePrevNextButtons = (
  emblaApi: EmblaCarouselType | undefined
): UsePrevNextButtonsType => {
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true)
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true)

  const onPrevButtonClick = useCallback(() => {
    if (!emblaApi) return
    emblaApi.scrollPrev()
  }, [emblaApi])

  const onNextButtonClick = useCallback(() => {
    if (!emblaApi) return
    emblaApi.scrollNext()
  }, [emblaApi])

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setPrevBtnDisabled(!emblaApi.canScrollPrev())
    setNextBtnDisabled(!emblaApi.canScrollNext())
  }, [])

  useEffect(() => {
    if (!emblaApi) return

    onSelect(emblaApi)
    emblaApi.on('reInit', onSelect).on('select', onSelect)
  }, [emblaApi, onSelect])

  return {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick
  }
}

type EmblaCarouselButtonPropType = ComponentPropsWithRef<'button'>

export const PrevButton: React.FC<EmblaCarouselButtonPropType> = (props) => {
  const { children, ...restProps } = props

  return (
    <Fbutton
    variant="secondary"
      size="icon"
      rounded
      type="button"
      {...restProps}
    >
      <ChevronLeftIcon/>
      {children}
    </Fbutton>
  )
}

export const NextButton: React.FC<EmblaCarouselButtonPropType> = (props) => {
  const { children, ...restProps } = props

  return (
    <Fbutton
    variant="secondary"
      size="icon"
      rounded
      type="button"
      {...restProps}
    >
      <ChevronRightIcon/>
      {children}
    </Fbutton>
  )
}
