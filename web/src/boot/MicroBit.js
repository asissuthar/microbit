import { boot } from "quasar/wrappers";
import { requestMicrobit, getServices } from "microbit-web-bluetooth";
import onChange from "on-change";
import { flatten } from "flat";
export class MicroBit {
  static async scan() {
    return new MicroBit(await requestMicrobit(window.navigator.bluetooth));
  }

  static #listeners = [];
  static addListener(callback) {
    if (!this.#listeners.includes(callback)) {
      this.#listeners.push(callback);
    }
  }
  static removeListener(callback) {
    const index = this.#listeners.indexOf(callback);
    if (index > -1) {
      this.#listeners.splice(index, 1);
    }
  }
  static clearListeners() {
    this.#listeners = [];
  }
  static #invokeListeners = async (path, value, previousValue, data = null) => {
    return Promise.allSettled(
      this.#listeners
        .filter((callback) => callback instanceof Function)
        .map((callback) =>
          callback(
            data ? "device" : "devices",
            data ?? this.toJSON(),
            path,
            value,
            previousValue
          )
        )
    );
  };

  static #invokeListenersFromDevice = async (
    data,
    path,
    value,
    previousValue
  ) => this.#invokeListeners(path, value, previousValue, data);

  static #devices = onChange({}, this.#invokeListeners);
  static #add(device) {
    device.addDataListener(this.#invokeListenersFromDevice);
    this.#devices[device.data.id] = device;
  }
  static #remove(device) {
    device.removeDataListener(this.#invokeListenersFromDevice);
    delete this.#devices[device.data.id];
  }
  static get(id) {
    return this.devices[id];
  }
  static get devices() {
    return onChange.target(this.#devices);
  }
  static toJSON() {
    const devicesData = {};
    for (const id in this.devices) {
      devicesData[id] = this.devices[id].toJSON();
    }
    return devicesData;
  }

  #device = null;
  #services = null;

  #dataListeners = [];

  #data = {
    id: null,
    name: null,
    connection: {
      connecting: false,
      connected: false,
      disconnecting: false,
    },
    deviceInformation: {
      available: false,
      loading: false,
      data: {
        modelNumber: null,
        serialNumber: null,
        firmwareRevision: null,
        hardwareRevision: null,
        manufacturer: null,
      },
    },
    button: {
      available: false,
      a: {
        loading: false,
        data: null,
      },
      b: {
        loading: false,
        data: null,
      },
    },
    led: {
      available: false,
      loading: false,
      updating: false,
      data: [
        [false, false, false, false, false],
        [false, false, false, false, false],
        [false, false, false, false, false],
        [false, false, false, false, false],
        [false, false, false, false, false],
      ],
      delay: {
        loading: false,
        updating: false,
        data: null,
      },
      text: {
        updating: false,
        data: null,
      },
    },
    temperature: {
      available: false,
      loading: false,
      data: null,
      period: {
        loading: false,
        updating: false,
        data: null,
      },
    },
    accelerometer: {
      available: false,
      loading: false,
      data: {
        x: null,
        y: null,
        z: null,
      },
      period: {
        loading: false,
        updating: false,
        data: null,
      },
    },
    magnetometer: {
      available: false,
      loading: false,
      data: {
        x: null,
        y: null,
        z: null,
      },
      period: {
        loading: false,
        updating: false,
        data: null,
      },
      bearing: {
        loading: false,
        data: null,
      },
      calibration: {
        doing: false,
        data: null,
      },
    },
    uart: {
      available: false,
      data: null,
      text: {
        sending: false,
        data: null,
      },
    },
    event: {
      available: false,
      loading: false,
      updating: false,
      data: {
        type: null,
        value: null,
      },
    },
    ioPin: {
      available: false,
      loading: false,
      updating: false,
      data: null,
      adConfiguration: {
        loading: false,
        updating: false,
        data: null,
      },
      ioConfiguration: {
        loading: false,
        updating: false,
        data: null,
      },
      pwmControl: {
        updating: false,
        data: null,
      },
    },
  };

  constructor(device) {
    this.#device = device;
    this.#data.id = device?.id;
    this.#data.name = device?.name;
    this.#data = onChange(this.#data, this.#invokeDataListeners);
    MicroBit.#add(this);
  }

  addDataListener(callback) {
    if (!this.#dataListeners.includes(callback)) {
      this.#dataListeners.push(callback);
    }
  }

  removeDataListener(callback) {
    const index = this.#dataListeners.indexOf(callback);
    if (index > -1) {
      this.#dataListeners.splice(index, 1);
    }
  }

  clearDataListeners() {
    this.#dataListeners = [];
  }

  #invokeDataListeners = async (path, value, previousValue) => {
    return Promise.allSettled(
      this.#dataListeners
        .filter((callback) => callback instanceof Function)
        .map((callback) =>
          callback(
            this.toJSON(),
            path,
            JSON.parse(JSON.stringify(value ?? null)),
            previousValue
          )
        )
    );
  };

  get data() {
    return onChange.target(this.#data);
  }

  async connect() {
    try {
      this.#data.connection.connecting = true;
      this.#services = await getServices(this.#device);
      this.#data.connection.connected = true;
      if (this.#services.deviceInformationService) {
        this.#data.deviceInformation.available = true;
      }
      if (this.#services.buttonService) {
        this.#data.button.available = true;
        this.addButtonAListener(this.#onButtonA);
        this.addButtonBListener(this.#onButtonB);
      }
      if (this.#services.ledService) {
        this.#data.led.available = true;
      }
      if (this.#services.temperatureService) {
        this.#data.temperature.available = true;
        this.addTemperatureChangedListener(this.#onTemperature);
      }
      if (this.#services.accelerometerService) {
        this.#data.accelerometer.available = true;
        this.addAccelerometerChangedListener(this.#onAccelerometer);
      }
      if (this.#services.magnetometerService) {
        this.#data.magnetometer.available = true;
        this.addMagnetometerChangedListener(this.#onMagnetometer);
        this.addMagnetometerBearingChangedListener(this.#onMagnetometerBearing);
        this.addMagnetometerCalibrationChangedListener(
          this.#onMagnetometerCalibration
        );
      }
      if (this.#services.uartService) {
        this.#data.uart.available = true;
        this.addReceiveTextListener(this.#onReceiveText);
      }
      if (this.#services.eventService) {
        this.#data.event.available = true;
        this.addEventListener(this.#onEvent);
      }
      if (this.#services.ioPinService) {
        this.#data.ioPin.available = true;
        this.addIoPinChangedListener(this.#onIoPin);
      }
      this.addDisconnectedListener(this.#onDisconnected);
    } finally {
      this.#data.connection.connecting = false;
    }
  }

  async readDeviceInformation() {
    try {
      this.#data.deviceInformation.loading = true;
      this.#updateDeviceInformationData(
        await this.#services?.deviceInformationService?.readDeviceInformation()
      );
    } finally {
      this.#data.deviceInformation.loading = false;
    }
  }

  #updateDeviceInformationData(data) {
    this.#data.deviceInformation.data.modelNumber = data?.modelNumber;
    this.#data.deviceInformation.data.serialNumber = data?.serialNumber;
    this.#data.deviceInformation.data.firmwareRevision = data?.firmwareRevision;
    this.#data.deviceInformation.data.hardwareRevision = data?.hardwareRevision;
    this.#data.deviceInformation.data.manufacturer = data?.manufacturer;
  }

  async readButtonA() {
    try {
      this.#data.button.a.loading = true;
      this.#data.button.a.data =
        await this.#services?.buttonService?.readButtonAState();
    } finally {
      this.#data.button.a.loading = false;
    }
  }

  async readButtonB() {
    try {
      this.#data.button.b.loading = true;
      this.#data.button.b.data =
        await this.#services?.buttonService?.readButtonBState();
    } finally {
      this.#data.button.b.loading = false;
    }
  }

  async setScrollingDelay(delay) {
    try {
      this.#data.led.delay.updating = true;
      await this.#services?.ledService?.setScrollingDelay(delay);
      this.#data.led.delay.data = delay;
    } finally {
      this.#data.led.delay.updating = false;
    }
  }

  async getScrollingDelay() {
    try {
      this.#data.led.delay.loading = true;
      this.#data.led.delay.data =
        await this.#services?.ledService?.getScrollingDelay();
    } finally {
      this.#data.led.delay.loading = false;
    }
  }

  async writeText(text) {
    try {
      this.#data.led.text.updating = true;
      await this.#services?.ledService?.writeText(text);
      this.#data.led.text.data = text;
    } finally {
      this.#data.led.text.updating = false;
    }
  }

  async readMatrix() {
    try {
      this.#data.led.loading = true;
      this.#updateLedData(await this.#services?.ledService?.readMatrixState());
    } finally {
      this.#data.led.loading = false;
    }
  }

  async writeMatrix(state) {
    try {
      this.#data.led.updating = true;
      await this.#services?.ledService?.writeMatrixState(state);
      this.#updateLedData(state);
    } finally {
      this.#data.led.updating = false;
    }
  }

  #updateLedData(state) {
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        this.#data.led.data[x][y] = state[x][y];
      }
    }
  }

  async setTemperaturePeriod(frequency) {
    try {
      this.#data.temperature.period.updating = true;
      await this.#services?.temperatureService?.setTemperaturePeriod(frequency);
      this.#data.temperature.period.data = frequency;
    } finally {
      this.#data.temperature.period.updating = false;
    }
  }

  async getTemperaturePeriod() {
    try {
      this.#data.temperature.period.loading = true;
      this.#data.temperature.period.data =
        await this.#services?.temperatureService?.getTemperaturePeriod();
    } finally {
      this.#data.temperature.period.loading = false;
    }
  }

  async readTemperature() {
    try {
      this.#data.temperature.loading = true;
      this.#data.temperature.data =
        await this.#services?.temperatureService?.readTemperature();
    } finally {
      this.#data.temperature.loading = false;
    }
  }

  async setAccelerometerPeriod(frequency) {
    try {
      this.#data.accelerometer.period.updating = true;
      await this.#services?.accelerometerService?.setAccelerometerPeriod(
        frequency
      );
      this.#data.accelerometer.period.data = frequency;
    } finally {
      this.#data.accelerometer.period.updating = false;
    }
  }

  async getAccelerometerPeriod() {
    try {
      this.#data.accelerometer.period.loading = true;
      this.#data.accelerometer.period.data =
        await this.#services?.accelerometerService?.getAccelerometerPeriod();
    } finally {
      this.#data.accelerometer.period.loading = false;
    }
  }

  async readAccelerometer() {
    try {
      this.#data.accelerometer.loading = true;
      this.#updateAccelerometerData(
        await this.#services?.accelerometerService?.readAccelerometerData()
      );
    } finally {
      this.#data.accelerometer.loading = false;
    }
  }

  #updateAccelerometerData({ x, y, z }) {
    this.#data.accelerometer.data.x = x;
    this.#data.accelerometer.data.y = y;
    this.#data.accelerometer.data.z = z;
  }

  async calibrate() {
    try {
      this.#data.magnetometer.calibration.doing = true;
      this.#data.magnetometer.calibration.data =
        await this.#services?.magnetometerService?.calibrate();
    } finally {
      this.#data.magnetometer.calibration.doing = false;
    }
  }

  async setMagnetometerPeriod(frequency) {
    try {
      this.#data.magnetometer.period.updating = true;
      await this.#services?.magnetometerService?.setMagnetometerPeriod(
        frequency
      );
      this.#data.magnetometer.period.data = frequency;
    } finally {
      this.#data.magnetometer.period.updating = false;
    }
  }

  async getMagnetometerPeriod() {
    try {
      this.#data.magnetometer.period.loading = true;
      this.#data.magnetometer.period.data =
        await this.#services?.magnetometerService?.getMagnetometerPeriod();
    } finally {
      this.#data.magnetometer.period.loading = false;
    }
  }

  async readMagnetometer() {
    try {
      this.#data.magnetometer.loading = true;
      this.#updateMagnetometerData(
        await this.#services?.magnetometerService?.readMagnetometerData()
      );
    } finally {
      this.#data.magnetometer.loading = false;
    }
  }

  #updateMagnetometerData({ x, y, z }) {
    this.#data.magnetometer.data.x = x;
    this.#data.magnetometer.data.y = y;
    this.#data.magnetometer.data.z = z;
  }

  async readMagnetometerBearing() {
    try {
      this.#data.magnetometer.bearing.loading = true;
      this.#data.magnetometer.bearing.data =
        await this.#services?.magnetometerService?.readMagnetometerBearing();
    } finally {
      this.#data.magnetometer.bearing.loading = false;
    }
  }

  async sendText(text) {
    try {
      this.#data.uart.text.sending = true;
      await this.#services?.uartService?.sendText(text);
      this.#data.uart.text.data = text;
    } finally {
      this.#data.uart.text.sending = false;
    }
  }

  async getMicrobitRequirements() {
    try {
      this.#data.event.loading = true;
      this.#updateEventData(
        await this.#services?.eventService?.getMicrobitRequirements()
      );
    } finally {
      this.#data.event.loading = false;
    }
  }

  async setClientRequirements(type, value) {
    try {
      this.#data.event.updating = true;
      await this.#services?.eventService?.setClientRequirements(type, value);
      this.#updateEventData({ type, value });
    } finally {
      this.#data.event.updating = false;
    }
  }

  async readEvent() {
    try {
      this.#data.event.loading = true;
      this.#updateEventData(
        await this.#services?.eventService?.readMicrobitEvent()
      );
    } finally {
      this.#data.event.loading = false;
    }
  }

  async writeClientEvent(type, value) {
    try {
      this.#data.event.updating = true;
      await this.#services?.eventService?.writeClientEvent(type, value);
      this.#updateEventData({ type, value });
    } finally {
      this.#data.event.updating = false;
    }
  }

  #updateEventData({ type, value }) {
    this.#data.event.data.type = type;
    this.#data.event.data.value = value;
  }

  async readPin() {
    try {
      this.#data.ioPin.loading = true;
      this.#data.ioPin.data = await this.#services?.ioPinService?.readPinData();
    } finally {
      this.#data.ioPin.loading = false;
    }
  }

  async writePin(data) {
    try {
      this.#data.ioPin.updating = true;
      await this.#services?.ioPinService?.writePinData(data);
      this.#data.ioPin.data = data;
    } finally {
      this.#data.ioPin.updating = false;
    }
  }

  async getAdConfiguration() {
    try {
      this.#data.ioPin.adConfiguration.loading = true;
      this.#data.ioPin.adConfiguration.data =
        await this.#services?.ioPinService?.getAdConfiguration();
    } finally {
      this.#data.ioPin.adConfiguration.loading = false;
    }
  }

  async setAdConfiguration(data) {
    try {
      this.#data.ioPin.adConfiguration.updating = true;
      await this.#services?.ioPinService?.setAdConfiguration(data);
      this.#data.ioPin.adConfiguration.data = data;
    } finally {
      this.#data.ioPin.adConfiguration.updating = false;
    }
  }

  async getIoConfiguration() {
    try {
      this.#data.ioPin.ioConfiguration.loading = true;
      this.#data.ioPin.ioConfiguration.data =
        await this.#services?.ioPinService?.getIoConfiguration();
    } finally {
      this.#data.ioPin.ioConfiguration.loading = false;
    }
  }

  async setIoConfiguration(data) {
    try {
      this.#data.ioPin.ioConfiguration.updating = true;
      await this.#services?.ioPinService?.setIoConfiguration(data);
      this.#data.ioPin.ioConfiguration.data = data;
    } finally {
      this.#data.ioPin.ioConfiguration.updating = false;
    }
  }

  async setPwmControl(data) {
    try {
      this.#data.ioPin.pwmControl.updating = true;
      await this.#services?.ioPinService?.setPwmControl(data);
      this.#data.ioPin.pwmControl.data = data;
    } finally {
      this.#data.ioPin.pwmControl.updating = false;
    }
  }

  async disconnect() {
    try {
      this.#data.connection.disconnecting = true;
      if (this.#device?.gatt?.connected) {
        await this.#device?.gatt?.disconnect();
      } else {
        this.#data.connection.connected = false;
      }
    } finally {
      this.#data.connection.disconnecting = false;
    }
  }

  #onDisconnected = () => {
    this.#data.connection.connected = false;
    this.#services = null;
  };

  async destroy() {
    try {
      await this.disconnect();
    } catch {}
    this.clearDataListeners();
    onChange.unsubscribe(this.#data);
    this.removeButtonAListener(this.#onButtonA);
    this.removeButtonBListener(this.#onButtonB);
    this.removeTemperatureChangedListener(this.#onTemperature);
    this.removeAccelerometerChangedListener(this.#onAccelerometer);
    this.removeMagnetometerChangedListener(this.#onMagnetometer);
    this.removeReceiveTextListener(this.#onReceiveText);
    this.removeEventListener(this.#onEvent);
    this.removeIoPinChangedListener(this.#onIoPin);
    this.removeDisconnectedListener(this.#onDisconnected);
    MicroBit.#remove(this);
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

  addTemperatureChangedListener(callback) {
    this.#services?.temperatureService?.addEventListener(
      "temperaturechanged",
      callback
    );
  }

  removeTemperatureChangedListener(callback) {
    this.#services?.temperatureService?.removeEventListener(
      "temperaturechanged",
      callback
    );
  }

  addAccelerometerChangedListener(callback) {
    this.#services?.accelerometerService?.addEventListener(
      "accelerometerdatachanged",
      callback
    );
  }

  removeAccelerometerChangedListener(callback) {
    this.#services?.accelerometerService?.removeEventListener(
      "accelerometerdatachanged",
      callback
    );
  }

  addMagnetometerChangedListener(callback) {
    this.#services?.magnetometerService?.addEventListener(
      "magnetometerdatachanged",
      callback
    );
  }

  removeMagnetometerChangedListener(callback) {
    this.#services?.magnetometerService?.removeEventListener(
      "magnetometerdatachanged",
      callback
    );
  }

  addMagnetometerBearingChangedListener(callback) {
    this.#services?.magnetometerService?.addEventListener(
      "magnetometerbearingchanged",
      callback
    );
  }

  removeMagnetometerBearingChangedListener(callback) {
    this.#services?.magnetometerService?.removeEventListener(
      "magnetometerbearingchanged",
      callback
    );
  }

  addMagnetometerCalibrationChangedListener(callback) {
    this.#services?.magnetometerService?.addEventListener(
      "magnetometercalibrationchanged",
      callback
    );
  }

  removeMagnetometerCalibrationChangedListener(callback) {
    this.#services?.magnetometerService?.removeEventListener(
      "magnetometercalibrationchanged",
      callback
    );
  }

  addReceiveTextListener(callback) {
    this.#services?.uartService?.addEventListener("receiveText", callback);
  }

  removeReceiveTextListener(callback) {
    this.#services?.uartService?.removeEventListener("receiveText", callback);
  }

  addEventListener(callback) {
    this.#services?.eventService?.addEventListener("microbitevent", callback);
  }

  removeEventListener(callback) {
    this.#services?.eventService?.removeEventListener(
      "microbitevent",
      callback
    );
  }

  addIoPinChangedListener(callback) {
    this.#services?.ioPinService?.addEventListener("pindatachanged", callback);
  }

  removeIoPinChangedListener(callback) {
    this.#services?.ioPinService?.removeEventListener(
      "pindatachanged",
      callback
    );
  }

  addDisconnectedListener(callback) {
    this.#device?.addEventListener("gattserverdisconnected", callback);
  }

  removeDisconnectedListener(callback) {
    this.#device?.removeEventListener("gattserverdisconnected", callback);
  }

  #onButtonA = (event) => {
    this.#data.button.a.data = event.detail;
  };

  #onButtonB = (event) => {
    this.#data.button.b.data = event.detail;
  };

  #onTemperature = (event) => {
    this.#data.temperature.data = event.detail;
  };

  #onAccelerometer = (event) => {
    this.#updateAccelerometerData(event.detail);
  };

  #onMagnetometer = (event) => {
    this.#updateMagnetometerData(event.detail);
  };

  #onMagnetometerBearing = (event) => {
    this.#data.magnetometer.bearing.data = event.detail;
  };

  #onMagnetometerCalibration = (event) => {
    this.#data.magnetometer.calibration.data = event.detail;
  };

  #onReceiveText = (event) => {
    this.#data.uart.data = event.detail;
  };

  #onEvent = (event) => {
    this.#updateEventData(event.detail);
  };

  #onIoPin = (event) => {
    this.#data.ioPin.data = event.detail;
  };

  toJSON() {
    return this.data;
  }
}

export default boot(async ({ store }) => {
  MicroBit.addListener((from, data, path, value) => {
    if (from === "devices") {
      store.commit("MicroBit/setDevices", data);
    } else {
      store.commit("MicroBit/setDevice", {
        id: data.id,
        path,
        value,
      });
    }
  });
});
