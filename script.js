// Inicialização
let temas = [];
let disciplinaSelecionada = null;
let quillEditor = null;
let editandoIndice = localStorage.getItem('editandoIndice') ? parseInt(localStorage.getItem('editandoIndice')) : null;

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

// Carrega dados do localStorage se disponível
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

// Seleciona uma disciplina
function selecionarDisciplina(nome) {
    disciplinaSelecionada = nome;
    document.getElementById('disciplina-titulo').textContent = `Disciplina: ${nome}`;
    document.getElementById('gerenciar-disciplina').classList.remove('escondido');
    document.getElementById('formulario-tema').innerHTML = '';
    document.getElementById('resultado-busca').innerHTML = '';
    document.getElementById('busca-tema').value = '';
    document.getElementById('campo-busca').classList.remove('escondido');
    document.getElementById('bloco-questoes').classList.add('escondido');
    document.getElementById('conteudo-estudo').classList.add('escondido');
    filtrarTemas();
}

// Gera o formulário de tema
function gerarFormularioTema(titulo = '', conteudo = '') {
    return `
        <input type="text" id="titulo-tema" value="${titulo}" placeholder="Título do Tema" />
        <div id="editor" style="height: 200px;"></div>
        <button onclick="salvarTema()">Salvar Tema</button>
        <button onclick="mostrarFormularioQuestao()">Adicionar Questão</button>
        <hr>
        <div id="formulario-questao" class="escondido">
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
            <label for="correta">Alternativa Correta:</label>
            <select id="correta"></select>
            <textarea id="comentario-questao" placeholder="Comentário sobre o tema (opcional)" rows="2" style="width: 100%; margin-top: 10px;"></textarea>
            <button onclick="salvarQuestao()">➕ Salvar Questão</button>
            <button onclick="cancelarQuestao()">Cancelar</button>
        </div>
        <div id="bloco-questoes">
            <h4>Questões Salvas</h4>
            <div id="questoes-salvas"></div>
        </div>
    `;
}

// Mostra o formulário de questão
function mostrarFormularioQuestao() {
    document.getElementById('formulario-questao').classList.remove('escondido');
    // Inicializa o editor Quill.js para o campo de comentário
    quillEditorComentario = new Quill('#editor-comentario', {
        theme: 'snow',
        placeholder: 'Digite o comentário da questão (opcional)',
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
    // Limpa o conteúdo do editor de comentário
    quillEditorComentario.root.innerHTML = '';
}

// Salva um tema
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
    document.getElementById('campo-busca').classList.remove('escondido');
    filtrarTemas();
}

// Filtra temas por disciplina e busca
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
            <button onclick="abrirTema(${index})">Abrir Tema</button>
            <button onclick="editarTema(${index})">✏️ Editar</button>
            <button onclick="excluirTema(${index})">️ Excluir</button>
        `;
        resultados.appendChild(card);
    });
    // Exibe o botão "Adicionar Novo Tema" apenas se a lista de temas estiver sendo exibida
    if (document.getElementById('resultado-busca').innerHTML !== '') {
        document.querySelector('#gerenciar-disciplina button').style.display = 'inline-block';
    } else {
        document.querySelector('#gerenciar-disciplina button').style.display = 'none';
    }
}

// Abre um tema para estudo
function abrirTema(index) {
    const tema = temas[index];
    if (!tema || tema.disciplina !== disciplinaSelecionada) return;
    const conteudoEstudo = document.getElementById('conteudo-estudo');
    conteudoEstudo.innerHTML = `
        <h2>${tema.titulo}</h2>
        <div>${tema.conteudo}</div>
        <button onclick="responderQuestoes(${index})">Responder Questões</button>
    `;
    conteudoEstudo.classList.remove('escondido');
    // Oculta o formulário de tema, o campo de busca e os demais temas
    document.getElementById('formulario-tema').innerHTML = '';
    document.getElementById('campo-busca').classList.add('escondido');
    document.getElementById('resultado-busca').innerHTML = '';
    document.getElementById('formulario-questao').classList.add('escondido'); // Oculta o formulário de questão
    // Oculta o botão "Adicionar Novo Tema"
    document.querySelector('#gerenciar-disciplina button').style.display = 'none';
    // Exibe o título do tema na seção #disciplina-titulo
    document.getElementById('disciplina-titulo').textContent = `Tema: ${tema.titulo}`;
}

// Edita um tema existente
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
    localStorage.setItem('editandoIndice', editandoIndice); // Armazena o editandoIndice no localStorage
    mostrarQuestoesSalvas();
    // Oculta o campo de busca e os demais temas
    document.getElementById('campo-busca').classList.add('escondido');
    document.getElementById('resultado-busca').innerHTML = '';
    // Atualiza o título da seção para o título do tema
    document.getElementById('disciplina-titulo').textContent = `Editando Tema: ${tema.titulo}`;
    // Oculta o botão "Adicionar Novo Tema"
    document.querySelector('#gerenciar-disciplina button').style.display = 'none';
}

// Exclui um tema
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
        editandoIndice = null; // Redefine editandoIndice para null
    }
}

// Gera campos de alternativas para questões
function gerarCamposAlternativas() {
    const container = document.getElementById('alternativas-container');
    container.innerHTML = ''; // Limpa os campos anteriores
    const numAlternativas = parseInt(document.getElementById('quantidade-alternativas').value);
    for (let i = 0; i < numAlternativas; i++) {
        const letra = String.fromCharCode(65 + i); // A, B, C, D, E
        container.innerHTML += `
            <label for="alternativa${letra}">Alternativa ${letra}:</label>
            <input type="text" id="alternativa${letra}" placeholder="Alternativa ${letra}" />
        `;
    }
    // Atualiza as opções do campo "Alternativa Correta"
    const corretaSelect = document.getElementById('correta');
    corretaSelect.innerHTML = '';
    for (let i = 0; i < numAlternativas; i++) {
        const letra = String.fromCharCode(65 + i);
        corretaSelect.innerHTML += `<option value="${letra}">${letra}</option>`;
    }
}

function salvarQuestao() {
    const enunciado = document.getElementById('enunciado-questao').value.trim();
    const numAlternativas = parseInt(document.getElementById('quantidade-alternativas').value);
    const alternativas = [];
    for (let i = 0; i < numAlternativas; i++) {
        const letra = String.fromCharCode(65 + i);
        alternativas.push(document.getElementById(`alternativa${letra}`).value.trim());
    }
    const correta = document.getElementById('correta').value;
    const comentario = quillEditorComentario.root.innerHTML; // Obtém o conteúdo formatado do editor

    if (!enunciado || alternativas.some(alt => !alt) || !correta) {
        alert("Por favor, preencha todos os campos da questão.");
        return;
    }

    const novaQuestao = {
        enunciado,
        alternativas,
        correta,
        comentario
    };

    const temaAtual = temas[editandoIndice];
    temaAtual.questoes = temaAtual.questoes || [];

    const editandoIndex = document.querySelector('#formulario-questao button[onclick="salvarQuestao()"]').getAttribute('data-editando');

    if (editandoIndex !== null) {
        // Atualiza a questão existente
        temaAtual.questoes[editandoIndex] = novaQuestao;
        document.querySelector('#formulario-questao button[onclick="salvarQuestao()"]').removeAttribute('data-editando');
        document.querySelector('#formulario-questao button[onclick="salvarQuestao()"]').textContent = "➕ Salvar Questão";
    } else {
        // Adiciona uma nova questão
        temaAtual.questoes.push(novaQuestao);
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
    for (let i = 0; i < 5; i++) {
        const letra = String.fromCharCode(65 + i);
        const inputAlt = document.getElementById(`alternativa${letra}`);
        if (inputAlt) inputAlt.value = '';
    }
    document.getElementById('correta').value = '';
    quillEditorComentario.root.innerHTML = ''; // Limpa o conteúdo do editor de comentário
    document.getElementById('formulario-questao').classList.add('escondido');
    mostrarQuestoesSalvas();
}

function mostrarQuestoesSalvas() {
    if (editandoIndice === null) return;
    const temaAtual = temas[editandoIndice];
    if (!temaAtual || !temaAtual.questoes) return;
    const container = document.getElementById('questoes-salvas');
    container.innerHTML = '';
    const questoes = temaAtual.questoes;
    let html = '';
    questoes.forEach((q, i) => {
        html += `
            <div style="border:1px solid #ccc; padding:10px; margin-top:10px;">
                <strong>${i + 1}.</strong> ${q.enunciado}<br>
                <form id="questao-${i}">
                    ${q.alternativas.map((alt, idx) => `
                        <label>
                            <input type="radio" name="resposta-${i}" value="${String.fromCharCode(65 + idx)}">
                            ${String.fromCharCode(65 + idx)}) ${alt}
                        </label><br>
                    `).join('')}
                    <button type="button" onclick="verificarResposta(${i})">Verificar</button>
                    <button type="button" onclick="editarQuestao(${i})" data-questao-index="${i}">Editar</button>
                    <button type="button" onclick="excluirQuestao(${i})">Excluir</button>
                </form>
                <p id="comentario-${i}" style="margin-top: 10px;">
                    <strong>Resposta:</strong> ${q.correta}<br>
                    <strong>Comentário:</strong> ${q.comentario || 'Nenhum comentário.'}
                </p>
            </div>
        `;
    });
    container.innerHTML = html;
}

// Verifica a resposta de uma questão
function verificarResposta(questaoIndex) {
    const questao = temas[editandoIndice].questoes[questaoIndex];
    const respostaSelecionada = document.querySelector(`input[name="resposta-${questaoIndex}"]:checked`);
    if (!respostaSelecionada) {
        alert("Selecione uma resposta.");
        return;
    }
    const respostaLetra = respostaSelecionada.value;
    const comentarioElement = document.getElementById(`comentario-${questaoIndex}`);
    if (respostaLetra === questao.correta) {
        comentarioElement.innerHTML = `Resposta correta! ${questao.comentario || ''}`;
        comentarioElement.style.color = 'green';
    } else {
        comentarioElement.innerHTML = `Resposta incorreta. A correta é ${questao.correta}. ${questao.comentario || ''}`;
        comentarioElement.style.color = 'red';
    }
}

function editarQuestao(questaoIndex) {
    const questao = temas[editandoIndice].questoes[questaoIndex];
    // Preenche o formulário de questão com os dados da questão selecionada
    document.getElementById('enunciado-questao').value = questao.enunciado;
    document.getElementById('quantidade-alternativas').value = questao.alternativas.length;
    gerarCamposAlternativas(); // Gera os campos de alternativas
    for (let i = 0; i < questao.alternativas.length; i++) {
        document.getElementById(`alternativa${String.fromCharCode(65 + i)}`).value = questao.alternativas[i];
    }
    document.getElementById('correta').value = questao.correta;
    // Preenche o conteúdo do editor de comentário
    quillEditorComentario.root.innerHTML = questao.comentario;
    // Atualiza o texto do botão "Salvar Questão" para "Atualizar Questão"
    document.querySelector('#formulario-questao button[onclick="salvarQuestao()"]').textContent = "Atualizar Questão";
    // Adiciona um atributo "data-editando" ao botão "Salvar Questão" para indicar que estamos editando
    document.querySelector('#formulario-questao button[onclick="salvarQuestao()"]').setAttribute('data-editando', questaoIndex);
    document.getElementById('formulario-questao').classList.remove('escondido');
}

// Exclui uma questão
function excluirQuestao(questaoIndex) {
    if (confirm('Deseja excluir esta questão?')) {
        temas[editandoIndice].questoes.splice(questaoIndex, 1);
        mostrarQuestoesSalvas();
        // Atualiza o localStorage com as alterações
        if (storageDisponivel()) {
            try {
                localStorage.setItem('temas', JSON.stringify(temas));
            } catch (e) {
                console.error("Erro ao atualizar localStorage:", e);
            }
        }
    }
}

// Responde às questões de um tema
function responderQuestoes(index) {
    const tema = temas[index];
    if (!tema || !tema.questoes || tema.questoes.length === 0) {
        alert("Este tema não possui questões cadastradas.");
        return;
    }
    const blocoQuestoes = document.getElementById('bloco-questoes');
    blocoQuestoes.innerHTML = '';
    tema.questoes.forEach((questao, i) => {
        let alternativasHTML = '';
        questao.alternativas.forEach((alt, j) => {
            const letra = String.fromCharCode(65 + j);
            alternativasHTML += `
                <label>
                    <input type="radio" name="resposta-${i}" value="${letra}">
                    ${letra}) ${alt}
                </label><br>
            `;
        });
        blocoQuestoes.innerHTML += `
            <div class="questao-salva">
                <p><strong>${i + 1}. ${questao.enunciado}</strong></p>
                <form id="questao-${i}">
                    ${alternativasHTML}
                    <button type="button" onclick="verificarResposta(${i})">Verificar</button>
                </form>
                <p id="comentario-${i}"></p>
            </div>
        `;
    });
    blocoQuestoes.classList.remove('escondido');
    document.getElementById('conteudo-estudo').classList.add('escondido'); // Oculta o conteúdo do estudo
    editandoIndice = index; // Define o editandoIndice para o tema atual
    localStorage.setItem('editandoIndice', editandoIndice); // Armazena o editandoIndice no localStorage
}

// Mostra o formulário para adicionar um novo tema
function mostrarFormularioTema() {
    const formularioTema = document.getElementById('formulario-tema');
    formularioTema.innerHTML = gerarFormularioTema(); // Usa a função gerarFormularioTema() para criar o formulário
    formularioTema.classList.remove('escondido'); // Exibe o formulário
    document.getElementById('campo-busca').classList.add('escondido'); // Oculta o campo de busca
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
}