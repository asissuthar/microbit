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

  #device = null;
  #services = null;
  #data = {
    deviceInformation: {
      modelNumber: null,
      serialNumber: null,
      firmwareRevision: null,
      hardwareRevision: null,
      manufacturer: null,
    },
    button: {
      a: null,
      b: null,
    },
    led: null,
    temperature: null,
    accelerometer: null,
    magnetometer: null,
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
    this.#services?.buttonService?.addEventListener(
      "buttonastatechanged",
      this.#onButtonA
    );
    this.#services?.buttonService?.addEventListener(
      "buttonbstatechanged",
      this.#onButtonB
    );
    // this.#services.ledService
    // this.#services.temperatureService
    // this.#services.accelerometerService
    // this.#services.magnetometerService
    this.#services?.uartService?.addEventListener(
      "receiveText",
      this.#onReceiveText
    );
    // this.#services.eventService
    // this.#services.ioPinService
    this.addDisconnectedListener(this.#onDisconnected);
  }

  #onButtonA = (event) => {
    this.#data.button.a = event.detail;
  };

  #onButtonB = (event) => {
    this.#data.button.b = event.detail;
  };

  #onReceiveText = (event) => {
    this.#data.uart = event.detail;
  };

  async deviceInformation() {
    this.#data.deviceInformation =
      await this.#services?.deviceInformationService?.readDeviceInformation();
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
    MicroBit.remove(this);
    this.removeDisconnectedListener(this.#onDisconnected);
    this.#services = null;
    this.#device = null;
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