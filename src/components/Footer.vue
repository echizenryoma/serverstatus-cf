<template>
  <v-footer color="transparent" class="text-center flex-column pa-4">
    <div class="text-caption mb-1">
      {{ appVersion }}
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
    </div>
    <div class="text-caption mb-2">
      <i18n-t keypath="app.footer.copyright">
        <template #year>{{ new Date().getFullYear() }}</template>
        <template #author>Ryoma Dev</template>
      </i18n-t>
    </div>
    <div class="d-flex justify-center">
      <v-avatar size="42">
        <v-img src="@/assets/author.webp" alt="作者"></v-img>
      </v-avatar>
    </div>
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
