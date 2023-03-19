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
                if (response.status == 200) {
                    let getSessionRes = await fetch(ROOT_URL + '/session', {credentials: 'include'})
                    if (getSessionRes.status == 200) {
                        this.user = await getSessionRes.json();
                    }
                } else {
                    console.error('unable to authorize spotify:', response.statusText)
                }
            } catch (error) {
                console.error('unable to authorize spotify:', error)
            }
        },
        async getHistory() {
            try {
                let response = await fetch(ROOT_URL + '/history');
                let data = await response.json();

                console.log('history:', data);
            } catch (error) {
                console.log('unable to get history:', error)
            }
        }
    },
    mounted() {
        this.login();
        const urlParams = new URLSearchParams(window.location.search);
        this.isAuthorized = urlParams.has('authorized');
        console.log('authorized', this.isAuthorized)
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
            <v-container class='elevation-2 h-100 d-flex flex-column'>
                <v-container v-if='!user.spotifyConnected' class="d-flex flex-column align-center">
                    <div class="mb-2">Connect Your Spotify Account to get started!</div>
                    <v-btn variant='outlined' @click='authorizeSpotify'>
                        Connect
                    </v-btn>
                </v-container>
                <v-container v-else class="d-flex flex-column align-center">
                    <v-btn variant='outlined' @click='getHistory'>
                        Get History
                    </v-btn>
                </v-container>
            </v-container>
        </v-main>
    </v-app>
</template>
