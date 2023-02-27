<script lang='ts'>
const ROOT_URL = 'http://localhost:5173';
export default {
    data() {
        return {
            isLoggedIn: false,
            isAuthorized: false,
            user: {
                email: '',
                firstname: '',
            },
        }
    },
    methods: {
        async login() {
            try {
                let getSessionRes = await fetch(ROOT_URL + '/session', {credentials: 'include'})
                if (getSessionRes.status == 200) {
                    this.isLoggedIn = true
                    this.user = await getSessionRes.json()
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
                let data = await response.json();
                window.location.href = data.url;
            } catch (error) {
                console.log('unable to authorize spotify:', error)
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
            
            <v-spacer></v-spacer>
            
            <div v-show='isLoggedIn' class='mx-4'>
                Logged in as {{ user.email }}
                
                <div @click='logout'>Logout</div>
            </div>
        </v-app-bar>

        <v-main>
            <v-container class='elevation-2 h-100 d-flex justify-center'>
                <v-btn v-if='!isAuthorized' variant='outlined' @click='authorizeSpotify'>
                    Connect Spotify
                </v-btn>

                <div v-else>
                    <v-btn variant='outlined' @click='getHistory'>
                        Get History
                    </v-btn>
                </div>
            </v-container>
        </v-main>
    </v-app>
</template>
