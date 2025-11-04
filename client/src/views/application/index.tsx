import { exports } from '@/application';
import './index.scss';

export default function Application() {
  onMount(exports.game_start);

  return <canvas id="game-canvas" />
}
