<script lang='ts'>
const ROOT_URL = 'http://localhost:5173';
export default {
    data() {
        return {
            isLoggedIn: false,
            user: {
                email: '',
                firstName: '',
                spotifyConnected: false,
            },
            history: []
        }
    },
    methods: {
        async login() {
            try {
                let getSessionRes = await fetch(ROOT_URL + '/session', {credentials: 'include'})
                if (getSessionRes.status == 200) {
                    this.isLoggedIn = true;
                    this.user = await getSessionRes.json();
                }
            } catch (error) {
                console.log('unable to get session:', error)
            }
            if (!this.isLoggedIn) {
                this.$router.push('/login')
            }
        },
        async logout() {
            try {
                let deleteSessionRes = await fetch(ROOT_URL + '/session', {method: 'Delete'});
                if (deleteSessionRes.status == 204) {
                    this.isLoggedIn = false;
                    this.login();
                } else {
                    console.log('unable to logout:', deleteSessionRes.statusText);
                }
            } catch (error) {
                console.log('unable to logout:', error);
            }
        },
        async authorizeSpotify() {
            try {
                let response = await fetch(ROOT_URL + '/auth');

                // send to spotify authorization page
                let data = await response.json();
                window.location.href = data.url;
            } catch (error) {
                console.error('unable to authorize spotify:', error)
            }
        },
        async getHistory() {
            try {
                let response = await fetch(ROOT_URL + '/history');
                let data = await response.json();

                this.history = data;
                console.log(this.history);
            } catch (error) {
                console.log('unable to get history:', error)
            }
        }
    },
    mounted() {
        this.login();
    }
}
</script>

<template>
    <v-app v-show='isLoggedIn'>
        <v-app-bar class='bg-grey-darken-4 text-teal-lighten-2'>
            <v-toolbar-title>DaF Reports</v-toolbar-title>
            
            <v-spacer/>

            <div v-show='isLoggedIn' class='mx-4 d-flex flex-column justify-end'>
                <div class="mt-1">Welcome, {{ user.firstName }}!</div>
                <v-btn variant="plain" class='pa-0 my-0 ml-auto' @click='logout'>Logout</v-btn>
            </div>
        </v-app-bar>

        <v-main>
            <v-container class='elevation-2 my-0 py-0 h-100 d-flex flex-column'>
                <v-container v-if='!user.spotifyConnected' class="d-flex flex-column align-center">
                    <div class="mb-2">Connect Your Spotify Account to get started!</div>
                    <v-btn variant='outlined' @click='authorizeSpotify'>
                        Connect
                    </v-btn>
                </v-container>
                <v-container v-else class="d-flex my-0 py-0 flex-column align-center">
                    <v-sheet :border="true" class="rounded-b w-50 pa-4 d-flex justify-center">
                        <v-btn 
                            variant='outlined'
                            @click='getHistory'>
                            Get History
                        </v-btn>
                    </v-sheet>
                    <v-container class="">
                        <v-card
                            v-for="listen in history" 
                            variant="plain"
                            class="w-50 mx-auto my-1 d-flex align-start"
                            :border="true"
                            elevation="1"
                            >
                            <div class="ma-0 pa-0">
                                <img
                                    :src="listen.track.album.images[0].url"
                                    width="75"
                                    height="75"
                                    class="ma-0 pa-0 d-block"
                                >
                            </div>
                            <v-sheet class="d-inline-flex flex-column ma-1 my-auto">
                                <h3>{{ listen.track.name }}</h3>
                                <p>{{ listen.track.artists[0].name }} - {{ listen.track.album.name }}</p>
                            </v-sheet>
                        </v-card>
                    </v-container>
                </v-container>
            </v-container>
        </v-main>
    </v-app>
</template>
