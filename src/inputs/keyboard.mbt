///|
#valtype
pub(all) enum Code {
  KeyA
  KeyB
  KeyC
  KeyD
  KeyE
  KeyF
  KeyG
  KeyH
  KeyI
  KeyJ
  KeyK
  KeyL
  KeyM
  KeyN
  KeyO
  KeyP
  KeyQ
  KeyR
  KeyS
  KeyT
  KeyU
  KeyV
  KeyW
  KeyX
  KeyY
  KeyZ
  ArrowUp
  ArrowDown
  ArrowLeft
  ArrowRight
  Space
  Enter
  Escape
} derive(Eq, Show, Hash)

///|
///所有按键集合
#valtype
pub let all_codes : Set[Code] = Set::from_array([
  KeyA,
  KeyB,
  KeyC,
  KeyD,
  KeyE,
  KeyF,
  KeyG,
  KeyH,
  KeyI,
  KeyJ,
  KeyK,
  KeyL,
  KeyM,
  KeyN,
  KeyO,
  KeyP,
  KeyQ,
  KeyR,
  KeyS,
  KeyT,
  KeyU,
  KeyV,
  KeyW,
  KeyX,
  KeyY,
  KeyZ,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Space,
  Enter,
  Escape,
])

///|
///【本次】按下的键集合
#valtype
pub let pressed_keys : Set[Code] = Set::new()

///|
///【上次】按下的键集合
#valtype
let last_pressed_keys : Set[Code] = Set::new()

///|
///【差值】本次新增的键集合
#valtype
let just_pressed_keys : Set[Code] = Set::new()

///|
///【差值】本次释放的键集合
#valtype
let just_released_keys : Set[Code] = Set::new()

///|
pub fn Code::from_string(code : String) -> Code? {
  match code {
    "KeyA" => Some(KeyA)
    "KeyB" => Some(KeyB)
    "KeyC" => Some(KeyC)
    "KeyD" => Some(KeyD)
    "KeyE" => Some(KeyE)
    "KeyF" => Some(KeyF)
    "KeyG" => Some(KeyG)
    "KeyH" => Some(KeyH)
    "KeyI" => Some(KeyI)
    "KeyJ" => Some(KeyJ)
    "KeyK" => Some(KeyK)
    "KeyL" => Some(KeyL)
    "KeyM" => Some(KeyM)
    "KeyN" => Some(KeyN)
    "KeyO" => Some(KeyO)
    "KeyP" => Some(KeyP)
    "KeyQ" => Some(KeyQ)
    "KeyR" => Some(KeyR)
    "KeyS" => Some(KeyS)
    "KeyT" => Some(KeyT)
    "KeyU" => Some(KeyU)
    "KeyV" => Some(KeyV)
    "KeyW" => Some(KeyW)
    "KeyX" => Some(KeyX)
    "KeyY" => Some(KeyY)
    "KeyZ" => Some(KeyZ)
    "ArrowUp" => Some(ArrowUp)
    "ArrowDown" => Some(ArrowDown)
    "ArrowLeft" => Some(ArrowLeft)
    "ArrowRight" => Some(ArrowRight)
    "Space" => Some(Space)
    "Enter" => Some(Enter)
    "Escape" => Some(Escape)
    _ => None
  }
}

///|
pub fn is_pressed(code : Code) -> Bool {
  pressed_keys.contains(code)
}

///|
pub fn is_released(code : Code) -> Bool {
  !pressed_keys.contains(code)
}

pub fn is_just_pressed(code : Code) -> Bool {
  just_pressed_keys.contains(code)
}

pub fn is_just_released(code: Code) -> Bool {
  just_released_keys.contains(code)
}

///|
pub fn key_vector(
  up : Code,
  down : Code,
  left : Code,
  right : Code,
) -> @math.Vec2 {
  let x = if is_pressed(left) {
    -1.0
  } else if is_pressed(right) {
    1.0
  } else {
    0.0
  }
  let y = if is_pressed(up) {
    1.0
  } else if is_pressed(down) {
    -1.0
  } else {
    0.0
  }
  @math.Vec2(x, y)
}

///|
pub fn advanced_key_system(_dt : Double) -> Unit {
  just_pressed_keys.clear()
  for code in pressed_keys.difference(last_pressed_keys) {
    just_pressed_keys.add(code)
  }
  just_released_keys.clear()
  for code in all_codes.difference(pressed_keys) {
    just_released_keys.add(code)
  }
  last_pressed_keys.clear()
  for code in pressed_keys {
    last_pressed_keys.add(code)
  }
}
