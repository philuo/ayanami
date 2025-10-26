///|
priv struct Timer {
  mut rest : Double
  pausible : Bool
  callback : Event
}

///|
let timers : Array[Timer] = Array::new()

///|
pub fn timeout(
  time : Double,
  callback : Event,
  pausible? : Bool = true,
) -> Unit {
  timers.push({ rest: time, pausible, callback })
}

///|
pub fn timer_system(_dt : Double) -> Unit {
  for timer in timers.filter(timer => timer.pausible) {
    timer.rest -= _dt
    if timer.rest <= 0 {
      (timer.callback)()
    }
  }
  timers.retain(timer => timer.rest > 0)
}

///|
pub fn realtime_timer_system(_dt : Double) -> Unit {
  for timer in timers.filter(timer => !timer.pausible) {
    let realtime_dt = @backend.get_realtime_delta()
    timer.rest -= realtime_dt
    if timer.rest <= 0 {
      (timer.callback)()
    }
  }
  timers.retain(timer => timer.rest > 0)
}
