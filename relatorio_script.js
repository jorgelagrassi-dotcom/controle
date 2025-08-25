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
const botoesContainer = document.getElementById('botoes-disciplinas').querySelector('.buttons-container');
const botaoVoltarGeral = document.getElementById('voltar-geral');
const urlParams = new URLSearchParams(window.location.search);
const docIdParaEdicao = urlParams.get('docId');

// Função para formatar o timestamp do Firebase em uma data legível
function formatarData(timestamp) {
    if (timestamp && timestamp.toDate) {
        const data = timestamp.toDate();
        return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR');
    }
    return 'N/A';
}

// Função para adicionar os botões de ação (editar e excluir)
function adicionarBotoesDeAcao(linha, docId) {
    const celulaAcoes = linha.insertCell(-1);
    celulaAcoes.classList.add('acoes-celula');

    // Botão de Excluir
    const botaoExcluir = document.createElement('button');
    botaoExcluir.classList.add('botao-acao');
    botaoExcluir.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>`;
    botaoExcluir.title = "Excluir Registro";
    botaoExcluir.addEventListener('click', () => {
        if (confirm("Tem certeza que deseja excluir este registro?")) {
            db.collection("controles").doc(docId).delete().then(() => {
                alert("Documento excluído com sucesso!");
                location.reload(); // Recarrega a página para atualizar a tabela
            }).catch((error) => {
                console.error("Erro ao remover documento: ", error);
                alert("Erro ao excluir o documento.");
            });
        }
    });
    // Botão de Editar
    const botaoEditar = document.createElement('button');
    botaoEditar.classList.add('botao-acao');
    botaoEditar.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;
    botaoEditar.title = "Editar Registro";
    botaoEditar.addEventListener('click', () => {
        // Redireciona para a página de formulário com o ID do documento
        window.location.href = `index.html?docId=${docId}`;
    });

    celulaAcoes.appendChild(botaoEditar);
    celulaAcoes.appendChild(botaoExcluir);
}


// Função para buscar e exibir todos os dados
async function buscarEExibirDados() {
    try {
        const querySnapshot = await db.collection("controles").get();
        const dadosPorDisciplina = {};

        // 1. Preenche a tabela geral e agrupa os dados por disciplina
        querySnapshot.forEach(doc => {
            const dados = doc.data();
            dados.docId = doc.id; // Adiciona o ID do documento ao objeto

            const linhaGeral = tabelaCorpoGeral.insertRow();
            // NOVO: Verifica se a linha deve ter a classe de cor vermelha
            if (dados.motivos && dados.motivos.includes('plataforma-instavel')) {
                linhaGeral.classList.add('plataforma-instavel-row');
            }

            linhaGeral.insertCell(0).textContent = dados.professor || 'N/A';
            linhaGeral.insertCell(1).textContent = dados.sala || 'N/A';
            linhaGeral.insertCell(2).textContent = dados.data || 'N/A';
            linhaGeral.insertCell(3).textContent = (dados.disciplinas && dados.disciplinas.length > 0) ? dados.disciplinas.join(", ") : 'N/A';
            linhaGeral.insertCell(4).textContent = (dados.motivos && dados.motivos.length > 0) ? dados.motivos.join(", ") : 'N/A';
            linhaGeral.insertCell(5).textContent = dados.observacao || 'N/A';
            linhaGeral.insertCell(6).textContent = formatarData(dados.timestamp);
            adicionarBotoesDeAcao(linhaGeral, dados.docId);

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
            button.addEventListener('click', () => {
                filtrarPorDisciplina(disciplina, dadosPorDisciplina[disciplina]);
            });
            botoesContainer.appendChild(button);
        }

    } catch (e) {
        console.error("Erro ao buscar dados do Firestore: ", e);
        alert("Ocorreu um erro ao carregar os relatórios.");
    }
}


function filtrarPorDisciplina(disciplina, dados) {
    // Esconde o relatório geral e mostra o de disciplina única
    relatorioGeral.style.display = 'none';
    relatorioDisciplinaUnica.style.display = 'block';
    botaoVoltarGeral.style.display = 'block';

    // Limpa a tabela de disciplina única
    tabelaCorpoDisciplina.innerHTML = '';

    // Preenche a tabela com os dados filtrados
    dados.forEach(dado => {
        const linha = tabelaCorpoDisciplina.insertRow();
        // NOVO: Aplica a classe de cor vermelha se necessário
        if (dado.motivos && dado.motivos.includes('plataforma-instavel')) {
            linha.classList.add('plataforma-instavel-row');
        }

        linha.insertCell(0).textContent = dado.professor || 'N/A';
        linha.insertCell(1).textContent = dado.sala || 'N/A';
        linha.insertCell(2).textContent = dado.data || 'N/A';
        linha.insertCell(3).textContent = (dado.disciplinas && dado.disciplinas.length > 0) ? dado.disciplinas.join(", ") : 'N/A';
        linha.insertCell(4).textContent = (dado.motivos && dado.motivos.length > 0) ? dado.motivos.join(", ") : 'N/A';
        linha.insertCell(5).textContent = dado.observacao || 'N/A';
        linha.insertCell(6).textContent = formatarData(dado.timestamp);
        adicionarBotoesDeAcao(linha, dado.docId);
    });
}

// Adiciona um evento para o botão de voltar ao relatório geral
botaoVoltarGeral.addEventListener('click', () => {
    relatorioGeral.style.display = 'block';
    relatorioDisciplinaUnica.style.display = 'none';
    botaoVoltarGeral.style.display = 'none';
});

// Inicia o processo
buscarEExibirDados();
