///|
/// 2d transformation matrix 2x2 handles rotation/scale/skew
/// [a c tx]
/// [b d ty]
/// [0 0 1 ]
#valtype
pub(all) struct Transform {
  a : Double // scale_x * cos(rotation)
  b : Double // scale_x * sin(rotation) + skew_y
  c : Double // scale_y * -sin(rotation) + skew_x
  d : Double // scale_y * cos(rotation)
  tx : Double // translation_x
  ty : Double // translation_y
}

///|
pub fn Transform::clone(self : Transform) -> Transform {
  Transform::{
    a: self.a,
    b: self.b,
    c: self.c,
    d: self.d,
    tx: self.tx,
    ty: self.ty,
  }
}

///| 误差默认值 0.000001
pub const DEFAULT_EPSILON : Double = 0.000001

///| 0右侧默认值 0.0000000001
pub const DEFAULT_ZERO_RIGHT : Double = 0.0000000001

///|
pub fn Transform::identity() -> Transform {
  Transform::{ a: 1.0, b: 0.0, c: 0.0, d: 1.0, tx: 0.0, ty: 0.0 }
}

///|
pub impl Default for Transform with default() {
  Transform::identity()
}

///|
pub impl Eq for Transform with equal(self, other) {
  transform_approx_eq(self, other)
}

///|
pub impl Add for Transform with add(self, other) {
  {
    a: self.a + other.a,
    b: self.b + other.b,
    c: self.c + other.c,
    d: self.d + other.d,
    tx: self.tx + other.tx,
    ty: self.ty + other.ty,
  }
}

///|
pub impl Sub for Transform with sub(self, other) {
  {
    a: self.a - other.a,
    b: self.b - other.b,
    c: self.c - other.c,
    d: self.d - other.d,
    tx: self.tx - other.tx,
    ty: self.ty - other.ty,
  }
}

///|
pub impl Mul for Transform with mul(self, other) {
  {
    a: self.a * other.a + self.c * other.b,
    b: self.b * other.a + self.d * other.b,
    c: self.a * other.c + self.c * other.d,
    d: self.b * other.c + self.d * other.d,
    tx: self.a * other.tx + self.c * other.ty + self.tx,
    ty: self.b * other.tx + self.d * other.ty + self.ty,
  }
}

///|
pub fn Transform::new(
  a? : Double = 1.0,
  b? : Double = 0.0,
  c? : Double = 0.0,
  d? : Double = 1.0,
  tx? : Double = 0.0,
  ty? : Double = 0.0,
) -> Transform {
  Transform::{ a, b, c, d, tx, ty }
}

///|
pub fn Transform::from_translation(tx : Double, ty : Double) -> Transform {
  Transform::{ a: 1.0, b: 0.0, c: 0.0, d: 1.0, tx, ty }
}

///|
pub fn Transform::from_scale(sx : Double, sy : Double) -> Transform {
  Transform::{ a: sx, b: 0.0, c: 0.0, d: sy, tx: 0.0, ty: 0.0 }
}

///|
pub fn Transform::from_rotation_deg(deg : Double) -> Transform {
  Transform::from_rotation_rad(deg * @math.PI / 180)
}

///|
pub fn Transform::from_rotation_rad(rad : Double) -> Transform {
  let sin_val = @math.sin(rad)
  let cos_val = @math.cos(rad)
  { a: cos_val, b: sin_val, c: -sin_val, d: cos_val, tx: 0.0, ty: 0.0 }
}

///|
pub fn Transform::from_skew(kx : Double, ky : Double) -> Transform {
  Transform::{ a: 1.0, b: ky, c: kx, d: 1.0, tx: 0.0, ty: 0.0 }
}

///|
pub fn Transform::apply_to_point(
  self : Transform,
  x : Double,
  y : Double,
) -> Vec2 {
  Vec2(self.a * x + self.c * y + self.tx, self.b * x + self.d * y + self.ty)
}

///|
pub fn Transform::apply_to_vec(self : Transform, vec : Vec2) -> Vec2 {
  let p = self.apply_to_point(vec.0, vec.1)
  Vec2(p.0, p.1)
}

///|
pub fn Transform::get_translation(self : Transform) -> Vec2 {
  Vec2(self.tx, self.ty)
}

///|
pub fn Transform::get_scale(self : Transform) -> Vec2 {
  let sx = (self.a * self.a + self.b * self.b).sqrt()
  let sy = (self.c * self.c + self.d * self.d).sqrt()
  Vec2(sx, sy)
}

///|
pub fn Transform::scale(
  self : Transform,
  sx : Double,
  sy : Double,
) -> Transform {
  Transform::from_scale(sx, sy) * self
}

///|
pub fn Transform::get_rotation_rad(self : Transform) -> Double {
  @math.atan2(self.b, self.a)
}

///|
pub fn Transform::rotate_rad(self : Transform, rad : Double) -> Transform {
  Transform::from_rotation_rad(rad) * self
}

///|
pub fn Transform::inverse(self : Transform) -> Transform? {
  let det = self.a * self.d - self.b * self.c
  if det.abs() < DEFAULT_ZERO_RIGHT {
    None
  } else {
    let inv_det = 1.0 / det
    Some({
      a: self.d * inv_det,
      b: -self.b * inv_det,
      c: -self.c * inv_det,
      d: self.a * inv_det,
      tx: (self.c * self.ty - self.d * self.tx) * inv_det,
      ty: (self.b * self.tx - self.a * self.ty) * inv_det,
    })
  }
}

///|
pub fn Transform::flip_y(height : Double) -> Transform {
  Transform::from_translation(0.0, height) * Transform::from_scale(1.0, -1.0)
}

///|
pub fn approx_eq(
  a : Double,
  b : Double,
  epsilon? : Double = DEFAULT_EPSILON,
) -> Bool {
  (a - b).abs() < epsilon
}

///|
pub fn transform_approx_eq(
  t1 : Transform,
  t2 : Transform,
  epsilon? : Double = DEFAULT_EPSILON,
) -> Bool {
  approx_eq(t1.a, t2.a, epsilon~) &&
  approx_eq(t1.b, t2.b, epsilon~) &&
  approx_eq(t1.c, t2.c, epsilon~) &&
  approx_eq(t1.d, t2.d, epsilon~) &&
  approx_eq(t1.tx, t2.tx, epsilon~) &&
  approx_eq(t1.ty, t2.ty, epsilon~)
}
