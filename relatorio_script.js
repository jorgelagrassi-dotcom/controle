// Este é o código que busca os dados do Firestore, cria botões de filtro e exibe os relatórios.
// Esta versão inclui botões para editar e excluir registros e usa autenticação segura.

// Configuração do Firebase, obtida do ambiente de execução
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Inicializa o Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = app.firestore();
const auth = app.auth();

// Variáveis globais
let userId = null;
let dadosPorDisciplina = {};
let todosOsDados = [];

// Referências aos elementos HTML
const tabelaCorpoGeral = document.getElementById('tabela-relatorio').getElementsByTagName('tbody')[0];
const relatorioGeral = document.getElementById('relatorio-geral');
const relatorioDisciplinaUnica = document.getElementById('relatorio-disciplina-unica');
const tabelaCorpoDisciplina = document.getElementById('tabela-disciplina-unica').getElementsByTagName('tbody')[0];
const botoesContainer = document.querySelector('#botoes-disciplinas .buttons-container');
const voltarGeralBtn = document.getElementById('voltar-geral');
const confirmModal = document.getElementById('confirm-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
let docToDeleteId = null;
let docToEditId = null;

// Observa o estado de autenticação
auth.onAuthStateChanged(async (user) => {
    if (user) {
        userId = user.uid;
        console.log("Usuário autenticado:", userId);
        // Inicia a escuta de dados após a autenticação
        startDataListener();
    } else {
        // Tenta fazer o login personalizado ou anônimo
        try {
            if (initialAuthToken) {
                await auth.signInWithCustomToken(initialAuthToken);
            } else {
                await auth.signInAnonymously();
            }
        } catch (error) {
            console.error("Erro ao autenticar:", error);
            // Poderia exibir uma mensagem de erro na tela aqui
        }
    }
});

// Função para formatar o timestamp do Firestore
function formatarData(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate();
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('pt-BR', options);
}

// Função para renderizar os dados na tabela geral
function renderizarTabelaGeral(dadosArray) {
    tabelaCorpoGeral.innerHTML = '';
    dadosArray.forEach(doc => {
        const dados = doc.data();
        const docId = doc.id;
        const linha = tabelaCorpoGeral.insertRow();
        linha.insertCell(0).textContent = dados.professor || 'N/A';
        linha.insertCell(1).textContent = dados.sala || 'N/A';
        linha.insertCell(2).textContent = dados.data || 'N/A';
        linha.insertCell(3).textContent = (dados.disciplinas || []).join(', ');
        linha.insertCell(4).textContent = (dados.motivos || []).join(', ');
        linha.insertCell(5).textContent = dados.observacao || 'N/A';
        linha.insertCell(6).textContent = formatarData(dados.timestamp);

        // Célula de ações
        const acoesCelula = linha.insertCell(7);
        acoesCelula.className = 'acoes-celula';
        
        // Botão de Editar
        const editBtn = document.createElement('button');
        editBtn.className = 'botao-acao edit';
        editBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path d="M410.3 231l11.3-11.3-33.9-33.9-11.3 11.3-50.5-50.5 11.3-11.3 33.9-33.9-11.3-11.3-11.3 11.3-33.9-33.9-11.3 11.3L272 176.4l-33.9-33.9-11.3 11.3-11.3-11.3-33.9 33.9-11.3-11.3L135.4 176l-11.3-11.3-33.9 33.9 11.3 11.3-50.5 50.5 11.3 11.3 33.9-33.9 11.3 11.3L176.4 272l33.9-33.9 11.3 11.3 11.3-11.3 33.9 33.9-11.3 11.3 50.5 50.5-11.3 11.3-33.9-33.9-11.3 11.3L231 410.3l11.3-11.3-33.9-33.9-11.3 11.3-50.5-50.5 11.3-11.3 33.9-33.9-11.3-11.3L176 231l-33.9-33.9-11.3 11.3L96.4 208 107.7 219.3l-11.3 11.3L56.4 272l-11.3 11.3 33.9 33.9 11.3-11.3L176 335.6l33.9-33.9 11.3 11.3 11.3-11.3 33.9 33.9 11.3 11.3 50.5 50.5-11.3 11.3-33.9-33.9-11.3-11.3L272 335.6l33.9 33.9-11.3 11.3 11.3 11.3 33.9-33.9 11.3-11.3 50.5-50.5-11.3-11.3-33.9 33.9-11.3-11.3L335.6 272l33.9 33.9 11.3-11.3 11.3 11.3 33.9-33.9 11.3-11.3L455.6 272l-11.3-11.3 33.9-33.9 11.3 11.3z"/>
            </svg>
            <path d="M410.3 231l11.3-11.3-33.9-33.9-11.3 11.3-50.5-50.5 11.3-11.3 33.9-33.9-11.3-11.3-11.3 11.3-33.9-33.9-11.3 11.3L272 176.4l-33.9-33.9-11.3 11.3-11.3-11.3-33.9 33.9-11.3-11.3L135.4 176l-11.3-11.3-33.9 33.9 11.3 11.3-50.5 50.5 11.3 11.3 33.9-33.9 11.3 11.3L176.4 272l33.9-33.9 11.3 11.3 11.3-11.3 33.9 33.9-11.3 11.3 50.5 50.5-11.3 11.3-33.9-33.9-11.3 11.3L231 410.3l11.3-11.3-33.9-33.9-11.3 11.3-50.5-50.5 11.3-11.3 33.9-33.9-11.3-11.3L176 231l-33.9-33.9-11.3 11.3L96.4 208 107.7 219.3l-11.3 11.3L56.4 272l-11.3 11.3 33.9 33.9 11.3-11.3L176 335.6l33.9-33.9 11.3 11.3 11.3-11.3 33.9 33.9 11.3 11.3 50.5 50.5-11.3 11.3-33.9-33.9-11.3 11.3L272 335.6l33.9 33.9-11.3 11.3 11.3 11.3 33.9-33.9 11.3-11.3 50.5-50.5-11.3-11.3-33.9 33.9-11.3-11.3L335.6 272l33.9 33.9 11.3-11.3 11.3 11.3 33.9-33.9 11.3-11.3L455.6 272l-11.3-11.3 33.9-33.9 11.3 11.3z"/>
            </svg>
        `;
        editBtn.onclick = () => exibirModalEdicao(docId, dados);
        acoesCelula.appendChild(editBtn);

        // Botão de Excluir
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'botao-acao';
        deleteBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.7C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
            </svg>
        `;
        deleteBtn.onclick = () => exibirModalConfirmacao(docId);
        acoesCelula.appendChild(deleteBtn);
    });
}

// Função para renderizar os dados na tabela de uma única disciplina
function renderizarTabelaDisciplina(dadosArray) {
    tabelaCorpoDisciplina.innerHTML = '';
    dadosArray.forEach(dados => {
        const linha = tabelaCorpoDisciplina.insertRow();
        linha.insertCell(0).textContent = dados.professor || 'N/A';
        linha.insertCell(1).textContent = dados.sala || 'N/A';
        linha.insertCell(2).textContent = dados.data || 'N/A';
        linha.insertCell(3).textContent = (dados.motivos || []).join(', ');
        linha.insertCell(4).textContent = dados.observacao || 'N/A';
        linha.insertCell(5).textContent = formatarData(dados.timestamp);
        
        // Célula de ações (apenas para a tabela geral)
        const acoesCelula = linha.insertCell(6);
        acoesCelula.className = 'acoes-celula';
        
        // Botão de Editar
        const editBtn = document.createElement('button');
        editBtn.className = 'botao-acao edit';
        editBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path d="M410.3 231l11.3-11.3-33.9-33.9-11.3 11.3-50.5-50.5 11.3-11.3 33.9-33.9-11.3-11.3-11.3 11.3-33.9-33.9-11.3 11.3L272 176.4l-33.9-33.9-11.3 11.3-11.3-11.3-33.9 33.9-11.3-11.3L135.4 176l-11.3-11.3-33.9 33.9 11.3 11.3-50.5 50.5 11.3 11.3 33.9-33.9 11.3 11.3L176.4 272l33.9-33.9 11.3 11.3 11.3-11.3 33.9 33.9-11.3 11.3 50.5 50.5-11.3 11.3-33.9-33.9-11.3 11.3L231 410.3l11.3-11.3-33.9-33.9-11.3 11.3-50.5-50.5 11.3-11.3 33.9-33.9-11.3-11.3L176 231l-33.9-33.9-11.3 11.3L96.4 208 107.7 219.3l-11.3 11.3L56.4 272l-11.3 11.3 33.9 33.9 11.3-11.3L176 335.6l33.9-33.9 11.3 11.3 11.3-11.3 33.9 33.9 11.3 11.3 50.5 50.5-11.3 11.3-33.9-33.9-11.3 11.3L272 335.6l33.9 33.9-11.3 11.3 11.3 11.3 33.9-33.9 11.3-11.3 50.5-50.5-11.3-11.3-33.9 33.9-11.3-11.3L335.6 272l33.9 33.9 11.3-11.3 11.3 11.3 33.9-33.9 11.3-11.3L455.6 272l-11.3-11.3 33.9-33.9 11.3 11.3z"/>
            </svg>
            <path d="M410.3 231l11.3-11.3-33.9-33.9-11.3 11.3-50.5-50.5 11.3-11.3 33.9-33.9-11.3-11.3-11.3 11.3-33.9-33.9-11.3 11.3L272 176.4l-33.9-33.9-11.3 11.3-11.3-11.3-33.9 33.9-11.3-11.3L135.4 176l-11.3-11.3-33.9 33.9 11.3 11.3-50.5 50.5 11.3 11.3 33.9-33.9 11.3 11.3L176.4 272l33.9-33.9 11.3 11.3 11.3-11.3 33.9 33.9-11.3 11.3 50.5 50.5-11.3 11.3-33.9-33.9-11.3 11.3L231 410.3l11.3-11.3-33.9-33.9-11.3 11.3-50.5-50.5 11.3-11.3 33.9-33.9-11.3-11.3L176 231l-33.9-33.9-11.3 11.3L96.4 208 107.7 219.3l-11.3 11.3L56.4 272l-11.3 11.3 33.9 33.9 11.3-11.3L176 335.6l33.9-33.9 11.3 11.3 11.3-11.3 33.9 33.9 11.3 11.3 50.5 50.5-11.3 11.3-33.9-33.9-11.3 11.3L272 335.6l33.9 33.9-11.3 11.3 11.3 11.3 33.9-33.9 11.3-11.3 50.5-50.5-11.3-11.3-33.9 33.9-11.3-11.3L335.6 272l33.9 33.9 11.3-11.3 11.3 11.3 33.9-33.9 11.3-11.3L455.6 272l-11.3-11.3 33.9-33.9 11.3 11.3z"/>
            </svg>
        `;
        editBtn.onclick = () => exibirModalEdicao(dados.docId, dados);
        acoesCelula.appendChild(editBtn);

        // Botão de Excluir
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'botao-acao';
        deleteBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.7C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
            </svg>
        `;
        deleteBtn.onclick = () => exibirModalConfirmacao(dados.docId);
        acoesCelula.appendChild(deleteBtn);
    });
}

// Escuta os dados do Firestore em tempo real
function startDataListener() {
    if (!userId) {
        console.error("ID do usuário não disponível. O listener não pode ser iniciado.");
        return;
    }

    const collectionPath = `artifacts/${appId}/users/${userId}/controles`;
    db.collection(collectionPath)
      .onSnapshot(querySnapshot => {
          todosOsDados = [];
          dadosPorDisciplina = {};
          querySnapshot.forEach(doc => {
              const data = doc.data();
              const docWithId = { ...data, docId: doc.id };
              todosOsDados.push(docWithId);

              // Agrupa os dados por disciplina
              if (data.disciplinas && data.disciplinas.length > 0) {
                  data.disciplinas.forEach(disciplina => {
                      const disciplinaFormatada = disciplina.toUpperCase();
                      if (!dadosPorDisciplina[disciplinaFormatada]) {
                          dadosPorDisciplina[disciplinaFormatada] = [];
                      }
                      dadosPorDisciplina[disciplinaFormatada].push(docWithId);
                  });
              }
          });

          renderizarTabelaGeral(todosOsDados);
          criarBotoesDeFiltro();
      }, error => {
          console.error("Erro ao buscar documentos:", error);
      });
}

// Cria os botões para cada disciplina
function criarBotoesDeFiltro() {
    botoesContainer.innerHTML = '';
    for (const disciplina in dadosPorDisciplina) {
        const button = document.createElement('button');
        button.textContent = disciplina;
        button.classList.add('button-discipline');
        button.addEventListener('click', () => exibirRelatorioPorDisciplina(disciplina));
        botoesContainer.appendChild(button);
    }
}

// Exibe o relatório de uma única disciplina
function exibirRelatorioPorDisciplina(disciplina) {
    relatorioGeral.style.display = 'none';
    relatorioDisciplinaUnica.style.display = 'block';
    voltarGeralBtn.style.display = 'block';
    const dadosFiltrados = dadosPorDisciplina[disciplina.toUpperCase()] || [];
    renderizarTabelaDisciplina(dadosFiltrados);
}

// Exibe o relatório geral novamente
voltarGeralBtn.addEventListener('click', () => {
    relatorioGeral.style.display = 'block';
    relatorioDisciplinaUnica.style.display = 'none';
    voltarGeralBtn.style.display = 'none';
    renderizarTabelaGeral(todosOsDados);
});

// Exibir modal de confirmação de exclusão
function exibirModalConfirmacao(docId) {
    docToDeleteId = docId;
    confirmModal.style.display = 'flex';
}

// Ocultar modal de confirmação de exclusão
function ocultarModalConfirmacao() {
    confirmModal.style.display = 'none';
    docToDeleteId = null;
}

// Lógica de exclusão do documento
confirmDeleteBtn.addEventListener('click', async () => {
    if (docToDeleteId) {
        const docRef = db.collection(`artifacts/${appId}/users/${userId}/controles`).doc(docToDeleteId);
        try {
            await docRef.delete();
            console.log("Documento excluído com sucesso!");
        } catch (error) {
            console.error("Erro ao remover documento:", error);
        }
    }
    ocultarModalConfirmacao();
});

cancelDeleteBtn.addEventListener('click', ocultarModalConfirmacao);


// Exibir modal de edição
function exibirModalEdicao(docId, dados) {
    docToEditId = docId;
    document.getElementById('edit-professor').value = dados.professor || '';
    document.getElementById('edit-sala').value = dados.sala || '';
    document.getElementById('edit-data').value = dados.data || '';
    document.getElementById('edit-motivos').value = (dados.motivos || []).join(', ');
    document.getElementById('edit-observacao').value = dados.observacao || '';
    editModal.style.display = 'flex';
}

// Ocultar modal de edição
function ocultarModalEdicao() {
    editModal.style.display = 'none';
    docToEditId = null;
}

// Lógica de edição do documento
editForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (docToEditId) {
        const updatedData = {
            professor: document.getElementById('edit-professor').value,
            sala: document.getElementById('edit-sala').value,
            data: document.getElementById('edit-data').value,
            motivos: document.getElementById('edit-motivos').value.split(',').map(m => m.trim()).filter(m => m),
            observacao: document.getElementById('edit-observacao').value,
        };

        const docRef = db.collection(`artifacts/${appId}/users/${userId}/controles`).doc(docToEditId);
        try {
            await docRef.update(updatedData);
            console.log("Documento atualizado com sucesso!");
        } catch (error) {
            console.error("Erro ao atualizar documento:", error);
        }
    }
    ocultarModalEdicao();
});

cancelEditBtn.addEventListener('click', ocultarModalEdicao);

