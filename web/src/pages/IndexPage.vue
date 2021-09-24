<template>
  <q-page>
    <q-btn no-caps @click="microBitScan" label="Scan" />
    <div v-for="device in getDevices" :key="device.id">
      <m-connect :device="device" />
      <m-uart-service :device="device" />
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import { mapGetters, mapActions } from "vuex";
import MUartService from "components/MUartService.vue";
import MConnect from "components/MConnect.vue";

export default defineComponent({
  components: { MUartService, MConnect },
  name: "IndexPage",
  computed: {
    ...mapGetters("MicroBit", ["getDevices"]),
  },
  methods: {
    ...mapActions("MicroBit", ["scan"]),
    async microBitScan() {
      try {
        await this.scan();
      } catch (error) {
        console.log(error);
      }
    },
  },
});
</script>
