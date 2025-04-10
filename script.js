// Inicialização
let temas = [];
let disciplinaSelecionada = null;
let quillEditor = null;
let editandoIndice = null;

// Verifica se localStorage está disponível
function storageDisponivel() {
  try {
    const teste = '__storage_test__';
    localStorage.setItem(teste, teste);
    localStorage.removeItem(teste);
    return true;
  } catch (e) {
    console.warn("LocalStorage indisponível ou desativado:", e);
    return false;
  }
}

if (storageDisponivel()) {
  const dados = localStorage.getItem('temas');
  try {
    temas = JSON.parse(dados) || [];
  } catch (e) {
    console.warn("Erro ao ler dados do localStorage:", e);
    temas = [];
  }
} else {
  alert("O armazenamento local (localStorage) está desativado ou indisponível. Use outro navegador ou ajuste as configurações de privacidade.");
}

// Selecionar disciplina
function selecionarDisciplina(nome) {
  disciplinaSelecionada = nome;
  document.getElementById('disciplina-titulo').textContent = `Disciplina: ${nome}`;
  document.getElementById('gerenciar-disciplina').style.display = 'block';
  document.getElementById('formulario-tema').innerHTML = '';
  document.getElementById('resultado-busca').innerHTML = '';
  document.getElementById('busca-tema').value = '';
  document.getElementById('campo-busca').style.display = 'block';
  filtrarTemas();
}

// Mostrar formulário para adicionar/editar tema
function mostrarFormularioTema() {
  const formHTML = gerarFormularioTema();
  document.getElementById('formulario-tema').innerHTML = formHTML;
  document.getElementById('campo-busca').style.display = 'none';
  document.getElementById('resultado-busca').innerHTML = '';

  quillEditor = new Quill('#editor', {
    theme: 'snow',
    placeholder: 'Digite o conteúdo do tema...',
    modules: {
      toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['clean']
      ]
    }
  });

  editandoIndice = null;
}

// Função para gerar o formulário de tema (reutilizada em adicionar e editar)
function gerarFormularioTema(titulo = '', conteudo = '') {
  return `
    <input type="text" id="titulo-tema" value="${titulo}" placeholder="Título do Tema" />
    <div id="editor" style="height: 200px;"></div>
    <button onclick="salvarTema()">📅 Salvar Tema</button>

    <hr>
    <div id="bloco-questoes">
      <h4>Adicionar Questão</h4>
      <textarea id="enunciado-questao" placeholder="Digite o enunciado da questão..." rows="3" style="width: 100%"></textarea>

      <label for="quantidade-alternativas">Número de Alternativas:</label>
      <select id="quantidade-alternativas" onchange="gerarCamposAlternativas()">
        <option value="">Selecione</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
      </select>

      <div id="alternativas-container"></div>

      <textarea id="comentario-questao" placeholder="Comentário sobre o tema (opcional)" rows="2" style="width: 100%; margin-top: 10px;"></textarea>

      <button onclick="salvarQuestao()">➕ Salvar Questão</button>
    </div>
  `;
}

// Salvar tema
function salvarTema() {
  const titulo = document.getElementById('titulo-tema').value.trim();
  const conteudo = quillEditor ? quillEditor.root.innerHTML : '';

  if (!titulo || !conteudo || !disciplinaSelecionada) {
    alert('Por favor, preencha o título, o conteúdo e selecione uma disciplina.');
    return;
  }

  const questoes = editandoIndice !== null ? temas[editandoIndice].questoes || [] : [];

  const novoTema = {
    titulo,
    conteudo,
    disciplina: disciplinaSelecionada,
    questoes
  };

  if (editandoIndice !== null) {
    temas[editandoIndice] = novoTema;
    editandoIndice = null;
  } else {
    temas.push(novoTema);
  }

  if (storageDisponivel()) {
    try {
      localStorage.setItem('temas', JSON.stringify(temas));
    } catch (e) {
      console.error("Erro ao salvar no localStorage:", e);
    }
  }

  document.getElementById('formulario-tema').innerHTML = '';
  document.getElementById('busca-tema').value = '';
  document.getElementById('resultado-busca').innerHTML = '';
  alert('Tema salvo com sucesso!');
  document.getElementById('campo-busca').style.display = 'block';
  filtrarTemas();
}

// Filtrar temas por disciplina e busca
function filtrarTemas() {
  const termo = document.getElementById('busca-tema').value.toLowerCase().trim();
  const resultados = document.getElementById('resultado-busca');
  resultados.innerHTML = '';

  const temasFiltrados = temas.filter(t =>
    t.disciplina === disciplinaSelecionada &&
    (!termo || t.titulo.toLowerCase().includes(termo))
  );

  if (temasFiltrados.length === 0) {
    resultados.innerHTML = '<p>Nenhum tema encontrado.</p>';
    return;
  }

  temasFiltrados.forEach((tema, index) => {
    const card = document.createElement('div');
    card.className = 'tema-card';
    card.innerHTML = `
      <h3>${tema.titulo}</h3>
      <div>${tema.conteudo}</div>
      <button onclick="editarTema(${index})">✏️ Editar</button>
      <button onclick="excluirTema(${index})">🗑️ Excluir</button>
    `;
    resultados.appendChild(card);
  });
}

// Editar tema
function editarTema(index) {
  const tema = temas[index];
  if (!tema || tema.disciplina !== disciplinaSelecionada) return;

  const formHTML = gerarFormularioTema(tema.titulo, tema.conteudo);
  document.getElementById('formulario-tema').innerHTML = formHTML;

  quillEditor = new Quill('#editor', {
    theme: 'snow',
    placeholder: 'Digite o conteúdo do tema...',
    modules: {
      toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['clean']
      ]
    }
  });

  quillEditor.root.innerHTML = tema.conteudo;
  editandoIndice = index;
}

// Excluir tema
function excluirTema(index) {
  if (confirm('Deseja excluir este tema?')) {
    temas.splice(index, 1);
    if (storageDisponivel()) {
      try {
        localStorage.setItem('temas', JSON.stringify(temas));
      } catch (e) {
        console.error("Erro ao atualizar localStorage:", e);
      }
    }
    document.getElementById('formulario-tema').innerHTML = '';
    document.getElementById('resultado-busca').innerHTML = '';
    filtrarTemas();
  }
}

// Gerar campos de alternativas para questões
function gerarCamposAlternativas() {
  const container = document.getElementById('alternativas-container');
  container.innerHTML = '';

  const qtd = parseInt(document.getElementById('quantidade-alternativas').value);
  for (let i = 0; i < qtd; i++) {
    const letra = String.fromCharCode(65 + i);
    container.innerHTML += `
      <div style="margin-top:5px">
        <input type="radio" name="correta" value="${i}" id="alt${i}">
        <label for="alt${i}"><strong>${letra})</strong></label>
        <input type="text" id="texto-alt${i}" placeholder="Alternativa ${letra}" style="width: 80%">
      </div>
    `;
  }
}

// Salvar questão e vincular ao tema atual
function salvarQuestao() {
  const enunciado = document.getElementById('enunciado-questao').value.trim();
  const qtd = parseInt(document.getElementById('quantidade-alternativas').value);
  const comentario = document.getElementById('comentario-questao').value.trim();

  if (!enunciado || isNaN(qtd) || qtd < 2) {
    alert("Preencha o enunciado e selecione uma quantidade válida de alternativas.");
    return;
  }

  const alternativas = [];
  let corretaIndex = -1;

  for (let i = 0; i < qtd; i++) {
    const texto = document.getElementById(`texto-alt${i}`).value.trim();
    if (!texto) {
      alert(`Preencha a alternativa ${String.fromCharCode(65 + i)}`);
      return;
    }
    alternativas.push(texto);
    if (document.getElementById(`alt${i}`).checked) {
      corretaIndex = i;
    }
  }

  if (corretaIndex === -1) {
    alert("Selecione a alternativa correta.");
    return;
  }

  const novaQuestao = {
    enunciado,
    alternativas,
    correta: corretaIndex,
    comentario
  };

  if (editandoIndice !== null) {
    temas[editandoIndice].questoes = temas[editandoIndice].questoes || [];
    temas[editandoIndice].questoes.push(novaQuestao);
  }

  if (storageDisponivel()) {
    try {
      localStorage.setItem('temas', JSON.stringify(temas));
    } catch (e) {
      console.error("Erro ao salvar questão no localStorage:", e);
    }
  }

  alert("Questão salva com sucesso!");
  document.getElementById('enunciado-questao').value = '';
  document.getElementById('quantidade-alternativas').value = '';
  document.getElementById('comentario-questao').value = '';
  document.getElementById('alternativas-container').innerHTML = '';

  // Reexibir as questões
  mostrarQuestoesSalvas();
}

// Exibe as questões salvas (caso esteja editando)
function mostrarQuestoesSalvas() {
  if (editandoIndice === null || !temas[editandoIndice].questoes) return;

  const bloco = document.getElementById('bloco-questoes');
  const questoes = temas[editandoIndice].questoes;

  let html = '<h4>Questões Salvas</h4>';
  questoes.forEach((q, i) => {
    html += `
      <div style="border:1px solid #ccc; padding:10px; margin-top:10px;">
        <strong>${i + 1}.</strong> ${q.enunciado}<br>
        ${q.alternativas.map((alt, idx) => `
          ${String.fromCharCode(65 + idx)}) ${alt} ${q.correta === idx ? "<strong>(Correta)</strong>" : ""}
        `).join('<br>')}
        ${q.comentario ? `<p><em>Comentário:</em> ${q.comentario}</p>` : ''}
      </div>
    `;
  });

  bloco.insertAdjacentHTML('beforeend', html);
}

