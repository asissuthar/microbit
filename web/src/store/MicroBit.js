import { MicroBit } from "boot/MicroBit";
import { flatten, unflatten } from "flat";

const state = () => ({
  scanning: false,
  devices: [],
});

const getters = {
  isScanning(state) {
    return state.scanning;
  },
  getDevices(state) {
    const devices = {};
    for (const id in state.devices) {
      devices[id] = unflatten(state.devices[id]);
    }
    return devices;
  },
  getDevice(state, getters) {
    return (id) => getters.getDevices[id];
  },
};

const mutations = {
  setScanning(state, value) {
    state.scanning = value;
  },
  setDevices(state, value) {
    const devices = {};
    for (const id in value) {
      devices[id] = flatten(value[id]);
    }
    state.devices = devices;
  },
  setDevice(state, { id, path, value }) {
    state.devices[id][path] = value;
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
