import { useModal } from "../../providers/modal-provider";
import ButtonOptions from "../ui/button-options";
import { Fbutton } from "../ui/fancy-button";
import { Label } from "../ui/label";

type GameConfigProps = {
  game: { id: string; title: string; color: string };
};

function GameConfig({ game }: GameConfigProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-sart">{game.title}</h2>
      <p className="mb-8">Select the game configurations</p>

      {(() => {
        switch (game.id) {
          case "trivia":
            return <TriviaGameConfig />;
          case "drawit":
            return <DrawItGameConfig />;
          case "oddoneout":
            return <OddOneOutGameConfig />;
          default:
            return null;
        }
      })()}
    </div>
  );
}

export default GameConfig;

const TriviaGameConfig = () => {
    const {closeModal} = useModal();
  return (
    <div className="grid gap-8">
      <div className="grid gap-2">
        <Label htmlFor="lobby-code">Number of Rounds</Label>
        <ButtonOptions value={5} options={[3, 5, 10, 15, 20]} />
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

const DrawItGameConfig = () => {
     const {closeModal} = useModal();
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

const OddOneOutGameConfig = () => {
  return <div>Odd One Out Game Config</div>;
};
