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
