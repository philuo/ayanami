# 游戏

## UI(TypeScript -> HTML + CSS + JS / Canvas)

## 用户输入(CPU(TypeScript) -> 键盘、鼠标按键、滚动、移动位置、游戏手柄)

```js
document.addEventListener('keydown', event => {
  
});
document.addEventListener('keyup', event => {
  
});
document.addEventListener('mouseenter', event => {
  
});
document.addEventListener('mouse', event => {
  
});
```


## 游戏逻辑(MoonBit)

- Entity、ECS、System、World
- AI计算(怪物的行为等)
- 物理模拟、游戏逻辑判定、寻路...

## 渲染(CPU(TypeScript -> JS) + GPU(WebGPU - Shader))

计算依赖“资源” + “数据”：
- Transform(平移、旋转、缩放、斜切的变化之和)
- 相机(视锥体、视口、投影矩阵)
- Shader(着色器代码)
- 粒子效果

## 资源

- 模型数据(点的数据集)
- 纹理材质(贴图)
- 音频数据(声音的波形数据)
- 视频：过场动画
- 动画：序列帧动画、骨骼动画
