(module
  (type (;0;) (struct (field i32) (field f32) (field f32) (field f32)))
  (type (;1;) (array (mut (ref null 0))))
  (rec
    (type (;2;) (func (param (ref 3) i32) (result (ref 0))))
    (type (;3;) (sub (struct (field (mut (ref null 2))))))
  )
  (type (;4;) (struct (field (mut f64))))
  (type (;5;) (func))
  (type (;6;) (func (result i32)))
  (type (;7;) (func (result f64)))
  (type (;8;) (func (param f64)))
  (import "env" "app_stop" (func (;0;) (type 6)))
  (import "env" "app_start" (func (;1;) (type 7)))
  (import "env" "memory" (memory (;0;) 1024 1024 shared))
  (global (;0;) (mut (ref null 4)) ref.null none)
  (export "memory" (memory 0))
  (export "game_stop" (func 2))
  (export "game_start" (func 3))
  (export "game_loop" (func 4))
  (start 6)
  (elem (;0;) declare func 5)
  (func (;2;) (type 5)
    call 0
    drop
  )
  (func (;3;) (type 5)
    global.get 0
    ref.as_non_null
    call 1
    struct.set 4 0
  )
  (func (;4;) (type 8) (param f64)
    (local i32 i32 (ref 3) (ref 1))
    i32.const 32
    i32.load
    local.tee 1
    i32.const 65535
    i32.and
    if (result (ref 1)) ;; label = @1
      local.get 1
      i32.const 16
      i32.shr_u
      i32.const 15
      i32.and
      local.tee 2
      if (result (ref 1)) ;; label = @2
        ref.func 5
        struct.new 3
        local.tee 3
        i32.const 0
        local.get 3
        struct.get 3 0
        call_ref 2
        local.get 2
        array.new 1
        local.set 4
        i32.const 1
        local.set 1
        loop ;; label = @3
          block ;; label = @4
            block (result i32) ;; label = @5
              local.get 1
              local.get 2
              i32.lt_s
              if ;; label = @6
                local.get 4
                local.get 1
                local.get 3
                local.get 1
                local.get 3
                struct.get 3 0
                call_ref 2
                array.set 1
                local.get 1
                i32.const 1
                i32.add
                br 1 (;@5;)
              end
              br 1 (;@4;)
            end
            local.set 1
            br 1 (;@3;)
          end
        end
        local.get 4
      else
        array.new_fixed 1 0
      end
    else
      array.new_fixed 1 0
    end
    drop
  )
  (func (;5;) (type 2) (param (ref 3) i32) (result (ref 0))
    local.get 1
    i32.const 4
    i32.shl
    i32.const 4640
    i32.add
    local.tee 1
    i32.load
    local.get 1
    i32.const 4
    i32.add
    f32.load
    local.get 1
    i32.const 8
    i32.add
    f32.load
    local.get 1
    i32.const 12
    i32.add
    f32.load
    struct.new 0
  )
  (func (;6;) (type 5)
    struct.new_default 4
    global.set 0
    i32.const 0
    i32.const 4096
    i32.store
    i32.const 4
    i64.const 18014398509481984
    i64.store
  )
)
