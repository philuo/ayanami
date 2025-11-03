// pub fn get_zoom() -> Double = "env" "get_zoom"

///|
pub fn get_realtime_delta() -> Double = "env" "get_realtime_delta"

///|
#cfg(target="wasm-gc")
fn js_log(msg : String) -> Unit = "env" "log"

pub fn log_number(msg : Double) -> Unit = "env" "log"

///|
pub fn js_app_start() -> Double = "env" "app_start"

///|
pub fn js_app_stop() -> Unit = "env" "app_stop"

///|
/// [T: Show] using Javascript console.log
#cfg(target="wasm-gc")
pub fn[T : Show] log(msg : T) -> Unit {
  js_log(msg.to_string())
}

///|
/// 启动应用，并返回当前时间
pub fn app_start() -> Double {
  js_app_start()
}

pub fn app_stop() -> Unit {
  js_app_stop()
}
