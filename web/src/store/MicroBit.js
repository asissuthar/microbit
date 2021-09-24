import { MicroBit } from "boot/MicroBit";

const state = () => ({
  scanning: false,
  devices: [],
});

const getters = {
  isScanning(state) {
    return state.scanning;
  },
  getDevices(state) {
    return state.devices;
  },
};

const mutations = {
  setScanning(state, value) {
    state.scanning = value;
  },
  setDevices(state, value) {
    state.devices = value;
  },
};

const actions = {
  async scan({ commit }) {
    commit("setScanning", true);
    try {
      await MicroBit.scan();
    } finally {
      commit("setScanning", false);
    }
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};
