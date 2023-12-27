$("#l").click(function () {
    var receivedCode = "received_code_from_redirect_uri";  // Bu kısmı kendi uygulamanızda elde edilen kodla değiştirmelisiniz
    var clientId = "your_client_id";  // 42 API uygulama bilgilerinizi buraya ekleyin
    var clientSecret = "your_client_secret";
    var redirectUri = "your_redirect_uri";

    $.ajax({
        url: "https://api.intra.42.fr/oauth/token",
        method: "POST",
        data: {
            grant_type: "authorization_code",
            client_id: clientId,
            client_secret: clientSecret,
            code: receivedCode,
            redirect_uri: redirectUri
        },
        success: function (tokenResponse) {
            var accessToken = tokenResponse.access_token;

            // Token alındıktan sonra kullanıcının bilgilerini çekmek için ayrı bir API çağrısı yap
            $.ajax({
                url: "https://api.intra.42.fr/v2/me",
                method: "GET",
                headers: {
                    Authorization: "Bearer " + accessToken
                },
                success: function (userInfo) {
                    console.log("Kullanıcı bilgileri:", userInfo);
                    // Burada kullanıcı bilgilerini işleyebilirsiniz
                },
                error: function (error) {
                    console.log("Hata:", error);
                }
            });
        },
        error: function (error) {
            console.log("Hata:", error);
        }
    });
});
