// Este é o código completo do seu aplicativo, com as suas credenciais do Firebase já inseridas.

// Suas credenciais do Firebase
var firebaseConfig = {
    apiKey: "AIzaSyDUE4ioFbh56t4vfI2MF_3Gi0z97ebslp0",
    authDomain: "justificativa-b5c71.firebaseapp.com",
    projectId: "justificativa-b5c71",
    storageBucket: "justificativa-b5c71.firebasestorage.app",
    messagingSenderId: "148699441670",
    appId: "1:148699441670:web:c78fe0b1bfbee992bf7187",
    measurementId: "G-4W498B878H"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Obtém uma referência para o serviço Firestore
const db = firebase.firestore();

document.getElementById('form-controle').addEventListener('submit', async function(event) {
    event.preventDefault(); // Evita que o formulário recarregue a página

    // Coleta os dados do formulário
    // CONVERTE PROFESSOR E OBSERVAÇÃO PARA CAIXA ALTA ANTES DE SALVAR
    const professor = document.getElementById('professor').value.toUpperCase();
    const sala = document.getElementById('sala').value;
    const data = document.getElementById('data').value;
    const horario = document.getElementById('horario').value;
    const observacao = document.getElementById('observacao').value.toUpperCase();

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
        // Salva os dados na coleção 'controles' no Firestore
        await db.collection("controles").add(dados);
        
        // Em caso de sucesso
        alert("Dados salvos com sucesso!");
        document.getElementById('form-controle').reset(); // Limpa o formulário
    } catch (e) {
        // Em caso de erro
        console.error("Erro ao salvar os dados: ", e);
        alert("Ocorreu um erro ao salvar os dados.");
    }
});
