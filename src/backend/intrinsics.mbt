///|
/// 获取线性内存大小
pub fn memory_size() -> Int = "(func (result i32) (memory.size))"

///|
/// 扩展线性内存，传入页码，每页64KB
pub fn memory_grow(delta : Int) -> Int =
  #|(func (param $delta i32) (result i32) (memory.grow (local.get $delta)))

///|
/// 复制内存，dest为目标地址，source为源地址，len为复制长度
pub fn memory_copy(dest : Int, source : Int, len : Int) =
  #|(func (param $dest i32) (param $source i32) (param $len i32) (memory.copy (local.get $dest) (local.get $source) (local.get $len)))

///|
/// 填充内存，dest为目标地址，val为填充值，len为填充长度
pub fn memory_fill(dest : Int, val : Int, len : Int) =
  #|(func (param $dest i32) (param $val i32) (param $len i32) (memory.fill (local.get $dest) (local.get $val) (local.get $len)))

///|
fn load32_a1(pos : Int) -> Int =
  #|(func (param $pos i32) (result i32) (i32.load align=1 (local.get $pos)))

///|
fn load32_a2(pos : Int) -> Int =
  #|(func (param $pos i32) (result i32) (i32.load align=2 (local.get $pos)))

///|
fn load32_a4(pos : Int) -> Int =
  #|(func (param $pos i32) (result i32) (i32.load align=4 (local.get $pos)))

///|
/// 加载32位整数
pub fn load_i32(pos : Int, align? : Int = 4) -> Int {
  match align {
    4 => load32_a4(pos)
    2 => load32_a2(pos)
    _ => load32_a1(pos)
  }
}

///|
fn load32_u_a1(pos : Int) -> UInt =
  #|(func (param $pos i32) (result i32) (i32.load align=1 (local.get $pos)))

///|
fn load32_u_a2(pos : Int) -> UInt =
  #|(func (param $pos i32) (result i32) (i32.load align=2 (local.get $pos)))

///|
fn load32_u_a4(pos : Int) -> UInt =
  #|(func (param $pos i32) (result i32) (i32.load align=4 (local.get $pos)))

///|
/// 加载32位无符号整数
pub fn load_u32(pos : Int, align? : Int = 4) -> UInt {
  match align {
    4 => load32_u_a4(pos)
    2 => load32_u_a2(pos)
    _ => load32_u_a1(pos)
  }
}

fn load64_a1(pos : Int) -> Int64 =
  #|(func (param $pos i32) (result i64) (i64.load align=1 (local.get $pos)))
fn load64_a2(pos : Int) -> Int64 =
  #|(func (param $pos i32) (result i64) (i64.load align=2 (local.get $pos)))
fn load64_a4(pos : Int) -> Int64 =
  #|(func (param $pos i32) (result i64) (i64.load align=4 (local.get $pos)))
fn load64_a8(pos : Int) -> Int64 =
  #|(func (param $pos i32) (result i64) (i64.load align=8 (local.get $pos)))

///｜
/// 加载64位整数
pub fn load_i64(pos : Int, align~: Int = 8) -> Int64 {
  match align {
    8 => load64_a8(pos)
    4 => load64_a4(pos)
    2 => load64_a2(pos)
    _ => load64_a1(pos)
  }
}

fn load64_u_a1(pos : Int) -> UInt64 =
  #|(func (param $pos i32) (result i64) (i64.load align=1 (local.get $pos)))
fn load64_u_a2(pos : Int) -> UInt64 =
  #|(func (param $pos i32) (result i64) (i64.load align=2 (local.get $pos)))
fn load64_u_a4(pos : Int) -> UInt64 =
  #|(func (param $pos i32) (result i64) (i64.load align=4 (local.get $pos)))
fn load64_u_a8(pos : Int) -> UInt64 =
  #|(func (param $pos i32) (result i64) (i64.load align=8 (local.get $pos)))

///|
/// 加载64位无符号整数
pub fn load_u64(pos : Int, align~: Int = 8) -> UInt64 {
  match align {
    8 => load64_u_a8(pos)
    4 => load64_u_a4(pos)
    2 => load64_u_a2(pos)
    _ => load64_u_a1(pos)
  }
}

fn loadf32_a1(pos : Int) -> Float =
  #|(func (param $pos i32) (result f32) (f32.load align=1 (local.get $pos)))
fn loadf32_a2(pos : Int) -> Float =
  #|(func (param $pos i32) (result f32) (f32.load align=2 (local.get $pos)))
fn loadf32_a4(pos : Int) -> Float =
  #|(func (param $pos i32) (result f32) (f32.load align=4 (local.get $pos)))

///|
/// 加载32位浮点数
pub fn load_f32(pos : Int, align~: Int = 4) -> Float {
  match align {
    4 => loadf32_a4(pos)
    2 => loadf32_a2(pos)
    _ => loadf32_a1(pos)
  }
}

pub fn loadf64_a1(pos : Int) -> Double =
  #|(func (param $pos i32) (result f64) (f64.load align=1 (local.get $pos)))
pub fn loadf64_a2(pos : Int) -> Double =
  #|(func (param $pos i32) (result f64) (f64.load align=2 (local.get $pos)))
pub fn loadf64_a4(pos : Int) -> Double =
  #|(func (param $pos i32) (result f64) (f64.load align=4 (local.get $pos)))
pub fn loadf64_a8(pos : Int) -> Double =
  #|(func (param $pos i32) (result f64) (f64.load align=8 (local.get $pos)))

///|
/// 加载64位浮点数
pub fn load_f64(pos : Int, align~: Int = 8) -> Double {
  match align {
    8 => loadf64_a8(pos)
    4 => loadf64_a4(pos)
    2 => loadf64_a2(pos)
    _ => loadf64_a1(pos)
  }
}
///|
/// 加载8位整数
pub fn load32_i8(pos : Int) -> Int =
  #|(func (param $pos i32) (result i32) (i32.load8_s (local.get $pos)))

///|
/// 加载8位整数(无符号)
pub fn load32_u8(pos : Int) -> UInt =
  #|(func (param $pos i32) (result i32) (i32.load8_u (local.get $pos)))

///|
/// 加载16位整数
pub fn load32_i16(pos : Int) -> Int =
  #|(func (param $pos i32) (result i32) (i32.load16_s align=2 (local.get $pos)))

///|
/// 加载16位整数(无符号)
pub fn load32_u16(pos : Int) -> UInt =
  #|(func (param $pos i32) (result i32) (i32.load16_u align=2 (local.get $pos)))

///|
/// 加载64位整数(8位无符号)
pub fn load64_u8(pos : Int) -> Int64 =
  #|(func (param $pos i32) (result i64) (i64.load8_u (local.get $pos)))

fn store32_a1(pos : Int, val : Int) =
  #|(func (param $pos i32) (param $val i32) (i32.store align=1 (local.get $pos) (local.get $val)))
fn store32_a2(pos : Int, val : Int) =
  #|(func (param $pos i32) (param $val i32) (i32.store align=2 (local.get $pos) (local.get $val)))
fn store32_a4(pos : Int, val : Int) =
  #|(func (param $pos i32) (param $val i32) (i32.store align=4 (local.get $pos) (local.get $val)))

///|
/// 存储32位整数
pub fn store_i32(pos : Int, val : Int, align~: Int = 4) -> Unit {
  match align {
    4 => store32_a4(pos, val)
    2 => store32_a2(pos, val)
    _ => store32_a1(pos, val)
  }
}


fn store64_a1(pos : Int, val : Int64) =
  #|(func (param $pos i32) (param $val i64) (i64.store align=1 (local.get $pos) (local.get $val)))
fn store64_a2(pos : Int, val : Int64) =
  #|(func (param $pos i32) (param $val i64) (i64.store align=2 (local.get $pos) (local.get $val)))
fn store64_a4(pos : Int, val : Int64) =
  #|(func (param $pos i32) (param $val i64) (i64.store align=4 (local.get $pos) (local.get $val)))
fn store64_a8(pos : Int, val : Int64) =
  #|(func (param $pos i32) (param $val i64) (i64.store align=8 (local.get $pos) (local.get $val)))

///|
/// 存储64位整数
pub fn store_i64(pos : Int, val : Int64, align~: Int = 8) -> Unit {
  match align {
    8 => store64_a8(pos, val)
    4 => store64_a4(pos, val)
    2 => store64_a2(pos, val)
    _ => store64_a1(pos, val)
  }
}

///|
/// 存储64位无符号整数
pub fn store_u64(pos : Int, val : Int64, align~: Int = 8) -> Unit {
  match align {
    8 => store64_a8(pos, val)
    4 => store64_a4(pos, val)
    2 => store64_a2(pos, val)
    _ => store64_a1(pos, val)
  }
}


fn storef32_a1(pos : Int, val : Float) =
  #|(func (param $pos i32) (param $val f32) (f32.store align=1 (local.get $pos) (local.get $val)))


fn storef32_a2(pos : Int, val : Float) =
  #|(func (param $pos i32) (param $val f32) (f32.store align=2 (local.get $pos) (local.get $val)))

fn storef32_a4(pos : Int, val : Float) =
  #|(func (param $pos i32) (param $val f32) (f32.store align=4 (local.get $pos) (local.get $val)))

///|
/// 存储32位浮点数
pub fn store_f32(pos : Int, val : Float, align~: Int = 4) -> Unit {
  match align {
    4 => storef32_a4(pos, val)
    2 => storef32_a2(pos, val)
    _ => storef32_a1(pos, val)
  }
}

fn storef64_a1(pos : Int, val : Double) =
  #|(func (param $pos i32) (param $val f64) (f64.store align=1 (local.get $pos) (local.get $val)))


fn storef64_a2(pos : Int, val : Double) =
  #|(func (param $pos i32) (param $val f64) (f64.store align=2 (local.get $pos) (local.get $val)))


fn storef64_a4(pos : Int, val : Double) =
  #|(func (param $pos i32) (param $val f64) (f64.store align=4 (local.get $pos) (local.get $val)))

fn storef64_a8(pos : Int, val : Double) =
  #|(func (param $pos i32) (param $val f64) (f64.store align=8 (local.get $pos) (local.get $val)))

///|
/// 存储64位浮点数
pub fn store_f64(pos : Int, val : Double, align~: Int = 8) -> Unit {
  match align {
    8 => storef64_a8(pos, val)
    4 => storef64_a4(pos, val)
    2 => storef64_a2(pos, val)
    _ => storef64_a1(pos, val)
  }
}
///|
/// 存储8位整数
pub fn store32_i8(pos : Int, val : Int) =
  #|(func (param $pos i32) (param $val i32) (i32.store8 (local.get $pos) (local.get $val)))

/// 存储8位无符号整数
pub fn store32_u8(pos : Int, val : Int) =
  #|(func (param $pos i32) (param $val i32) (i32.store8 (local.get $pos) (local.get $val)))

///|
/// 存储16位整数
pub fn store32_i16(pos : Int, val : Int) =
  #|(func (param $pos i32) (param $val i32) (i32.store16 align=2 (local.get $pos) (local.get $val)))
///|
/// 存储16位无符号整数
pub fn store32_u16(pos : Int, val : Int) =
  #|(func (param $pos i32) (param $val i32) (i32.store16 align=2 (local.get $pos) (local.get $val)))
