///|
pub(all) enum Axis {
  X
  Y
}
///|
#valtype
pub(all) struct Vec2(Double, Double) derive(Eq, Show)

///|
pub impl Default for Vec2 with default() {
  Vec2(0.0, 0.0)
}

///|
pub fn Vec2::op_get(self : Vec2, axis : Axis) -> Double {
  match axis {
    Axis::X => self.0
    Axis::Y => self.1
  }
}

///|
pub fn Vec2::update(self : Vec2, axis : Axis, val : Double) -> Vec2 {
  match axis {
    X => Vec2(val, self.1)
    Y => Vec2(self.0, val)
  }
}

///|
pub fn Vec2::clone(self : Vec2) -> Vec2 {
  Vec2(self.0, self.1)
}

///|
pub impl Add for Vec2 with add(self, other) {
  Vec2(self.0 + other.0, self.1 + other.1)
}

///|
pub impl Sub for Vec2 with sub(self, other) {
  Vec2(self.0 - other.0, self.1 - other.1)
}

///|
pub impl Mul for Vec2 with mul(self, other) {
  Vec2(self.0 * other.0, self.1 * other.1)
}

///|
pub impl Neg for Vec2 with neg(self) {
  Vec2(-self.0, -self.1)
}

///|
pub fn Vec2::scalar_mul(self : Vec2, scalar : Double) -> Vec2 {
  Vec2(self.0 * scalar, self.1 * scalar)
}

///|
pub fn Vec2::scalar_div(self : Vec2, scalar : Double) -> Vec2 {
  Vec2(self.0 / scalar, self.1 / scalar)
}

///|
pub fn Vec2::distance(self : Vec2) -> Double {
  (self.0 * self.0 + self.1 * self.1).sqrt()
}

///|
pub fn Vec2::distance_to(self : Vec2, other : Vec2) -> Double {
  (self - other).distance()
}

///|
pub fn Vec2::dot(self : Vec2, other : Vec2) -> Double {
  self.0 * other.0 + self.1 * other.1
}

///|
pub fn Vec2::normalize(self : Vec2) -> Vec2 {
  let mag = self.distance()
  if mag > 0.0 {
    Vec2(self.0 / mag, self.1 / mag)
  } else {
    Vec2(0, 0)
  }
}
