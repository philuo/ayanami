# 技术文档

## MoonBit 中的 guard 关键字

### 基本语法

```moonbit
guard condition else { 
  // 如果condition为false时执行的代码
}
```

### 主要作用和用途

#### 1. 前置条件检查
`guard`用于验证函数或代码块的先决条件，如果条件不满足，立即执行`else`分支中的代码。

```moonbit
pub fn parse_uint64(str : StringView, base? : Int = 0) -> UInt64 raise StrConvError {
  guard str != "" else { syntax_err() }  // 字符串不能为空
  // 继续解析逻辑...
}
```

#### 2. 数据验证
在处理JSON解析、数值转换等场景中验证数据有效性：

```moonbit
pub impl FromJson for Int with from_json(json, path) {
  guard json is Number(n, ..) &&
    n != @double.infinity &&
    n != @double.neg_infinity else {
    decode_error(path, "Int::from_json: expected number")
  }
  // 继续转换...
}
```

#### 3. 范围和边界检查
用于验证参数是否在有效范围内：

```moonbit
fn percentile(sorted_data~ : Array[Double], pct~ : Double) -> Double {
  guard sorted_data.length() > 0          // 数组不能为空
  guard pct >= 0.0 && pct <= 100.0         // 百分比必须在0-100之间
  // 继续计算...
}
```

#### 4. 模式匹配中的条件
在`match`表达式中作为附加条件：

```moonbit
match expr {
  Sub(e1, e2) if e1 == e2 => Lit(0)  // 当两个表达式相等时
  _ => expr
}
```

### 语法特点

- **简洁性**：比传统的`if (!condition) { ... }`更加简洁
- **可读性**：清楚地表达"这个条件必须满足，否则..."的意图
- **提前退出**：当条件不满足时立即执行处理逻辑，避免嵌套的if语句

### 使用场景

1. **函数参数验证**
2. **数据格式检查**  
3. **算法前置条件验证**
4. **错误处理和边界情况处理**
5. **避免深层嵌套的if语句**

## 值类型 vs 引用类型

### 值类型（Tuple-struct）

#### 性能优势
- **栈分配** - 直接在栈上分配，无需堆内存管理
- **零成本抽象** - 编译时完全内联，运行时无额外开销
- **缓存友好** - 连续内存布局，CPU缓存命中率高
- **无GC压力** - 不参与垃圾回收，减少GC停顿
- **SIMD友好** - 可以被向量化优化

#### 适用场景
```moonbit
// 零开销抽象
struct Point(Int, Int)
struct Vector3(Double, Double, Double)
struct UserId(Int)
```

### 引用类型的开销

- **堆分配** - 需要在堆上分配内存
- **间接访问** - 通过指针间接访问，可能造成缓存未命中
- **GC开销** - 参与垃圾回收，增加GC压力
- **内存碎片** - 可能造成内存碎片化

### 嵌套值类型限制

MoonBit不允许值类型嵌套值类型，错误示例：

```moonbit
// 错误：值类型包含值类型字段
struct A {
  x : Int  // Int是值类型
}

struct B {
  a : A    // A包含值类型，所以A也是值类型
  y : Int  // 这会导致嵌套值类型错误
}
```

### 解决方案

#### 方案1：使用引用类型
```moonbit
struct A {
  x : Int
}

struct B {
  a : A    // A包含值类型，但B作为引用类型
  y : Int
}
```

#### 方案2：使用`Ref[T]`包装基本类型
```moonbit
struct A {
  x : Ref[Int]  // 使用Ref包装
}

struct B {
  a : A
  y : Int
}
```

#### 方案3：使用普通结构体而不是tuple-struct
```moonbit
// 错误：tuple-struct是值类型
struct MyInt(Int)

struct Container {
  value : MyInt  // 错误：嵌套值类型
}

// 正确：使用普通结构体
struct MyIntStruct {
  value : Int
}

struct Container {
  value : MyIntStruct  // 正确
}
```

### 性能提升数据

在典型场景中，值类型相比引用类型可以带来：
- **2-5倍** 的内存访问速度提升
- **显著减少** GC压力和停顿时间
- **更好的** CPU缓存利用率
- **更适合** SIMD向量化优化

### 最佳实践

#### 适合使用值类型的场景
1. **小型数据结构** (< 16-32字节)
2. **高频使用** (如ID、坐标、颜色等)
3. **数值计算** (向量、矩阵、复数等)
4. **性能关键路径**

```moonbit
// 完美的值类型用例
struct Color(UInt8, UInt8, UInt8, UInt8)  // RGBA
struct Position(Double, Double)            // 2D坐标
struct Timestamp(Int64)                     // 时间戳
```

#### 适合使用引用类型的场景
1. **大型数据结构**
2. **需要共享所有权**
3. **复杂数据关系**
4. **生命周期较长**

```moonbit
struct User {
  id : UserId        // 值类型，高性能
  name : String      // 引用类型
  posts : Array[Post] // 引用类型
}
```

## @math.atan2 函数详解

### 核心功能
`atan2(y, x)` 计算点 `(x, y)` 与原点连线的角度（弧度）。

### 语法
```moonbit
@math.atan2(y坐标, x坐标)
```

### atan2 vs atan 的区别

#### 普通 atan 的问题
```moonbit
// atan只能判断比值，丢失象限信息
let angle1 = @math.atan(1.0 / 1.0)  // 45度
let angle2 = @math.atan(-1.0 / -1.0) // 也是45度，但实际应该是225度！
```

#### atan2 的优势
```moonbit
// atan2考虑x,y的符号，能正确判断象限
let angle1 = @math.atan2(1.0, 1.0)   // 45度 (第一象限)
let angle2 = @math.atan2(-1.0, -1.0) // -135度 或 225度 (第三象限)
let angle3 = @math.atan2(1.0, -1.0)  // 135度 (第二象限)
let angle4 = @math.atan2(-1.0, 1.0)  // -45度 (第四象限)
```

### 实际应用

#### 1. 向量角度计算
```moonbit
struct Vector2 {
  a : Double  // x坐标
  b : Double  // y坐标
}

// 获取向量的角度（弧度）
fn Vector2::angle(self : Vector2) -> Double {
  @math.atan2(self.b, self.a)
}

// 转换为角度
fn Vector2::angle_degrees(self : Vector2) -> Double {
  @math.atan2(self.b, self.a) * 180.0 / @math.pi
}
```

#### 2. 坐标方位计算
```moonbit
fn get_bearing(x : Double, y : Double) -> String {
  let angle = @math.atan2(y, x) * 180.0 / @math.pi
  
  // 根据角度返回方位
  match angle {
    a if a >= -22.5 && a < 22.5 => "东"
    a if a >= 22.5 && a < 67.5 => "东北"
    a if a >= 67.5 && a < 112.5 => "北"
    a if a >= 112.5 && a < 157.5 => "西北"
    a if a >= 157.5 || a < -157.5 => "西"
    a if a >= -157.5 && a < -112.5 => "西南"
    a if a >= -112.5 && a < -67.5 => "南"
    _ => "东南"
  }
}
```

#### 3. 游戏开发中的应用
```moonbit
// 计算两个点之间的角度
fn angle_between(x1 : Double, y1 : Double, x2 : Double, y2 : Double) -> Double {
  let dx = x2 - x1
  let dy = y2 - y1
  @math.atan2(dy, dx)
}

// 让物体朝向目标旋转
struct GameObject {
  x : Double
  y : Double
  rotation : Double  // 当前旋转角度
}

fn GameObject::rotate_towards(self : GameObject, target_x : Double, target_y : Double) -> GameObject {
  let target_angle = @math.atan2(target_y - self.y, target_x - self.x)
  { self | rotation: target_angle }
}
```

### 常用角度参考

| 点 (x, y) | atan2(y, x) 结果 | 说明 |
|-----------|------------------|------|
| (1, 0) | 0 | 正X轴 |
| (0, 1) | π/2 ≈ 1.57 | 正Y轴 |
| (-1, 0) | π ≈ 3.14 | 负X轴 |
| (0, -1) | -π/2 ≈ -1.57 | 负Y轴 |
| (1, 1) | π/4 ≈ 0.785 | 45度 |
| (-1, 1) | 3π/4 ≈ 2.36 | 135度 |

### 注意事项

1. **返回弧度**，不是角度
2. **参数顺序**是 `atan2(y, x)`，不是 `atan2(x, y)`
3. **返回范围**是 `(-π, π]`
4. **特殊情况**：`atan2(0, 0)` 返回 `0`

## Transform::inverse 方法详解

### Transform 矩阵结构

```moonbit
struct Transform {
  a: Double  // scale_x * cos(rotation)
  b: Double  // scale_x * sin(rotation) + skew_y  
  c: Double  // scale_y * -sin(rotation) + skew_x
  d: Double  // scale_y * cos(rotation)
  tx: Double // translation_x
  ty: Double // translation_y
}
```

对应的矩阵形式：
```
[a  c  tx]
[b  d  ty]  
[0  0   1]
```

点变换公式：
```
x' = a*x + c*y + tx
y' = b*x + d*y + ty
```

### 方法功能

`Transform::inverse` 计算一个变换的"反向操作"，即逆变换。

### 核心原理

#### 1. 计算行列式
```moonbit
let det = self.a * self.d - self.b * self.c
```

对于矩阵 `[a c; b d]`，行列式计算为 `a*d - b*c`。

**几何意义**：这个值表示变换后的面积缩放比例
- `det > 0`：保持方向（不会翻转）
- `det < 0`：翻转方向（镜像）
- `det = 0`：降维（把2D压成1D，不可逆）

#### 2. 可逆性检查
```moonbit
if det.abs() < 0.0000000001 {
  None
}
```

当行列式接近0时，说明变换把平面"压扁"了，信息丢失，无法反推。

**不可逆的情况：**
```moonbit
// scale_x = 0，把所有x坐标映射到0
let bad_transform = Transform{
  a: 0, b: 0,  // 第一行全0
  c: 0, d: 1,
  tx: 0, ty: 0
} // det = 0*1 - 0*0 = 0 ❌
```

#### 3. 计算逆矩阵
```moonbit
let inv_det = 1.0 / det

Some({
  a: self.d * inv_det,        // d/det
  b: -self.b * inv_det,       // -b/det  
  c: -self.c * inv_det,       // -c/det
  d: self.a * inv_det,        // a/det
  tx: (self.c * self.ty - self.d * self.tx) * inv_det,
  ty: (self.b * self.tx - self.a * self.ty) * inv_det,
})
```

**数学原理**：
对于2×2矩阵 `M = [a c; b d]`，其逆矩阵是：
```
M⁻¹ = 1/det × [d -c; -b a]
```

**平移部分的推导**：
原始变换：
```
x' = a*x + c*y + tx
y' = b*x + d*y + ty
```

逆变换需要解这个方程组：
```
x = d*(x'-tx) - c*(y'-ty)  除以det
y = -b*(x'-tx) + a*(y'-ty) 除以det
```

整理后得到：
```
tx' = (c*ty - d*tx)/det
ty' = (b*tx - a*ty)/det
```

### 实际应用场景

#### 1. 游戏开发 - 坐标转换

```moonbit
// 坐标变换函数（基于该矩阵结构）
fn transform_point(t : Transform, x : Double, y : Double) -> (Double, Double) {
  let new_x = t.a * x + t.c * y + t.tx
  let new_y = t.b * x + t.d * y + t.ty
  (new_x, new_y)
}

// 假设一个精灵的变换：旋转45度，缩放2倍，移动到(100,50)
let sprite_transform = Transform{
  a: 2.0 * 0.707,        // 2*cos(45°) ≈ 1.414
  b: 2.0 * 0.707,        // 2*sin(45°) + 0 ≈ 1.414  
  c: 2.0 * -0.707,       // 2*-sin(45°) + 0 ≈ -1.414
  d: 2.0 * 0.707,        // 2*cos(45°) ≈ 1.414
  tx: 100.0, ty: 50.0
}

// 精灵的本地坐标(10, 0) → 世界坐标
let world_pos = transform_point(sprite_transform, 10.0, 0.0)
// ≈ (114.14, 64.14)

// 用户点击了屏幕(114.14, 64.14)，想知道在精灵的本地坐标中是哪个点？
match sprite_transform.inverse() {
  Some(inv_transform) => {
    let local_pos = transform_point(inv_transform, 114.14, 64.14)
    // 回到 (10, 0) ✅
  }
  None => { println("变换不可逆") }
}
```

#### 2. UI点击检测

```moonbit
// 一个按钮被旋转、缩放、移动了
let button_transform = Transform{
  a: 0.866, b: 0.5,     // 旋转30度并缩放
  c: -0.5,  d: 0.866,
  tx: 100.0, ty: 50.0   // 移动到(100,50)
}

// 用户点击了屏幕点(120, 80)
let click_pos = (120.0, 80.0)

// 要判断是否点击了按钮，需要把点击坐标转换到按钮的本地坐标系
match button_transform.inverse() {
  Some(inv_transform) => {
    let (local_x, local_y) = transform_point(inv_transform, click_pos.0, click_pos.1)
    // 现在可以用按钮的原始尺寸判断点击了没有
  }
  None => { /* 变换异常 */ }
}
```

#### 3. 图像处理中的坐标映射

```moonbit
// 图像的仿射变换：倾斜和旋转
let image_transform = Transform{
  a: 1.2, b: 0.3,     // 水平拉伸+垂直倾斜
  c: -0.1, d: 1.1,    // 水平倾斜+垂直拉伸  
  tx: 0.0, ty: 0.0    // 无平移
}

// 把图像坐标映射到屏幕坐标
fn map_to_screen(local_x : Double, local_y : Double) -> (Double, Double) {
  transform_point(image_transform, local_x, local_y)
}

// 把屏幕点击坐标映射回图像坐标（用于选取图像区域）
match image_transform.inverse() {
  Some(inv_transform) => {
    fn screen_to_image(screen_x : Double, screen_y : Double) -> (Double, Double) {
      transform_point(inv_transform, screen_x, screen_y)
    }
    
    // 用户点击屏幕(100, 50)，映射到图像坐标
    let image_coords = screen_to_image(100.0, 50.0)
    // 可以用来选取图像的对应区域
  }
  None => { println("无法进行坐标映射") }
}
```

### 验证正确性

```moonbit
test "transform inverse correctness" {
  // 创建一个复合变换
  let original = Transform{
    a: 1.5, b: 0.8,     // 缩放+旋转+倾斜
    c: -0.3, d: 1.2,
    tx: 10.0, ty: 5.0   // 平移
  }
  
  // 测试点
  let test_points = [(0.0, 0.0), (1.0, 2.0), (-3.0, 4.0)]
  
  match original.inverse() {
    Some(inverse) => {
      for (x, y) in test_points {
        // 正向变换
        let (tx, ty) = transform_point(original, x, y)
        
        // 逆向变换
        let (rx, ry) = transform_point(inverse, tx, ty)
        
        // 应该恢复到原始坐标（允许浮点误差）
        assert((rx - x).abs() < 0.000001)
        assert((ry - y).abs() < 0.000001)
      }
    }
    None => { assert(false, "变换应该是可逆的") }
  }
}
```

### 总结

`Transform::inverse`的作用：
1. **功能**：计算一个变换的"反向操作"
2. **用途**：坐标转换、点击检测、图形编辑等
3. **原理**：基于行列式的矩阵求逆
4. **限制**：不能有信息丢失（行列式不能为0）

这个方法在游戏、图形学、UI开发中非常常用，是坐标系统转换的核心工具。
## 3×3仿射变换矩阵求逆详解

### 3×3矩阵结构

Transform对应的3×3矩阵：
```
[a  c  tx]
[b  d  ty]  
[0  0   1 ]
```

### 求逆方法

#### 方法1：分块矩阵法

把3×3矩阵分成四个块：
```
[A  t]
[0ᵀ 1]
```

其中：
- `A = [a c; b d]` 是2×2的线性变换部分
- `t = [tx; ty]` 是2×1的平移部分
- `0ᵀ = [0 0]` 是1×2的零向量

**逆矩阵公式：**
```
[A⁻¹  -A⁻¹t]
[0ᵀ     1   ]
```

#### 方法2：逐步推导

设逆矩阵为：
```
[x₁ x₂ x₃]
[x₄ x₅ x₆]
[0   0   1]
```

满足：
```
[a c tx][x₁ x₂ x₃]   [1 0 0]
[b d ty][x₄ x₅ x₆] = [0 1 0]  
[0 0  1][0   0  1]   [0 0 1]
```

### 具体计算例子

#### 例子1：纯旋转+缩放（无平移）

原始矩阵：
```
[1   -1   0]  // 对应旋转45°+缩放√2倍
[1    1   0]  
[0    0   1]
```

**计算过程：**

1. **2×2部分求逆：**
```moonbit
// 2×2部分：[1 -1; 1 1]
det = 1*1 - (-1)*1 = 2

// 2×2逆矩阵：
A⁻¹ = 1/2 × [1  1; -1 1]
    = [0.5  0.5; -0.5 0.5]
```

2. **平移部分：**
```moonbit
// 原平移 t = [tx; ty] = [0; 0]
// 平移的逆：-A⁻¹t = -[0.5  0.5; -0.5 0.5] × [0; 0] = [0; 0]
```

3. **完整的3×3逆矩阵：**
```
[0.5  0.5   0]
[-0.5 0.5   0]
[0    0     1]
```

#### 例子2：旋转+缩放+平移

原始矩阵：**旋转45°+缩放√2倍+平移(2,3)**
```
[1   -1   2]
[1    1   3]  
[0    0   1]
```

**计算过程：**

1. **2×2部分（不变）：**
```moonbit
A⁻¹ = [0.5  0.5; -0.5 0.5]
```

2. **平移部分：**
```moonbit
// 原平移 t = [2; 3]
// 平移的逆：-A⁻¹t
tx' = -(0.5*2 + 0.5*3) = -(1 + 1.5) = -2.5
ty' = -(-0.5*2 + 0.5*3) = -(-1 + 1.5) = -0.5
```

3. **完整的3×3逆矩阵：**
```
[0.5   0.5  -2.5]
[-0.5  0.5  -0.5]
[0     0     1  ]
```

### 验证计算结果

#### 测试原矩阵变换：
```moonbit
// 点变换函数
fn transform_point(t : Transform, x : Double, y : Double) -> (Double, Double) {
  (t.a * x + t.c * y + t.tx, t.b * x + t.d * y + t.ty)
}

// 原始变换：旋转45°+缩放√2倍+平移(2,3)
let transform = Transform{
  a: 1.0,  b: 1.0,   // 旋转+缩放部分
  c: -1.0, d: 1.0,
  tx: 2.0, ty: 3.0   // 平移部分
}

// 点(1,0)变换：
let (x1, y1) = transform_point(transform, 1.0, 0.0)  // (1,0) → (3,4)

// 点(0,1)变换：  
let (x2, y2) = transform_point(transform, 0.0, 1.0)  // (0,1) → (1,4)
```

#### 用逆矩阵验证：
```moonbit
match transform.inverse() {
  Some(inverse) => {
    // 点(3,4)逆变换：
    let (rx1, ry1) = transform_point(inverse, x1, y1)  // (3,4) → (1,0)
    
    // 点(1,4)逆变换：
    let (rx2, ry2) = transform_point(inverse, x2, y2)  // (1,4) → (0,1)
    
    // 验证（允许浮点误差）
    assert((rx1 - 1.0).abs() < 0.000001)
    assert((ry1 - 0.0).abs() < 0.000001)
    assert((rx2 - 0.0).abs() < 0.000001)
    assert((ry2 - 1.0).abs() < 0.000001)
  }
  None => { assert(false, "变换应该是可逆的") }
}
```

### 几何解释

#### 原始变换序列：
1. **先**逆时针旋转45度
2. **再**等比例缩放√2倍  
3. **最后**平移(2,3)

#### 逆变换序列：
1. **先**反向平移(-2,-3)
2. **再**缩小√2倍
3. **最后**顺时针旋转45度

#### 变换序列验证：
```
(1,0) → 旋转45° → (0.707,0.707) → 放大√2倍 → (1,1) → 平移(2,3) → (3,4)
(3,4) → 平移(-2,-3) → (1,1) → 缩小√2倍 → (0.707,0.707) → 旋转-45° → (1,0) ✓
```

### 3×3求逆的关键点

1. **2×2部分**：用标准2×2矩阵求逆公式 `1/det × [d -c; -b a]`
2. **平移部分**：用公式 `-A⁻¹t`
3. **最后一行**：始终保持 `[0 0 1]`

### MoonBit代码完整示例

```moonbit
test "3x3 transform inverse with translation" {
  // 原始变换：旋转45°+缩放√2倍+平移(2,3)
  let original = Transform{
    a: 1.0,  b: 1.0,   // 旋转+缩放部分
    c: -1.0, d: 1.0,
    tx: 2.0, ty: 3.0   // 平移部分
  }
  
  // 变换点函数
  fn transform_point(t : Transform, x : Double, y : Double) -> (Double, Double) {
    (t.a * x + t.c * y + t.tx, t.b * x + t.d * y + t.ty)
  }
  
  // 测试点
  let test_points = [(1.0, 0.0), (0.0, 1.0), (2.0, 3.0)]
  
  match original.inverse() {
    Some(inverse) => {
      for (x, y) in test_points {
        // 正向变换
        let (tx, ty) = transform_point(original, x, y)
        
        // 逆向变换
        let (rx, ry) = transform_point(inverse, tx, ty)
        
        // 应该恢复到原始坐标（允许浮点误差）
        assert((rx - x).abs() < 0.000001)
        assert((ry - y).abs() < 0.000001)
      }
      
      // 验证预期的逆矩阵值
      // a: 0.5, b: -0.5, c: 0.5, d: 0.5, tx: -2.5, ty: -0.5
      assert((inverse.a - 0.5).abs() < 0.000001)
      assert((inverse.b + 0.5).abs() < 0.000001)
      assert((inverse.c - 0.5).abs() < 0.000001)
      assert((inverse.d - 0.5).abs() < 0.000001)
      assert((inverse.tx + 2.5).abs() < 0.000001)
      assert((inverse.ty + 0.5).abs() < 0.000001)
    }
    None => { assert(false, "变换应该是可逆的") }
  }
}
```

### Transform::inverse方法的实现原理

你的`Transform::inverse`方法就是这样实现的：

```moonbit
pub fn Transform::inverse(self : Transform) -> Transform? {
  let det = self.a * self.d - self.b * self.c
  
  if det.abs() < 0.0000000001 {
    None
  } else {
    let inv_det = 1.0 / det
    Some({
      // 2×2部分：A⁻¹
      a: self.d * inv_det,        // d/det
      b: -self.b * inv_det,       // -b/det  
      c: -self.c * inv_det,       // -c/det
      d: self.a * inv_det,        // a/det
      
      // 平移部分：-A⁻¹t
      tx: (self.c * self.ty - self.d * self.tx) * inv_det,
      ty: (self.b * self.tx - self.a * self.ty) * inv_det,
    })
  }
}
```

这正是 `-A⁻¹t` 的展开形式！

### 总结

3×3仿射变换矩阵求逆的关键步骤：
1. **计算行列式**：`det = a*d - b*c`
2. **检查可逆性**：确保 `det ≠ 0`
3. **求2×2部分逆矩阵**：`1/det × [d -c; -b a]`
4. **求平移部分逆矩阵**：`-A⁻¹t`
5. **组装完整3×3逆矩阵**

这个方法在游戏开发、计算机图形学、UI框架等领域非常重要，是坐标系转换的核心算法。