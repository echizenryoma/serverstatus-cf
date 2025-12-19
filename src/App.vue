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
import Footer from './components/Footer.vue';
</script>

<style>
.global-bg {
  background-image: url('@/assets/background.webp');
  background-size: cover;
  background-attachment: fixed;
  background-position: center;
  min-height: 100vh;
  z-index: 0;
}

@media (max-width: 768px) {
  .global-bg {
    background-image: none;
  }
}
</style>