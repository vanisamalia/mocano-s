<!DOCTYPE html>
<html lang="id">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Login | Our Little Album</title>

    <link
        rel="stylesheet"
        href="style.css"
    >

</head>

<body class="auth-page">


    <div class="auth-container">

        <!-- KEMBALI KE HOME -->

        <a
            href="index.html"
            class="back-home"
        >
            ← Back to our album
        </a>


        <!-- LOGIN BOX -->

        <div class="auth-box">

            <p class="small-title">
                OUR LITTLE ALBUM
            </p>

            <h1>
                Welcome back.
            </h1>

            <p class="auth-description">
                Masuk untuk melanjutkan cerita
                dan menambahkan kenangan baru.
            </p>


            <form id="login-form">


                <!-- EMAIL -->

                <div class="form-group">

                    <label for="email">
                        Email
                    </label>

                    <input
                        type="email"
                        id="email"
                        placeholder="your@email.com"
                        required
                    >

                </div>


                <!-- PASSWORD -->

                <div class="form-group">

                    <label for="password">
                        Password
                    </label>

                    <input
                        type="password"
                        id="password"
                        placeholder="Masukkan password"
                        required
                    >

                </div>


                <!-- BUTTON -->

                <button
                    type="submit"
                    class="auth-button"
                >
                    Login
                </button>


            </form>


            <!-- MESSAGE -->

            <p
                id="login-message"
                class="auth-message"
            ></p>


            <!-- REGISTER -->

            <p class="auth-switch">

                Belum punya akun?

                <a href="register.html">
                    Create an account
                </a>

            </p>

        </div>

    </div>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="config.js"></script>
<script src="auth.js"></script>

</body>

</html>
