/**
 * @file 环境判断
 * @author Perfumere
 */
import EnvUtil from './env';
import EventUtil from './event';
import { storage } from './storage';

function _genGlobalVal(utils: Record<string, any>) {
  return {
    configurable: false,
    value: Object.freeze({ __proto__: null, ...utils })
  };
}

Object.defineProperties(window, {
  Util: _genGlobalVal({
    ...EnvUtil,
  }),
  Emiter: _genGlobalVal(EventUtil<Record<EventType, unknown>>(true)),
  storage: {
    configurable: false,
    value: storage
  }
});

// polyfill for mp-weixin
if (typeof Array.prototype.at !== 'function') {
  Array.prototype.at = function(index: number) {
    if (index < 0) {
      return this[this.length + index];
    }

    return this[index];
  }
}
