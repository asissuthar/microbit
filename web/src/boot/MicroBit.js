import { boot } from "quasar/wrappers";
import { requestMicrobit, getServices } from "microbit-web-bluetooth";

export class MicroBit {
  static #devices = new Map();
  static async scan() {
    return new MicroBit(await requestMicrobit(window.navigator.bluetooth));
  }
  static #devicesUpdatedListeners = [];
  static addDevicesUpdatedListener(callback) {
    if (!this.#devicesUpdatedListeners.includes(callback)) {
      this.#devicesUpdatedListeners.push(callback);
    }
  }
  static removeDevicesUpdatedListener(callback) {
    const index = this.#devicesUpdatedListeners.indexOf(callback);
    if (index > -1) {
      this.#devicesUpdatedListeners.splice(index, 1);
    }
  }
  static async #invokeDevicesUpdatedListeners() {
    return Promise.allSettled(
      this.#devicesUpdatedListeners
        .filter((callback) => callback instanceof Function)
        .map((callback) => callback([...this.#devices.values()]))
    );
  }
  static add(device) {
    this.#devices.set(device.id, device);
    this.#invokeDevicesUpdatedListeners();
  }
  static remove(device) {
    this.#devices.delete(device.id);
    this.#invokeDevicesUpdatedListeners();
  }
  static get(id) {
    return this.#devices.get(id);
  }

  #dataChangeListeners = [];
  addDataChangeListener(callback) {
    if (!this.#dataChangeListeners.includes(callback)) {
      this.#dataChangeListeners.push(callback);
    }
  }
  removeDataChangeListener(callback) {
    const index = this.#dataChangeListeners.indexOf(callback);
    if (index > -1) {
      this.#dataChangeListeners.splice(index, 1);
    }
  }
  async #invokeDataChangeListeners() {
    return Promise.allSettled(
      this.#dataChangeListeners
        .filter((callback) => callback instanceof Function)
        .map((callback) => callback(this.#data))
    );
  }

  #device = null;
  #services = null;
  #data = {
    button: {
      a: null,
      b: null,
    },
    led: null,
    temperature: null,
    accelerometer: {
      x: null,
      y: null,
      y: null,
    },
    magnetometer: {
      x: null,
      y: null,
      y: null,
    },
    uart: null,
    event: null,
    ioPin: null,
  };
  #isConncted = false;

  constructor(device) {
    this.#device = device;
    MicroBit.add(this);
  }

  get isConnected() {
    return this.#isConncted;
  }

  get id() {
    return this.#device?.id;
  }

  get name() {
    return this.#device?.name;
  }

  get data() {
    return this.#data;
  }

  async connect() {
    this.#services = await getServices(this.#device);
    this.#isConncted = true;
    this.addButtonAListener(this.#onButtonA);
    this.addButtonBListener(this.#onButtonB);
    // this.#services.ledService
    // this.#services.temperatureService
    // this.#services.accelerometerService
    // this.#services.magnetometerService
    this.addReceiveTextListener(this.#onReceiveText);
    // this.#services.eventService
    // this.#services.ioPinService
    this.addDisconnectedListener(this.#onDisconnected);
  }

  #onButtonA = (event) => {
    this.#data.button.a = event.detail;
    this.#invokeDataChangeListeners();
  };

  #onButtonB = (event) => {
    this.#data.button.b = event.detail;
    this.#invokeDataChangeListeners();
  };

  #onReceiveText = (event) => {
    this.#data.uart = event.detail;
    this.#invokeDataChangeListeners();
  };

  async deviceInformation() {
    return this.#services?.deviceInformationService?.readDeviceInformation();
  }

  async readButtonAState() {
    return this.#services?.buttonService?.readButtonAState();
  }

  async readButtonBState() {
    return this.#services?.buttonService?.readButtonBState();
  }

  async sendText(text) {
    await this.#services?.uartService?.sendText(text);
  }

  async setTemperaturePeriod(frequency) {
    await this.#services?.temperatureService?.setTemperaturePeriod(frequency);
  }

  async getTemperaturePeriod(frequency) {
    return this.#services?.temperatureService?.getTemperaturePeriod();
  }

  async disconnect() {
    if (this.#device?.gatt?.connected) {
      await this.#device?.gatt?.disconnect();
    }
  }

  #onDisconnected = () => {
    this.#isConncted = false;
    this.#services = null;
  };

  async destroy() {
    await this.disconnect();
    this.removeButtonAListener(this.#onButtonA);
    this.removeButtonBListener(this.#onButtonB);
    this.removeReceiveTextListener(this.#onReceiveText);
    this.removeDisconnectedListener(this.#onDisconnected);
    MicroBit.remove(this);
    this.#services = null;
    this.#device = null;
  }

  addButtonAListener(callback) {
    this.#services?.buttonService?.addEventListener(
      "buttonastatechanged",
      callback
    );
  }

  removeButtonAListener(callback) {
    this.#services?.buttonService?.removeEventListener(
      "buttonastatechanged",
      callback
    );
  }

  addButtonBListener(callback) {
    this.#services?.buttonService?.addEventListener(
      "buttonbstatechanged",
      callback
    );
  }

  removeButtonBListener(callback) {
    this.#services?.buttonService?.removeEventListener(
      "buttonbstatechanged",
      callback
    );
  }

  addReceiveTextListener(callback) {
    this.#services?.uartService?.addEventListener("receiveText", callback);
  }

  removeReceiveTextListener(callback) {
    this.#services?.uartService?.removeEventListener("receiveText", callback);
  }

  addDisconnectedListener(callback) {
    this.#device?.addEventListener("gattserverdisconnected", callback);
  }

  removeDisconnectedListener(callback) {
    this.#device?.removeEventListener("gattserverdisconnected", callback);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      isConnected: this.isConnected,
    };
  }
}

export default boot(async ({ store }) => {
  MicroBit.addDevicesUpdatedListener((devices) => {
    store.commit(
      "MicroBit/setDevices",
      devices.map((device) => ({
        id: device.id,
        name: device.name,
      }))
    );
  });
});
