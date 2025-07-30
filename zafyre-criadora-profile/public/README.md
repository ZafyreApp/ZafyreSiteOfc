# Zafyre Criadora Profile

Este projeto é uma plataforma dedicada a criadoras de conteúdo, permitindo que elas gerenciem seus perfis, interajam com seus seguidores e monetizem seu trabalho. Abaixo estão as instruções para instalação e uso do projeto.

## Estrutura do Projeto

O projeto contém os seguintes arquivos e diretórios:

- **public/**
  - **criadora.html**: Página de perfil da criadora, exibindo informações do perfil, postagens e opções de interação.
  - **css/**
    - **style.css**: Estilos gerais para o site.
    - **criadora-profile.css**: Estilos específicos para a página de perfil da criadora.
  - **js/**
    - **firebase-config.js**: Configuração do Firebase para autenticação e banco de dados.
    - **firebase-auth.js**: Gerenciamento da autenticação de usuários.
    - **common.js**: Funções comuns utilizadas em várias partes do site.
    - **criadora-profile.js**: Lógica específica para a página de perfil da criadora.
  - **assets/**
    - **default-avatar.png**: Imagem padrão para criadoras sem avatar personalizado.
  - **README.md**: Documentação do projeto.

## Funcionalidades

1. **Informações do Perfil**:
   - Exibição do avatar, nome, biografia e selo de "Premium".
   - Contagem de seguidores e curtidas.
   - Botões para editar o perfil e iniciar um chat privado.

2. **Caixa de Postagens**:
   - Área para criar novas postagens e carregar fotos.
   - Atualização automática das postagens no perfil e no feed.

3. **Grade de Postagens**:
   - Exibição das postagens da criadora em um layout semelhante ao Instagram.
   - Postagens PPV exibidas desfocadas para não assinantes.

4. **Funcionalidades de Monetização**:
   - Opções de assinatura e precificação de PPV.
   - Programa de indicação com código único.

5. **Ranking Semanal de Criadoras**:
   - Exibição das "Criadoras Estrelas da Semana".

6. **Carteira Zafyre**:
   - Exibição de saldo em ZafyreCoins e opções de saque.

7. **Zafyre Shop**:
   - Opção de assinar o plano Premium e visualizar status atual do plano.

8. **Layout Responsivo**:
   - Cabeçalho fixo e ícones fixos que se transformam em uma barra superior em telas menores.

9. **Interação e Gamificação**:
   - Histórico de chats, ranking de usuários e opções de interação no feed.

## Instalação

1. Clone o repositório:
   ```
   git clone <URL_DO_REPOSITORIO>
   ```

2. Navegue até o diretório do projeto:
   ```
   cd zafyre-criadora-profile
   ```

3. Abra o arquivo `public/criadora.html` em um navegador para visualizar a página de perfil da criadora.

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## Licença

Este projeto está licenciado sob a MIT License. Veja o arquivo LICENSE para mais detalhes.