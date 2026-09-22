// =========================
// REGISTER
// =========================

const registerForm =
    document.getElementById("register-form");

const registerMessage =
    document.getElementById("register-message");


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const email =
                document.getElementById(
                    "register-email"
                ).value.trim();

            const password =
                document.getElementById(
                    "register-password"
                ).value;

            const confirmPassword =
                document.getElementById(
                    "confirm-password"
                ).value;


            // Cek password
            if (password !== confirmPassword) {

                registerMessage.textContent =
                    "Password tidak sama.";

                return;
            }


            registerMessage.textContent =
                "Membuat akun...";


            // Register ke Supabase
            const { data, error } =
                await db.auth.signUp({

                    email: email,

                    password: password

                });


            // Jika error
            if (error) {

                registerMessage.textContent =
                    error.message;

                console.error(error);

                return;
            }


            // Berhasil
            registerMessage.textContent =
                "Akun berhasil dibuat. Silakan login.";

            registerForm.reset();

        }
    );

}



// =========================
// LOGIN
// =========================

const loginForm =
    document.getElementById("login-form");

const loginMessage =
    document.getElementById("login-message");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const email =
                document.getElementById(
                    "email"
                ).value.trim();

            const password =
                document.getElementById(
                    "password"
                ).value;

            loginMessage.textContent =
                "Memeriksa akun...";

            const { data, error } =
                await db.auth.signInWithPassword({

                    email: email,
                    password: password

                });

            if (error) {

                loginMessage.textContent =
                    error.message;

                console.error(error);

                return;
            }

            loginMessage.textContent =
                "Login berhasil.";

            // Kembali ke Beranda
            window.location.href =
                "index.html";

        }
    );

}