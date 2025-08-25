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

// Novas referências para os gráficos e botões
const graficosContainer = document.getElementById('graficos-container');
const botaoExibirGraficos = document.getElementById('exibir-graficos');
const canvasGraficoMotivosBarras = document.getElementById('graficoMotivosBarras');
const canvasGraficoDisciplinasBarras = document.getElementById('graficoDisciplinasBarras');
const canvasGraficoMotivosPizza = document.getElementById('graficoMotivosPizza');
const canvasGraficoDisciplinasPizza = document.getElementById('graficoDisciplinasPizza');
let chartMotivosBarras = null;
let chartDisciplinasBarras = null;
let chartMotivosPizza = null;
let chartDisciplinasPizza = null;

// Objeto para armazenar os dados agrupados por disciplina
let dadosPorDisciplina = {};

// Função para formatar a data do campo 'data' (AAAA-MM-DD) para DD/MM/AA
function formatarDataSimples(dataString) {
    if (!dataString) return 'N/A';
    const partes = dataString.split('-');
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0].slice(-2)}`;
    }
    return dataString; // Retorna o original se o formato não for o esperado
}

// Função para exibir o relatório de uma disciplina específica
function exibirRelatorioPorDisciplina(disciplina) {
    // Esconde o relatório geral e mostra o de disciplina única
    relatorioGeral.style.display = 'none';
    relatorioDisciplinaUnica.style.display = 'block';
    graficosContainer.style.display = 'none';
    botaoVoltarGeral.style.display = 'block';
    botaoExibirGraficos.textContent = 'Ver Gráficos';

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
        linha.insertCell(2).textContent = formatarDataSimples(registro.data) || 'N/A';
        linha.insertCell(3).textContent = registro.motivos.join(", ") || 'N/A';
        linha.insertCell(4).textContent = registro.observacao || 'N/A';
        adicionarBotoesDeAcao(linha, registro.docId); // Adiciona os botões de ação
    });
}

// Função para exibir o relatório geral
function exibirRelatorioGeral() {
    relatorioGeral.style.display = 'block';
    relatorioDisciplinaUnica.style.display = 'none';
    graficosContainer.style.display = 'none';
    botaoVoltarGeral.style.display = 'none';
    botaoExibirGraficos.textContent = 'Ver Gráficos';
}

// Função para exibir os gráficos
function exibirGraficos() {
    relatorioGeral.style.display = 'none';
    relatorioDisciplinaUnica.style.display = 'none';
    graficosContainer.style.display = 'block';
    botaoVoltarGeral.style.display = 'block';
    botaoExibirGraficos.textContent = 'Ver Relatório Geral';
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

    // Botão de Excluir (Apagar)
    const botaoApagar = document.createElement('button');
    botaoApagar.textContent = 'Apagar';
    botaoApagar.classList.add('botao-acao', 'apagar');
    botaoApagar.style.backgroundColor = 'red';
    botaoApagar.style.color = 'white';
    botaoApagar.style.border = 'none';
    botaoApagar.style.padding = '5px 10px';
    botaoApagar.style.cursor = 'pointer';
    botaoApagar.onclick = () => deletarRegistro(docId);
    celulaAcoes.appendChild(botaoApagar);
}

// Função para padronizar o nome das disciplinas
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

// Função para padronizar o nome dos motivos
function padronizarMotivo(motivo) {
    if (motivo.toLowerCase() === 'redacao') {
        return 'REDAÇÃO';
    }
    return motivo.charAt(0).toUpperCase() + motivo.slice(1).replace(/-/g, ' ');
}

// **NOVA FUNÇÃO: Criar os gráficos de Motivos e Disciplinas**
function criarGraficos(dados) {
    // 1. Processar dados de MOTIVOS
    const contagemMotivos = {};
    dados.forEach(registro => {
        registro.motivos.forEach(motivo => {
            const motivoFormatado = padronizarMotivo(motivo);
            contagemMotivos[motivoFormatado] = (contagemMotivos[motivoFormatado] || 0) + 1;
        });
    });

    // 2. Processar dados de DISCIPLINAS
    const contagemDisciplinas = {};
    dados.forEach(registro => {
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

    // 3. Destruir gráficos anteriores, se existirem
    if (chartMotivosBarras) chartMotivosBarras.destroy();
    if (chartDisciplinasBarras) chartDisciplinasBarras.destroy();
    if (chartMotivosPizza) chartMotivosPizza.destroy();
    if (chartDisciplinasPizza) chartDisciplinasPizza.destroy();

    // 4. Criar o gráfico de Barras de Motivos
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
                legend: {
                    display: false,
                },
                title: {
                    display: true,
                    text: 'Motivos Mais Registrados'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // 5. Criar o gráfico de Barras de Disciplinas
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
                legend: {
                    display: false,
                },
                title: {
                    display: true,
                    text: 'Disciplinas Mais Usadas'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed.y || 0;
                            return `${label}: ${value}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // 6. Criar o gráfico de Pizza de Motivos
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
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Motivos Mais Registrados'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
                            const percentage = total ? ((value / total) * 100).toFixed(1) + '%' : '0%';
                            return `${label}: ${value} (${percentage})`;
                        }
                    }
                }
            }
        }
    });

    // 7. Criar o gráfico de Pizza de Disciplinas
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
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Disciplinas Mais Usadas'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
                            const percentage = total ? ((value / total) * 100).toFixed(1) + '%' : '0%';
                            return `${label}: ${value} (${percentage})`;
                        }
                    }
                }
            }
        }
    });
}

// Evento do botão de voltar para o relatório geral
botaoVoltarGeral.addEventListener('click', exibirRelatorioGeral);

// Evento do novo botão para exibir os gráficos
botaoExibirGraficos.addEventListener('click', () => {
    if (graficosContainer.style.display === 'none') {
        exibirGraficos();
    } else {
        exibirRelatorioGeral();
    }
});

// Escuta por mudanças na coleção 'controles' em tempo real
db.collection("controles").orderBy("data", "desc").onSnapshot((querySnapshot) => {
    // Limpa o objeto de dados por disciplina
    dadosPorDisciplina = {};
    botoesContainer.innerHTML = "";
    
    // Limpa a tabela geral
    tabelaCorpoGeral.innerHTML = "";

    // 1. Popula o relatório geral e agrupa os dados
    const todosOsDados = [];
    querySnapshot.forEach((doc) => {
        const dados = doc.data();
        dados.docId = doc.id; // Adiciona o ID do documento aos dados
        todosOsDados.push(dados);

        // Insere a linha na tabela geral
        const linhaGeral = tabelaCorpoGeral.insertRow();
        linhaGeral.insertCell(0).textContent = dados.professor || 'N/A';
        linhaGeral.insertCell(1).textContent = dados.sala || 'N/A';
        linhaGeral.insertCell(2).textContent = formatarDataSimples(dados.data) || 'N/A';
        linhaGeral.insertCell(3).textContent = dados.disciplinas.map(d => padronizarDisciplina(d)).join(", ") || 'N/A';
        linhaGeral.insertCell(4).textContent = dados.motivos.map(m => padronizarMotivo(m)).join(", ") || 'N/A';
        linhaGeral.insertCell(5).textContent = dados.observacao || 'N/A';
        adicionarBotoesDeAcao(linhaGeral, dados.docId); // Adiciona os botões de ação

        // Agrupa os dados por disciplina
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

    // 2. Cria os botões para cada disciplina
    for (const disciplina in dadosPorDisciplina) {
        const button = document.createElement('button');
        button.textContent = disciplina;
        button.classList.add('button-discipline');
        button.addEventListener('click', () => exibirRelatorioPorDisciplina(disciplina));
        botoesContainer.appendChild(button);
    }

    // 3. Cria os gráficos com todos os dados
    criarGraficos(todosOsDados);
});