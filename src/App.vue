<template>
  <v-app>
    <v-main>
      <div class="global-bg">
        <router-view />
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
//
</script>

<style>
.global-bg {
  background-image: url('@/assets/background.jpg');
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