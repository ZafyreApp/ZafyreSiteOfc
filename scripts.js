// scripts.js
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Evita o envio do formulário

    const email = event.target[0].value;
    const password = event.target[1].value;

    // Aqui você pode adicionar a lógica de autenticação, como API ou validação
    console.log(`Email: ${email}, Senha: ${password}`);

    // Simulação de login bem-sucedido
    alert('Login realizado com sucesso!');
    // Redirecionar para a página principal ou perfil
    window.location.href = 'index.html'; // Altere para a página desejada
});
// scripts.js
document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Evita o envio do formulário

    const name = event.target[0].value;
    const email = event.target[1].value;
    const password = event.target[2].value;

    // Aqui você pode adicionar a lógica de registro, como API ou validação
    console.log(`Nome: ${name}, Email: ${email}, Senha: ${password}`);

    // Simulação de registro bem-sucedido
    alert('Conta criada com sucesso!');
    // Redirecionar para a página de login ou perfil
    window.location.href = 'login.html'; // Altere para a página desejada
});
// scripts.js
document.getElementById('registerForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Evita o envio do formulário

    const name = event.target[0].value;
    const email = event.target[1].value;
    const password = event.target[2].value;

    // Simulação de chamada à API para registrar o usuário
    try {
        const response = await fetch('https://api.exemplo.com/register', { // Substitua pela URL real
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password }),
        });

        if (!response.ok) {
            throw new Error('Erro ao registrar. Tente novamente.');
        }

        const data = await response.json();
        alert('Conta criada com sucesso!');

        // Redirecionar para a página de login ou perfil
        window.location.href = 'login.html'; // Altere para a página desejada
    } catch (error) {
        alert(error.message);
    }
});
