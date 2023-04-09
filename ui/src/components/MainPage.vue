<script lang='ts'>
const ROOT_URL = 'http://localhost:5173';
// const ROOT_URL = 'https://cer8phtgvw.us-east-2.awsapprunner.com';

enum list_option {
    TRACK_COUNT = 1,
    TRACK_TIME,
    TRACK_NAME,
    ARTIST_NAME,
    ALBUM_NAME,
};

interface strToEnumType {
    "Track count": boolean;
    "Track time": boolean;
    "Track name": boolean;
    "Artist name": boolean;
    "Album name": boolean;
}

const strToEnum = {
    "Track count": list_option.TRACK_COUNT,
    "Track time": list_option.TRACK_TIME,
    "Track name": list_option.TRACK_NAME,
    "Artist name": list_option.ARTIST_NAME,
    "Album name": list_option.ALBUM_NAME,
}

interface TimeFilter {
    start_time: number;
    end_time: number;
};

interface user {
    email: string;
    firstName: string;
    spotifyConnected: boolean;
};

const contextTooltip = {
    "Playlist": "played from a playlist",
    "Album": "played from an album",
    "No context": "played without context (ie. auto-play)",
}

interface ctxToValType {
    "Playlist": string;
    "Album": string;
    "No context": string;
}

const contextFilterToValue:ctxToValType = {
    "Playlist": "playlist",
    "Album": "album",
    "No context": "context_free",
}

interface dataRet {
    isLoggedIn: boolean;
    user: user;
    nav: string;

    history: listen[];
    history_loading: boolean;
    
    sort: string;
    contextFilters: any;
    contextTooltip: any;

    tracks: listen[];
    tracks_cur_page: number;
    tracks_loading: boolean;
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
};

interface listen {
    track: track;
    played_at: number;
    context_uri: string;
    count: number;
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
            history_loading: false,
            tracks: [],
            nav: "tracks",
            contextFilters: {
                "Album": true,
                "Playlist": true,
                "No context": true,
            },
            sort: "Track count",
            contextTooltip: contextTooltip,
            tracks_cur_page: 1,
            tracks_loading: false,
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
                this.history_loading = true;
                let response = await fetch(ROOT_URL + '/history');
                let data = await response.json();

                this.history = data;
            } catch (error) {
                console.log('unable to get history:', error);
            }
            this.history_loading = false;
        },
        async getTracks() {
            let params:string = "";
            
            params += "?list_by=" + encodeURIComponent(strToEnum[this.sort as keyof strToEnumType]);
            
            let contexts:string = "";
            for (let filter in this.contextFilters) {
                if (this.contextFilters[filter]) {
                    contexts += "," + contextFilterToValue[filter as keyof ctxToValType]
                }
            }
            params += "&contexts=" + encodeURIComponent(contexts.slice(1));

            try {
                this.tracks_loading = true;
                let response = await fetch(ROOT_URL + '/tracks' + params);
                if (response.ok) {
                    this.tracks = await response.json()
                }
            } catch (error) {
                console.log('unable to get tracks:', error);
            }
            this.tracks_loading = false;
        },
        clearFilter() {
            this.contextFilters = {
                "Album": true,
                "Playlist": true,
                "No context": true,
            };
            this.sort = "Track count";
        },
        msToString(millis:number):string {
            // ms -> 12m:46s
            let totalSeconds = (millis - (millis % 1000)) / 1000;
            if (totalSeconds < 60) {
                return sTwoDigit(totalSeconds) + "s";
            }
            let seconds = totalSeconds % 60;
            let totalMinutes = (totalSeconds - seconds) / 60;
            if (totalMinutes < 60) {
                return sTwoDigit(totalMinutes) + ":" + sTwoDigit(seconds) + "s";
            }
            let minutes = totalMinutes % 60;
            let totalHours = (totalMinutes - minutes) / 60;
            if (totalHours < 24) {
                return String(totalHours) + ":" + sTwoDigit(minutes) + ":" + sTwoDigit(seconds) + "s";
            }
            let hours = totalHours % 24;
            let days = (totalHours - hours) / 24;
            return String(days) + ":" + sTwoDigit(hours) + ":" + sTwoDigit(minutes) + ":" + sTwoDigit(seconds) + "s";
        },
        pages(total:number, page_size:number) {
            let remainder = total % page_size
            if (remainder == 0) {
                return total / page_size;
            } else {
                return ((total - remainder) / page_size) + 1;
            }
        }
    },
    computed: {
        sortEnums() {
            return Object.keys(strToEnum);
        }
    },
    mounted() {
        this.login();
    }
}

const sTwoDigit = (mins:number):string => {
    return ("0" + String(mins)).slice(-2);
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

                <v-list-item title="Recent History" value="settings" prepend-icon="mdi-folder-music" @click="nav = 'history'"></v-list-item>
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
                    <v-card :border="true" :loading="tracks_loading" variant="flat" elevation="1" class="rounded-b w-75 pa-4 d-flex justify-center">
                        <v-btn 
                            class="mr-2" 
                            icon="mdi-filter-remove" 
                            variant="flat" 
                            :disabled="tracks_loading"
                            @click="clearFilter">
                        </v-btn>
                        <v-spacer/>
                        <div class="d-flex align-start w-100">
                            <v-autocomplete
                                label="sort"
                                v-model="sort"
                                :items="sortEnums"
                                class="d-inline-block w-50"
                                :disabled="tracks_loading"
                            ></v-autocomplete>
                            <div class="d-inline-block w-50 pa-2 pt-0">
                                <div class="text-caption mb-2">Contexts to include:</div>
                                <v-item-group multiple selected-class="bg-grey-darken-1" class="d-flex justify-space-between">
                                    <v-item
                                        v-for="filter in Object.keys(contextFilters)"
                                        v-slot="{ selectedClass }"
                                        :key="filter"
                                        >
                                        <v-tooltip :text="contextTooltip[filter]" location="bottom">
                                            <template v-slot:activator="{ props }">
                                                <v-btn
                                                    variant="tonal"
                                                    @click="contextFilters[filter] = !contextFilters[filter]"
                                                    v-bind="props"
                                                    :class="contextFilters[filter]? ['bg-grey-darken-1'] : []"
                                                    size="small"
                                                    :disabled="tracks_loading"
                                                    >
                                                    {{ filter }}
                                                </v-btn>
                                            </template>
                                        </v-tooltip>
                                        
                                    </v-item>
                                </v-item-group>
                            </div>
                        </div>
                        <v-spacer/>
                        <v-btn
                            class="ml-2"
                            icon="mdi-magnify" 
                            variant="flat"
                            :disabled="tracks_loading"
                            @click='getTracks'>
                        </v-btn>
                    </v-card>
                    <v-container class="">
                        <v-pagination 
                            v-model="tracks_cur_page" 
                            v-if="pages(tracks.length, 25) > 1" 
                            :length="pages(tracks.length, 25)"
                            :disabled="tracks_loading"
                            class="w-50 mx-auto"/>
                        <v-card
                            v-for="listen in tracks.slice((tracks_cur_page-1)*25, tracks_cur_page*25)" 
                            variant="plain"
                            class="mx-auto my-1 d-flex align-start"
                            width="60%"
                            :border="true"
                            elevation="1"
                            :disabled="tracks_loading"
                            >
                            <div class="ma-0 pa-0">
                                <img
                                    :src="listen.track.album.images[0].url"
                                    width="75"
                                    height="75"
                                    class="ma-0 pa-0 d-block"
                                >
                            </div>
                            <v-sheet style="white-space: nowrap; overflow-x: hidden; text-overflow: ellipsis;" class="d-inline-flex flex-column ma-1 my-auto">
                                <h3>{{ listen.track.name }}</h3>
                                <p>{{ listen.track.artists[0].name }} - {{ listen.track.album.name }}</p>
                                <p>
                                    {{ listen.count }} listens 
                                    &#x2022; {{ msToString(listen.track.duration_ms * listen.count) }}
                                </p>
                            </v-sheet>
                        </v-card>
                        <v-pagination 
                            v-model="tracks_cur_page" 
                            v-if="pages(tracks.length, 25) > 1"
                            :length="pages(tracks.length, 25)"
                            :disabled="tracks_loading"
                            class="w-50 mx-auto"/>
                    </v-container>
                </v-container>
                
                
                <v-container v-else-if="nav == 'history'" class="d-flex my-0 py-0 flex-column align-center">
                    <v-sheet :border="true" class="rounded-b w-50 pa-4 d-flex justify-center">
                        <v-btn 
                            variant='outlined'
                            :loading="history_loading"
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
                            :disabled="history_loading"
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
                                <p style="flex-wrap: nowrap; text-overflow: ellipsis;">{{ listen.track.artists[0].name }} - {{ listen.track.album.name }}</p>
                            </v-sheet>
                        </v-card>
                    </v-container>
                </v-container>
                <v-container v-else class="d-flex justify-center"><p class="text-h4 mt-15 text-grey-lighten-1">Coming soon!</p></v-container>
            </v-container>
        </v-main>
    </v-app>
</template>
