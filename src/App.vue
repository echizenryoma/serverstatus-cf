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
  import { setBackgroundImage } from '@/utils/background'
  import Footer from './components/Footer.vue'

  const { backgroundImage } = setBackgroundImage()
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
