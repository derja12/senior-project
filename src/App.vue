<script lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import router from './router';
export default {
  data() {
    return {
      isAuthorized: false,
    }
  },
  methods: {
    login() {
      if (this.isAuthorized) {
        this.$router.push('/login') // placeholder
      } else {
        this.$router.push('/login')
      }
    }
  },
  mounted() {
    // const urlParams = new URLSearchParams(window.location.search);
    // this.isUserAuthorized = urlParams.has('authorized');
    this.login();
  }
}
</script>

<template>
  <v-app>
    <v-app-bar class="bg-grey-darken-4 text-teal-lighten-2">
      <v-toolbar-title>DaF Reports</v-toolbar-title>
    </v-app-bar>
    <router-view></router-view>
  </v-app>
</template>
