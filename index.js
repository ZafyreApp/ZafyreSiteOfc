// index.js

// Importa os módulos necessários
const express = require('express');
const path = require('path');
// Importações corretas para Firebase Admin SDK
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore'); // Adicionado FieldValue
// const { getAuth } = require('firebase-admin/auth'); // Você pode descomentar se precisar de Admin Auth

// --- Novas importações para Cloudinary e Multer ---
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const fs = require('fs'); // Módulo para manipulação de arquivos (para excluir temporários)

// --- Novas importações para Mercado Pago Webhook (Payment) ---
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago'); // Adicionado Payment

const app = express();
const port = process.env.PORT || 3000; // Usa a porta do ambiente Replit ou 3000 como fallback

// --- Configuração do Firebase Admin SDK ---
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

let serviceAccount;
try {
    serviceAccount = JSON.parse(serviceAccountString);
} catch (error) {
    console.error('ERRO: Falha ao fazer parse do FIREBASE_SERVICE_ACCOUNT_JSON. Verifique o formato do JSON no secret do Replit.', error);
    process.exit(1);
}

// Inicializa o Firebase Admin SDK
initializeApp({
    credential: cert(serviceAccount)
});

console.log('Firebase Admin SDK inicializado com sucesso.');

const db = getFirestore(); // Instância do Firestore
// const adminAuth = getAuth(); // Você pode inicializar se for usar Admin Auth

// --- CONFIGURAÇÃO DO MERCADO PAGO SDK ---
const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

if (!accessToken) {
    console.error('ERRO: MERCADO_PAGO_ACCESS_TOKEN não configurado nos secrets do Replit.');
    process.exit(1);
}

const client = new MercadoPagoConfig({ accessToken: accessToken });
const preferenceService = new Preference(client);
const paymentService = new Payment(client); // Instância do serviço Payment para webhooks

console.log('Mercado Pago SDK configurado com sucesso (usando API v2.x.x).');

// --- CONFIGURAÇÃO DO CLOUDINARY ---
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('ERRO: Credenciais do Cloudinary (CLOUD_NAME, API_KEY, API_SECRET) não configuradas nos secrets do Replit.');
    process.exit(1);
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
console.log('Cloudinary configurado com sucesso.');

// --- Configuração do Multer para upload de arquivos temporários ---
const upload = multer({ dest: 'uploads/' });

// --- MIDDLEWARES ---
app.use(express.json()); // Para parsing de JSON no corpo das requisições
app.use(express.urlencoded({ extended: true })); // Para parsing de form data
app.use(express.static(path.join(__dirname, 'public'))); // Serve arquivos estáticos da pasta public

// --- ROTAS DO SERVIDOR EXPRESS ---

// Rota principal (login.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Rota para o perfil
app.get('/my-profile.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'my-profile.html'));
});

// Rota para notificações
app.get('/notifications.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'notifications.html'));
});

// Rota para Zafyre Pay
app.get('/zafyre-pay.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'zafyre-pay.html'));
});

// Rota para Chat
app.get('/chat.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Rota para Feed
app.get('/feed.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'feed.html'));
});

// --- ROTA: Upload de mídia para o Cloudinary ---
app.post('/api/upload-media', upload.single('media'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'zafyre_posts',
            resource_type: 'auto'
        });

        fs.unlinkSync(req.file.path);

        res.status(200).json({ url: result.secure_url, type: result.resource_type });

    } catch (error) {
        console.error("Erro ao fazer upload para Cloudinary:", error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Erro no servidor ao fazer upload da mídia.', error: error.message });
    }
});

// Rota para salvar URL da imagem do Cloudinary no Firestore (Pode ser removida ou adaptada, pois o my-profile.html já salva na coleção 'posts')
// Mantida, mas observe o comentário sobre a coleção 'imagens'
app.post('/salvar-url-imagem-no-firestore', async (req, res) => {
    const { imageUrl, publicId } = req.body;
    if (!imageUrl || !publicId) {
        return res.status(400).json({ message: 'URL da imagem ou Public ID ausentes.' });
    }
    try {
        // Cuidado: esta coleção 'imagens' é diferente de 'posts'
        const docRef = await db.collection('imagens').add({
            url: imageUrl,
            public_id: publicId,
            timestamp: FieldValue.serverTimestamp() // Usando FieldValue
        });
        console.log('URL da imagem salva no Firestore com ID:', docRef.id);
        res.status(200).json({ message: 'URL da imagem salva com sucesso no Firestore!', id: docRef.id });
    } catch (error) {
        console.error('Erro ao salvar URL da imagem no Firestore:', error);
        res.status(500).json({ message: 'Erro ao salvar URL da imagem no Firestore.' });
    }
});

// Rota para criar preferência de pagamento do Mercado Pago
app.post('/criar-preferencia-pagamento', async (req, res) => {
    // Agora os dados do item e userId vêm do frontend
    const itemId = req.body.itemId || 'DEFAULT_ITEM_ID'; // Defina um fallback ou valide melhor
    const itemTitle = req.body.itemTitle || 'Produto Zafyre Padrão';
    const itemQuantity = req.body.itemQuantity || 1;
    const itemUnitPrice = req.body.itemUnitPrice || 1.00; // Use um valor padrão seguro
    const userId = req.body.userId; // ID do usuário do Zafyre Pay

    if (!userId) {
        console.error('Erro: userId não fornecido para criar preferência de pagamento.');
        return res.status(400).json({ message: 'ID do usuário é necessário para criar a preferência de pagamento.' });
    }

    const REPLIT_PUBLIC_URL = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;

    let body = {
        items: [
            {
                id: itemId,
                title: itemTitle,
                quantity: itemQuantity,
                unit_price: itemUnitPrice
            }
        ],
        back_urls: {
            success: `${REPLIT_PUBLIC_URL}/pagamento-sucesso`,
            failure: `${REPLIT_PUBLIC_URL}/pagamento-falha`,
            pending: `${REPLIT_PUBLIC_URL}/pagamento-pendente`
        },
        auto_return: 'approved',
        notification_url: `${REPLIT_PUBLIC_URL}/webhook-mercado-pago`, // URL para onde o MP enviará as notificações
        external_reference: userId // Vincula o pagamento ao userId para recuperar no webhook
    };

    try {
        const response = await preferenceService.create({ body });
        console.log('Preferência de pagamento criada:', response.init_point);
        res.status(200).json({ init_point: response.init_point });
    } catch (error) {
        console.error('Erro ao criar preferência de pagamento do Mercado Pago:', error);
        res.status(500).json({ message: 'Erro ao criar preferência de pagamento.', error: error.message });
    }
});


// --- NOVA ROTA: Webhook do Mercado Pago para receber notificações de pagamento ---
app.post('/webhook-mercado-pago', async (req, res) => {
    const { type, data } = req.body; // type pode ser 'payment', 'merchant_order', etc. data.id é o ID do recurso

    console.log('--- Webhook Mercado Pago Recebido ---');
    console.log('Tipo:', type);
    console.log('Dados:', JSON.stringify(data, null, 2)); // Use JSON.stringify para logar o objeto de forma legível

    // Verificamos se o tipo da notificação é 'payment' e se temos o ID do pagamento
    if (type === 'payment' && data && data.id) {
        const paymentId = data.id;
        console.log(`Recebido webhook para Payment ID: ${paymentId}`);

        try {
            // *** SEGURANÇA: Buscar os detalhes do pagamento diretamente da API do Mercado Pago ***
            // Isso garante que os dados são autênticos e não foram adulterados.
            const paymentInfo = await paymentService.get({ id: paymentId }); // Usando a nova instância paymentService

            console.log('Detalhes do pagamento obtidos via API do Mercado Pago:', JSON.stringify(paymentInfo, null, 2));

            // *** Extrair dados e registrar/atualizar Transação no Firestore ***
            const userId = paymentInfo.external_reference; // O ID do usuário que você enviou
            const paymentStatus = paymentInfo.status; // 'approved', 'pending', 'rejected', 'cancelled'
            const paymentTitle = paymentInfo.description || (paymentInfo.items && paymentInfo.items.length > 0 ? paymentInfo.items[0].title : 'Pagamento Zafyre');
            const paymentAmount = paymentInfo.transaction_amount;
            const paymentCurrency = paymentInfo.currency_id;
            const paymentMethod = paymentInfo.payment_method_id;

            if (!userId) {
                console.warn(`Webhook: external_reference (userId) não encontrado para Payment ID: ${paymentId}. Não será possível vincular a um usuário.`);
            }

            // Salvar no Firestore na coleção 'transactions'
            await db.collection('transactions').doc(paymentId).set({ // Usa o paymentId como ID do documento
                userId: userId || 'unknown', // Vincula a transação ao usuário, 'unknown' se não houver
                paymentId: paymentId,
                title: paymentTitle,
                amount: paymentAmount,
                currency: paymentCurrency,
                status: paymentStatus,
                timestamp: FieldValue.serverTimestamp(), // Usa FieldValue do firebase-admin/firestore
                paymentMethod: paymentMethod,
                // Você pode adicionar mais campos do `paymentInfo` aqui se precisar
            }, { merge: true }); // `merge: true` atualiza o documento se já existir, cria se não existir

            console.log(`Transação para Payment ID ${paymentId} (${paymentStatus}) registrada/atualizada no Firestore.`);

            // *** Lógica de Negócio Pós-Pagamento (Ex: Ativar Premium) ***
            if (paymentStatus === 'approved' && userId && userId !== 'unknown') {
                // Aqui você adicionaria a lógica para, por exemplo,
                // atualizar o perfil do usuário no Firestore para "premium"
                try {
                    await db.collection('users').doc(userId).update({
                        isPremium: true,
                        premiumActivatedAt: FieldValue.serverTimestamp()
                    });
                    console.log(`Usuário ${userId} atualizado para Premium.`);
                } catch (userUpdateError) {
                    console.error(`Erro ao atualizar status Premium para o usuário ${userId}:`, userUpdateError);
                }
            }
            // Você pode adicionar lógica para 'pending' ou 'rejected' também

        } catch (error) {
            console.error(`Erro ao processar webhook para Payment ID ${paymentId}:`, error);
            return res.status(500).send('Erro interno ao processar webhook');
        }
    } else {
        console.log('Webhook recebido, mas não é uma notificação de pagamento relevante ou está incompleta.');
    }

    // SEMPRE responda com 200 OK para o Mercado Pago
    res.status(200).send('Webhook recebido com sucesso');
});


// Exemplo de rota para adicionar dados ao Firestore (Mantida para referência)
app.get('/adicionar-dado', async (req, res) => {
    try {
        const docRef = await db.collection('testes').add({
            mensagem: 'Olá do Firebase Admin SDK no Replit!',
            timestamp: FieldValue.serverTimestamp() // Usando FieldValue
        });
        console.log('Documento adicionado com ID:', docRef.id);
        res.send(`Dado adicionado ao Firestore com sucesso! ID: ${docRef.id}`);
    } catch (error) {
        console.error('Erro ao adicionar dado ao Firestore:', error);
        res.status(500).send('Erro ao adicionar dado ao Firestore.');
    }
});

// Exemplo de rota para buscar dados do Firestore (Mantida para referência)
app.get('/buscar-dados', async (req, res) => {
    try {
        const snapshot = await db.collection('testes').get();
        const dados = [];
        snapshot.forEach(doc => {
            dados.push(doc.data());
        });
        console.log('Dados do Firestore:', dados);
        res.json(dados);
    } catch (error) {
        console.error('Erro ao buscar dados do Firestore:', error);
        res.status(500).send('Erro ao buscar dados do Firestore.');
    }
});

// Rotas de retorno do Mercado Pago (para redirecionamento do usuário)
app.get('/pagamento-sucesso', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pagamento-sucesso.html')); // Melhor redirecionar para uma página HTML
});

app.get('/pagamento-falha', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pagamento-falha.html')); // Melhor redirecionar para uma página HTML
});

app.get('/pagamento-pendente', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pagamento-pendente.html')); // Melhor redirecionar para uma página HTML
});


// Rota 404 - deve ser a última
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Inicia o servidor Express
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
    console.log(`Acesse seu app em: http://localhost:${port}`); // No Replit, use a URL pública
});
