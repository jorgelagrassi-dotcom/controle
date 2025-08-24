// Este é o código que busca os dados do Firestore, cria botões de filtro e exibe os relatórios.
// Esta versão inclui botões para editar e excluir registros.

// Suas credenciais do Firebase (já preenchidas)
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
const db = firebase.firestore();

// Referências aos elementos HTML
const tabelaCorpoGeral = document.getElementById('tabela-relatorio').getElementsByTagName('tbody')[0];
const relatorioGeral = document.getElementById('relatorio-geral');
const relatorioDisciplinaUnica = document.getElementById('relatorio-disciplina-unica');
const tabelaCorpoDisciplina = document.getElementById('tabela-disciplina-unica').getElementsByTagName('tbody')[0];
const botoesContainer = document.querySelector('#botoes-disciplinas .buttons-container');
const botaoVoltarGeral = document.getElementById('voltar-geral');

// Objeto para armazenar os dados agrupados por disciplina
let dadosPorDisciplina = {};

// Função para formatar a data
function formatarData(timestamp) {
    if (!timestamp) return 'N/A';
    const data = new Date(timestamp.seconds * 1000);
    return data.toLocaleString('pt-BR');
}

// **NOVA FUNÇÃO: Excluir um registro do Firestore**
async function deletarRegistro(docId) {
    if (confirm("Tem certeza que deseja excluir este registro?")) {
        try {
            await db.collection("controles").doc(docId).delete();
            console.log("Registro excluído com sucesso!");
        } catch (error) {
            console.error("Erro ao excluir registro:", error);
        }
    }
}

// **NOVA FUNÇÃO: Adicionar botões de ação a uma linha da tabela**
function adicionarBotoesDeAcao(linha, docId) {
    const celulaAcoes = linha.insertCell();
    celulaAcoes.classList.add('acoes-celula');

    // Botão de Excluir (lixeira)
    const botaoDeletar = document.createElement('button');
    botaoDeletar.classList.add('botao-acao', 'deletar');
    botaoDeletar.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="m376-292 124-124 124 124q11 11 28 11t28-11q11-11 11-28t-11-28L556-448l124-124q11-11 11-28t-11-28q-11-11-28-11t-28 11L500-504l-124-124q-11-11-28-11t-28 11q-11 11-11 28t11 28l124 124-124 124q-11 11-11 28t11 28q11 11 28 11t28-11Zm124-212Zm-240 512q-33 0-56.5-23.5T184-240v-520h-40q-17 0-28.5-11.5T104-796q0-17 11.5-28.5T144-836h138q0-11-3-22t-6-20q-11-19-28-36.5t-40-25.5q-15-7-25-11.5T246-960h337q16 0 31.5 5.5t33.5 13.5q15 8 26 21t18 29h-243q-24 0-42 18t-18 42h-31q-17 0-28.5 11.5T324-836h403v520q0 33-23.5 56.5T704-240H260Z"/></svg>`;
    botaoDeletar.onclick = () => deletarRegistro(docId);
    celulaAcoes.appendChild(botaoDeletar);
}

// Função para exibir o relatório de uma disciplina específica
function exibirRelatorioPorDisciplina(disciplina) {
    // Esconde o relatório geral e mostra o de disciplina única
    relatorioGeral.style.display = 'none';
    relatorioDisciplinaUnica.style.display = 'block';
    botaoVoltarGeral.style.display = 'block';

    // Limpa a tabela de disciplina única para evitar duplicatas
    tabelaCorpoDisciplina.innerHTML = "";

    // Pega os dados da disciplina selecionada
    const dados = dadosPorDisciplina[disciplina];
    if (!dados) return;

    // Remove o título anterior antes de adicionar o novo
    const tituloExistente = relatorioDisciplinaUnica.querySelector('h2');
    if (tituloExistente) {
        tituloExistente.remove();
    }
    
    // Adiciona o título da disciplina
    const tituloDisciplina = document.createElement('h2');
    tituloDisciplina.textContent = `Relatório: ${disciplina}`;
    relatorioDisciplinaUnica.prepend(tituloDisciplina);

    // Popula a tabela com os dados da disciplina
    dados.forEach(registro => {
        const linha = tabelaCorpoDisciplina.insertRow();
        linha.insertCell(0).textContent = registro.professor || 'N/A';
        linha.insertCell(1).textContent = registro.sala || 'N/A';
        linha.insertCell(2).textContent = registro.data || 'N/A';
        linha.insertCell(3).textContent = registro.motivos.join(", ") || 'N/A';
        linha.insertCell(4).textContent = registro.observacao || 'N/A';
        linha.insertCell(5).textContent = formatarData(registro.timestamp);
        adicionarBotoesDeAcao(linha, registro.docId); // Adiciona os botões de ação
    });
}

// Função para exibir o relatório geral
function exibirRelatorioGeral() {
    relatorioGeral.style.display = 'block';
    relatorioDisciplinaUnica.style.display = 'none';
    botaoVoltarGeral.style.display = 'none';
}

// Evento do botão de voltar para o relatório geral
botaoVoltarGeral.addEventListener('click', exibirRelatorioGeral);

// Escuta por mudanças na coleção 'controles' em tempo real
db.collection("controles").orderBy("timestamp", "desc").onSnapshot((querySnapshot) => {
    // Limpa o objeto de dados por disciplina
    dadosPorDisciplina = {};
    botoesContainer.innerHTML = "";
    
    // Limpa a tabela geral
    tabelaCorpoGeral.innerHTML = "";

    // 1. Popula o relatório geral e agrupa os dados
    querySnapshot.forEach((doc) => {
        const dados = doc.data();
        dados.docId = doc.id; // Adiciona o ID do documento aos dados

        // Insere a linha na tabela geral
        const linhaGeral = tabelaCorpoGeral.insertRow();
        linhaGeral.insertCell(0).textContent = dados.professor || 'N/A';
        linhaGeral.insertCell(1).textContent = dados.sala || 'N/A';
        linhaGeral.insertCell(2).textContent = dados.data || 'N/A';
        linhaGeral.insertCell(3).textContent = dados.disciplinas.join(", ") || 'N/A';
        linhaGeral.insertCell(4).textContent = dados.motivos.join(", ") || 'N/A';
        linhaGeral.insertCell(5).textContent = dados.observacao || 'N/A';
        linhaGeral.insertCell(6).textContent = formatarData(dados.timestamp);
        adicionarBotoesDeAcao(linhaGeral, dados.docId); // Adiciona os botões de ação

        // Agrupa os dados por disciplina
        if (dados.disciplinas && dados.disciplinas.length > 0) {
            dados.disciplinas.forEach(disciplina => {
                const disciplinaFormatada = disciplina.toUpperCase();
                if (!dadosPorDisciplina[disciplinaFormatada]) {
                    dadosPorDisciplina[disciplinaFormatada] = [];
                }
                dadosPorDisciplina[disciplinaFormatada].push(dados);
            });
        }
    });

    // 2. Cria os botões para cada disciplina
    for (const disciplina in dadosPorDisciplina) {
        const button = document.createElement('button');
        button.textContent = disciplina;
        button.classList.add('button-discipline');
        button.addEventListener('click', () => exibirRelatorioPorDisciplina(disciplina));
        botoesContainer.appendChild(button);
    }
});
