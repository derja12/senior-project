<script lang="ts">
const ROOT_URL = 'http://localhost:5173';
// const ROOT_URL = 'https://cer8phtgvw.us-east-2.awsapprunner.com';

export default {
    data(){
        return {
            firstName: '',
            lastName: '',
            email: "",
            confirm_email: "",
            password: "",
            confirm_password: "",
            showLogin: false,
        }
    },
    methods: {
        async signupDaF() {
            // validate register form
            let error_message = validateEmail(this.email, this.confirm_email);
            if (error_message) {
                console.error(error_message);
                return;
            }
            error_message = validatePassword(this.password, this.confirm_password);
            if (error_message) {
                console.error(error_message);
                return;
            }

            try {
                let response = await fetch(ROOT_URL + '/users', {
                    method: "Post",
                    body: 'firstName=' + encodeURIComponent(this.firstName)
                        + "&lastName=" + encodeURIComponent(this.lastName)
                        + "&passwordText=" + encodeURIComponent(this.password) 
                        + "&email=" + encodeURIComponent(this.email),
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                });
                if (response.status == 201) {
                    this.$router.push('/login');
                } else {
                    console.error("failed to register:", response.statusText);
                }
            } catch (error) {
                console.error("failed to register:", error);
            }
        },
        async sendToLogin() {
            this.$router.push('/login');
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

// validateEmail validates the two email fields provided and returns
// a string representing the error message (empty if no error)
function validateEmail(email: String, confirm_email: String): String {
    if (email == "") {
        return "Must provide an email";
    } else if (email != confirm_email) {
        return "Provided emails must match";
    }
    return "";
}

// validatePassword validates the two password fields provided and returns
// a string representing the error message (empty if no error)
function validatePassword(password: String, confirm_password: String): String {
    if (password == "") {
        return "Must provide an password";
    } else if (password.length < 8) {
        return "Password must be at least 8 characters long";
    } else if (password != confirm_password) {
        return "Provided passwords must match";
    }
    return "";
}
</script>

<template>
    <v-app v-show="showLogin">
        <v-main>
            <v-container class="h-100 d-flex justify-center align-center">
                <v-card class="px-16 pt-4">
                    <!-- title -->
                    <v-card-title class="text-h5">Create new DaF account</v-card-title>

                    <!-- text fields -->
                    <v-text-field 
                        v-model="firstName" @keydown.enter="signupDaF" 
                        label="First Name" type="email" class="mt-10">
                    </v-text-field>
                    <v-text-field 
                        v-model="lastName" @keydown.enter="signupDaF" 
                        label="Last Name" type="email" class="">
                    </v-text-field>
                    <v-text-field 
                        v-model="email" @keydown.enter="signupDaF" 
                        label="email" type="email" class="">
                    </v-text-field>
                    <v-text-field 
                        v-model="confirm_email" @keydown.enter="signupDaF" 
                        label="confirm email" type="email" class="">
                    </v-text-field>
                    <v-text-field 
                        v-model="password" @keydown.enter="signupDaF" 
                        label="password" type="password" class="">
                    </v-text-field>
                    <v-text-field 
                        v-model="confirm_password" @keydown.enter="signupDaF" 
                        label="confirm_password" type="password" class="">
                    </v-text-field>

                    <!-- login buttons -->
                    <v-card-actions>    
                        <v-btn size="large" class="w-100 bg-grey-darken-4 text-teal-lighten-2" @click="signupDaF">
                            Register
                        </v-btn>
                    </v-card-actions>

                    <!-- sign up buttons -->
                    <v-container class="d-flex justify-center"> 
                        <v-btn variant="plain" class="mx-n2 text-teal-lighten-2" @click="sendToLogin">
                            Back to login
                        </v-btn>
                    </v-container>
                </v-card>
            </v-container>
        </v-main>
    </v-app>
</template>
