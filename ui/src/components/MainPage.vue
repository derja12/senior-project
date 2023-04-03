<script lang='ts'>
// const ROOT_URL = 'http://localhost:5173';
const ROOT_URL = 'https://cer8phtgvw.us-east-2.awsapprunner.com';

enum list_option {
    TRACK_COUNT = 1,
    TRACK_TIME,
    TRACK_ALPHABETICAL,
    ARTIST_ALPHABETICAL,
    ALBUM_ALPHABETICAL,
};

interface ListTracksRequest {
    list_by: list_option;
    page_size: number;
    page_num: number;
    time_filter: TimeFilter;
};

interface TimeFilter {
    start_time: number;
    end_time: number;
};

interface user {
    email: string;
    firstName: string;
    spotifyConnected: boolean;
};

interface dataRet {
    isLoggedIn: boolean;
    user: user;
    history: listen[];
    tracks: track[];
    nav: string;
};

interface image {
    height: number;
    width: number;
    url: string;
};

interface album {
    uri: string;
    total_tracks: number;
    images: image[];
    name: string;
};

interface artist {
    uri: string;
    name: string;
}

interface track {
    album: album;
    artists: artist[];
    duration_ms: number;
    name: string;
    popularity: number;
    track_number: number;
    uri: string;
    listens?: number;
};

interface listen {
    track: track;
    played_at: number;
    context_uri: string;
};

export default {
    data() {
        let d:dataRet =  {
            isLoggedIn: false,
            user: {
                email: '',
                firstName: '',
                spotifyConnected: false,
            },
            history: [],
            tracks: [],
            nav: "tracks",
        }
        return d
    },
    methods: {
        test() {
            console.log(this.nav);
        },
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
                console.log('unable to get history:', error);
            }
        },
        async getTracks() {
            let params:string = "";
            params += "?list_by=" + encodeURIComponent(list_option.TRACK_COUNT);
            params += "&page_size=" + encodeURIComponent(10);
            try {
                let response = await fetch(ROOT_URL + '/tracks' + params);
                if (response.ok) {
                    this.tracks = await response.json()
                }
            } catch (error) {
                console.log('unable to get tracks:', error);
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
        <v-navigation-drawer v-if='user.spotifyConnected' @click.select="test" expand-on-hover rail>
            <v-list>
                <v-list-item title="Tracks" value="tracks" prepend-icon="mdi-music" @click="nav = 'tracks'"></v-list-item>

                <v-list-item title="Albums" value="albums" prepend-icon="mdi-album" @click="nav = 'albums'"></v-list-item>

                <v-list-item title="Artists" value="artists" prepend-icon="mdi-account" @click="nav = 'artists'"></v-list-item>

                <v-list-item title="History" value="settings" prepend-icon="mdi-folder-music" @click="nav = 'history'"></v-list-item>
            </v-list>
        </v-navigation-drawer>
        <v-main>
            <v-container class='elevation-2 my-0 py-0 h-100 d-flex flex-column'>
                <v-container v-if='!user.spotifyConnected' class="d-flex flex-column align-center">
                    <div class="mb-2">Connect Your Spotify Account to get started!</div>
                    <v-btn variant='outlined' @click='authorizeSpotify'>
                        Connect
                    </v-btn>
                </v-container>
                <v-container v-else-if="nav == 'tracks'" class="d-flex my-0 py-0 flex-column align-center">
                    <v-sheet :border="true" class="rounded-b w-50 pa-4 d-flex justify-center">
                        <v-btn 
                            variant='outlined'
                            @click='getTracks'>
                            Get Tracks
                        </v-btn>
                    </v-sheet>
                    <v-container class="">
                        <v-card
                            v-for="track in tracks" 
                            variant="plain"
                            class="w-50 mx-auto my-1 d-flex align-start"
                            :border="true"
                            elevation="1"
                            >
                            <div class="ma-0 pa-0">
                                <img
                                    :src="track.album.images[0].url"
                                    width="75"
                                    height="75"
                                    class="ma-0 pa-0 d-block"
                                >
                            </div>
                            <v-sheet class="d-inline-flex flex-column ma-1 my-auto">
                                <h3>{{ track.name }}</h3>
                                <p>{{ track.artists[0].name }} - {{ track.album.name }}</p>
                                <p>{{ track.listens }} listens</p>
                            </v-sheet>
                        </v-card>
                    </v-container>
                </v-container>
                <v-container v-else-if="nav == 'history'" class="d-flex my-0 py-0 flex-column align-center">
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
                <v-container v-else></v-container>
            </v-container>
        </v-main>
    </v-app>
</template>
