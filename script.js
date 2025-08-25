// Este é o código completo do seu aplicativo, com as suas credenciais do Firebase já inseridas.

// Importa os módulos necessários do Firebase SDK v11.6.1
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInWithCustomToken, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Variáveis globais fornecidas pelo ambiente para as credenciais do Firebase
// Elas são usadas para garantir que a aplicação funcione corretamente neste ambiente.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let authReady = false;

// Função para exibir uma mensagem personalizada (substitui o 'alert()')
function showMessage(message, isError = false) {
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');

    messageText.textContent = message;
    messageBox.style.backgroundColor = isError ? '#dc3545' : '#28a745';
    messageBox.classList.remove('hidden');

    // Oculta a mensagem após 3 segundos
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 3000);
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
    } catch (error) {
        console.error("Erro na autenticação Firebase:", error);
        showMessage("Ocorreu um erro na autenticação. Verifique o console.", true);
    }
}

// Chama a função de autenticação ao carregar a página
authenticateUser();

// Adiciona um listener para o formulário
document.getElementById('form-controle').addEventListener('submit', async function(event) {
    event.preventDefault(); // Evita que o formulário recarregue a página

    // Verifica se a autenticação está pronta
    if (!authReady) {
        showMessage("Aguarde a autenticação...", true);
        return;
    }

    // Coleta os dados do formulário
    const professor = document.getElementById('professor').value;
    const sala = document.getElementById('sala').value;
    const data = document.getElementById('data').value;
    const horario = document.getElementById('horario').value;
    const observacao = document.getElementById('observacao').value;

    const disciplinasSelecionadas = [];
    document.querySelectorAll('input[name="disciplina"]:checked').forEach(checkbox => {
        disciplinasSelecionadas.push(checkbox.value);
    });

    const motivosSelecionados = [];
    document.querySelectorAll('input[name="motivo"]:checked').forEach(checkbox => {
        motivosSelecionados.push(checkbox.value);
    });

    // Cria um objeto com todos os dados
    const dados = {
        professor: professor,
        sala: sala,
        data: data,
        horario: horario,
        disciplinas: disciplinasSelecionadas,
        motivos: motivosSelecionados,
        observacao: observacao,
        timestamp: serverTimestamp() // Adiciona data e hora do servidor
    };

    try {
        // Salva os dados na coleção 'controles' no Firestore
        await addDoc(collection(db, "controles"), dados);

        // Em caso de sucesso
        showMessage("Dados salvos com sucesso!");
        document.getElementById('form-controle').reset(); // Limpa o formulário
    } catch (e) {
        // Em caso de erro
        console.error("Erro ao salvar os dados: ", e);
        showMessage("Ocorreu um erro ao salvar os dados.", true);
    }
});
