import { store } from "quasar/wrappers";
import { createStore } from "vuex";

import MicroBit from "./MicroBit";

export default store(function (/* { ssrContext } */) {
  const Store = createStore({
    modules: {
      MicroBit,
    },

    // enable strict mode (adds overhead!)
    // for dev mode and --debug builds only
    strict: process.env.DEBUGGING,
  });

  return Store;
});
