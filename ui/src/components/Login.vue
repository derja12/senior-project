<script lang="ts">
// const ROOT_URL = 'http://localhost:5173';
const ROOT_URL = 'https://cer8phtgvw.us-east-2.awsapprunner.com';

export default {
    data(){
        return {
            email: "",
            password: "",
            showLogin: false,
        }
    },
    methods: {
        async loginDaF() {
            try {
                let response = await fetch(ROOT_URL + '/session', {
                    method: "Post",
                    body: "passwordText=" + encodeURIComponent(this.password) + "&email=" + encodeURIComponent(this.email),
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                });
                if (response.status == 201) {
                    this.$router.push('/');
                } else {
                    console.error("failed to log in:", response.statusText);
                }
            } catch (error) {
                console.error("failed to log in:", error);
            }
        },
        async sendToRegister() {
            this.$router.push('/register');
        }
    },
    async mounted() {
        let getSessionRes = await fetch(ROOT_URL + '/session', {credentials: 'include'})
        if (getSessionRes.status == 200) {
            this.$router.push('/')
        } else {
            this.showLogin = true;
        }
    }
}
</script>

<template>
    <v-app v-show="showLogin">
        <v-main>
            <v-container class="h-100 d-flex justify-center align-center">
                <v-card class="px-16 pt-4">
                    <!-- title -->
                    <v-card-title class="text-h5">Log in to your DaF account</v-card-title>

                    <!-- text fields -->
                    <v-text-field 
                        v-model="email" @keydown.enter="loginDaF" 
                        label="email" type="email" class="mt-10">
                    </v-text-field>
                    <v-text-field 
                        v-model="password" @keydown.enter="loginDaF" 
                        label="password" type="password" class="">
                    </v-text-field>

                    <!-- login buttons -->
                    <v-card-actions>    
                        <v-btn size="large" class="w-100 bg-grey-darken-4 text-teal-lighten-2" @click="loginDaF">
                            Login
                        </v-btn>
                    </v-card-actions>

                    <!-- sign up buttons -->
                    <v-container>
                        Don't have an account? 
                        <v-btn variant="plain" class="mx-n2 text-teal-lighten-2" @click="sendToRegister">
                            Sign Up
                        </v-btn>
                    </v-container>
                </v-card>
            </v-container>
        </v-main>
    </v-app>
</template>
