// pub fn get_zoom() -> Double = "env" "get_zoom"

///|
pub fn get_realtime_delta() -> Double = "env" "get_realtime_delta"

///|
// fn js_log(msg : String) -> Unit = "env" "log"

pub fn log_number(msg : Double) -> Unit = "env" "log"

///|
pub fn js_app_start() -> Unit = "env" "app_start"

///|
pub fn js_app_stop() -> Unit = "env" "app_stop"

///|
/// [T: Show] using Javascript console.log
// pub fn[T : Show] log(msg : T) -> Unit {
//   js_log(msg.to_string())
// }

pub fn app_start() -> Unit {
  js_app_start()
}

pub fn app_stop() -> Unit {
  js_app_stop()
}
