import { Games, GameType } from "@umati/ws";
import { useState } from "react";
import { useModal } from "../../providers/modal-provider";
import ButtonOptions from "../ui/button-options";
import { Fbutton } from "../ui/fancy-button";
import { Label } from "../ui/label";

type GameConfigAction = (options: Record<string, any>) => void
type GameConfigProps = {
  game: typeof Games[0]
  action: GameConfigAction
};

function GameConfig({ game, action }: GameConfigProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-sart">{game.title}</h2>
      <p className="mb-8">Select the game configurations</p>

      {(() => {
        switch (game.id) {
          case GameType.TRIVIA:
            return <TriviaGameConfig action={action} />;
          case GameType.DRAWIT:
            return <DrawItGameConfig />;
          case GameType.OOO:
            return <OddOneOutGameConfig />;
          case GameType.HM:
            return <HMGameConfig action={action} />
          case GameType.CHAMELEON:
            return <ChameleonGameConfig action={action} />
          default:
            return null;
        }
      })()}
    </div>
  );
}

export default GameConfig;

const TriviaGameConfig = ({action}: { action: GameConfigAction}) => {
  console.log("🚀 ~ TriviaGameConfig ~ action:", action)
  const { closeModal } = useModal();
  const [noOfRounds, setNoOfRounds] = useState(10);
  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <Label htmlFor="lobby-code">Number of Rounds</Label>
        <ButtonOptions
          value={noOfRounds}
          options={[3, 5, 10, 15, 20]}
          onChange={(val) => setNoOfRounds(val as number)}
        />
      </div>
      <div className="grid gap-2">
        <Fbutton
          type="submit"
          variant="secondary"
          className="w-full"
          onClick={async () => {
            await action({
              noOfRounds,
            });
          }}
        >
          Start Game
        </Fbutton>
        <Fbutton variant="outline" className="w-full" onClick={closeModal}>
          Cancel
        </Fbutton>
      </div>
    </div>
  );
};

const DrawItGameConfig = () => {
  const { closeModal } = useModal();
  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <Label htmlFor="lobby-code">Number of Rounds</Label>
        <ButtonOptions value={3} options={[1, 2, 3, 5, 10]} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="lobby-code">Word Count</Label>
        <ButtonOptions value={3} options={[2, 3, 4, 5]} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="lobby-code">Drawtime</Label>
        <ButtonOptions value={60} options={[30, 60, 80]} />
      </div>
      <div className="grid gap-2">
        <Fbutton
          type="submit"
          variant="secondary"
          className="w-full"
          onClick={async () => {}}
        >
          Start Game
        </Fbutton>
        <Fbutton variant="outline" className="w-full" onClick={closeModal}>
          Cancel
        </Fbutton>
      </div>
    </div>
  );
};

const HMGameConfig = ({action}: { action: GameConfigAction}) => {
  console.log("🚀 ~ HMGameConfig ~ action:", action)
  const { closeModal } = useModal();
  const [noOfRounds, setNoOfRounds] = useState(10);
  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <Label htmlFor="lobby-code">Number of Rounds</Label>
        <ButtonOptions
          value={noOfRounds}
          options={[3, 5, 10, 15, 20]}
          onChange={(val) => setNoOfRounds(val as number)}
          variant="dark-outline"
        />
      </div>
      <div className="grid gap-2">
        <Fbutton
          type="submit"
          variant="secondary"
          className="w-full"
          onClick={async () => {
            await action({
              noOfRounds,
            });
          }}
        >
          Start Game
        </Fbutton>
        <Fbutton variant="dark-outline" className="w-full" onClick={closeModal}>
          Cancel
        </Fbutton>
      </div>
    </div>
  );
};

const OddOneOutGameConfig = () => {
  return <div>Odd One Out Game Config</div>;
};



const ChameleonGameConfig = ({action}: { action: GameConfigAction}) => {
  const { closeModal } = useModal();
  const [noOfRounds, setNoOfRounds] = useState(8);
  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <Label htmlFor="lobby-code">Number of Rounds</Label>
        <ButtonOptions
          value={noOfRounds}
          options={[3, 5, 8, 10, 12]}
          onChange={(val) => setNoOfRounds(val as number)}
        />
      </div>
      <div className="grid gap-2">
        <Fbutton
          type="submit"
          variant="secondary"
          className="w-full"
          onClick={async () => {
            await action({
              noOfRounds,
            });
          }}
        >
          Start Game
        </Fbutton>
        <Fbutton variant="outline"  className="w-full" onClick={closeModal}>
          Cancel
        </Fbutton>
      </div>
    </div>
  );
};