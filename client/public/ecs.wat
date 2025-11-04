(module
  (type (;0;) (func))
  (type (;1;) (func (param i32 i32) (result i32 f32 f32 f32)))
  (type (;2;) (func (param i32 i32)))
  (type (;3;) (func (param i32)))
  (type (;4;) (func (result i32 f32 f32 f32)))
  (type (;5;) (func (result f64)))
  (type (;6;) (func (result i32)))
  (type (;7;) (func (param i32 i32) (result i32)))
  (type (;8;) (func (param i32 i32 i64)))
  (type (;9;) (func (param i32) (result i32)))
  (type (;10;) (func (param f64)))
  (import "env" "app_start" (func (;0;) (type 5)))
  (import "env" "app_stop" (func (;1;) (type 6)))
  (import "env" "memory" (memory (;0;) 1024 1024 shared))
  (table (;0;) 1 1 funcref)
  (global (;0;) (mut i32) i32.const 0)
  (global (;1;) (mut i32) i32.const 0)
  (export "memory" (memory 0))
  (export "game_stop" (func 10))
  (export "game_start" (func 11))
  (export "game_loop" (func 12))
  (start 14)
  (elem (;0;) (i32.const 0) func 13)
  (func (;2;) (type 7) (param i32 i32) (result i32)
    (local i32)
    local.get 0
    local.get 1
    i32.const 256
    i32.lt_u
    if (result i32) ;; label = @1
      local.get 1
      i32.const 4
      i32.shr_u
      local.set 1
      i32.const 0
    else
      local.get 1
      i32.const 536870910
      i32.lt_u
      if ;; label = @2
        local.get 1
        i32.const 1
        i32.const 27
        local.get 1
        i32.clz
        i32.sub
        i32.shl
        i32.add
        i32.const 1
        i32.sub
        local.set 1
      end
      local.get 1
      i32.const 31
      local.get 1
      i32.clz
      i32.sub
      local.tee 2
      i32.const 4
      i32.sub
      i32.shr_u
      i32.const 16
      i32.xor
      local.set 1
      local.get 2
      i32.const 7
      i32.sub
    end
    local.tee 2
    i32.const 2
    i32.shl
    i32.add
    i32.load offset=4 align=1
    i32.const -1
    local.get 1
    i32.shl
    i32.and
    local.tee 1
    if (result i32) ;; label = @1
      local.get 0
      local.get 1
      i32.ctz
      local.get 2
      i32.const 4
      i32.shl
      i32.add
      i32.const 2
      i32.shl
      i32.add
      i32.load offset=96 align=1
    else
      local.get 0
      i32.load align=1
      i32.const -1
      local.get 2
      i32.const 1
      i32.add
      i32.shl
      i32.and
      local.tee 1
      if (result i32) ;; label = @2
        local.get 0
        local.get 0
        local.get 1
        i32.ctz
        local.tee 1
        i32.const 2
        i32.shl
        i32.add
        i32.load offset=4 align=1
        i32.ctz
        local.get 1
        i32.const 4
        i32.shl
        i32.add
        i32.const 2
        i32.shl
        i32.add
        i32.load offset=96 align=1
      else
        i32.const 0
      end
    end
  )
  (func (;3;) (type 2) (param i32 i32)
    (local i32 i32 i32 i32)
    local.get 1
    i32.load align=1
    i32.const -4
    i32.and
    local.tee 2
    i32.const 256
    i32.lt_u
    if (result i32) ;; label = @1
      local.get 2
      i32.const 4
      i32.shr_u
      local.set 3
      i32.const 0
    else
      i32.const 31
      i32.const 1073741820
      local.get 2
      local.get 2
      i32.const 1073741820
      i32.ge_u
      select
      local.tee 3
      i32.clz
      i32.sub
      local.set 2
      local.get 3
      local.get 2
      i32.const 4
      i32.sub
      i32.shr_u
      i32.const 16
      i32.xor
      local.set 3
      local.get 2
      i32.const 7
      i32.sub
    end
    local.set 5
    local.get 1
    i32.load offset=8 align=1
    local.set 2
    local.get 1
    i32.load offset=4 align=1
    local.tee 4
    if ;; label = @1
      local.get 4
      local.get 2
      i32.store offset=8 align=1
    end
    local.get 2
    if ;; label = @1
      local.get 2
      local.get 4
      i32.store offset=4 align=1
    end
    local.get 1
    local.get 0
    local.get 5
    i32.const 4
    i32.shl
    local.get 3
    i32.add
    i32.const 2
    i32.shl
    i32.add
    local.tee 4
    i32.load offset=96 align=1
    i32.eq
    if ;; label = @1
      local.get 4
      local.get 2
      i32.store offset=96 align=1
      local.get 2
      i32.eqz
      if ;; label = @2
        local.get 0
        local.get 5
        i32.const 2
        i32.shl
        i32.add
        local.tee 1
        local.get 1
        i32.load offset=4 align=1
        i32.const -2
        local.get 3
        i32.rotl
        i32.and
        local.tee 1
        i32.store offset=4 align=1
        local.get 1
        i32.eqz
        if ;; label = @3
          local.get 0
          local.get 0
          i32.load align=1
          i32.const -2
          local.get 5
          i32.rotl
          i32.and
          i32.store align=1
        end
      end
    end
  )
  (func (;4;) (type 2) (param i32 i32)
    (local i32 i32 i32 i32)
    local.get 1
    i32.load align=1
    local.tee 2
    local.set 3
    local.get 1
    i32.const 4
    i32.add
    local.tee 5
    local.get 2
    i32.const -4
    i32.and
    i32.add
    local.tee 2
    i32.load align=1
    local.tee 4
    i32.const 1
    i32.and
    if ;; label = @1
      local.get 0
      local.get 2
      call 3
      local.get 1
      local.get 3
      i32.const 4
      i32.add
      local.get 4
      i32.const -4
      i32.and
      i32.add
      local.tee 3
      i32.store align=1
      local.get 1
      i32.load align=1
      i32.const -4
      i32.and
      local.get 5
      i32.add
      local.tee 2
      i32.load align=1
      local.set 4
    end
    local.get 3
    i32.const 2
    i32.and
    if ;; label = @1
      local.get 1
      i32.const 4
      i32.sub
      i32.load align=1
      local.tee 1
      i32.load align=1
      local.set 5
      local.get 0
      local.get 1
      call 3
      local.get 1
      local.get 5
      i32.const 4
      i32.add
      local.get 3
      i32.const -4
      i32.and
      i32.add
      local.tee 3
      i32.store align=1
    end
    local.get 2
    local.get 4
    i32.const 2
    i32.or
    i32.store align=1
    local.get 2
    i32.const 4
    i32.sub
    local.get 1
    i32.store align=1
    local.get 3
    i32.const -4
    i32.and
    local.tee 2
    i32.const 256
    i32.lt_u
    if (result i32) ;; label = @1
      local.get 2
      i32.const 4
      i32.shr_u
      local.set 2
      i32.const 0
    else
      i32.const 31
      i32.const 1073741820
      local.get 2
      local.get 2
      i32.const 1073741820
      i32.ge_u
      select
      local.tee 2
      i32.clz
      i32.sub
      local.set 3
      local.get 2
      local.get 3
      i32.const 4
      i32.sub
      i32.shr_u
      i32.const 16
      i32.xor
      local.set 2
      local.get 3
      i32.const 7
      i32.sub
    end
    local.set 3
    local.get 0
    local.get 3
    i32.const 4
    i32.shl
    local.get 2
    i32.add
    i32.const 2
    i32.shl
    i32.add
    i32.load offset=96 align=1
    local.set 4
    local.get 1
    i32.const 0
    i32.store offset=4 align=1
    local.get 1
    local.get 4
    i32.store offset=8 align=1
    local.get 4
    if ;; label = @1
      local.get 4
      local.get 1
      i32.store offset=4 align=1
    end
    local.get 0
    local.get 3
    i32.const 4
    i32.shl
    local.get 2
    i32.add
    i32.const 2
    i32.shl
    i32.add
    local.get 1
    i32.store offset=96 align=1
    local.get 0
    local.get 0
    i32.load align=1
    i32.const 1
    local.get 3
    i32.shl
    i32.or
    i32.store align=1
    local.get 0
    local.get 3
    i32.const 2
    i32.shl
    i32.add
    local.tee 0
    local.get 0
    i32.load offset=4 align=1
    i32.const 1
    local.get 2
    i32.shl
    i32.or
    i32.store offset=4 align=1
  )
  (func (;5;) (type 8) (param i32 i32 i64)
    (local i32 i32 i32)
    local.get 0
    i32.load offset=1568 align=1
    local.tee 4
    i32.const 0
    local.get 1
    i32.const 19
    i32.add
    i32.const -16
    i32.and
    i32.const 4
    i32.sub
    local.tee 1
    i32.const 16
    i32.sub
    local.tee 3
    local.get 4
    i32.eq
    select
    if ;; label = @1
      local.get 4
      i32.load align=1
      local.set 5
      local.get 3
      local.set 1
    end
    local.get 2
    i32.wrap_i64
    i32.const -16
    i32.and
    local.get 1
    i32.sub
    local.tee 3
    i32.const 20
    i32.lt_u
    if ;; label = @1
      return
    end
    local.get 1
    local.get 5
    i32.const 2
    i32.and
    local.get 3
    i32.const 8
    i32.sub
    local.tee 3
    i32.const 1
    i32.or
    i32.or
    i32.store align=1
    local.get 1
    i32.const 0
    i32.store offset=4 align=1
    local.get 1
    i32.const 0
    i32.store offset=8 align=1
    local.get 1
    i32.const 4
    i32.add
    local.get 3
    i32.add
    local.tee 3
    i32.const 2
    i32.store align=1
    local.get 0
    local.get 3
    i32.store offset=1568 align=1
    local.get 0
    local.get 1
    call 4
  )
  (func (;6;) (type 0)
    (local i32 i32)
    memory.size
    local.tee 0
    i32.const 0
    i32.le_s
    if (result i32) ;; label = @1
      i32.const 1
      local.get 0
      i32.sub
      memory.grow
      i32.const 0
      i32.lt_s
    else
      i32.const 0
    end
    if ;; label = @1
      unreachable
    end
    i32.const 4128
    i32.const 0
    i32.store align=1
    i32.const 5696
    i32.const 0
    i32.store align=1
    i32.const 0
    local.set 0
    loop ;; label = @1
      local.get 0
      i32.const 23
      i32.lt_u
      if ;; label = @2
        local.get 0
        i32.const 2
        i32.shl
        i32.const 4128
        i32.add
        i32.const 0
        i32.store offset=4 align=1
        i32.const 0
        local.set 1
        loop ;; label = @3
          local.get 1
          i32.const 16
          i32.lt_u
          if ;; label = @4
            local.get 0
            i32.const 4
            i32.shl
            local.get 1
            i32.add
            i32.const 2
            i32.shl
            i32.const 4128
            i32.add
            i32.const 0
            i32.store offset=96 align=1
            local.get 1
            i32.const 1
            i32.add
            local.set 1
            br 1 (;@3;)
          end
        end
        local.get 0
        i32.const 1
        i32.add
        local.set 0
        br 1 (;@1;)
      end
    end
    i32.const 4128
    i32.const 5700
    memory.size
    i64.extend_i32_s
    i64.const 16
    i64.shl
    call 5
    i32.const 4128
    global.set 0
  )
  (func (;7;) (type 3) (param i32)
    (local i32)
    local.get 0
    i32.const 4128
    i32.lt_u
    if ;; label = @1
      return
    end
    global.get 0
    i32.eqz
    if ;; label = @1
      call 6
    end
    local.get 0
    i32.const 4
    i32.sub
    local.set 1
    local.get 0
    i32.const 15
    i32.and
    i32.const 1
    local.get 0
    select
    if (result i32) ;; label = @1
      i32.const 1
    else
      local.get 1
      i32.load align=1
      i32.const 1
      i32.and
    end
    if ;; label = @1
      unreachable
    end
    local.get 1
    local.get 1
    i32.load align=1
    i32.const 1
    i32.or
    i32.store align=1
    global.get 0
    local.get 1
    call 4
  )
  (func (;8;) (type 9) (param i32) (result i32)
    (local i32 i32 i32 i32)
    local.get 0
    i32.const 8
    i32.add
    local.set 0
    global.get 0
    i32.eqz
    if ;; label = @1
      call 6
    end
    local.get 0
    i32.const 1073741820
    i32.gt_u
    if ;; label = @1
      unreachable
    end
    global.get 0
    local.tee 2
    local.get 0
    i32.const 12
    i32.le_u
    if (result i32) ;; label = @1
      i32.const 12
    else
      local.get 0
      i32.const 19
      i32.add
      i32.const -16
      i32.and
      i32.const 4
      i32.sub
    end
    local.tee 0
    call 2
    local.tee 1
    i32.eqz
    if ;; label = @1
      memory.size
      local.tee 1
      local.get 0
      i32.const 256
      i32.ge_u
      if (result i32) ;; label = @2
        local.get 0
        i32.const 536870910
        i32.lt_u
        if (result i32) ;; label = @3
          local.get 0
          i32.const 1
          i32.const 27
          local.get 0
          i32.clz
          i32.sub
          i32.shl
          i32.add
          i32.const 1
          i32.sub
        else
          local.get 0
        end
      else
        local.get 0
      end
      i32.const 4
      local.get 2
      i32.load offset=1568 align=1
      local.get 1
      i32.const 16
      i32.shl
      i32.const 4
      i32.sub
      i32.ne
      i32.shl
      i32.add
      i32.const 65535
      i32.add
      i32.const -65536
      i32.and
      i32.const 16
      i32.shr_u
      local.tee 3
      local.get 1
      local.get 3
      i32.gt_s
      select
      memory.grow
      i32.const 0
      i32.lt_s
      if ;; label = @2
        local.get 3
        memory.grow
        i32.const 0
        i32.lt_s
        if ;; label = @3
          unreachable
        end
      end
      local.get 2
      local.get 1
      i32.const 16
      i32.shl
      memory.size
      i64.extend_i32_s
      i64.const 16
      i64.shl
      call 5
      local.get 2
      local.get 0
      call 2
      local.set 1
    end
    local.get 2
    local.get 1
    call 3
    local.get 1
    i32.load align=1
    local.tee 3
    i32.const -4
    i32.and
    local.get 0
    i32.sub
    local.tee 4
    i32.const 16
    i32.ge_u
    if ;; label = @1
      local.get 1
      local.get 0
      local.get 3
      i32.const 2
      i32.and
      i32.or
      i32.store align=1
      local.get 1
      i32.const 4
      i32.add
      local.get 0
      i32.add
      local.tee 0
      local.get 4
      i32.const 4
      i32.sub
      i32.const 1
      i32.or
      i32.store align=1
      local.get 2
      local.get 0
      call 4
    else
      local.get 1
      local.get 3
      i32.const -2
      i32.and
      i32.store align=1
      local.get 1
      i32.const 4
      i32.add
      local.tee 0
      local.get 1
      i32.load align=1
      i32.const -4
      i32.and
      local.tee 2
      i32.add
      local.get 0
      local.get 2
      i32.add
      i32.load align=1
      i32.const -3
      i32.and
      i32.store align=1
    end
    local.get 1
    i32.const 4
    i32.add
    local.tee 0
    i32.const 1
    i32.store align=1
    local.get 0
  )
  (func (;9;) (type 3) (param i32)
    (local i32 i32 i32 i32 i32 i32 i32)
    local.get 0
    i32.load align=1
    local.tee 3
    i32.const 1
    i32.gt_s
    if ;; label = @1
      local.get 0
      local.get 3
      i32.const 1
      i32.sub
      i32.store align=1
    else
      local.get 3
      i32.const 1
      i32.eq
      if ;; label = @2
        block ;; label = @3
          i32.const 0
          local.set 3
          loop ;; label = @4
            block (result i32) ;; label = @5
              local.get 0
              i32.load offset=4 align=1
              local.tee 2
              i32.const 30
              i32.shr_u
              local.tee 1
              if ;; label = @6
                local.get 1
                i32.const 2
                i32.eq
                if ;; label = @7
                  local.get 2
                  i32.const 28
                  i32.shr_u
                  i32.const 3
                  i32.and
                  i32.const 1
                  i32.eq
                  if ;; label = @8
                    local.get 2
                    i32.const 268435455
                    i32.and
                    local.set 2
                    local.get 0
                    i32.const 8
                    i32.add
                    local.tee 1
                    i32.load align=1
                    local.tee 4
                    i32.const 8
                    i32.shr_u
                    i32.const 2047
                    i32.and
                    local.set 5
                    local.get 4
                    i32.const 19
                    i32.shr_u
                    i32.const 2047
                    i32.and
                    local.set 6
                    local.get 1
                    i32.const 4
                    i32.add
                    local.set 1
                    loop ;; label = @9
                      local.get 2
                      i32.const 0
                      i32.gt_s
                      if ;; label = @10
                        local.get 2
                        i32.const 1
                        i32.sub
                        local.set 2
                        i32.const 0
                        local.set 4
                        local.get 1
                        local.get 6
                        i32.const 2
                        i32.shl
                        i32.add
                        local.set 1
                        loop ;; label = @11
                          local.get 4
                          local.get 5
                          i32.lt_s
                          if ;; label = @12
                            local.get 1
                            i32.load align=1
                            local.tee 7
                            if ;; label = @13
                              local.get 7
                              call 9
                            end
                            local.get 4
                            i32.const 1
                            i32.add
                            local.set 4
                            local.get 1
                            i32.const 4
                            i32.add
                            local.set 1
                            br 1 (;@11;)
                          end
                        end
                        br 1 (;@9;)
                      end
                    end
                  else
                    i32.const 2
                    local.get 2
                    i32.const 268435455
                    i32.and
                    local.tee 1
                    br_if 3 (;@5;)
                    drop
                  end
                else
                  local.get 1
                  i32.const 1
                  i32.ne
                  if ;; label = @8
                    unreachable
                  end
                end
              else
                local.get 2
                i32.const 19
                i32.shr_u
                i32.const 2047
                i32.and
                local.get 2
                i32.const 8
                i32.shr_u
                i32.const 2047
                i32.and
                local.tee 1
                br_if 1 (;@5;)
                drop
              end
              local.get 0
              call 7
              local.get 3
              i32.eqz
              br_if 2 (;@3;)
              local.get 3
              i32.load offset=4 align=1
              local.set 1
              local.get 3
              local.tee 0
              local.get 0
              i32.load align=1
              local.tee 2
              i32.const 2
              i32.shl
              i32.add
              i32.load align=1
              local.set 3
              local.get 2
              i32.const 1
              i32.add
            end
            local.set 4
            loop ;; label = @5
              loop ;; label = @6
                local.get 1
                i32.const 0
                i32.gt_s
                if ;; label = @7
                  local.get 1
                  i32.const 1
                  i32.sub
                  local.set 1
                  local.get 0
                  local.get 4
                  i32.const 2
                  i32.shl
                  i32.add
                  local.tee 6
                  i32.load align=1
                  local.tee 2
                  i32.eqz
                  if ;; label = @8
                    local.get 4
                    i32.const 1
                    i32.add
                    local.set 4
                    br 2 (;@6;)
                  end
                  local.get 2
                  i32.load align=1
                  local.tee 5
                  i32.const 1
                  i32.gt_s
                  if ;; label = @8
                    local.get 2
                    local.get 5
                    i32.const 1
                    i32.sub
                    i32.store align=1
                  else
                    local.get 5
                    i32.const 1
                    i32.eq
                    if ;; label = @9
                      local.get 1
                      if ;; label = @10
                        local.get 0
                        local.get 4
                        i32.store align=1
                        local.get 0
                        local.get 1
                        i32.store offset=4 align=1
                        local.get 6
                        local.get 3
                        i32.store align=1
                        local.get 0
                        local.set 3
                      else
                        local.get 0
                        call 7
                      end
                      local.get 2
                      local.set 0
                      br 5 (;@4;)
                    end
                  end
                  local.get 4
                  i32.const 1
                  i32.add
                  local.set 4
                  br 1 (;@6;)
                end
              end
              local.get 0
              call 7
              local.get 3
              if ;; label = @6
                local.get 3
                i32.load offset=4 align=1
                local.set 1
                local.get 3
                local.tee 0
                local.get 0
                i32.load align=1
                local.tee 2
                i32.const 2
                i32.shl
                i32.add
                i32.load align=1
                local.set 3
                local.get 2
                i32.const 1
                i32.add
                local.set 4
                br 1 (;@5;)
              end
            end
          end
        end
      end
    end
  )
  (func (;10;) (type 0)
    call 1
    drop
  )
  (func (;11;) (type 0)
    (local f64)
    call 0
    local.set 0
    global.get 1
    local.get 0
    f64.store offset=8 align=1
  )
  (func (;12;) (type 10) (param f64)
    (local i32 i32 i32 i32 i32 i32 i32 f32 f32 f32 f32 f32 f32)
    i32.const 32
    i32.load
    local.tee 5
    i32.const 65535
    i32.and
    if (result i32) ;; label = @1
      local.get 5
      i32.const 16
      i32.shr_u
      i32.const 15
      i32.and
      local.tee 5
      if (result i32) ;; label = @2
        i32.const 4096
        i32.load align=1
        local.tee 1
        i32.const 0
        i32.ge_s
        if ;; label = @3
          i32.const 4096
          local.get 1
          i32.const 1
          i32.add
          i32.store align=1
        end
        i32.const 4096
        i32.const 0
        i32.const 4104
        i32.load align=1
        call_indirect (type 1)
        local.set 10
        local.set 9
        local.set 8
        local.tee 4
        local.set 7
        local.get 8
        local.set 11
        local.get 9
        local.set 12
        local.get 10
        local.set 13
        i32.const 0
        local.set 1
        local.get 5
        i32.const 4
        i32.shl
        call 8
        local.tee 6
        local.get 5
        i32.const 1073741824
        i32.or
        i32.store offset=4 align=1
        loop ;; label = @3
          local.get 1
          local.get 5
          i32.lt_s
          if ;; label = @4
            local.get 3
            local.get 6
            i32.add
            local.tee 2
            local.get 7
            i32.store offset=8 align=1
            local.get 2
            i32.const 4
            i32.add
            local.get 11
            f32.store offset=8 align=1
            local.get 2
            i32.const 8
            i32.add
            local.get 12
            f32.store offset=8 align=1
            local.get 2
            i32.const 12
            i32.add
            local.get 13
            f32.store offset=8 align=1
            local.get 3
            i32.const 16
            i32.add
            local.set 3
            local.get 1
            i32.const 1
            i32.add
            local.set 1
            br 1 (;@3;)
          end
        end
        local.get 6
        local.set 3
        i32.const 1
        local.set 1
        loop ;; label = @3
          block ;; label = @4
            block (result i32) ;; label = @5
              local.get 1
              local.get 5
              i32.lt_s
              if ;; label = @6
                i32.const 4096
                i32.load align=1
                local.tee 2
                i32.const 0
                i32.ge_s
                if ;; label = @7
                  i32.const 4096
                  local.get 2
                  i32.const 1
                  i32.add
                  i32.store align=1
                end
                i32.const 4096
                local.get 1
                i32.const 4104
                i32.load align=1
                call_indirect (type 1)
                local.set 10
                local.set 9
                local.set 8
                local.tee 4
                local.set 2
                local.get 3
                i32.load offset=4 align=1
                i32.const 268435455
                i32.and
                i32.const 1
                i32.sub
                local.get 1
                i32.ge_s
                if ;; label = @7
                  local.get 1
                  i32.const 0
                  i32.lt_s
                  if ;; label = @8
                    unreachable
                  end
                else
                  unreachable
                end
                local.get 1
                i32.const 4
                i32.shl
                local.tee 6
                local.get 3
                i32.add
                local.get 2
                i32.store offset=8 align=1
                local.get 3
                local.get 6
                i32.add
                local.tee 2
                i32.const 4
                i32.add
                local.get 8
                f32.store offset=8 align=1
                local.get 2
                i32.const 8
                i32.add
                local.get 9
                f32.store offset=8 align=1
                local.get 2
                i32.const 12
                i32.add
                local.get 10
                f32.store offset=8 align=1
                local.get 1
                i32.const 1
                i32.add
                br 1 (;@5;)
              else
                i32.const 4096
                call 9
              end
              br 1 (;@4;)
            end
            local.set 1
            br 1 (;@3;)
          end
        end
        local.get 3
      else
        i32.const 4096
        call 9
        i32.const 4112
      end
    else
      i32.const 4112
    end
    call 9
  )
  (func (;13;) (type 1) (param i32 i32) (result i32 f32 f32 f32)
    local.get 0
    call 9
    local.get 1
    i32.const 4
    i32.shl
    i32.const 4640
    i32.add
    local.tee 0
    i32.load
    local.get 0
    i32.const 4
    i32.add
    f32.load
    local.get 0
    i32.const 8
    i32.add
    f32.load
    local.get 0
    i32.const 12
    i32.add
    f32.load
  )
  (func (;14;) (type 0)
    (local i32)
    i32.const 8
    call 8
    local.tee 0
    i32.const 2097152
    i32.store offset=4 align=1
    local.get 0
    f64.const 0x0p+0 (;=0;)
    f64.store offset=8 align=1
    local.get 0
    global.set 1
    i32.const 0
    i32.const 4096
    i32.store
    i32.const 4
    i64.const 18014398509481984
    i64.store
  )
  (data (;0;) (i32.const 4096) "\ff\ff\ff\ff\00\00 \00\00\00\00\00\00\00\00\00\ff\ff\ff\ff\00\00\00@\00\00\00\00\00\00\00\00")
)
