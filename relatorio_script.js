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
const botaoExibirGraficos = document.getElementById('exibir-graficos');
const graficosContainer = document.getElementById('graficos-container');
const canvasGraficoMotivosBarras = document.getElementById('graficoMotivosBarras');
const canvasGraficoDisciplinasBarras = document.getElementById('graficoDisciplinasBarras');
const canvasGraficoMotivosPizza = document.getElementById('graficoMotivosPizza');
const canvasGraficoDisciplinasPizza = document.getElementById('graficoDisciplinasPizza');

let chartMotivosBarras = null;
let chartDisciplinasBarras = null;
let chartMotivosPizza = null;
let chartDisciplinasPizza = null;

let dadosPorDisciplina = {};

function formatarDataSimples(dataString) {
    if (!dataString) return 'N/A';
    const partes = dataString.split('-');
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0].slice(-2)}`;
    }
    return dataString;
}

function exibirRelatorioPorDisciplina(disciplina) {
    relatorioGeral.style.display = 'none';
    graficosContainer.style.display = 'none';
    relatorioDisciplinaUnica.style.display = 'block';
    
    // Mostra o botão de voltar para o relatório geral e esconde o de gráficos
    botaoVoltarGeral.style.display = 'block';
    botaoExibirGraficos.style.display = 'none';

    tabelaCorpoDisciplina.innerHTML = "";
    
    const dados = dadosPorDisciplina[disciplina];
    if (!dados) return;

    const tituloExistente = relatorioDisciplinaUnica.querySelector('h2');
    if (tituloExistente) {
        tituloExistente.remove();
    }
    
    const tituloDisciplina = document.createElement('h2');
    tituloDisciplina.textContent = `Relatório: ${disciplina}`;
    relatorioDisciplinaUnica.prepend(tituloDisciplina);

    dados.forEach(registro => {
        const linha = tabelaCorpoDisciplina.insertRow();
        linha.insertCell(0).textContent = registro.professor || 'N/A';
        linha.insertCell(1).textContent = registro.sala || 'N/A';
        linha.insertCell(2).textContent = formatarDataSimples(registro.data) || 'N/A';
        linha.insertCell(3).textContent = registro.motivos.map(m => padronizarMotivo(m)).join(", ") || 'N/A';
        linha.insertCell(4).textContent = registro.observacao || 'N/A';
        adicionarBotoesDeAcao(linha, registro.docId);
    });
}

function exibirRelatorioGeral() {
    relatorioGeral.style.display = 'block';
    relatorioDisciplinaUnica.style.display = 'none';
    graficosContainer.style.display = 'none';

    // Mostra o botão de gráficos e esconde o de voltar
    botaoVoltarGeral.style.display = 'none';
    botaoExibirGraficos.style.display = 'block';
}

function exibirGraficos() {
    relatorioGeral.style.display = 'none';
    relatorioDisciplinaUnica.style.display = 'none';
    graficosContainer.style.display = 'block';
    
    // Mostra o botão de voltar e esconde o de gráficos
    botaoVoltarGeral.style.display = 'block';
    botaoExibirGraficos.style.display = 'none';
}

async function deletarRegistro(docId) {
    if (confirm("Tem certeza que deseja excluir este registro?")) {
        try {
            await db.collection("controles").doc(docId).delete();
            alert("Registro excluído com sucesso!");
        } catch (error) {
            console.error("Erro ao excluir registro:", error);
            alert("Ocorreu um erro ao tentar excluir o registro.");
        }
    }
}

function adicionarBotoesDeAcao(linha, docId) {
    const celulaAcoes = linha.insertCell();
    celulaAcoes.classList.add('acoes-celula');

    const botaoApagar = document.createElement('button');
    botaoApagar.textContent = 'Apagar';
    botaoApagar.classList.add('botao-acao', 'apagar');
    botaoApagar.onclick = () => deletarRegistro(docId);
    celulaAcoes.appendChild(botaoApagar);
}

function padronizarDisciplina(disciplina) {
    if (disciplina.toLowerCase() === 'ingles') {
        return 'INGLÊS';
    } else if (disciplina.toLowerCase() === 'fisica') {
        return 'FÍSICA';
    } else if (disciplina.toLowerCase() === 'progr') {
        return 'ALURA';
    }
    return disciplina.toUpperCase();
}

function padronizarMotivo(motivo) {
    if (motivo.toLowerCase() === 'redacao') {
        return 'REDAÇÃO';
    } else if (motivo.toLowerCase() === 'sala-em-prova') {
        return 'ATIVIDADE SEM DISPOSITIVO';
    }
    return motivo.charAt(0).toUpperCase() + motivo.slice(1).replace(/-/g, ' ');
}

function criarGraficos(dados) {
    const contagemMotivos = {};
    const contagemDisciplinas = {};

    dados.forEach(registro => {
        registro.motivos.forEach(motivo => {
            const motivoFormatado = padronizarMotivo(motivo);
            contagemMotivos[motivoFormatado] = (contagemMotivos[motivoFormatado] || 0) + 1;
        });
        registro.disciplinas.forEach(disciplina => {
            const disciplinaFormatada = padronizarDisciplina(disciplina);
            contagemDisciplinas[disciplinaFormatada] = (contagemDisciplinas[disciplinaFormatada] || 0) + 1;
        });
    });

    const labelsMotivos = Object.keys(contagemMotivos);
    const dataMotivos = Object.values(contagemMotivos);
    const labelsDisciplinas = Object.keys(contagemDisciplinas);
    const dataDisciplinas = Object.values(contagemDisciplinas);

    const backgroundColors = [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)'
    ];
    const borderColors = backgroundColors.map(color => color.replace('0.8', '1'));

    if (chartMotivosBarras) chartMotivosBarras.destroy();
    if (chartDisciplinasBarras) chartDisciplinasBarras.destroy();
    if (chartMotivosPizza) chartMotivosPizza.destroy();
    if (chartDisciplinasPizza) chartDisciplinasPizza.destroy();

    chartMotivosBarras = new Chart(canvasGraficoMotivosBarras, {
        type: 'bar',
        data: {
            labels: labelsMotivos,
            datasets: [{
                label: 'Motivos',
                data: dataMotivos,
                backgroundColor: backgroundColors.slice(0, labelsMotivos.length),
                borderColor: borderColors.slice(0, labelsMotivos.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Motivos Mais Registrados' },
                tooltip: { callbacks: { label: (context) => `${context.label}: ${context.parsed.y}` } }
            },
            scales: { y: { beginAtZero: true } }
        }
    });

    chartDisciplinasBarras = new Chart(canvasGraficoDisciplinasBarras, {
        type: 'bar',
        data: {
            labels: labelsDisciplinas,
            datasets: [{
                label: 'Disciplinas',
                data: dataDisciplinas,
                backgroundColor: backgroundColors.slice(0, labelsDisciplinas.length),
                borderColor: borderColors.slice(0, labelsDisciplinas.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Disciplinas Mais Usadas' },
                tooltip: { callbacks: { label: (context) => `${context.label}: ${context.parsed.y}` } }
            },
            scales: { y: { beginAtZero: true } }
        }
    });

    chartMotivosPizza = new Chart(canvasGraficoMotivosPizza, {
        type: 'pie',
        data: {
            labels: labelsMotivos,
            datasets: [{
                label: 'Motivos',
                data: dataMotivos,
                backgroundColor: backgroundColors.slice(0, labelsMotivos.length),
                borderColor: borderColors.slice(0, labelsMotivos.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Distribuição dos Motivos' },
                tooltip: { callbacks: { label: (context) => `${context.label}: ${context.parsed} (${(context.parsed / context.dataset.data.reduce((a, c) => a + c, 0) * 100).toFixed(1)}%)` } }
            }
        }
    });

    chartDisciplinasPizza = new Chart(canvasGraficoDisciplinasPizza, {
        type: 'pie',
        data: {
            labels: labelsDisciplinas,
            datasets: [{
                label: 'Disciplinas',
                data: dataDisciplinas,
                backgroundColor: backgroundColors.slice(0, labelsDisciplinas.length),
                borderColor: borderColors.slice(0, labelsDisciplinas.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Distribuição das Disciplinas' },
                tooltip: { callbacks: { label: (context) => `${context.label}: ${context.parsed} (${(context.parsed / context.dataset.data.reduce((a, c) => a + c, 0) * 100).toFixed(1)}%)` } }
            }
        }
    });
}

// Eventos de clique para os botões de navegação
botaoVoltarGeral.addEventListener('click', exibirRelatorioGeral);
botaoExibirGraficos.addEventListener('click', exibirGraficos);

db.collection("controles").orderBy("data", "desc").onSnapshot((querySnapshot) => {
    dadosPorDisciplina = {};
    botoesContainer.innerHTML = "";
    tabelaCorpoGeral.innerHTML = "";
    const todosOsDados = [];

    querySnapshot.forEach((doc) => {
        const dados = doc.data();
        dados.docId = doc.id;
        todosOsDados.push(dados);

        const linhaGeral = tabelaCorpoGeral.insertRow();
        linhaGeral.insertCell(0).textContent = dados.professor || 'N/A';
        linhaGeral.insertCell(1).textContent = dados.sala || 'N/A';
        linhaGeral.insertCell(2).textContent = formatarDataSimples(dados.data) || 'N/A';
        linhaGeral.insertCell(3).textContent = dados.disciplinas.map(d => padronizarDisciplina(d)).join(", ") || 'N/A';
        linhaGeral.insertCell(4).textContent = dados.motivos.map(m => padronizarMotivo(m)).join(", ") || 'N/A';
        linhaGeral.insertCell(5).textContent = dados.observacao || 'N/A';
        adicionarBotoesDeAcao(linhaGeral, dados.docId);

        if (dados.disciplinas && dados.disciplinas.length > 0) {
            dados.disciplinas.forEach(disciplina => {
                const disciplinaFormatada = padronizarDisciplina(disciplina);
                if (!dadosPorDisciplina[disciplinaFormatada]) {
                    dadosPorDisciplina[disciplinaFormatada] = [];
                }
                dadosPorDisciplina[disciplinaFormatada].push(dados);
            });
        }
    });

    for (const disciplina in dadosPorDisciplina) {
        const button = document.createElement('button');
        button.textContent = disciplina;
        button.classList.add('button-discipline');
        button.addEventListener('click', () => exibirRelatorioPorDisciplina(disciplina));
        botoesContainer.appendChild(button);
    }

    criarGraficos(todosOsDados);
});