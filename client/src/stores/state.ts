import type { SetStoreFunction } from 'solid-js/store';

type State = ReturnType<typeof __getInitParams>;
type StateKey = keyof State;

let pageChatRef: HTMLDivElement;
let controller: AbortController;

const touchCtrl = {
  timer: null as NodeJS.Timeout | null,
  isTouching: false,
  start: () => touchCtrl.isTouching = true,
  end: () => {
    clearTimeout(touchCtrl.timer);
    touchCtrl.timer = setTimeout(() => touchCtrl.isTouching = false, 500);
  }
};

/** 录音控制器 */
const voiceCtrl = {
  timer: null as NodeJS.Timeout | null,
  MAX_RECORD_TIME: 60
};

/** 初始化 */
function __getInitParams() {
  return {
    
  };
}

const __genGetters = (state: State) => {
  return {
    
  }
}

const __genActions = (state: State, setState: SetStoreFunction<State>) => {
  const actions = {
    
  };

  return actions;
};

function createState() {
  const [state, setState] = createStore(__getInitParams());

  return {
    state,
    ...__genGetters(state),
    ...__genActions(state, setState)
  };
}

export default createRoot(createState);
