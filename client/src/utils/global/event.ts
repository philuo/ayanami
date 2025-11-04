/**
 * @file 事件总线
 * @author fanchong
 */
export type EventHandlerList<T = unknown> = Array<Handler<T>>;
export type EventHandlerMap<Events> = Map<
  keyof Events,
  EventHandlerList<Events[keyof Events]>
>;

export const mitt = <Events>(isLocal = true): EventUtil<Events> => {
  let list: EventHandlerMap<Events>;
  const all: EventHandlerMap<Events> = new Map();
  const ctor = {
    $on<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>) {
      if (typeof handler !== 'function') {
        return;
      }

      const handlers = all.get(type) as Array<Handler<Events[Key]>>;

      if (handlers) {
        handlers.push(handler);
      }
      else {
        all.set(type, [handler] as EventHandlerList<Events[keyof Events]>);
      }
    },

    $emit<Key extends keyof Events>(type: Key, evt?: Events[Key]) {
      all.get(type)?.slice().forEach(handler => handler(evt!));

      if (list) {
        const handlers: Array<Handler<Events[Key]>> | undefined = list.get(type);

        handlers?.slice().forEach(handler => {
          handler(evt!);
          handlers.splice(handlers.indexOf(handler) >>> 0, 1);
        });
      }
    }
  } as EventUtil<Events>;

  if (isLocal) {
    list = new Map();

    ctor.$off = <Key extends keyof Events>(type: Key, handler?: Handler<Events[Key]>) => {
      const allHandlers: Array<Handler<Events[Key]>> | undefined = all.get(type);
      const listHandlers: Array<Handler<Events[Key]>> | undefined = list.get(type);

      if (typeof handler === 'function') {
        allHandlers?.splice(allHandlers.indexOf(handler) >>> 0, 1);
        listHandlers?.splice(listHandlers.indexOf(handler) >>> 0, 1);
      }
      else {
        all.set(type, []);
        list.set(type, []);
      }
    };

    ctor.$once = <Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>) => {
      if (typeof handler !== 'function') {
        return;
      }

      const handlers = list.get(type) as Array<Handler<Events[Key]>>;

      if (handlers) {
        handlers.push(handler);
      }
      else {
        list.set(type, [handler] as EventHandlerList<Events[keyof Events]>);
      }
    };
  }

  return ctor;
};

export default mitt;
