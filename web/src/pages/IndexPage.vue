<template>
  <q-page>
    <q-btn
      class="full-width"
      color="primary"
      no-caps
      @click="scanDevices"
      label="Scan"
    />
    <div v-for="(device, id) in getDevices" :key="id">
      <micro-bit :device="device" />
    </div>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import { mapGetters, mapActions } from "vuex";
import MicroBit from "components/MicroBit.vue";

export default defineComponent({
  components: { MicroBit },
  name: "IndexPage",
  computed: {
    ...mapGetters("MicroBit", ["getDevices"]),
  },
  methods: {
    ...mapActions("MicroBit", ["scan"]),
    async scanDevices() {
      try {
        await this.scan();
      } catch (error) {
        console.log(error);
      }
    },
  },
});
</script>
