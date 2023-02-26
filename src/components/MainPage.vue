<script>
export default {
  methods: {
    async pingExpress() {
      let response = await fetch("http://localhost:5173/ping");
      console.log(this.isUserAuthorized);
      console.log(response);
    },
    async loginSpotify() {
      let response = await fetch("http://localhost:5173/login");
      let data = await response.json();
      console.log(data.url);
      window.location.href = data.url;
    }
  },
}
</script>

<template>
  <v-app>
    <v-app-bar
      app
    >
      <v-app-bar-nav-icon></v-app-bar-nav-icon>

      <v-toolbar-title>Application</v-toolbar-title>

      <v-spacer></v-spacer>

    </v-app-bar>

    <v-main>
      <v-container>
        <v-row>
          <v-col
            v-for="n in 24"
            :key="n"
            cols="4"
          >
            <v-card v-if="n != 2" height="200"></v-card>
            <v-card v-else height="200">
              <v-card-actions>
                <v-btn class="mx-auto" size="large" @click="pingExpress">
                  <v-icon size="large" color="blue-darken-4">mdi-table-tennis</v-icon>
                </v-btn>
                <v-btn class="mx-auto" size="large" @click="loginSpotify">
                  <v-icon size="large" color="blue-darken-4">mdi-login-variant</v-icon>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>
