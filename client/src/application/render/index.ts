/**
 * @file 渲染帧处理
 */
import inputs from '@/application/inputs';

/** Mock: 渲染 */
export function render() {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  // 设置 Canvas 尺寸（考虑设备像素比）
  const dpr = devicePixelRatio || 2;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);
  ctx.fillStyle = '#333';
  ctx.font = '16px monospace';
  ctx.textAlign = 'left';
  const lineHeight = 22;
  let x = 20;
  let y = 20;

  const result = {
    keyboard: [],
    mouse_move: [],
  }

  inputs.keyboard_buffer.each(v => result.keyboard.push(v));
  inputs.mouse_move_buffer.each(v => result.mouse_move.push(v));

  const keyboard_lines = JSON.stringify(result.keyboard, null, 2).split(/\r?\n/);
  const mouse_move_lines = JSON.stringify(result.mouse_move, null, 2).split(/\r?\n/);

  for (let line of keyboard_lines) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }

  for (let line of mouse_move_lines) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
}
