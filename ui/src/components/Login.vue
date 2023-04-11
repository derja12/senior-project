<script lang="ts">
// const ROOT_URL = 'http://localhost:5173';
const ROOT_URL = 'https://cer8phtgvw.us-east-2.awsapprunner.com';

export default {
    data(){
        return {
            email: "",
            password: "",
            showLogin: false,
            errorText: "",
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
                } else if (response.status == 401) {
                    this.errorText = "Email and/or password not recognized. Please try again"
                } else {
                    this.errorText = "An unknown error occured while attempting to login"
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
                <v-card class="w-50 px-16 pt-4">
                    <!-- title -->
                    <v-card-title class="text-h5" style="text-align: center;">Log in to your DaF account</v-card-title>

                    <p v-if="errorText" style="text-align: center;" class="pa-2 text-red-lighten-1 bg-red-lighten-5 mt-4">{{ errorText }}</p>

                    <!-- text fields -->
                    <v-text-field 
                        v-model="email" @keydown.enter="loginDaF" 
                        label="email" type="email" class="mt-4 mx-8">
                    </v-text-field>
                    <v-text-field 
                        v-model="password" @keydown.enter="loginDaF" 
                        label="password" type="password" class="mx-8">
                    </v-text-field>

                    <!-- login buttons -->
                    <v-card-actions>    
                        <v-btn size="large" width="88%" class="rounded-0 mx-auto bg-grey-darken-4 text-teal-lighten-2" @click="loginDaF">
                            Login
                        </v-btn>
                    </v-card-actions>

                    <!-- sign up buttons -->
                    <v-container style="text-align: center;">
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
