
// public/js/zafyre-creators.js

import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc,
    updateDoc,
    collection, 
    query, 
    where, 
    orderBy,
    getDocs, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { app } from './firebase-init.js';

const db = getFirestore(app);
const auth = getAuth(app);

// Elementos da UI
const inviteCode = document.getElementById('invite-code');
const inviteLink = document.getElementById('invite-link');
const copyCodeBtn = document.getElementById('copy-code-btn');
const copyLinkBtn = document.getElementById('copy-link-btn');
const totalReferrals = document.getElementById('total-referrals');
const activeReferrals = document.getElementById('active-referrals');
const totalCommission = document.getElementById('total-commission');
const monthCommission = document.getElementById('month-commission');
const referredCreatorsList = document.getElementById('referred-creators-list');

let currentUserId = null;
let currentUserData = null;

// Autenticação
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserId = user.uid;
        console.log("Usuário autenticado no Zafyre Creators:", currentUserId);
        
        // Verificar se é criadora
        await checkUserType(currentUserId);
        await loadCreatorData(currentUserId);
        await loadReferralStats(currentUserId);
        await loadReferredCreators(currentUserId);
        setupEventListeners();
    } else {
        console.log("Nenhum usuário autenticado. Redirecionando...");
        window.location.href = '/';
    }
});

// Verificar tipo de usuário
async function checkUserType(userId) {
    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.userType !== 'creator') {
                alert("Esta página é apenas para criadoras.");
                window.location.href = 'user-profile-male.html';
                return;
            }
        }
    } catch (error) {
        console.error("Erro ao verificar tipo de usuário:", error);
    }
}

// Carregar dados da criadora
async function loadCreatorData(userId) {
    try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            currentUserData = userDoc.data();
            
            // Gerar código de convite se não existir
            if (!currentUserData.inviteCode) {
                const inviteCodeValue = generateInviteCode();
                await updateDoc(doc(db, "users", userId), {
                    inviteCode: inviteCodeValue
                });
                currentUserData.inviteCode = inviteCodeValue;
            }

            // Atualizar UI
            inviteCode.textContent = currentUserData.inviteCode;
            const baseUrl = window.location.origin;
            const linkUrl = `${baseUrl}/register?ref=${currentUserData.inviteCode}`;
            inviteLink.value = linkUrl;
        }
    } catch (error) {
        console.error("Erro ao carregar dados da criadora:", error);
    }
}

// Gerar código de convite único
function generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'ZAF';
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Carregar estatísticas de indicações
async function loadReferralStats(userId) {
    try {
        // Buscar todas as indicações da criadora
        const referralsQuery = query(
            collection(db, "referrals"),
            where("referrerId", "==", userId)
        );
        const referralsSnapshot = await getDocs(referralsQuery);

        let totalReferralsCount = 0;
        let activeReferralsCount = 0;
        let totalCommissionAmount = 0;
        let monthCommissionAmount = 0;

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        referralsSnapshot.forEach((doc) => {
            const referral = doc.data();
            totalReferralsCount++;

            // Verificar se ainda está ativa (30 dias)
            const referralDate = referral.createdAt?.toDate();
            if (referralDate) {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                if (referralDate > thirtyDaysAgo) {
                    activeReferralsCount++;
                }
            }

            // Somar comissões
            totalCommissionAmount += referral.totalCommission || 0;

            // Comissões do mês atual
            if (referral.commissions) {
                referral.commissions.forEach(commission => {
                    const commissionDate = commission.date?.toDate();
                    if (commissionDate && commissionDate >= monthStart) {
                        monthCommissionAmount += commission.amount || 0;
                    }
                });
            }
        });

        // Atualizar UI
        totalReferrals.textContent = totalReferralsCount;
        activeReferrals.textContent = activeReferralsCount;
        totalCommission.textContent = `R$ ${totalCommissionAmount.toFixed(2)}`;
        monthCommission.textContent = `R$ ${monthCommissionAmount.toFixed(2)}`;

    } catch (error) {
        console.error("Erro ao carregar estatísticas de indicações:", error);
    }
}

// Carregar lista de criadoras indicadas
async function loadReferredCreators(userId) {
    try {
        const referralsQuery = query(
            collection(db, "referrals"),
            where("referrerId", "==", userId),
            orderBy("createdAt", "desc")
        );
        const referralsSnapshot = await getDocs(referralsQuery);

        referredCreatorsList.innerHTML = '';

        if (referralsSnapshot.empty) {
            referredCreatorsList.innerHTML = `
                <div class="empty-state">
                    <h4>Nenhuma indicação ainda</h4>
                    <p>Compartilhe seu código de convite para começar a ganhar comissões!</p>
                </div>
            `;
            return;
        }

        for (const doc of referralsSnapshot.docs) {
            const referral = doc.data();
            
            // Buscar dados da criadora indicada
            const referredUserDoc = await getDoc(doc(db, "users", referral.referredUserId));
            if (referredUserDoc.exists()) {
                const referredUser = referredUserDoc.data();
                const creatorItem = createReferredCreatorItem(referral, referredUser);
                referredCreatorsList.appendChild(creatorItem);
            }
        }

    } catch (error) {
        console.error("Erro ao carregar criadoras indicadas:", error);
        referredCreatorsList.innerHTML = `
            <div class="error-state">
                <p>Erro ao carregar indicações. Tente novamente.</p>
            </div>
        `;
    }
}

// Criar item da criadora indicada
function createReferredCreatorItem(referral, referredUser) {
    const item = document.createElement('div');
    item.classList.add('referred-creator-item');

    const referralDate = referral.createdAt?.toDate();
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const isActive = referralDate && referralDate > thirtyDaysAgo;
    const daysRemaining = isActive ? 
        Math.ceil((30 - (now - referralDate) / (1000 * 60 * 60 * 24))) : 0;

    item.classList.add(isActive ? 'active' : 'expired');

    item.innerHTML = `
        <div class="creator-avatar-container">
            <img src="${referredUser.photoURL || 'default-avatar.png.jpg'}" 
                 alt="${referredUser.displayName}" class="creator-avatar">
            <div class="status-indicator ${isActive ? 'active' : 'expired'}"></div>
        </div>
        <div class="creator-info">
            <h4>${referredUser.displayName || 'Criadora'}</h4>
            <p class="join-date">Entrou em ${referralDate?.toLocaleDateString('pt-BR') || 'Data desconhecida'}</p>
            <div class="commission-info">
                <span class="total-commission">R$ ${(referral.totalCommission || 0).toFixed(2)} em comissões</span>
                ${isActive ? 
                    `<span class="days-remaining">${daysRemaining} dias restantes</span>` :
                    `<span class="expired-label">Período expirado</span>`
                }
            </div>
        </div>
        <div class="creator-earnings">
            <span class="earnings-label">Faturamento dela:</span>
            <span class="earnings-value">R$ ${(referral.referredUserEarnings || 0).toFixed(2)}</span>
        </div>
    `;

    return item;
}

// Configurar event listeners
function setupEventListeners() {
    // Copiar código de convite
    copyCodeBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(inviteCode.textContent);
            copyCodeBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                Copiado!
            `;
            setTimeout(() => {
                copyCodeBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                    Copiar Código
                `;
            }, 2000);
        } catch (error) {
            console.error("Erro ao copiar código:", error);
            alert("Erro ao copiar código. Tente novamente.");
        }
    });

    // Copiar link de convite
    copyLinkBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(inviteLink.value);
            copyLinkBtn.textContent = 'Copiado!';
            setTimeout(() => {
                copyLinkBtn.textContent = 'Copiar Link';
            }, 2000);
        } catch (error) {
            console.error("Erro ao copiar link:", error);
            alert("Erro ao copiar link. Tente novamente.");
        }
    });

    // Filtros de criadoras
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filterReferredCreators(e.target.dataset.filter);
        });
    });
}

// Filtrar criadoras indicadas
function filterReferredCreators(filter) {
    const items = referredCreatorsList.querySelectorAll('.referred-creator-item');
    
    items.forEach(item => {
        switch (filter) {
            case 'all':
                item.style.display = 'flex';
                break;
            case 'active':
                if (item.classList.contains('active')) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
                break;
            case 'expired':
                if (item.classList.contains('expired')) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
                break;
        }
    });
}

console.log("Zafyre Creators JS carregado");
