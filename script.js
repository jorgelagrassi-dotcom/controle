// Este é o código que lida com a submissão do formulário e salva os dados no Firestore.
// Foi atualizado para usar a sintaxe modular do Firebase e garantir a autenticação correta.

// Importa os módulos necessários do Firebase SDK v11.6.1
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Variáveis globais fornecidas pelo ambiente
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Referências aos elementos HTML
const form = document.getElementById('form-controle');
const statusMessage = document.getElementById('status-message');

// Função para exibir uma mensagem de status na interface
function showStatusMessage(message, isSuccess = true) {
    statusMessage.textContent = message;
    statusMessage.style.display = 'block';
    statusMessage.style.backgroundColor = isSuccess ? '#4CAF50' : '#f44336';
    statusMessage.style.color = 'white';
    statusMessage.style.padding = '10px';
    statusMessage.style.borderRadius = '5px';
    statusMessage.style.textAlign = 'center';
    statusMessage.style.marginBottom = '10px';

    // Esconde a mensagem depois de 5 segundos
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 5000);
}

// Escuta a autenticação do usuário. Apenas registra o evento de submit após o login.
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("Usuário autenticado:", user.uid);

        // Adiciona o ouvinte de evento para o formulário
        form.addEventListener('submit', async function(event) {
            event.preventDefault(); // Evita que o formulário recarregue a página

            // Coleta os dados do formulário
            const professor = document.getElementById('professor').value;
            const sala = document.getElementById('sala').value;
            const data = document.getElementById('data').value;
            const horario = document.getElementById('horario').value;
            const observacao = document.getElementById('observacao').value;

            const disciplinasSelecionadas = Array.from(
                document.querySelectorAll('input[name="disciplina"]:checked')
            ).map(checkbox => checkbox.value);

            const motivosSelecionados = Array.from(
                document.querySelectorAll('input[name="motivo"]:checked')
            ).map(checkbox => checkbox.value);

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
                showStatusMessage("Dados salvos com sucesso!");
                form.reset(); // Limpa o formulário
            } catch (e) {
                // Em caso de erro
                console.error("Erro ao salvar os dados: ", e);
                showStatusMessage("Ocorreu um erro ao salvar os dados.", false);
            }
        });

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
            showStatusMessage("Erro de autenticação. Tente recarregar a página.", false);
        }
    }
});
