<template>
  <v-app>
    <v-main>
      <div class="global-bg">
        <router-view />
      </div>

      <Footer />
    </v-main>
  </v-app>
</template>

<script setup>
  import Footer from './components/Footer.vue'

  const backgrounds = import.meta.glob('@/assets/background.*.webp', {
    eager: true,
    import: 'default',
  })
  const bgList = Object.values(backgrounds)
  const bgUrl = bgList[Math.floor(Math.random() * bgList.length)]
  const backgroundImage = `url("${bgUrl}?v=${__APP_VERSION__}")`
</script>

<style>
.global-bg {
  background-image: v-bind(backgroundImage);
  background-size: cover;
  background-attachment: fixed;
  background-position: top;
  min-height: 100vh;
  z-index: 0;
}

@media (max-width: 768px) {
  .global-bg {
    background-image: none;
  }
}
</style>
