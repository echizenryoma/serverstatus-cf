<template>
  <div class="text-caption text-right mt-2" style="color: #888;">
    <i18n-t keypath="app.footer.version"></i18n-t>: {{ appVersion }}
  </div>
  <v-footer app absolute color="transparent" class="text-center d-flex flex-column">
    <v-col class="text-caption">
      <i18n-t keypath="app.footer.poweredBy">
        <template #influxDb>
          <a href="https://www.influxdata.com/" target="_blank">InfluxDB</a>
        </template>
        <template #cloudflarePage>
          <a href="https://pages.cloudflare.com/" target="_blank">Cloudflare Pages</a>
        </template>
        <template #vuetify>
          <a href="https://vuetifyjs.com/" target="_blank">Vuetify</a>
        </template>
      </i18n-t>
    </v-col>
    <v-col class="text-caption">
      <i18n-t keypath="app.footer.copyright">
        <template #year>{{ new Date().getFullYear() }}</template>
        <template #author>Ryoma Dev</template>
      </i18n-t>
    </v-col>
  </v-footer>
</template>

<script>
export default {
  name: 'Footer',
  data() {
    return {
      appVersion: __APP_VERSION__,
    }
  },
}
</script>
