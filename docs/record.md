@math.atan2(self.b, self.a) 是用来计算二维向量的角度（弧度）的数学函数。                                 │
│                                                                                                          │
│ 函数含义                                                                                                 │
│                                                                                                          │
│ atan2(y, x) 计算点 (x, y) 与原点连线的角度：                                                             │
│                                                                                                          │
│ │ // 语法：atan2(y坐标, x坐标)                                                                           │
│ │ @math.atan2(self.b, self.a)  // 假设a是x坐标，b是y坐标                                                 │
│                                                                                                          │
│ 实际用途                                                                                                 │
│                                                                                                          │
│ 1. 向量角度计算                                                                                          │
│ │ struct Vector2 {                                                                                       │
│ │   a : Double  // x坐标                                                                                 │
│ │   b : Double  // y坐标                                                                                 │
│ │ }                                                                                                      │
│ │                                                                                                        │
│ │ // 获取向量的角度（弧度）                                                                              │
│ │ fn Vector2::angle(self : Vector2) -> Double {                                                          │
│ │   @math.atan2(self.b, self.a)                                                                          │
│ │ }                                                                                                      │
│ │                                                                                                        │
│ │ // 转换为角度                                                                                          │
│ │ fn Vector2::angle_degrees(self : Vector2) -> Double {                                                  │
│ │   @math.atan2(self.b, self.a) * 180.0 / @math.pi                                                       │
│ │ }                                                                                                      │
│                                                                                                          │
│ 2. 坐标方位计算                                                                                          │
│ │ fn get_bearing(x : Double, y : Double) -> String {                                                     │
│ │   let angle = @math.atan2(y, x) * 180.0 / @math.pi                                                     │
│ │                                                                                                        │
│ │   // 根据角度返回方位                                                                                  │
│ │   match angle {                                                                                        │
│ │     a if a >= -22.5 && a < 22.5 => "东"                                                                │
│ │     a if a >= 22.5 && a < 67.5 => "东北"                                                               │
│ │     a if a >= 67.5 && a < 112.5 => "北"                                                                │
│ │     a if a >= 112.5 && a < 157.5 => "西北"                                                             │
│ │     a if a >= 157.5 || a < -157.5 => "西"                                                              │
│ │     a if a >= -157.5 && a < -112.5 => "西南"                                                           │
│ │     a if a >= -112.5 && a < -67.5 => "南"                                                              │
│ │     _ => "东南"                                                                                        │
│ │   }                                                                                                    │
│ │ }                                                                                                      │
│                                                                                                          │
│ 3. 游戏开发中的应用                                                                                      │
│ │ // 计算两个点之间的角度                                                                                │
│ │ fn angle_between(x1 : Double, y1 : Double, x2 : Double, y2 : Double) -> Double {                       │
│ │   let dx = x2 - x1                                                                                     │
│ │   let dy = y2 - y1                                                                                     │
│ │   @math.atan2(dy, dx)                                                                                  │
│ │ }                                                                                                      │
│ │                                                                                                        │
│ │ // 让物体朝向目标旋转                                                                                  │
│ │ struct GameObject {                                                                                    │
│ │   x : Double                                                                                           │
│ │   y : Double                                                                                           │
│ │   rotation : Double  // 当前旋转角度                                                                   │
│ │ }                                                                                                      │
│ │                                                                                                        │
│ │ fn GameObject::rotate_towards(self : GameObject, target_x : Double, target_y : Double) -> GameObject { │
│ │   let target_angle = @math.atan2(target_y - self.y, target_x - self.x)                                 │
│ │   { self | rotation: target_angle }                                                                    │
│ │ }                                                                                                      │
│                                                                                                          │
│ atan2 vs atan 的区别                                                                                     │
│                                                                                                          │
│ 普通 atan 的问题                                                                                         │
│ │ // atan只能判断比值，丢失象限信息                                                                      │
│ │ let angle1 = @math.atan(1.0 / 1.0)  // 45度                                                            │
│ │ let angle2 = @math.atan(-1.0 / -1.0) // 也是45度，但实际应该是225度！                                  │
│                                                                                                          │
│ atan2 的优势                                                                                             │
│ │ // atan2考虑x,y的符号，能正确判断象限                                                                  │
│ │ let angle1 = @math.atan2(1.0, 1.0)   // 45度 (第一象限)                                                │
│ │ let angle2 = @math.atan2(-1.0, -1.0) // -135度 或 225度 (第三象限)                                     │
│ │ let angle3 = @math.atan2(1.0, -1.0)  // 135度 (第二象限)                                               │
│ │ let angle4 = @math.atan2(-1.0, 1.0)  // -45度 (第四象限)                                               │
│                                                                                                          │
│ 常用角度参考                                                                                             │
│                                                                                                          │
│ | 点 (x, y) | atan2(y, x) 结果 | 说明 |                                                                  │
│ |-----------|------------------|------|                                                                  │
│ | (1, 0) | 0 | 正X轴 |                                                                                   │
│ | (0, 1) | π/2 ≈ 1.57 | 正Y轴 |                                                                          │
│ | (-1, 0) | π ≈ 3.14 | 负X轴 |                                                                           │
│ | (0, -1) | -π/2 ≈ -1.57 | 负Y轴 |                                                                       │
│ | (1, 1) | π/4 ≈ 0.785 | 45度 |                                                                          │
│ | (-1, 1) | 3π/4 ≈ 2.36 | 135度 |                                                                        │
│                                                                                                          │
│ 实际例子                                                                                                 │
│                                                                                                          │
│ │ test "atan2 examples" {                                                                                │
│ │   // 向量 (3, 4) 的角度                                                                                │
│ │   let angle1 = @math.atan2(4.0, 3.0)  // ≈ 0.927 弧度 (53.13度)                                        │
│ │                                                                                                        │
│ │   // 向量 (-3, 4) 的角度                                                                               │
│ │   let angle2 = @math.atan2(4.0, -3.0) // ≈ 2.214 弧度 (126.87度)                                       │
│ │                                                                                                        │
│ │   // 向量 (-3, -4) 的角度                                                                              │
│ │   let angle3 = @math.atan2(-4.0, -3.0) // ≈ -2.214 弧度 (-126.87度)                                    │
│ │                                                                                                        │
│ │   // 转换为角度                                                                                        │
│ │   let degrees1 = angle1 * 180.0 / @math.pi                                                             │
│ │   let degrees2 = angle2 * 180.0 / @math.pi                                                             │
│ │   let degrees3 = angle3 * 180.0 / @math.pi                                                             │
│ │                                                                                                        │
│ │   inspect(degrees1, content="53.130102354155985")                                                      │
│ │   inspect(degrees2, content="126.86989764584402")                                                      │
│ │   inspect(degrees3, content="-126.86989764584402")                                                     │
│ │ }                                                                                                      │
│                                                                                                          │
│ 注意事项                                                                                                 │
│                                                                                                          │
│ 1. 返回弧度，不是角度                                                                                    │
│ 2. 参数顺序是 atan2(y, x)，不是 atan2(x, y)                                                              │
│ 3. 返回范围是 (-π, π]                                                                                    │
│ 4. 特殊情况：atan2(0, 0) 返回 0                                                                          │
│                                                                                                          │
│ 这个函数在游戏开发、图形学、机器人导航等领域非常有用！
