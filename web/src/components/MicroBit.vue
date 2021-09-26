<template>
  <q-card>
    <q-card-section>
      <div class="text-h6">{{ deviceName }}</div>
    </q-card-section>
    <q-card-section v-if="isDeviceConnected">
      <div class="row text-center q-gutter-x-md">
        <q-card v-if="isButtonAvailable" class="col">
          <q-card-section>
            <micro-bit-button-a :device="device" />
          </q-card-section>
        </q-card>
        <q-card v-if="isButtonAvailable" class="col">
          <q-card-section>
            <micro-bit-button-b :device="device" />
          </q-card-section>
        </q-card>
        <q-card v-if="isTemperatureAvailable" class="col">
          <q-card-section>
            <micro-bit-temperature :device="device" />
          </q-card-section>
        </q-card>
      </div>

      <q-card v-if="isLedAvailable" class="q-mt-md q-gutter-y-md">
        <q-card-section>
          <micro-bit-led :device="device" />
          <q-input
            v-model="text"
            type="text"
            hide-bottom-space
            hide-hint
            label="Text"
            class="q-mt-md"
            outlined
            @keypress.enter="writeText"
          />
        </q-card-section>
      </q-card>
      <q-card v-if="isUartAvailable" class="q-mt-md q-gutter-y-md">
        <q-card-section>
          <q-input
            v-model="text"
            type="text"
            hide-bottom-space
            hide-hint
            label="Text"
            outlined
            @keypress.enter="sendText"
          />
          <div class="text-h6 q-mt-md">{{ uartData }}</div>
        </q-card-section>
      </q-card>
    </q-card-section>
    <q-card-actions>
      <q-btn
        @click="connect"
        :loading="isDeviceConnecting"
        class="full-width"
        :label="connectButtonLabel"
      />
    </q-card-actions>
  </q-card>
</template>

<script>
import { defineComponent } from "vue";
import { MicroBit } from "boot/MicroBit";
import MicroBitButtonA from "./MicroBitButtonA.vue";
import MicroBitButtonB from "./MicroBitButtonB.vue";
import MicroBitLed from "./MicroBitLed.vue";
import MicroBitTemperature from "./MicroBitTemperature.vue";

export default defineComponent({
  name: "MicroBit",
  components: {
    MicroBitButtonA,
    MicroBitButtonB,
    MicroBitLed,
    MicroBitTemperature,
  },
  props: {
    device: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      text: "",
    };
  },
  computed: {
    deviceId() {
      return this.device?.id;
    },
    deviceName() {
      return this.device?.name;
    },
    isDeviceConnected() {
      return this.device?.connection.connected;
    },
    isDeviceConnecting() {
      return this.device?.connection.connecting;
    },
    isButtonAvailable() {
      return this.device?.button.available;
    },
    isLedAvailable() {
      return this.device?.led.available;
    },
    isTemperatureAvailable() {
      return this.device?.temperature.available;
    },
    isUartAvailable() {
      return this.device?.uart.available;
    },
    uartData() {
      return this.device?.uart.data;
    },
    connectButtonLabel() {
      return this.isDeviceConnecting
        ? "Connecting"
        : this.isDeviceConnected
        ? "Disconnect"
        : "Connect";
    },
  },
  methods: {
    getMicroBit() {
      return MicroBit.get(this.deviceId);
    },
    async connect() {
      try {
        const microBit = this.getMicroBit();
        if (this.isDeviceConnected) {
          await microBit?.disconnect();
        } else {
          await microBit?.connect();
        }
      } catch (error) {
        console.log(error);
      }
    },
    async writeText() {
      try {
        await this.getMicroBit()?.writeText(this.text);
        this.text = "";
      } catch (error) {
        console.log(error);
      }
    },
    async sendText() {
      try {
        await this.getMicroBit()?.sendText(this.text + "\n");
        this.text = "";
      } catch (error) {
        console.log(error);
      }
    },
  },
  async mounted() {},
});
</script>
