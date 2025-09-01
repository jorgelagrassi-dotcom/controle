/* ========= Firebase ========= */
var firebaseConfig = {
  apiKey: "AIzaSyDUE4ioFbh56t4vfI2MF_3Gi0z97ebslp0",
  authDomain: "justificativa-b5c71.firebaseapp.com",
  projectId: "justificativa-b5c71",
  storageBucket: "justificativa-b5c71.firebasestorage.app",
  messagingSenderId: "148699441670",
  appId: "1:148699441670:web:c78fe0b1bfbee992bf7187",
  measurementId: "G-4W498B878H"
};
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); } else { firebase.app(); }
const db = firebase.firestore();

/* ========= Referências de DOM ========= */
const tabelaCorpoGeral = document.querySelector('#tabela-relatorio tbody');
const tabelaCorpoDisciplina = document.querySelector('#tabela-disciplina-unica tbody');
const relatorioGeral = document.getElementById('relatorio-geral');
const relatorioDisciplinaUnica = document.getElementById('relatorio-disciplina-unica');
const tituloDisciplina = document.getElementById('titulo-disciplina');
const botoesContainer = document.getElementById('buttons-disciplinas');
const botaoVoltarGeral = document.getElementById('voltar-geral');
const botaoExibirGraficos = document.getElementById('exibir-graficos');
const graficosContainer = document.getElementById('graficos-container');

const seletorAno = document.getElementById('filtro-ano');
const seletorMes = document.getElementById('filtro-mes');
const campoProfessor = document.getElementById('filtro-professor');
const botaoAplicar = document.getElementById('aplicar-filtros');
const botaoLimpar = document.getElementById('limpar-filtros');
const paginacaoContainer = document.getElementById('paginacao');

/* ========= Estado ========= */
let todosOsDados = [];           // Todos os docs da coleção
let dadosFiltrados = [];         // Resultado atual dos filtros
let dadosPorDisciplina = {};     // { DISCIPLINA: [docs] }
const REGISTROS_POR_PAGINA = 30;
let paginaAtual = 1;

/* ========= Utilitários ========= */
function seguroArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}
function formatarDataBR(yyyymmdd) {
  if (!yyyymmdd || typeof yyyymmdd !== 'string') return 'N/A';
  const [a,m,d] = yyyymmdd.split('-');
  if (!a || !m || !d) return yyyymmdd;
  return `${d}/${m}/${a.slice(-2)}`;
}
function limparTabela(tbody) {
  while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
}

/* ========= Filtros ========= */
function aplicarFiltros() {
  const anoSel = seletorAno.value;
  const mesSel = seletorMes.value;
  const profFiltro = (campoProfessor.value || '').toLowerCase().trim();

  dadosFiltrados = todosOsDados.filter(d => {
    let ok = true;

    // Filtro por ano/mês (campo data string YYYY-MM-DD)
    if (anoSel || mesSel) {
      if (d.data && typeof d.data === 'string' && d.data.includes('-')) {
        const [ano, mes] = d.data.split('-');
        if (anoSel && ano !== anoSel) ok = false;
        if (mesSel && mes !== mesSel) ok = false;
      } else {
        ok = false;
      }
    }

    // Filtro por professor
    if (ok && profFiltro) {
      const p = (d.professor || '').toLowerCase();
      ok = p.includes(profFiltro);
    }

    return ok;
  });

  // Se nenhum filtro ativo, mostra todos
  if (!anoSel && !mesSel && !profFiltro) {
    dadosFiltrados = [...todosOsDados];
  }

  exibirTabelaGeral(dadosFiltrados, 1);
}

/* ========= Paginação ========= */
function exibirTabelaGeral(lista, pagina) {
  paginaAtual = pagina;
  const inicio = (pagina - 1) * REGISTROS_POR_PAGINA;
  const fim = inicio + REGISTROS_POR_PAGINA;
  const registros = lista.slice(inicio, fim);

  limparTabela(tabelaCorpoGeral);
  registros.forEach(d => {
    const disciplinas = seguroArray(d.disciplinas).map(x => String(x).toUpperCase()).join(', ') || 'N/A';
    const motivos = seguroArray(d.motivos).map(x => String(x).replace(/-/g,' ')).join(', ') || 'N/A';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${d.professor || 'N/A'}</td>
      <td>${d.sala || 'N/A'}</td>
      <td>${formatarDataBR(d.data)}</td>
      <td>${disciplinas}</td>
      <td>${motivos}</td>
      <td>${d.observacao || 'N/A'}</td>
      <td class="acoes-celula"></td>
    `;
    adicionarBotoesAcao(tr.querySelector('.acoes-celula'), d._id);
    tabelaCorpoGeral.appendChild(tr);
  });

  gerarPaginacao(lista.length, pagina);
  // Garantir que a seção correta esteja visível
  relatorioGeral.style.display = 'block';
  relatorioDisciplinaUnica.style.display = 'none';
  graficosContainer.style.display = 'none';
  botaoVoltarGeral.style.display = 'none';
  botaoExibirGraficos.style.display = 'inline-block';
}

function gerarPaginacao(total, pagina) {
  paginacaoContainer.innerHTML = '';
  const totalPaginas = Math.ceil(total / REGISTROS_POR_PAGINA) || 1;

  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === pagina) btn.classList.add('ativo');
    btn.addEventListener('click', () => exibirTabelaGeral(dadosFiltrados, i));
    paginacaoContainer.appendChild(btn);
  }
}

/* ========= Relatório por disciplina ========= */
function exibirRelatorioPorDisciplina(nomeDisciplina) {
  const lista = dadosPorDisciplina[nomeDisciplina] || [];

  tituloDisciplina.textContent = `Plataforma: ${nomeDisciplina}`;
  limparTabela(tabelaCorpoDisciplina);

  lista.forEach(d => {
    const motivos = seguroArray(d.motivos).map(x => String(x).replace(/-/g,' ')).join(', ') || 'N/A';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${d.professor || 'N/A'}</td>
      <td>${d.sala || 'N/A'}</td>
      <td>${formatarDataBR(d.data)}</td>
      <td>${motivos}</td>
      <td>${d.observacao || 'N/A'}</td>
      <td class="acoes-celula"></td>
    `;
    adicionarBotoesAcao(tr.querySelector('.acoes-celula'), d._id);
    tabelaCorpoDisciplina.appendChild(tr);
  });

  // Troca de telas
  relatorioGeral.style.display = 'none';
  relatorioDisciplinaUnica.style.display = 'block';
  graficosContainer.style.display = 'none';
  botaoVoltarGeral.style.display = 'inline-block';
  botaoExibirGraficos.style.display = 'inline-block';
}

/* ========= Ações ========= */
async function deletarRegistro(docId) {
  const ok = confirm('Tem certeza que deseja excluir este registro?');
  if (!ok) return;
  try {
    await db.collection('controles').doc(docId).delete();
    alert('Registro excluído!');
  } catch (e) {
    console.error(e);
    alert('Erro ao excluir registro.');
  }
}
function adicionarBotoesAcao(container, docId) {
  const btnApagar = document.createElement('button');
  btnApagar.textContent = 'Apagar';
  btnApagar.className = 'botao-acao apagar';
  btnApagar.addEventListener('click', () => deletarRegistro(docId));
  container.appendChild(btnApagar);
}

/* ========= Construção de botões de disciplinas ========= */
function montarBotoesDisciplinas() {
  botoesContainer.innerHTML = '';
  const nomes = Object.keys(dadosPorDisciplina).sort();
  nomes.forEach(nome => {
    const btn = document.createElement('button');
    btn.textContent = nome;
    btn.className = 'button-discipline';
    btn.addEventListener('click', () => exibirRelatorioPorDisciplina(nome));
    botoesContainer.appendChild(btn);
  });
}

/* ========= Gráficos (simples) ========= */
let graficoMotivos, graficoDisciplinas;
function criarGraficos(lista) {
  // Motivos contagem
  const contMotivos = {};
  lista.forEach(d => {
    seguroArray(d.motivos).forEach(m => {
      const key = String(m).replace(/-/g,' ').trim();
      contMotivos[key] = (contMotivos[key] || 0) + 1;
    });
  });
  const ctxM = document.getElementById('graficoMotivosBarras');
  if (ctxM) {
    if (graficoMotivos) graficoMotivos.destroy();
    graficoMotivos = new Chart(ctxM, {
      type:'bar',
      data:{
        labels:Object.keys(contMotivos),
        datasets:[{ label:'Quantidade', data:Object.values(contMotivos) }]
      },
      options:{ responsive:true, plugins:{ legend:{display:false} }, scales:{ y:{ beginAtZero:true } } }
    });
  }

  // Disciplinas contagem
  const contDisc = {};
  lista.forEach(d => {
    seguroArray(d.disciplinas).forEach(x => {
      const key = String(x).toUpperCase().trim();
      contDisc[key] = (contDisc[key] || 0) + 1;
    });
  });
  const ctxD = document.getElementById('graficoDisciplinasBarras');
  if (ctxD) {
    if (graficoDisciplinas) graficoDisciplinas.destroy();
    graficoDisciplinas = new Chart(ctxD, {
      type:'bar',
      data:{
        labels:Object.keys(contDisc),
        datasets:[{ label:'Quantidade', data:Object.values(contDisc) }]
      },
      options:{ responsive:true, plugins:{ legend:{display:false} }, scales:{ y:{ beginAtZero:true } } }
    });
  }
}

/* ========= Preencher anos dinamicamente ========= */
function preencherAnosDisponiveis() {
  const anos = new Set();
  todosOsDados.forEach(d => {
    if (d.data && d.data.includes('-')) {
      const ano = d.data.split('-')[0];
      if (ano) anos.add(ano);
    }
  });
  const ordenados = Array.from(anos).sort();
  // Mantém "Todos" como primeira opção
  seletorAno.innerHTML = '<option value="">Todos</option>' + ordenados.map(a => `<option value="${a}">${a}</option>`).join('');
}

/* ========= Listeners de UI ========= */
botaoVoltarGeral.addEventListener('click', () => {
  relatorioGeral.style.display = 'block';
  relatorioDisciplinaUnica.style.display = 'none';
  graficosContainer.style.display = 'none';
  botaoVoltarGeral.style.display = 'none';
});
botaoExibirGraficos.addEventListener('click', () => {
  relatorioGeral.style.display = 'none';
  relatorioDisciplinaUnica.style.display = 'none';
  graficosContainer.style.display = 'block';
  botaoVoltarGeral.style.display = 'inline-block';
});
botaoAplicar.addEventListener('click', aplicarFiltros);
botaoLimpar.addEventListener('click', () => {
  seletorAno.value = '';
  seletorMes.value = '';
  campoProfessor.value = '';
  aplicarFiltros();
});
campoProfessor.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') aplicarFiltros();
});

/* ========= Firestore: carregar dados ========= */
db.collection('controles').orderBy('data','desc').onSnapshot((qs) => {
  todosOsDados = [];
  dadosPorDisciplina = {};

  qs.forEach(doc => {
    const d = doc.data() || {};
    const registro = {
      _id: doc.id,
      professor: d.professor || '',
      sala: d.sala || '',
      data: d.data || '',            // esperado YYYY-MM-DD
      horario: d.horario || '',
      disciplinas: seguroArray(d.disciplinas),
      motivos: seguroArray(d.motivos),
      observacao: d.observacao || ''
    };
    todosOsDados.push(registro);

    // Indexar por disciplina (para os botões dinâmicos)
    registro.disciplinas.forEach(raw => {
      const nome = String(raw).toUpperCase().trim();
      if (!nome) return;
      if (!dadosPorDisciplina[nome]) dadosPorDisciplina[nome] = [];
      dadosPorDisciplina[nome].push(registro);
    });
  });

  // Construir botões e filtros
  montarBotoesDisciplinas();
  preencherAnosDisponiveis();

  // Exibir relatório geral com filtros aplicados (ou todos se vazio)
  aplicarFiltros();

  // Atualizar gráficos
  criarGraficos(todosOsDados);
}, (err) => {
  console.error('Erro ao ouvir Firestore:', err);
});
