const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');

registerBtn.addEventListener('click', () => {
    container.classList.add("active");
});

loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
});

VK.init({
    apiId: YOUR_VK_APP_ID
});

// Обработчик для входа через VK
document.getElementById('vk-login').addEventListener('click', function(e) {
    e.preventDefault();
    VK.Auth.login(function(response) {
        if (response.session) {
            // Получаем данные пользователя
            VK.Api.call('users.get', {fields: 'photo_100,email'}, function(data) {
                const user = data.response[0];
                console.log('VK User:', user);
                // Отправляем данные на сервер
                authWithSocial({
                    provider: 'vk',
                    id: user.id,
                    name: `${user.first_name} ${user.last_name}`,
                    email: user.email || '',
                    avatar: user.photo_100
                });
            });
        }
    }, VK.access.FRIENDS + VK.access.EMAIL);
});

// Обработчик для входа через Google
document.getElementById('google-login').addEventListener('click', function(e) {
    e.preventDefault();
    google.accounts.id.initialize({
        client_id: 'YOUR_GOOGLE_CLIENT_ID',
        callback: handleGoogleResponse
    });
    google.accounts.id.prompt();
});

function handleGoogleResponse(response) {
    const user = JSON.parse(atob(response.credential.split('.')[1]));
    console.log('Google User:', user);
    authWithSocial({
        provider: 'google',
        id: user.sub,
        name: user.name,
        email: user.email,
        avatar: user.picture
    });
}

// Отправка данных на сервер
function authWithSocial(data) {
    fetch('/api/auth/social', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.href = '/profile';
        } else {
            alert('Ошибка авторизации: ' + data.message);
        }
    });
}