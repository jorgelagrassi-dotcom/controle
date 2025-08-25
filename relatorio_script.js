// Este é o código que busca os dados do Firestore e exibe na página.

// Importa os módulos necessários do Firebase SDK v11.6.1
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInWithCustomToken, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Variáveis globais fornecidas pelo ambiente para as credenciais do Firebase
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let authReady = false;

// Função para formatar a data para o formato DD/MM/AAAA
function formatarData(timestamp) {
    const data = new Date(timestamp.seconds * 1000);
    // Usa toLocaleDateString para garantir o formato local correto (DD/MM/AAAA)
    return data.toLocaleDateString('pt-BR');
}

// Autentica o usuário para permitir o uso do Firestore
async function authenticateUser() {
    try {
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            await signInAnonymously(auth);
        }
        authReady = true;
        console.log("Autenticação Firebase concluída. Usuário ID:", auth.currentUser.uid);
        // Chama a função de busca de dados apenas após a autenticação
        fetchAndDisplayData();
    } catch (error) {
        console.error("Erro na autenticação Firebase:", error);
    }
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

            // Insere as células com os dados
            const celulaProfessor = linha.insertCell(0);
            celulaProfessor.textContent = dados.professor;

            const celulaSala = linha.insertCell(1);
            celulaSala.textContent = dados.sala;

            const celulaData = linha.insertCell(2);
            celulaData.textContent = dados.data;
            
            const celulaDisciplinas = linha.insertCell(3);
            celulaDisciplinas.textContent = dados.disciplinas.join(", "); // Junta os itens do array

            const celulaMotivos = linha.insertCell(4);
            celulaMotivos.textContent = dados.motivos.join(", "); // Junta os itens do array

            const celulaObservacao = linha.insertCell(5);
            celulaObservacao.textContent = dados.observacao;

            const celulaTimestamp = linha.insertCell(6);
            celulaTimestamp.textContent = formatarData(dados.timestamp);
        });
    });
}

// Chama a função de autenticação ao carregar a página
authenticateUser();
