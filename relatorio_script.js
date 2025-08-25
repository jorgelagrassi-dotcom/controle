// Este é o código que busca os dados do Firestore e exibe na página.

// Importa os módulos necessários do Firebase SDK v11.6.1
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Variáveis globais fornecidas pelo ambiente para as credenciais do Firebase
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Função para formatar a data para o formato DD/MM/AAAA
function formatarData(timestamp) {
    if (!timestamp) return 'N/A'; // Adiciona uma verificação para evitar erros
    const data = new Date(timestamp.seconds * 1000);
    // Usa toLocaleDateString para garantir o formato local correto (DD/MM/AAAA)
    return data.toLocaleDateString('pt-BR');
}

// Função principal que busca e exibe os dados
function fetchAndDisplayData() {
    // Pega a referência para o corpo da tabela onde os dados serão exibidos
    const tabelaCorpo = document.getElementById('tabela-relatorio').getElementsByTagName('tbody')[0];

    // Escuta por mudanças na coleção 'controles' em tempo real
    onSnapshot(collection(db, "controles"), (querySnapshot) => {
        // Limpa a tabela para evitar duplicatas
        tabelaCorpo.innerHTML = "";

        // Para cada documento encontrado, cria uma nova linha na tabela
        querySnapshot.forEach((doc) => {
            const dados = doc.data();

            // Cria um novo elemento de linha na tabela
            const linha = tabelaCorpo.insertRow();

            // Insere as células com os dados.
            // Adiciona a verificação '|| 'N/A'' para evitar erros se algum campo estiver vazio.
            const celulaProfessor = linha.insertCell(0);
            celulaProfessor.textContent = dados.professor || 'N/A';

            const celulaSala = linha.insertCell(1);
            celulaSala.textContent = dados.sala || 'N/A';

            const celulaData = linha.insertCell(2);
            celulaData.textContent = dados.data || 'N/A';
            
            const celulaDisciplinas = linha.insertCell(3);
            celulaDisciplinas.textContent = (dados.disciplinas && dados.disciplinas.length > 0) ? dados.disciplinas.join(", ") : 'N/A';

            const celulaMotivos = linha.insertCell(4);
            celulaMotivos.textContent = (dados.motivos && dados.motivos.length > 0) ? dados.motivos.join(", ") : 'N/A';

            const celulaObservacao = linha.insertCell(5);
            celulaObservacao.textContent = dados.observacao || 'N/A';

            const celulaTimestamp = linha.insertCell(6);
            celulaTimestamp.textContent = formatarData(dados.timestamp);
        });
    });
}

// A nova lógica de autenticação.
// Usa onAuthStateChanged para garantir que a busca de dados só ocorra após a autenticação.
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // O usuário está autenticado, agora é seguro buscar os dados.
        console.log("Usuário autenticado:", user.uid);
        fetchAndDisplayData();
    } else {
        // Ninguém está logado. Tenta fazer login com o token ou anonimamente.
        try {
            if (initialAuthToken) {
                await signInWithCustomToken(auth, initialAuthToken);
            } else {
                await signInAnonymously(auth);
            }
        } catch (error) {
            console.error("Erro na autenticação:", error);
        }
    }
});
