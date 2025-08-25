// Este é o código completo do seu aplicativo, com a configuração de Firebase e a lógica de autenticação segura.

// Configuração do Firebase, obtida do ambiente de execução
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Inicializa o Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = app.firestore();
const auth = app.auth();

// Variável para armazenar o ID do usuário após a autenticação
let userId = null;

// Função para exibir um modal de mensagem personalizada
function showMessageModal(message) {
    // Cria os elementos do modal
    const modal = document.createElement('div');
    modal.className = 'custom-modal';
    const modalContent = document.createElement('div');
    modalContent.className = 'custom-modal-content';
    const messageP = document.createElement('p');
    messageP.textContent = message;
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'OK';
    closeBtn.className = 'custom-modal-button';

    // Adiciona os elementos ao DOM
    modalContent.appendChild(messageP);
    modalContent.appendChild(closeBtn);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Evento de clique para fechar o modal
    closeBtn.onclick = () => {
        document.body.removeChild(modal);
    };

    // Estilos do modal (inline para garantir que funcione)
    const style = document.createElement('style');
    style.innerHTML = `
        .custom-modal {
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .custom-modal-content {
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            max-width: 300px;
            width: 90%;
        }
        .custom-modal-button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 15px;
        }
    `;
    document.head.appendChild(style);
}

// Observa o estado de autenticação para obter o ID do usuário
auth.onAuthStateChanged(async (user) => {
    if (user) {
        userId = user.uid;
        console.log("Usuário autenticado:", userId);
    } else {
        // Se não houver usuário logado, faz o login personalizado ou anônimo
        try {
            if (initialAuthToken) {
                await auth.signInWithCustomToken(initialAuthToken);
            } else {
                await auth.signInAnonymously();
            }
        } catch (error) {
            console.error("Erro ao autenticar:", error);
            showMessageModal("Ocorreu um erro ao autenticar. Tente novamente.");
        }
    }
});

document.getElementById('form-controle').addEventListener('submit', async function(event) {
    event.preventDefault(); // Evita que o formulário recarregue a página

    // Verifica se o ID do usuário está disponível
    if (!userId) {
        showMessageModal("Aguardando autenticação. Tente novamente em instantes.");
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
        timestamp: firebase.firestore.FieldValue.serverTimestamp() // Adiciona data e hora do servidor
    };

    try {
        // Define o caminho da coleção para o usuário autenticado
        const collectionPath = `artifacts/${appId}/users/${userId}/controles`;
        
        // Salva os dados na coleção privada do usuário no Firestore
        await db.collection(collectionPath).add(dados);
        
        // Em caso de sucesso
        showMessageModal("Dados salvos com sucesso!");
        document.getElementById('form-controle').reset(); // Limpa o formulário
    } catch (e) {
        // Em caso de erro
        console.error("Erro ao salvar os dados: ", e);
        showMessageModal("Ocorreu um erro ao salvar os dados. Verifique o console para mais detalhes.");
    }
});
