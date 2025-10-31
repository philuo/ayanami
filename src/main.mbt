///|
pub fn memory_size() -> Int = "(func (result i32) (memory.size))"

///|
pub fn memory_grow(delta : Int) -> Int =
  #|(func (param $delta i32) (result i32) (memory.grow (local.get $delta)))

///|
pub fn memory_copy(dest : Int, source : Int, len : Int) =
  #|(func (param $dest i32) (param $source i32) (param $len i32) (memory.copy (local.get $dest) (local.get $source) (local.get $len)))

///|
pub fn memory_fill(dest : Int, val : Int, len : Int) =
  #|(func (param $dest i32) (param $val i32) (param $len i32) (memory.fill (local.get $dest) (local.get $val) (local.get $len)))

///|
pub fn load32(pos : Int) -> Int =
  #|(func (param $pos i32) (result i32) (i32.load (local.get $pos)))

///|
pub fn load64(pos : Int) -> Int64 =
  #|(func (param $pos i32) (result i64) (i64.load (local.get $pos)))

///|
pub fn loadf32(pos : Int) -> Float =
  #|(func (param $pos i32) (result f32) (f32.load (local.get $pos)))

///|
pub fn loadf64(pos : Int) -> Double =
  #|(func (param $pos i32) (result f64) (f64.load (local.get $pos)))

///|
pub fn load8_s(pos : Int) -> Int =
  #|(func (param $pos i32) (result i32) (i32.load8_s (local.get $pos)))

///|
pub fn load8_u(pos : Int) -> Int =
  #|(func (param $pos i32) (result i32) (i32.load8_u (local.get $pos)))

///|
pub fn load16_s(pos : Int) -> Int =
  #|(func (param $pos i32) (result i32) (i32.load16_s (local.get $pos)))

///|
pub fn load16_u(pos : Int) -> Int =
  #|(func (param $pos i32) (result i32) (i32.load16_u (local.get $pos)))

///|
pub fn load64_8u(pos : Int) -> Int64 =
  #|(func (param $pos i32) (result i64) (i64.load8_u (local.get $pos)))

///|
pub fn load32_u(pos : Int) -> UInt =
  #|(func (param $pos i32) (result i32) (i32.load (local.get $pos)))
///|
// 存储 32 位整数（接受 Int，如需存储 UInt 可用 .reinterpret_as_int() 转换）
pub fn store32(pos : Int, val : Int) =
  #|(func (param $pos i32) (param $val i32) (i32.store (local.get $pos) (local.get $val)))

///|
pub fn store64(pos : Int, val : Int64) =
  #|(func (param $pos i32) (param $val i64) (i64.store (local.get $pos) (local.get $val)))

///|
pub fn storef32(pos : Int, val : Float) =
  #|(func (param $pos i32) (param $val f32) (f32.store (local.get $pos) (local.get $val)))

///|
pub fn storef64(pos : Int, val : Double) =
  #|(func (param $pos i32) (param $val f64) (f64.store (local.get $pos) (local.get $val)))

///|
pub fn store8(pos : Int, val : Int) =
  #|(func (param $pos i32) (param $val i32) (i32.store8 (local.get $pos) (local.get $val)))

///|
pub fn store16(pos : Int, val : Int) =
  #|(func (param $pos i32) (param $val i32) (i32.store16 (local.get $pos) (local.get $val)))

///|
pub fn game_loop(_dt : Double) -> Unit {
  // // 处理输入系统
  // @inputs.advanced_key_system(_dt)
  // @inputs.advanced_mouse_system(_dt)

  // 游戏逻辑...
  // @backend.log_number(_dt)
  
  // 测试：UInt 超过 Int 最大值的情况
  // let big_uint: UInt = 3000000000U  // 超过 Int::max_value (2147483647)
  
  // 方式1：直接传 UInt 给 store32(Int) - 会报类型错误 ✗
  // store32(2, big_uint)  // ❌ 编译错误！MoonBit 不允许
  
  // 方式2：使用 reinterpret_as_int 转换 ✓
  // store32(0, big_uint.reinterpret_as_int())  // 位模式不变，不会截断
  @backend.log_number(load32_u(0).to_double())
}

///|
pub fn game_start() -> Unit {
  @backend.app_start()
}

///|
pub fn game_stop() -> Unit {
  @backend.app_stop()
}

#valtype
struct State {
  count: UInt
  name: UInt
}

// #valtype
// enum State {
//   Count(UInt)
//   Name(UInt)
// }

///|
pub fn initialize(a: UInt) -> FixedArray[State] {
  FixedArray::make(100000_000, { count: a, name: 1 })
}

// // ========== 输入同步接口 ==========

// ///|
// /// 键盘按下事件
// pub fn on_key_down(key_code : String) -> Unit {
//   match @inputs.Code::from_string(key_code) {
//     Some(code) => @inputs.pressed_keys.add(code)
//     None => ()
//   }
// }

// ///|
// /// 键盘释放事件
// pub fn on_key_up(key_code : String) -> Unit {
//   match @inputs.Code::from_string(key_code) {
//     Some(code) => @inputs.pressed_keys.remove(code)
//     None => ()
//   }
// }

// ///|
// /// 鼠标移动事件
// pub fn on_mouse_move(x : Double, y : Double, movement_x : Double, movement_y : Double) -> Unit {
//   @inputs.mouse.pos = @math.Vec2(x, y)
//   @inputs.mouse_movement.movement = @math.Vec2(movement_x, movement_y)
// }

// ///|
// /// 鼠标按下事件
// pub fn on_mouse_down(button : Int) -> Unit {
//   match button {
//     0 => @inputs.mouse.left = true
//     1 => @inputs.mouse.middle = true
//     2 => @inputs.mouse.right = true
//     _ => ()
//   }
// }

// ///|
// /// 鼠标释放事件
// pub fn on_mouse_up(button : Int) -> Unit {
//   match button {
//     0 => @inputs.mouse.left = false
//     1 => @inputs.mouse.middle = false
//     2 => @inputs.mouse.right = false
//     _ => ()
//   }
// }
