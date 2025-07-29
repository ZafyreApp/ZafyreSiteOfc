
// public/js/zafyre-shop.js

import { 
    getFirestore, 
    doc, 
    getDoc, 
    query, 
    collection, 
    where, 
    orderBy, 
    getDocs 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { app } from './firebase-init.js';

const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;
let userGender = null;

// Elementos da UI
const currentPlanStatus = document.getElementById('current-plan-status');
const planBadge = document.getElementById('plan-badge');
const planDescription = document.getElementById('plan-description');
const premiumPlans = document.getElementById('premium-plans');
const zafyreCoinsSection = document.getElementById('zafyre-coins-section');
const purchaseHistory = document.getElementById('purchase-history');

// Planos Premium para diferentes gêneros
const premiumPlansData = {
    male: [
        {
            duration: 'Mensal',
            price: 24.99,
            monthlyPrice: 24.99,
            benefits: ['Chat Ilimitado', 'Prioridade no Suporte', 'Emblemas Especiais', 'Sem Limite de Mensagens']
        },
        {
            duration: 'Trimestral',
            price: 59.99,
            monthlyPrice: 19.99,
            benefits: ['Chat Ilimitado', 'Prioridade no Suporte', 'Emblemas Especiais', 'Sem Limite de Mensagens', 'Desconto de 20%'],
            recommended: true
        },
        {
            duration: 'Semestral',
            price: 99.99,
            monthlyPrice: 16.67,
            benefits: ['Chat Ilimitado', 'Prioridade no Suporte', 'Emblemas Especiais', 'Sem Limite de Mensagens', 'Desconto de 33%']
        },
        {
            duration: 'Anual',
            price: 179.99,
            monthlyPrice: 14.99,
            benefits: ['Chat Ilimitado', 'Prioridade no Suporte', 'Emblemas Especiais', 'Sem Limite de Mensagens', 'Desconto de 40%']
        }
    ],
    female: [
        {
            duration: 'Mensal',
            price: 9.99,
            monthlyPrice: 9.99,
            benefits: ['Taxa de Saque Reduzida (5%)', 'Prioridade no Suporte', 'Emblema Criadora Premium']
        },
        {
            duration: 'Trimestral',
            price: 24.99,
            monthlyPrice: 8.33,
            benefits: ['Taxa de Saque Reduzida (5%)', 'Prioridade no Suporte', 'Emblema Criadora Premium', 'Desconto de 17%'],
            recommended: true
        },
        {
            duration: 'Semestral',
            price: 44.99,
            monthlyPrice: 7.50,
            benefits: ['Taxa de Saque Reduzida (5%)', 'Prioridade no Suporte', 'Emblema Criadora Premium', 'Desconto de 25%']
        },
        {
            duration: 'Anual',
            price: 79.99,
            monthlyPrice: 6.67,
            benefits: ['Taxa de Saque Reduzida (5%)', 'Prioridade no Suporte', 'Emblema Criadora Premium', 'Desconto de 33%']
        }
    ]
};

// Autenticação
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        await loadUserData();
        await loadPremiumPlans();
        await loadPurchaseHistory();
    } else {
        window.location.href = '/';
    }
});

// Carregar dados do usuário
async function loadUserData() {
    try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            userGender = userData.gender || 'male'; // Default para male se não especificado
            
            // Atualizar status do plano
            const isPremium = userData.isPremium || false;
            const premiumExpiresAt = userData.premiumExpiresAt;
            
            if (isPremium && premiumExpiresAt && premiumExpiresAt.toDate() > new Date()) {
                planBadge.textContent = 'Premium Ativo';
                planBadge.className = 'status-badge premium';
                planDescription.textContent = `Seu plano Premium expira em ${premiumExpiresAt.toDate().toLocaleDateString('pt-BR')}`;
            } else {
                planBadge.textContent = 'Plano Gratuito';
                planBadge.className = 'status-badge free';
                planDescription.textContent = 'Faça upgrade para Premium e desbloqueie recursos exclusivos!';
            }
            
            // Mostrar seção de ZafyreCoins apenas para homens
            if (userGender === 'male') {
                zafyreCoinsSection.classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
    }
}

// Carregar planos Premium baseado no gênero
function loadPremiumPlans() {
    const plans = premiumPlansData[userGender] || premiumPlansData.male;
    
    premiumPlans.innerHTML = '';
    
    plans.forEach(plan => {
        const planElement = createPremiumPlanElement(plan);
        premiumPlans.appendChild(planElement);
    });
}

// Criar elemento de plano Premium
function createPremiumPlanElement(plan) {
    const planDiv = document.createElement('div');
    planDiv.className = `premium-plan ${plan.recommended ? 'recommended' : ''}`;
    
    const recommendedBadge = plan.recommended ? '<div class="recommended-badge">Recomendado</div>' : '';
    
    const benefitsList = plan.benefits.map(benefit => `<li>${benefit}</li>`).join('');
    
    planDiv.innerHTML = `
        ${recommendedBadge}
        <div class="plan-duration">${plan.duration}</div>
        <div class="plan-price">R$ ${plan.price.toFixed(2)}</div>
        ${plan.monthlyPrice !== plan.price ? `<div class="plan-price-monthly">R$ ${plan.monthlyPrice.toFixed(2)}/mês</div>` : ''}
        <ul class="plan-benefits">
            ${benefitsList}
        </ul>
        <button class="buy-premium-btn" onclick="buyPremium('${plan.duration}', ${plan.price})">
            Assinar ${plan.duration}
        </button>
    `;
    
    return planDiv;
}

// Função para comprar Premium
window.buyPremium = async function(duration, price) {
    try {
        // Criar preferência de pagamento via Mercado Pago
        const response = await fetch('/criar-preferencia-pagamento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                itemId: `premium_${duration.toLowerCase()}`,
                itemTitle: `Zafyre Premium - ${duration}`,
                itemQuantity: 1,
                itemUnitPrice: price,
                userId: currentUser.uid
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            // Redirecionar para o Mercado Pago
            window.open(data.init_point, '_blank');
        } else {
            throw new Error('Erro ao criar preferência de pagamento');
        }
    } catch (error) {
        console.error('Erro ao comprar Premium:', error);
        alert('Erro ao processar pagamento. Tente novamente.');
    }
};

// Função para comprar ZafyreCoins
window.buyCoins = async function(packageAmount, price) {
    try {
        const response = await fetch('/criar-preferencia-pagamento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                itemId: `zafyrecoins_${packageAmount}`,
                itemTitle: `${packageAmount} ZafyreCoins`,
                itemQuantity: 1,
                itemUnitPrice: price,
                userId: currentUser.uid
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            window.open(data.init_point, '_blank');
        } else {
            throw new Error('Erro ao criar preferência de pagamento');
        }
    } catch (error) {
        console.error('Erro ao comprar ZafyreCoins:', error);
        alert('Erro ao processar pagamento. Tente novamente.');
    }
};

// Carregar histórico de compras
async function loadPurchaseHistory() {
    try {
        const purchasesQuery = query(
            collection(db, "transactions"),
            where("userId", "==", currentUser.uid),
            orderBy("timestamp", "desc")
        );
        
        const querySnapshot = await getDocs(purchasesQuery);
        
        if (querySnapshot.empty) {
            purchaseHistory.innerHTML = '<p class="info-message">Nenhuma compra realizada ainda.</p>';
            return;
        }
        
        purchaseHistory.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const purchase = doc.data();
            const purchaseElement = createPurchaseElement(purchase);
            purchaseHistory.appendChild(purchaseElement);
        });
        
    } catch (error) {
        console.error('Erro ao carregar histórico de compras:', error);
        purchaseHistory.innerHTML = '<p class="error-message">Erro ao carregar histórico de compras.</p>';
    }
}

// Criar elemento de compra
function createPurchaseElement(purchase) {
    const purchaseDiv = document.createElement('div');
    purchaseDiv.className = 'purchase-item';
    
    const date = purchase.timestamp ? purchase.timestamp.toDate().toLocaleDateString('pt-BR') : 'Data não disponível';
    const status = purchase.status === 'approved' ? 'Aprovado' : 
                   purchase.status === 'pending' ? 'Pendente' : 'Rejeitado';
    
    purchaseDiv.innerHTML = `
        <div class="purchase-details">
            <h4>${purchase.title || 'Compra Zafyre'}</h4>
            <p>${date} - Status: ${status}</p>
        </div>
        <div class="purchase-amount">R$ ${(purchase.amount || 0).toFixed(2)}</div>
    `;
    
    return purchaseDiv;
}

// Adicionar event listeners para botões de compra de coins
document.addEventListener('DOMContentLoaded', () => {
    const buyCoinsButtons = document.querySelectorAll('.buy-coins-btn');
    buyCoinsButtons.forEach(button => {
        button.addEventListener('click', () => {
            const packageAmount = button.getAttribute('data-package');
            const price = parseFloat(button.getAttribute('data-price'));
            window.buyCoins(packageAmount, price);
        });
    });
});
