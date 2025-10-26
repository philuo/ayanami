///|
pub fn normalize_angle(angle : Double) -> Double {
  let whole = @math.PI * 2.0
  let angle = angle % whole
  if angle < 0.0 {
    angle + whole
  } else {
    angle
  }
}
