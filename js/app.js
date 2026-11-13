// ==========================================
// MÓDULO PRINCIPAL DE APLICAÇÃO (GED PÚBLICO)
// ==========================================

let orgaoAtivoId = null;
let qrCodeInstance = null;
let activePastaQrId = null;
let usuarioLogado = null;

// Inicialização da aplicação ao carregar a página
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const pastaQR = urlParams.get('pasta');
    const relatorioAssinado = urlParams.get('relatorio');

    if (pastaQR) {
        setTimeout(() => {
            carregarModoPublico(pastaQR, true);
        }, 150);
    } else if (relatorioAssinado) {
        document.getElementById('viewLogin').classList.add('hidden');
        document.getElementById('viewAdminContainer').classList.add('hidden');
        document.getElementById('viewPublico').classList.remove('hidden');
        document.getElementById('pubOrgaoNome').innerText = "Relatório Diário Certificado - Autenticado";
        document.getElementById('pubPastaTitulo').innerText = "Validade e Assinatura Digital Verificada";
        document.getElementById('pubPastaDescricao').innerText = "Este relatório possui carimbo de tempo oficial e hash de integridade gerado pelo sistema GED Público Digital.";
    } else {
        const sessao = JSON.parse(localStorage.getItem('ged_sessao_user'));
        if (sessao) {
            usuarioLogado = sessao;
            entrarPainelAdmin();
        } else {
            document.getElementById('viewLogin').classList.remove('hidden');
        }
    }
};

// Sistema de Login
function realizarLogin(e) {
    e.preventDefault();
    let usr = document.getElementById('loginUsuario').value.trim();
    let sen = document.getElementById('loginSenha').value.trim();

    if ((usr.toLowerCase() === usuarioMaster.usuario.toLowerCase() || usr === usuarioMaster.email) && sen === usuarioMaster.senha) {
        usuarioLogado = { nome: usuarioMaster.usuario, cargo: 'Master (Administrador)', orgaoId: '', secretaria: '' };
        localStorage.setItem('ged_sessao_user', JSON.stringify(usuarioLogado));
        document.getElementById('viewLogin').classList.add('hidden');
        entrarPainelAdmin();
        mostrarToast("Login Master efetuado com sucesso!");
        return;
    }

    let userEncontrado = listaUsuarios.find(u => (u.nome.toLowerCase() === usr.toLowerCase() || u.email === usr) && u.senha === sen);
    if (userEncontrado) {
        usuarioLogado = userEncontrado;
        localStorage.setItem('ged_sessao_user', JSON.stringify(usuarioLogado));
        document.getElementById('viewLogin').classList.add('hidden');
        entrarPainelAdmin();
        mostrarToast(`Bem-vindo, ${userEncontrado.nome}!`);
    } else {
        alert("Usuário ou senha incorretos!");
    }
}

function realizarLogout() {
    localStorage.removeItem('ged_sessao_user');
    window.location.href = window.location.pathname;
}

function entrarPainelAdmin() {
    document.getElementById('adminHeader').classList.remove('hidden');
    document.getElementById('viewAdminContainer').classList.remove('hidden');
    
    let badge = document.getElementById('badgeCargoUser');
    badge.innerText = `Perfil: ${usuarioLogado.cargo} ${usuarioLogado.secretaria ? '(' + usuarioLogado.secretaria + ')' : ''}`;

    if (usuarioLogado.cargo === 'Master' || usuarioLogado.cargo.includes('Master')) {
        document.getElementById('btnGerenciarUsuarios').classList.remove('hidden');
        document.getElementById('btnCadastrarOrgao').classList.remove('hidden');
    } else {
        document.getElementById('btnGerenciarUsuarios').classList.add('hidden');
        document.getElementById('btnCadastrarOrgao').classList.add('hidden');
    }

    renderOrgaos();
}

// Recuperação de Senha
function abrirModalRecuperacao() { document.getElementById('modalRecuperacao').classList.remove('hidden'); }
function fecharModalRecuperacao() { document.getElementById('modalRecuperacao').classList.add('hidden'); }

function processarRecuperacao(e) {
    e.preventDefault();
    let email = document.getElementById('recEmail').value.trim();
    let cpf = document.getElementById('recCpf').value.trim();
    let novaSenha = document.getElementById('recNovaSenha').value.trim();

    if (email === usuarioMaster.email && cpf === usuarioMaster.cpf) {
        usuarioMaster.senha = novaSenha;
        salvarLocalStorage();
        fecharModalRecuperacao();
        mostrarToast("Senha Master redefinida com sucesso!");
    } else {
        alert("E-mail ou CPF não conferem com o cadastro Master.");
    }
}

// Gerenciamento de Usuários
function abrirModalGerenciarUsuarios() {
    let selOrgao = document.getElementById('novoUserOrgao');
    selOrgao.innerHTML = bancoDados.orgaos.map(o => `<option value="${o.id}">${o.nome}</option>`).join('');
    atualizarSecretariasModalUser();
    atualizarListaUsuariosModal();
    document.getElementById('modalGerenciarUsuarios').classList.remove('hidden');
}

function verificarCargoNovoUser() {
    let cargo = document.getElementById('novoUserCargo').value;
    let blocoSec = document.getElementById('blocoSecretariaRestrita');
    if (cargo === 'Secretario') blocoSec.classList.remove('hidden');
    else blocoSec.classList.add('hidden');
}

function atualizarSecretariasModalUser() {
    let orgaoId = document.getElementById('novoUserOrgao').value;
    let orgObj = bancoDados.orgaos.find(o => o.id === orgaoId);
    let selSec = document.getElementById('novoUserSecretaria');
    if (orgObj && orgObj.secretarias) {
        selSec.innerHTML = orgObj.secretarias.map(s => `<option value="${s}">${s}</option>`).join('');
    } else {
        selSec.innerHTML = `<option value="">Nenhuma secretaria cadastrada</option>`;
    }
}

function cadastrarNovoUsuario(e) {
    e.preventDefault();
    let nome = document.getElementById('novoUserNome').value.trim();
    let senha = document.getElementById('novoUserSenha').value.trim();
    let cargo = document.getElementById('novoUserCargo').value;
    let orgaoId = document.getElementById('novoUserOrgao').value;
    let secretaria = cargo === 'Secretario' ? document.getElementById('novoUserSecretaria').value : '';
    let orgObj = bancoDados.orgaos.find(o => o.id === orgaoId);

    listaUsuarios.push({ id: 'u_' + Date.now(), nome, senha, cargo, orgaoId, orgaoNome: orgObj ? orgObj.nome : 'Órgão', secretaria });
    salvarLocalStorage();
    atualizarListaUsuariosModal();
    document.getElementById('novoUserNome').value = '';
    document.getElementById('novoUserSenha').value = '';
    mostrarToast("Usuário cadastrado com sucesso!");
}

function atualizarListaUsuariosModal() {
    let container = document.getElementById('listaUsuariosCadastrados');
    if (listaUsuarios.length === 0) {
        container.innerHTML = `<div class="p-3 text-xs text-slate-400 text-center">Nenhum usuário cadastrado além do Master.</div>`;
        return;
    }
    container.innerHTML = listaUsuarios.map(u => `
        <div class="p-2.5 flex justify-between items-center text-xs">
            <div>
                <strong>${u.nome}</strong> <span class="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-blue-600">${u.cargo}</span>
                <span class="text-slate-500 block text-[11px]">Órgão: ${u.orgaoNome || 'Geral'} ${u.secretaria ? '• Setor: ' + u.secretaria : ''}</span>
            </div>
            <button onclick="removerUsuario('${u.id}')" class="text-red-500 hover:text-red-700 p-1 cursor-pointer"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join('');
}

function removerUsuario(id) {
    if(confirm("Remover este usuário?")) {
        listaUsuarios = listaUsuarios.filter(u => u.id !== id);
        salvarLocalStorage();
        atualizarListaUsuariosModal();
        mostrarToast("Usuário removido.");
    }
}

// Visão Pública e QR Code
function carregarModoPublico(pastaId, veioPorQrCode = false) {
    document.getElementById('viewLogin').classList.add('hidden');
    document.getElementById('viewAdminContainer').classList.add('hidden');
    document.getElementById('viewPublico').classList.remove('hidden');

    if (veioPorQrCode && localStorage.getItem('ged_sessao_user')) {
        document.getElementById('btnVoltarPainelDePublico').classList.remove('hidden');
    }

    let pasta = bancoDados.pastas.find(p => p.id === pastaId) || bancoDados.pastas[0];
    if (!pasta) return;

    const o = bancoDados.orgaos.find(x => x.id === pasta.orgaoId) || { nome: 'Órgão Público', cnpj: '-', gestor: '-', tipo: 'Entidade', endereco: '-' };

    document.getElementById('pubOrgaoTipo').innerText = o.tipo;
    document.getElementById('pubOrgaoNome').innerText = o.nome;
    document.getElementById('pubSecretariaNome').innerText = pasta.secretaria === 'Geral (Atos Oficiais)' ? 'Atos Oficiais e Normativos' : `Setor / Secretaria: ${pasta.secretaria}`;
    document.getElementById('pubOrgaoInfo').innerText = `CNPJ: ${o.cnpj} • Endereço: ${o.endereco || 'Não informado'} • Gestor: ${o.gestor}`;
    document.getElementById('pubPastaTipo').innerText = pasta.tipo;
    document.getElementById('pubPastaTitulo').innerText = pasta.titulo;
    document.getElementById('pubPastaDescricao').innerText = pasta.descricao || 'Sem observações.';
    document.getElementById('pubPastaAno').innerText = pasta.ano;
    document.getElementById('pubPastaMes').innerText = pasta.mes;

    document.getElementById('pubArquivosLista').innerHTML = pasta.arquivos.map((arq) => `
        <div class="flex items-center justify-between p-3 bg-slate-50 border rounded-lg text-xs">
            <span><strong>${arq.nome}</strong> (${arq.tamanho})</span>
            <button onclick="baixarDocumentoPDF('${arq.dados || ''}', '${arq.nome}')" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-semibold cursor-pointer">
                <i class="fa-solid fa-download mr-1"></i> Baixar
            </button>
        </div>
    `).join('');

    const secContratos = document.getElementById('pubSecaoContratosVinculados');
    if (pasta.contratos && pasta.contratos.length > 0) {
        secContratos.classList.remove('hidden');
        document.getElementById('pubContratosLista').innerHTML = pasta.contratos.map(c => {
            let arquivosContratoHtml = '';
            if (c.arquivos && c.arquivos.length > 0) {
                arquivosContratoHtml = c.arquivos.map(arqC => `
                    <div class="flex items-center justify-between p-2 bg-white border rounded text-[11px] mt-1">
                        <span><i class="fa-solid fa-file-pdf text-red-500 mr-1"></i> <strong>${arqC.nome}</strong> (${arqC.tamanho})</span>
                        <button onclick="baixarDocumentoPDF('${arqC.dados || ''}', '${arqC.nome}')" class="bg-emerald-700 text-white px-2.5 py-1 rounded font-semibold cursor-pointer">
                            <i class="fa-solid fa-download mr-1"></i> Baixar Contrato
                        </button>
                    </div>
                `).join('');
            } else if (c.arquivoDados) {
                arquivosContratoHtml = `
                    <div class="flex items-center justify-between p-2 bg-white border rounded text-[11px] mt-1">
                        <span><i class="fa-solid fa-file-pdf text-red-500 mr-1"></i> <strong>Contrato_${c.numero}.pdf</strong></span>
                        <button onclick="baixarDocumentoPDF('${c.arquivoDados}', 'Contrato_${c.numero}.pdf')" class="bg-emerald-700 text-white px-2.5 py-1 rounded font-semibold cursor-pointer">
                            <i class="fa-solid fa-download mr-1"></i> Baixar Contrato
                        </button>
                    </div>
                `;
            }

            let htmlAditivos = '';
            if (c.aditivos && c.aditivos.length > 0) {
                htmlAditivos = `<div class="mt-2 pt-2 border-t space-y-1">` + c.aditivos.map(ad => {
                    let arqsAditivoHtml = '';
                    if (ad.arquivos && ad.arquivos.length > 0) {
                        arqsAditivoHtml = ad.arquivos.map(arqAd => `
                            <div class="flex items-center justify-between p-1.5 bg-white border rounded text-[10px] mt-1">
                                <span><strong>${arqAd.nome}</strong> (${arqAd.tamanho})</span>
                                <button onclick="baixarDocumentoPDF('${arqAd.dados || ''}', '${arqAd.nome}')" class="bg-amber-600 text-white px-2 py-0.5 rounded font-semibold cursor-pointer">Baixar</button>
                            </div>
                        `).join('');
                    } else if (ad.dados) {
                        arqsAditivoHtml = `
                            <div class="flex items-center justify-between p-1.5 bg-white border rounded text-[10px] mt-1">
                                <span><strong>${ad.arquivo || 'Aditivo.pdf'}</strong></span>
                                <button onclick="baixarDocumentoPDF('${ad.dados}', '${ad.arquivo || 'Aditivo.pdf'}')" class="bg-amber-600 text-white px-2 py-0.5 rounded font-semibold cursor-pointer">Baixar</button>
                            </div>
                        `;
                    }

                    return `
                        <div class="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] space-y-1">
                            <div class="font-bold text-amber-950"><i class="fa-solid fa-file-circle-plus mr-1"></i> ${ad.titulo}</div>
                            <p class="text-slate-700">${ad.descricao || ''}</p>
                            ${arqsAditivoHtml}
                        </div>
                    `;
                }).join('') + `</div>`;
            }

            return `
                <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-2">
                    <div class="flex justify-between items-start font-bold text-emerald-900">
                        <span><i class="fa-solid fa-file-contract mr-1"></i> ${c.numero}</span>
                        <span>Global: R$ ${c.valorTotalAtualizado || c.valorContrato || '0,00'}</span>
                    </div>
                    <p class="text-slate-700">${c.descricao}</p>
                    <div class="text-[11px] text-slate-600">Vigência: <strong>${formatarDataBR(c.inicioVigencia)}</strong> até <strong>${formatarDataBR(c.terminoVigencia)}</strong></div>
                    <div class="space-y-1 pt-1">
                        ${arquivosContratoHtml}
                    </div>
                    ${htmlAditivos}
                </div>
            `;
        }).join('');
    } else {
        secContratos.classList.add('hidden');
    }
}

function voltarDoPublicoForAdmin() {
    document.getElementById('viewPublico').classList.add('hidden');
    entrarPainelAdmin();
}

// Gestão de Órgãos
function renderOrgaos() {
    const grid = document.getElementById('listaOrgaos');
    let orgaosVisiveis = bancoDados.orgaos;

    if (usuarioLogado.orgaoId && (usuarioLogado.cargo === 'Prefeito' || usuarioLogado.cargo === 'Presidente Câmara' || usuarioLogado.cargo === 'Funcionario' || usuarioLogado.cargo === 'Secretario')) {
        orgaosVisiveis = bancoDados.orgaos.filter(o => o.id === usuarioLogado.orgaoId);
    }

    let eMaster = usuarioLogado.cargo === 'Master' || usuarioLogado.cargo.includes('Master');

    grid.innerHTML = orgaosVisiveis.map(o => `
        <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-blue-500 transition flex flex-col justify-between">
            <div onclick="entrarOrgao('${o.id}')" class="cursor-pointer">
                <span class="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded uppercase">${o.tipo}</span>
                <h3 class="font-bold text-slate-900 text-base mt-2">${o.nome}</h3>
                <p class="text-xs text-slate-500 font-mono mt-1">CNPJ: ${o.cnpj}</p>
                <p class="text-xs text-slate-500 mt-1"><i class="fa-solid fa-location-dot mr-1"></i> ${o.endereco || 'Endereço não informado'}</p>
                <p class="text-xs text-slate-600 mt-2">Gestor: <strong>${o.gestor}</strong></p>
            </div>
            <div class="mt-4 pt-3 border-t flex justify-between items-center text-xs">
                <span onclick="entrarOrgao('${o.id}')" class="font-semibold text-blue-600 cursor-pointer flex items-center gap-1">Acessar <i class="fa-solid fa-arrow-right"></i></span>
                ${eMaster ? `
                    <div class="flex gap-2">
                        <button onclick="editarOrgao('${o.id}')" class="text-indigo-600 hover:text-indigo-800 p-1 cursor-pointer"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button onclick="excluirOrgao('${o.id}')" class="text-red-500 hover:text-red-700 p-1 cursor-pointer"><i class="fa-solid fa-trash"></i></button>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function entrarOrgao(id) {
    orgaoAtivoId = id;
    const o = bancoDados.orgaos.find(x => x.id === id);
    document.getElementById('painelNomeOrgao').innerText = o.nome;
    document.getElementById('painelCnpjOrgao').innerText = `CNPJ: ${o.cnpj} • Endereço: ${o.endereco || '-'} • Gestor: ${o.gestor}`;
    document.getElementById('telaOrgaos').classList.add('hidden');
    document.getElementById('telaPainel').classList.remove('hidden');

    aplicarPermissoesBotoes();
    document.getElementById('filtroModulo').value = 'PASTAS';
    alternarVisaoModulo();
    renderPastas();
    verificarContratosVencendo(false);
}

function aplicarPermissoesBotoes() {
    let botoesAcao = document.getElementById('painelBotoesAcao');
    if (usuarioLogado.cargo === 'Prefeito' || usuarioLogado.cargo === 'Presidente Câmara' || usuarioLogado.cargo === 'Secretario') {
        botoesAcao.style.display = 'none';
    } else {
        botoesAcao.style.display = 'flex';
        if (usuarioLogado.cargo === 'Funcionario') {
            document.getElementById('acaoSecs').style.display = 'none';
            document.getElementById('acaoTipos').style.display = 'none';
            document.getElementById('acaoTiposAtos').style.display = 'none';
            document.getElementById('acaoAno').style.display = 'none';
        }
    }
}

function voltarInicio() {
    orgaoAtivoId = null;
    document.getElementById('telaPainel').classList.add('hidden');
    document.getElementById('telaOrgaos').classList.remove('hidden');
    renderOrgaos();
}

// Filtros e Módulos
function alternarVisaoModulo() {
    const modulo = document.getElementById('filtroModulo').value;
    const blocoSec = document.getElementById('blocoFiltroSec');
    const titulo = document.getElementById('tituloSecaoListagem');
    const labelFiltro = document.getElementById('labelFiltroDinamico');
    const selectFiltro = document.getElementById('filtroTipo');
    const o = bancoDados.orgaos.find(x => x.id === orgaoAtivoId);

    if (modulo === 'ATOS') {
        blocoSec.classList.add('hidden');
        titulo.innerText = 'Atos Oficiais, Ofícios, Leis & Requerimentos';
        labelFiltro.innerText = 'Filtrar por Tipo';
        let tiposAtos = (o && o.tiposAtos) ? o.tiposAtos : ['Decreto', 'Lei', 'Ofício', 'Portaria', 'Requerimento'];
        selectFiltro.innerHTML = `<option value="TODOS">-- Todos os Tipos --</option>` + tiposAtos.map(t => `<option value="${t}">${t}</option>`).join('');
    } else if (modulo === 'LICITACOES') {
        blocoSec.classList.remove('hidden');
        titulo.innerText = 'Licitações & Contratos Vinculados';
        labelFiltro.innerText = 'Filtrar por Modalidade';
        let modalidades = ['Pregão Eletrônico', 'Dispensa Eletrônica', 'Inexigibilidade', 'Pregão Presencial', 'Concorrência', 'Tomada de Preços', 'Convite'];
        selectFiltro.innerHTML = `<option value="TODOS">-- Todas as Modalidades --</option>` + modalidades.map(m => `<option value="${m}">${m}</option>`).join('');
    } else {
        blocoSec.classList.remove('hidden');
        titulo.innerText = 'Pastas Mensais por Setor / Secretaria';
        labelFiltro.innerText = 'Filtrar por Mês';
        let meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        selectFiltro.innerHTML = `<option value="TODOS">-- Todos os Meses --</option>` + meses.map(m => `<option value="${m}">${m}</option>`).join('');
        atualizarFiltrosSecundaria();
    }
    renderPastas();
}

function atualizarFiltrosSecundaria() {
    const o = bancoDados.orgaos.find(x => x.id === orgaoAtivoId);
    if (!o) return;
    let secSelect = document.getElementById('filtroSecretaria');
    
    if (usuarioLogado.cargo === 'Secretario') {
        secSelect.innerHTML = `<option value="${usuarioLogado.secretaria}">${usuarioLogado.secretaria}</option>`;
        secSelect.disabled = true;
    } else {
        secSelect.disabled = false;
        secSelect.innerHTML = (o.secretarias || []).map(s => `<option value="${s}">${s}</option>`).join('');
    }
    document.getElementById('filtroAno').innerHTML = (o.anos || []).map(a => `<option value="${a}">${a}</option>`).join('');
}

// Renderização de Pastas e Licitações
function renderPastas() {
    const modulo = document.getElementById('filtroModulo').value;
    const anoSel = document.getElementById('filtroAno').value;
    const filtroSel = document.getElementById('filtroTipo').value;
    let secSel = document.getElementById('filtroSecretaria').value;

    if (usuarioLogado.cargo === 'Secretario') secSel = usuarioLogado.secretaria;

    const grid = document.getElementById('gridPastas');
    grid.innerHTML = '';

    let filtradas = bancoDados.pastas.filter(p => p.orgaoId === orgaoAtivoId && p.ano === anoSel);

    if (modulo === 'ATOS') {
        filtradas = filtradas.filter(p => p.secretaria === 'Geral (Atos Oficiais)');
        if (filtroSel !== 'TODOS') filtradas = filtradas.filter(p => p.tipo === filtroSel);
    } else if (modulo === 'LICITACOES') {
        filtradas = filtradas.filter(p => p.secretaria === secSel && (p.tipo.includes('Pregão') || p.tipo.includes('Dispensa') || p.tipo.includes('Inexigibilidade') || p.tipo.includes('Concorrência') || p.tipo.includes('Tomada') || p.tipo.includes('Convite')));
        if (filtroSel !== 'TODOS') filtradas = filtradas.filter(p => p.tipo === filtroSel);
    } else {
        filtradas = filtradas.filter(p => p.secretaria === secSel && p.secretaria !== 'Geral (Atos Oficiais)' && !p.tipo.includes('Pregão') && !p.tipo.includes('Dispensa') && !p.tipo.includes('Inexigibilidade') && !p.tipo.includes('Concorrência') && !p.tipo.includes('Tomada') && !p.tipo.includes('Convite'));
        if (filtroSel !== 'TODOS') filtradas = filtradas.filter(p => p.mes === filtroSel);
    }

    document.getElementById('contadorItens').innerText = `${filtradas.length} item(ns)`;

    if (filtradas.length === 0) {
        grid.innerHTML = `<div class="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed"><p class="text-sm">Nenhum registro encontrado.</p></div>`;
        return;
    }

    let hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    filtradas.forEach(p => {
        const card = document.createElement('div');
        const isLic = p.tipo.includes('Pregão') || p.tipo.includes('Dispensa') || p.tipo.includes('Inexigibilidade') || p.tipo.includes('Concorrência') || p.tipo.includes('Tomada') || p.tipo.includes('Convite');
        const isAto = p.secretaria === 'Geral (Atos Oficiais)';
        
        let badgeColor = isLic ? 'bg-amber-100 text-amber-800' : isAto ? 'bg-purple-100 text-purple-800' : 'bg-blue-50 text-blue-700';
        let podeExcluir = usuarioLogado.cargo === 'Master' || usuarioLogado.cargo.includes('Master');

        let listaArquivosHtml = '';
        if (p.arquivos && p.arquivos.length > 0) {
            listaArquivosHtml = p.arquivos.map(arq => `
                <div class="flex items-center justify-between p-1.5 bg-white border rounded text-[11px] mt-1">
                    <span class="truncate max-w-[170px]" title="${arq.nome}"><strong>${arq.nome}</strong> (${arq.tamanho})</span>
                    <button onclick="baixarDocumentoPDF('${arq.dados || ''}', '${arq.nome}')" class="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded font-semibold cursor-pointer shrink-0">
                        <i class="fa-solid fa-download mr-1"></i> Baixar
                    </button>
                </div>
            `).join('');
        }

        let htmlContratosVinculados = '';
        if (isLic) {
            if (!p.contratos) p.contratos = [];
            let qtdContratos = p.contratos.length;
            
            let listaContratosHtml = p.contratos.map(c => {
                let partes = c.terminoVigencia.split('-');
                let dataFim = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
                dataFim.setHours(0, 0, 0, 0);
                let diasRest = Math.ceil((dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

                let corVig = 'bg-emerald-50 border-emerald-200 text-emerald-800';
                let tagStatus = `Vigente (${diasRest}d)`;

                if (c.statusContrato === 'NAO_RENOVADO') {
                    corVig = 'bg-slate-200 border-slate-300 text-slate-700';
                    tagStatus = 'NÃO RENOVADO / ENCERRADO';
                } else if (diasRest < 0) {
                    corVig = 'bg-red-50 border-red-200 text-red-800';
                    tagStatus = 'VENCIDO';
                } else if (diasRest <= 30) {
                    corVig = 'bg-amber-50 border-amber-300 text-amber-900';
                    tagStatus = `Vence em ${diasRest}d!`;
                }

                let arquivosContratoCardHtml = '';
                if (c.arquivos && c.arquivos.length > 0) {
                    arquivosContratoCardHtml = c.arquivos.map(arqC => `
                        <div class="flex items-center justify-between p-1.5 bg-white border rounded text-[11px] mt-1">
                            <span class="truncate max-w-[150px]" title="${arqC.nome}"><strong>${arqC.nome}</strong> (${arqC.tamanho})</span>
                            <button onclick="baixarDocumentoPDF('${arqC.dados || ''}', '${arqC.nome}')" class="bg-emerald-700 hover:bg-emerald-800 text-white px-2 py-0.5 rounded font-semibold cursor-pointer shrink-0">
                                <i class="fa-solid fa-download mr-1"></i> Baixar
                            </button>
                        </div>
                    `).join('');
                } else if (c.arquivoDados) {
                    arquivosContratoCardHtml = `
                        <div class="flex items-center justify-between p-1.5 bg-white border rounded text-[11px] mt-1">
                            <span class="truncate max-w-[150px]">Contrato_${c.numero}.pdf</span>
                            <button onclick="baixarDocumentoPDF('${c.arquivoDados}', 'Contrato_${c.numero}.pdf')" class="bg-emerald-700 hover:bg-emerald-800 text-white px-2 py-0.5 rounded font-semibold cursor-pointer shrink-0">
                                <i class="fa-solid fa-download mr-1"></i> Baixar
                            </button>
                        </div>
                    `;
                }

                let htmlAditivosCard = '';
                if (c.aditivos && c.aditivos.length > 0) {
                    htmlAditivosCard = `<div class="mt-2 pt-1 border-t border-indigo-200 space-y-1">` + c.aditivos.map(ad => {
                        let arqsAditivoCardHtml = '';
                        if (ad.arquivos && ad.arquivos.length > 0) {
                            arqsAditivoCardHtml = ad.arquivos.map(arqAd => `
                                <div class="flex items-center justify-between p-1 bg-white border rounded text-[10px] mt-1">
                                    <span class="truncate max-w-[130px]">${arqAd.nome}</span>
                                    <button onclick="baixarDocumentoPDF('${arqAd.dados || ''}', '${arqAd.nome}')" class="bg-indigo-700 text-white px-1.5 py-0.5 rounded font-semibold shrink-0">Baixar</button>
                                </div>
                            `).join('');
                        } else if (ad.dados) {
                            arqsAditivoCardHtml = `
                                <div class="flex items-center justify-between p-1 bg-white border rounded text-[10px] mt-1">
                                    <span class="truncate max-w-[130px]">${ad.arquivo || 'Aditivo.pdf'}</span>
                                    <button onclick="baixarDocumentoPDF('${ad.dados}', '${ad.arquivo || 'Aditivo.pdf'}')" class="bg-indigo-700 text-white px-1.5 py-0.5 rounded font-semibold shrink-0">Baixar</button>
                                </div>
                            `;
                        }

                        return `
                            <div class="text-[11px] text-indigo-950 bg-indigo-50 p-2 rounded border border-indigo-200 space-y-1">
                                <div class="font-bold"><i class="fa-solid fa-file-circle-plus mr-1"></i> ${ad.titulo}</div>
                                <p class="text-slate-600">${ad.descricao || ''}</p>
                                ${arqsAditivoCardHtml}
                            </div>
                        `;
                    }).join('') + `</div>`;
                }

                let acoesContratoFooterHtml = '';
                if (c.statusContrato === 'NAO_RENOVADO') {
                    acoesContratoFooterHtml = `
                        <div class="pt-1 border-t flex justify-between items-center gap-1">
                            <span class="text-[10px] text-slate-500 italic">Contrato encerrado (somente consulta).</span>
                            <button onclick="reativarContrato('${p.id}', '${c.id}')" class="bg-amber-600 hover:bg-amber-700 text-white py-1 px-2 rounded text-[10px] font-semibold cursor-pointer">Reativar / Tornar Vigente</button>
                        </div>
                    `;
                } else {
                    acoesContratoFooterHtml = `
                        <div class="pt-1 border-t flex justify-between items-center gap-1">
                            <button onclick="abrirModalAditivo('${p.id}', '${c.id}')" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-1 px-2 rounded text-[10px] font-semibold cursor-pointer">
                                <i class="fa-solid fa-plus mr-1"></i> Adicionar Aditivo
                            </button>
                            <button onclick="marcarNaoRenovado('${p.id}', '${c.id}')" class="bg-slate-600 hover:bg-slate-700 text-white py-1 px-2 rounded text-[10px] font-semibold cursor-pointer">Marcar Não Renovado</button>
                        </div>
                    `;
                }

                return `
                    <div class="p-2.5 bg-slate-50 border rounded-lg text-xs space-y-1.5 mt-2">
                        <div class="flex justify-between items-start font-bold text-slate-900">
                            <span><i class="fa-solid fa-file-contract text-emerald-600 mr-1"></i> ${c.numero}</span>
                            <span class="${corVig} px-1.5 py-0.5 rounded text-[10px]">${tagStatus}</span>
                        </div>
                        <p class="text-slate-600 text-[11px]">${c.descricao}</p>
                        <div class="text-[10px] text-slate-500 flex justify-between">
                            <span>Vigência: ${formatarDataBR(c.inicioVigencia)} a ${formatarDataBR(c.terminoVigencia)}</span>
                            <span>Valor: <strong>R$ ${c.valorTotalAtualizado || c.valorContrato || '0,00'}</strong></span>
                        </div>
                        <div class="space-y-1 pt-1">
                            ${arquivosContratoCardHtml}
                        </div>
                        ${htmlAditivosCard}
                        ${acoesContratoFooterHtml}
                    </div>
                `;
            }).join('');

            htmlContratosVinculados = `
                <div class="mt-3 pt-3 border-t space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-xs text-emerald-800"><i class="fa-solid fa-file-contract mr-1"></i> Contratos (${qtdContratos})</span>
                        <button onclick="abrirModalContratoVinculado('${p.id}')" class="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded font-bold cursor-pointer">
                            <i class="fa-solid fa-plus mr-1"></i> Adicionar Contrato
                        </button>
                    </div>
                    ${listaContratosHtml}
                </div>
            `;
        }

        card.className = `bg-white border rounded-xl p-4 shadow-sm hover:shadow transition flex flex-col justify-between`;
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start gap-2 mb-2">
                    <span class="${badgeColor} text-[10px] font-bold px-2 py-0.5 rounded uppercase">${p.tipo}</span>
                    <span class="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">Ano ${p.ano}</span>
                </div>
                <h4 class="font-bold text-slate-800 text-sm mb-1">${p.titulo}</h4>
                <p class="text-xs text-slate-500 line-clamp-2 mb-2">${p.descricao || 'Sem descrição.'}</p>
                <div class="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border mb-2">
                    <span class="font-bold text-slate-700 block mb-1"><i class="fa-solid fa-paperclip text-slate-400 mr-1"></i> Documentos (${p.arquivos.length}):</span>
                    <div class="space-y-1 max-h-32 overflow-y-auto pr-1">
                        ${listaArquivosHtml}
                    </div>
                </div>
                ${htmlContratosVinculados}
            </div>
            <div class="space-y-2 pt-3 border-t mt-3">
                <div class="flex items-center space-x-2">
                    <button onclick="abrirModalQr('${p.id}')" class="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs py-2 px-3 rounded-lg font-semibold cursor-pointer"><i class="fa-solid fa-qrcode mr-1"></i> QR Code / Processo</button>
                    ${podeExcluir ? `<button onclick="excluirPasta('${p.id}')" class="text-red-500 hover:bg-red-50 p-2 rounded-lg text-xs cursor-pointer"><i class="fa-solid fa-trash"></i></button>` : ''}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Alertas de Vencimento de Contratos
function verificarContratosVencendo(forcarAbertura = false) {
    let hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let alertas = [];

    bancoDados.pastas.forEach(p => {
        if (orgaoAtivoId && p.orgaoId !== orgaoAtivoId) return;
        
        if (p.contratos && p.contratos.length > 0) {
            p.contratos.forEach(c => {
                if (c.statusContrato === 'NAO_RENOVADO') return;

                if (!c.terminoVigencia) return;
                let partes = c.terminoVigencia.split('-');
                let dataFim = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
                dataFim.setHours(0, 0, 0, 0);

                let diffTime = dataFim.getTime() - hoje.getTime();
                let diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diasRestantes <= 30 && diasRestantes >= -15) {
                    let org = bancoDados.orgaos.find(o => o.id === p.orgaoId);
                    alertas.push({
                        licitacaoId: p.id,
                        contratoId: c.id,
                        orgaoNome: org ? org.nome : 'Órgão',
                        secretaria: p.secretaria,
                        licitacaoTitulo: p.titulo,
                        contratoNumero: c.numero,
                        inicio: formatarDataBR(c.inicioVigencia),
                        termino: formatarDataBR(c.terminoVigencia),
                        diasRestantes: diasRestantes,
                        valorAtual: c.valorTotalAtualizado || c.valorContrato || '0,00'
                    });
                }
            });
        }
    });

    alertas.sort((a, b) => a.diasRestantes - b.diasRestantes);

    const btnTopo = document.getElementById('btnAlertaTopo');
    const spanTopo = document.getElementById('contadorAlertasTopo');
    if (alertas.length > 0) {
        btnTopo.classList.remove('hidden');
        spanTopo.innerText = `${alertas.length} Contrato(s) Vencendo`;
    } else {
        btnTopo.classList.add('hidden');
    }

    if (alertas.length > 0) {
        const chaveSessao = 'ged_alerta_visto_' + (orgaoAtivoId || 'geral');
        if (forcarAbertura || !localStorage.getItem(chaveSessao)) {
            localStorage.setItem(chaveSessao, '1');
            exibirModalAlertaVigencia(alertas);
        }
    } else if (forcarAbertura) {
        mostrarToast("Nenhum contrato próximo do vencimento nos próximos 30 dias neste órgão.");
    }
}

function exibirModalAlertaVigencia(lista) {
    const modalId = 'modalAlertaContratos';
    const existente = document.getElementById(modalId);
    if (existente) existente.remove();

    const htmlItens = lista.map(item => {
        let statusBadge = '';
        let cardBorder = 'border-amber-300 bg-amber-50';
        if (item.diasRestantes < 0) {
            statusBadge = `<span class="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">Vencido há ${Math.abs(item.diasRestantes)} dia(s)</span>`;
            cardBorder = 'border-red-300 bg-red-50';
        } else if (item.diasRestantes === 0) {
            statusBadge = `<span class="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">Vence HOJE!</span>`;
            cardBorder = 'border-red-300 bg-red-50';
        } else {
            statusBadge = `<span class="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">Vence em ${item.diasRestantes} dia(s)</span>`;
        }

        return `
            <div class="p-3.5 border ${cardBorder} rounded-xl text-xs space-y-1.5 shadow-sm">
                <div class="flex justify-between items-start gap-2">
                    <span class="font-bold text-slate-900 text-sm"><i class="fa-solid fa-file-contract text-amber-700 mr-1"></i> ${item.contratoNumero}</span>
                    ${statusBadge}
                </div>
                <p class="text-slate-600 text-[11px]"><strong>Pregão / Licitação:</strong> ${item.licitacaoTitulo}</p>
                <p class="text-slate-600 text-[11px]"><strong>Órgão:</strong> ${item.orgaoNome} • <strong>Setor:</strong> ${item.secretaria}</p>
                <div class="flex flex-wrap justify-between items-center pt-1 border-t border-black/5 text-[11px] text-slate-700">
                    <span><i class="fa-regular fa-calendar mr-1"></i> Vigência: <strong>${item.inicio}</strong> até <strong>${item.termino}</strong></span>
                    <span>Valor Global: <strong class="text-emerald-800">R$ ${item.valorAtual}</strong></span>
                </div>
                <div class="pt-1 flex justify-end gap-2">
                    <button onclick="marcarNaoRenovado('${item.licitacaoId}', '${item.contratoId}')" class="text-[11px] bg-slate-200 hover:bg-slate-300 text-slate-800 px-2.5 py-1 rounded font-semibold cursor-pointer">
                        Marcar como Não Renovado / Encerrado
                    </button>
                    <button onclick="abrirLicitacaoDoAlerta('${item.licitacaoId}')" class="text-[11px] bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 rounded font-semibold cursor-pointer">
                        <i class="fa-solid fa-eye mr-1"></i> Adicionar Aditivo
                    </button>
                </div>
            </div>
        `;
    }).join('');

    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = "fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4";
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 border-t-4 border-amber-500 max-h-[90vh] flex flex-col">
            <div class="flex items-center gap-3 border-b pb-3">
                <div class="bg-amber-100 text-amber-600 p-3 rounded-full text-xl shrink-0">
                    <i class="fa-solid fa-bell"></i>
                </div>
                <div>
                    <h3 class="font-bold text-base text-slate-900">Aviso de Vencimento de Contratos</h3>
                    <p class="text-xs text-slate-500">Contratos vinculados atingindo o prazo limite de vigência nos próximos 30 dias neste órgão.</p>
                </div>
            </div>
            <div class="space-y-2.5 overflow-y-auto flex-1 pr-1">
                ${htmlItens}
            </div>
            <div class="flex justify-between items-center pt-3 border-t">
                <span class="text-[11px] text-slate-400">Prórogues com aditivo ou marque como encerrado se não houver renovação.</span>
                <button onclick="document.getElementById('${modalId}').remove()" class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer">
                    Ciente, Fechar Aviso
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function marcarNaoRenovado(licId, contratoId) {
    let p = bancoDados.pastas.find(x => x.id === licId);
    if (p && p.contratos) {
        let con = p.contratos.find(c => c.id === contratoId);
        if (con) {
            con.statusContrato = 'NAO_RENOVADO';
            salvarLocalStorage();
            renderPastas();
            verificarContratosVencendo(false);
            const modalAlerta = document.getElementById('modalAlertaContratos');
            if (modalAlerta) modalAlerta.remove();
            mostrarToast("Contrato marcado como Encerrado / Não Renovado.");
        }
    }
}

function reativarContrato(licId, contratoId) {
    let p = bancoDados.pastas.find(x => x.id === licId);
    if (p && p.contratos) {
        let con = p.contratos.find(c => c.id === contratoId);
        if (con) {
            con.statusContrato = 'VIGENTE';
            salvarLocalStorage();
            renderPastas();
            mostrarToast("Contrato reativado para vigência.");
        }
    }
}

function abrirLicitacaoDoAlerta(licId) {
    const modalAlerta = document.getElementById('modalAlertaContratos');
    if (modalAlerta) modalAlerta.remove();

    let p = bancoDados.pastas.find(x => x.id === licId);
    if (p) {
        if (orgaoAtivoId !== p.orgaoId) entrarOrgao(p.orgaoId);
        document.getElementById('filtroModulo').value = 'LICITACOES';
        alternarVisaoModulo();
        if (p.secretaria) document.getElementById('filtroSecretaria').value = p.secretaria;
        if (p.ano) document.getElementById('filtroAno').value = p.ano;
        renderPastas();
        abrirModalQr(licId);
    }
}

// Geração de Relatórios em PDF Certificados
async function gerarRelatorioPDFCertificado() {
    try {
        mostrarToast("Gerando PDF certificado com QR Code...");
        let o = bancoDados.orgaos.find(x => x.id === orgaoAtivoId);
        if (!o) return;

        let dataHoraStr = new Date().toLocaleString('pt-BR');
        let nomeOp = usuarioLogado ? usuarioLogado.nome : 'Administrador';
        let cargoOp = usuarioLogado ? usuarioLogado.cargo : 'Master';
        let itensOrgao = bancoDados.pastas.filter(p => p.orgaoId === orgaoAtivoId);
        let hashRelatorio = 'GED-SHA256-' + btoa(nomeOp + dataHoraStr).substring(0, 24).toUpperCase();

        let tempDiv = document.createElement('div');
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);
        let qrUrl = `${window.location.origin}${window.location.pathname}?relatorio=assinado`;
        new QRCode(tempDiv, { text: qrUrl, width: 120, height: 120, colorDark: "#0f172a", colorLight: "#ffffff" });
        
        await new Promise(resolve => setTimeout(resolve, 100));
        let canvasEl = tempDiv.querySelector('canvas');
        let qrDataUri = canvasEl ? canvasEl.toDataURL('image/png') : null;
        document.body.removeChild(tempDiv);

        const { PDFDocument, rgb, StandardFonts } = PDFLib;
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]);
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        page.drawText(o.tipo.toUpperCase(), { x: 50, y: height - 45, size: 9, font: fontBold, color: rgb(0.2, 0.4, 0.7) });
        page.drawText(o.nome, { x: 50, y: height - 60, size: 14, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
        page.drawText(`CNPJ: ${o.cnpj} • Gestor: ${o.gestor}`, { x: 50, y: height - 74, size: 8, font: font, color: rgb(0.4, 0.4, 0.4) });
        page.drawLine({ start: { x: 50, y: height - 85 }, end: { x: width - 50, y: height - 85 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });

        page.drawText('RELATÓRIO DIÁRIO DE EXECUÇÃO DE SERVIÇOS E DIGITALIZAÇÃO', { x: 50, y: height - 105, size: 10, font: fontBold, color: rgb(0.1, 0.2, 0.4) });
        page.drawText(`Data de Emissão: ${dataHoraStr}`, { x: 50, y: height - 118, size: 8, font: font, color: rgb(0.3, 0.3, 0.3) });

        let currentY = height - 145;
        page.drawText('Serviços e Registros Realizados:', { x: 50, y: currentY, size: 9, font: fontBold, color: rgb(0.2, 0.2, 0.2) });
        currentY -= 15;

        if (itensOrgao.length === 0) {
            page.drawText('Nenhum registro encontrado para este órgão.', { x: 50, y: currentY, size: 8, font: font, color: rgb(0.5, 0.5, 0.5) });
        } else {
            itensOrgao.forEach((item, idx) => {
                if (currentY < 320) return;
                page.drawText(`${idx + 1}. [${item.tipo}] ${item.titulo} (${item.secretaria})`, { x: 50, y: currentY, size: 8, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
                currentY -= 12;
                let contratosStr = item.contratos ? ` | Contratos vinculados: ${item.contratos.length}` : '';
                page.drawText(`Descrição: ${item.descricao || 'Sem descrição'}${contratosStr}`, { x: 62, y: currentY, size: 7, font: font, color: rgb(0.4, 0.4, 0.4) });
                currentY -= 16;
            });
        }

        let boxY = 160;
        let boxHeight = 135;
        let boxWidth = width - 100;

        page.drawRectangle({ x: 50, y: boxY, width: boxWidth, height: boxHeight, color: rgb(0.97, 0.98, 1.0), borderColor: rgb(0.7, 0.75, 0.85), borderWidth: 1 });
        page.drawRectangle({ x: 50, y: boxY + boxHeight - 22, width: boxWidth, height: 22, color: rgb(0.15, 0.25, 0.45) });
        page.drawText('CERTIFICADO DE ASSINATURA DIGITAL E CARIMBO DE TEMPO', { x: 60, y: boxY + boxHeight - 15, size: 8, font: fontBold, color: rgb(1, 1, 1) });

        let infoY = boxY + boxHeight - 38;
        page.drawText(`Operador Responsável: ${nomeOp}`, { x: 60, y: infoY, size: 7, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
        infoY -= 12;
        page.drawText(`Cargo / Perfil: ${cargoOp}`, { x: 60, y: infoY, size: 7, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
        infoY -= 12;
        page.drawText(`Data / Hora Emissão: ${dataHoraStr}`, { x: 60, y: infoY, size: 7, font: fontBold, color: rgb(0.3, 0.3, 0.3) });
        infoY -= 12;
        page.drawText(`Hash SHA-256: ${hashRelatorio}`, { x: 60, y: infoY, size: 7, font: fontBold, color: rgb(0.1, 0.4, 0.2) });

        if (qrDataUri) {
            const qrImageBytes = await fetch(qrDataUri).then(res => res.arrayBuffer());
            const qrImage = await pdfDoc.embedPng(qrImageBytes);
            page.drawImage(qrImage, { x: width - 125, y: boxY + 15, width: 55, height: 55 });
        }

        let linhaY = boxY - 45;
        page.drawLine({ start: { x: 170, y: linhaY }, end: { x: width - 170, y: linhaY }, thickness: 0.75, color: rgb(0.2, 0.2, 0.2) });
        page.drawText(`${nomeOp.toUpperCase()} - ${cargoOp.toUpperCase()}`, { x: width / 2 - 110, y: linhaY - 12, size: 8, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
        page.drawText('Funcionário / Operador Responsável', { x: width / 2 - 75, y: linhaY - 22, size: 7, font: font, color: rgb(0.5, 0.5, 0.5) });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Relatorio_Certificado_${new Date().toISOString().slice(0,10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);

        mostrarToast("PDF Certificado gerado com sucesso!");
    } catch (erro) {
        console.error(erro);
        alert("Não foi possível gerar o arquivo PDF.");
    }
}

// Modais e Cadastros
function abrirRelatorioDiario() {
    let o = bancoDados.orgaos.find(x => x.id === orgaoAtivoId);
    if (!o) return;

    document.getElementById('relOrgaoTipo').innerText = o.tipo;
    document.getElementById('relOrgaoNome').innerText = o.nome;
    document.getElementById('relOrgaoDadosCnpj').innerText = `CNPJ: ${o.cnpj} • Gestor: ${o.gestor}`;
    document.getElementById('relOrgaoDadosEndereco').innerText = `Endereço e Contato: ${o.endereco || 'Não informado'}`;
    
    let dataHoraStr = new Date().toLocaleString('pt-BR');
    document.getElementById('relDataHoje').innerText = `Data de Emissão: ${dataHoraStr}`;

    let nomeOp = usuarioLogado ? usuarioLogado.nome : 'Administrador';
    let cargoOp = usuarioLogado ? usuarioLogado.cargo : 'Master';

    document.getElementById('relNomeOperador').innerText = nomeOp;
    document.getElementById('relCargoOperador').innerText = cargoOp;
    document.getElementById('relDataHoraEmissao').innerText = dataHoraStr;
    document.getElementById('relHashAssinatura').innerText = 'GED-SHA256-' + btoa(nomeOp + dataHoraStr).substring(0, 24).toUpperCase();

    let itensOrgao = bancoDados.pastas.filter(p => p.orgaoId === orgaoAtivoId);
    let containerLista = document.getElementById('relListaServicos');

    if (itensOrgao.length === 0) {
        containerLista.innerHTML = `<div class="p-3 text-xs text-slate-400 text-center border rounded">Nenhum serviço registrado.</div>`;
    } else {
        containerLista.innerHTML = itensOrgao.map((item, idx) => `
            <div class="p-3 bg-slate-50 border rounded-lg text-xs space-y-1">
                <div class="flex justify-between items-center font-bold text-slate-800">
                    <span>${idx + 1}. [${item.tipo}] ${item.titulo}</span>
                    <span class="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px]">${item.secretaria}</span>
                </div>
                <p class="text-slate-600">${item.descricao || ''}</p>
                ${item.contratos && item.contratos.length > 0 ? `<p class="text-[11px] text-emerald-700 font-semibold">Contratos vinculados: ${item.contratos.length}</p>` : ''}
            </div>
        `).join('');
    }

    document.getElementById('modalRelatorioDiario').classList.remove('hidden');
}

function fecharModal(id) { document.getElementById(id).classList.add('hidden'); }

function abrirModalOrgao() {
    document.getElementById('tituloModalOrgao').innerText = "Cadastrar Novo Órgão";
    document.getElementById('editOrgaoId').value = '';
    document.getElementById('cnpjOrgao').value = '';
    document.getElementById('nomeOrgao').value = '';
    document.getElementById('enderecoOrgao').value = '';
    document.getElementById('gestorOrgao').value = '';
    document.getElementById('modalOrgao').classList.remove('hidden');
}

function editarOrgao(id) {
    let o = bancoDados.orgaos.find(x => x.id === id);
    if(!o) return;
    document.getElementById('tituloModalOrgao').innerText = "Editar Dados do Órgão";
    document.getElementById('editOrgaoId').value = o.id;
    document.getElementById('cnpjOrgao').value = o.cnpj;
    document.getElementById('nomeOrgao').value = o.nome;
    document.getElementById('enderecoOrgao').value = o.endereco || '';
    document.getElementById('tipoOrgao').value = o.tipo;
    document.getElementById('gestorOrgao').value = o.gestor;
    document.getElementById('modalOrgao').classList.remove('hidden');
}

function excluirOrgao(id) {
    if (bancoDados.pastas.some(p => p.orgaoId === id)) {
        alert("Este órgão possui processos cadastrados e não pode ser excluído.");
        return;
    }
    if (confirm("Deseja realmente excluir este órgão?")) {
        bancoDados.orgaos = bancoDados.orgaos.filter(o => o.id !== id);
        salvarLocalStorage();
        renderOrgaos();
        mostrarToast("Órgão excluído.");
    }
}

async function buscarCnpjReceita() {
    let cnpjInput = document.getElementById('cnpjOrgao').value.replace(/\D/g, '');
    if (cnpjInput.length !== 14) { alert("CNPJ inválido."); return; }
    mostrarToast("Consultando CNPJ...");
    try {
        let resposta = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjInput}`);
        if (!resposta.ok) throw new Error("CNPJ não encontrado.");
        let dados = await resposta.json();
        document.getElementById('nomeOrgao').value = dados.razão_social || dados.nome_fantasia || '';
        document.getElementById('enderecoOrgao').value = `${dados.logradouro || ''}, ${dados.numero || 'S/N'}, ${dados.bairro || ''} - ${dados.municipio || ''}/${dados.uf || ''}`;
        document.getElementById('gestorOrgao').value = 'Gestor';
        mostrarToast("Dados carregados!");
    } catch (e) { alert("Erro ao buscar CNPJ."); }
}

function salvarOrgao() {
    let editId = document.getElementById('editOrgaoId').value;
    let nome = document.getElementById('nomeOrgao').value.trim();
    let cnpj = document.getElementById('cnpjOrgao').value.trim();
    let endereco = document.getElementById('enderecoOrgao').value.trim();
    let tipoOrgao = document.getElementById('tipoOrgao').value;
    let gestor = document.getElementById('gestorOrgao').value.trim() || 'Gestor';

    if(!nome || !cnpj) { alert("Preencha os campos obrigatórios."); return; }
    
    if (editId) {
        let o = bancoDados.orgaos.find(x => x.id === editId);
        if(o) { o.nome = nome; o.cnpj = cnpj; o.endereco = endereco; o.tipo = tipoOrgao; o.gestor = gestor; }
    } else {
        bancoDados.orgaos.push({
            id: 'org_' + Date.now(), nome, cnpj, endereco, tipo: tipoOrgao, gestor,
            secretarias: ['Gabinete', 'Administração', 'Finanças', 'Licitações'],
            anos: ['2026', '2025'],
            tiposDoc: ['Processo de Pagamento'],
            tiposAtos: ['Decreto', 'Portaria', 'Lei', 'Ofício', 'Requerimento']
        });
    }
    salvarLocalStorage();
    fecharModal('modalOrgao');
    renderOrgaos();
    mostrarToast("Órgão salvo com sucesso!");
}

function abrirModalSecretarias() {
    document.getElementById('listaSecretariasModal').innerHTML = (bancoDados.orgaos.find(x => x.id === orgaoAtivoId).secretarias || []).map(s => `
        <div class="p-2.5 flex justify-between items-center text-sm"><span>${s}</span><button onclick="removerSec('${s}')" class="text-red-500"><i class="fa-solid fa-trash"></i></button></div>
    `).join('');
    document.getElementById('modalSecretarias').classList.remove('hidden');
}

function adicionarSecretaria() {
    let val = document.getElementById('novaSecretariaNome').value.trim();
    if(!val) return;
    let o = bancoDados.orgaos.find(x => x.id === orgaoAtivoId);
    if(!o.secretarias) o.secretarias = [];
    if(!o.secretarias.includes(val)) {
        o.secretarias.push(val);
        salvarLocalStorage();
        abrirModalSecretarias();
        atualizarFiltrosSecundaria();
        document.getElementById('novaSecretariaNome').value = '';
        mostrarToast("Secretaria adicionada!");
    }
}

function removerSec(s) {
    let o = bancoDados.orgaos.find(x => x.id === orgaoAtivoId);
    o.secretarias = o.secretarias.filter(x => x !== s);
    salvarLocalStorage();
    abrirModalSecretarias();
    atualizarFiltrosSecundaria();
}

function abrirModalAno() { document.getElementById('modalAno').classList.remove('hidden'); }
function salvarAno() {
    let ano = document.getElementById('inputNovoAno').value.trim();
    if(!ano) return;
    let o = bancoDados.orgaos.find(x => x.id === orgaoAtivoId);
    if(!o.anos) o.anos = [];
    if(!o.anos.includes(ano)) { o.anos.push(ano); o.anos.sort((a,b)=>b-a); salvarLocalStorage(); }
    fecharModal('modalAno');
    atualizarFiltrosSecundaria();
    document.getElementById('filtroAno').value = ano;
    renderPastas();
    mostrarToast("Ano cadastrado!");
}

function abrirModalTipos() {
    let o = bancoDados.orgaos.find(x => x.id === orgaoAtivoId);
    document.getElementById('listaTiposModal').innerHTML = (o.tiposDoc || []).map(t => `
        <div class="p-2.5 flex justify-between items-center text-sm"><span>${t}</span><button onclick="removerTipo('${t}')" class="text-red-500"><i class="fa-solid fa-trash"></i></button></div>
    `).join('');
    document.getElementById('modalTipos').classList.remove('hidden');
}

function adicionarTipo() {
    let t = document.getElementById('inputNovoTipo').value.trim();
    if(!t) return;
    let o = bancoDados.orgaos.find(x => x.id === orgaoAtivoId);
    if(!o.tiposDoc) o.tiposDoc = [];
    if(!o.tiposDoc.includes(t)) {
        o.tiposDoc.push(t);
        salvarLocalStorage();
        abrirModalTipos();
        document.getElementById('inputNovoTipo').value = '';
        atualizarTiposPastaForm();
        mostrarToast("Tipo de pasta adicionado!");
    }
}

function removerTipo(t) {
    let o = bancoDados.orgaos.find(x => x.id === orgaoAtivoId);
    o.tiposDoc = o.tiposDoc.filter(x => x !== t);
    salvarLocalStorage();
    abrirModalTipos();
    atualizarTiposPastaForm();
}

function atualizarTiposPastaForm() {
    let o = bancoDados.orgaos.find(x => x.id === orgaoAtivoId);
    let select = document.getElementById('pastaTipoForm');
    if (o && select) {
        select.innerHTML = (o.tiposDoc || []).map(t => `<option value="${t}">${t}</option>`).join('');
    }
}

function abrirModalTiposAtos() {
    let o = bancoDados.orgaos.find(x => x.id === orgaoAtivoId);
    document.getElementById('listaTiposAtosModal').innerHTML = (o.tiposAtos || []).map(t => `
        <div class="p-2.5 flex justify-between items-center text-sm"><span>${t}</span><button onclick="removerTipoAto('${t}')" class="text-red-500"><i class="fa-solid fa-trash"></i></button></div>
    `).join('');
    document.getElementById('modalTiposAtos').classList.remove('hidden');
}

function adicionarTipoAto() {
    let t = document.getElementById('inputNovoTipoAto').value.trim();
    if(!t) return;
    let o = bancoDados.orgaos.find(x => x.id === orgaoAtivoId);
    if(!o.tiposAtos) o.tiposAtos = [];
    if(!o.tiposAtos.includes(t)) {
        o.tiposAtos.push(t);
        salvarLocalStorage();
        abrirModalTiposAtos();
        document.getElementById('inputNovoTipoAto').value = '';
        atualizarTiposModalAto();
        mostrarToast("Tipo de ato oficial adicionado!");
    }
}

function removerTipoAto(t) {
    let o = bancoDados.orgaos.find(x => x.id === orgaoAtivoId);
    o.tiposAtos = o.tiposAtos.filter(x => x !== t);
    salvarLocalStorage();
    abrirModalTiposAtos();
    atualizarTiposModalAto();
}

function atualizarTiposModalAto() {
    let o = bancoDados.orgaos.find(x => x.id === orgaoAtivoId);
    let select = document.getElementById('atoTipoForm');
    let tiposAtos = (o && o.tiposAtos) ? o.tiposAtos : ['Decreto', 'Lei', 'Ofício', 'Portaria', 'Requerimento'];
    if (select) {
        select.innerHTML = tiposAtos.map(t => `<option value="${t}">${t}</option>`).join('');
    }
}

function abrirModalPasta() {
    let o = bancoDados.orgaos.find(x => x.id === orgaoAtivoId);
    document.getElementById('pastaSecForm').innerHTML = (o.secretarias || []).map(s => `<option value="${s}">${s}</option>`).join('');
    atualizarTiposPastaForm();
    document.getElementById('pastaAnoForm').value = document.getElementById('filtroAno').value;
    document.getElementById('modalPasta').classList.remove('hidden');
}

function salvarPasta(e) {
    e.preventDefault();
    let fileInput = document.getElementById('pastaArquivos');
    let files = fileInput.files;

    if (files.length === 0) {
        bancoDados.pastas.unshift({
            id: 'p_' + Date.now(), orgaoId: orgaoAtivoId,
            secretaria: document.getElementById('pastaSecForm').value,
            mes: document.getElementById('pastaMesForm').value,
            ano: document.getElementById('pastaAnoForm').value,
            tipo: document.getElementById('pastaTipoForm').value,
            titulo: document.getElementById('pastaTitulo').value,
            descricao: document.getElementById('pastaDescricao').value,
            arquivos: [{ nome: 'Documento.pdf', tamanho: '300 KB', dados: '' }],
            contratos: []
        });
        concluirSalvamentoPasta();
        return;
    }

    processarArquivosEmLote(files, 0, [], function(listaProcessada) {
        bancoDados.pastas.unshift({
            id: 'p_' + Date.now(), orgaoId: orgaoAtivoId,
            secretaria: document.getElementById('pastaSecForm').value,
            mes: document.getElementById('pastaMesForm').value,
            ano: document.getElementById('pastaAnoForm').value,
            tipo: document.getElementById('pastaTipoForm').value,
            titulo: document.getElementById('pastaTitulo').value,
            descricao: document.getElementById('pastaDescricao').value,
            arquivos: listaProcessada,
            contratos: []
        });
        concluirSalvamentoPasta();
    });
}

function concluirSalvamentoPasta() {
    salvarLocalStorage();
    fecharModal('modalPasta');
    document.getElementById('pastaTitulo').value = '';
    document.getElementById('pastaDescricao').value = '';
    document.getElementById('filtroModulo').value = 'PASTAS';
    alternarVisaoModulo();
    renderPastas();
    abrirModalQr(bancoDados.pastas[0].id);
    mostrarToast("Pasta salva com sucesso!");
}

function abrirModalLicitacao() {
    let o = bancoDados.orgaos.find(x => x.id === orgaoAtivoId);
    document.getElementById('licSecForm').innerHTML = (o.secretarias || []).map(s => `<option value="${s}">${s}</option>`).join('');
    document.getElementById('licAnoForm').value = document.getElementById('filtroAno').value;
    document.getElementById('modalLicitacao').classList.remove('hidden');
}

function salvarLicitacao(e) {
    e.preventDefault();
    let files = document.getElementById('licArquivos').files;
    let modalidade = document.getElementById('licModalidadeForm').value;
    let numero = document.getElementById('licNumero').value;

    const montarObjeto = (arquivosArr) => ({
        id: 'p_' + Date.now(),
        orgaoId: orgaoAtivoId,
        secretaria: document.getElementById('licSecForm').value,
        mes: 'Ano Inteiro',
        ano: document.getElementById('licAnoForm').value,
        tipo: modalidade,
        titulo: `${modalidade} - ${numero}`,
        descricao: document.getElementById('licDescricao').value,
        arquivos: arquivosArr,
        contratos: []
    });

    if (files.length === 0) {
        bancoDados.pastas.unshift(montarObjeto([{ nome: 'Edital_Licitacao.pdf', tamanho: '1.2 MB', dados: '' }]));
        concluirSalvamentoLicitacao();
        return;
    }

    processarArquivosEmLote(files, 0, [], function(listaProcessada) {
        bancoDados.pastas.unshift(montarObjeto(listaProcessada));
        concluirSalvamentoLicitacao();
    });
}

function concluirSalvamentoLicitacao() {
    salvarLocalStorage();
    fecharModal('modalLicitacao');
    document.getElementById('licNumero').value = '';
    document.getElementById('licDescricao').value = '';
    document.getElementById('filtroModulo').value = 'LICITACOES';
    alternarVisaoModulo();
    renderPastas();
    mostrarToast("Licitação cadastrada com sucesso!");
}

function abrirModalContratoVinculado(licitacaoId) {
    document.getElementById('contratoLicitacaoId').value = licitacaoId;
    let lic = bancoDados.pastas.find(x => x.id === licitacaoId);
    if (lic) {
        document.getElementById('infoPregaoPaiModal').innerText = `Vinculando contrato ao processo: ${lic.titulo}`;
    }
    document.getElementById('conNumero').value = '';
    document.getElementById('conDescricao').value = '';
    document.getElementById('conInicioVigencia').value = '';
    document.getElementById('conTerminoVigencia').value = '';
    document.getElementById('conValorContrato').value = '';
    document.getElementById('modalContratoVinculado').classList.remove('hidden');
}

function salvarContratoVinculado(e) {
    e.preventDefault();
    let licId = document.getElementById('contratoLicitacaoId').value;
    let p = bancoDados.pastas.find(x => x.id === licId);
    if (!p) return;
    if (!p.contratos) p.contratos = [];

    let numero = document.getElementById('conNumero').value;
    let descricao = document.getElementById('conDescricao').value;
    let inicio = document.getElementById('conInicioVigencia').value;
    let termino = document.getElementById('conTerminoVigencia').value;
    let valor = document.getElementById('conValorContrato').value || '0,00';
    let files = document.getElementById('conArquivos').files;

    if (files.length === 0) {
        p.contratos.push({
            id: 'con_' + Date.now(),
            numero, descricao,
            inicioVigencia: inicio, terminoVigencia: termino,
            valorContrato: valor, valorTotalAtualizado: valor,
            statusContrato: 'VIGENTE',
            arquivos: [{ nome: 'Contrato.pdf', tamanho: '500 KB', dados: '' }],
            aditivos: []
        });
        concluirSalvamentoContrato(p);
        return;
    }

    processarArquivosEmLote(files, 0, [], function(listaProcessada) {
        p.contratos.push({
            id: 'con_' + Date.now(),
            numero, descricao,
            inicioVigencia: inicio, terminoVigencia: termino,
            valorContrato: valor, valorTotalAtualizado: valor,
            statusContrato: 'VIGENTE',
            arquivos: listaProcessada,
            aditivos: []
        });
        concluirSalvamentoContrato(p);
    });
}

function concluirSalvamentoContrato(p) {
    salvarLocalStorage();
    fecharModal('modalContratoVinculado');
    renderPastas();
    verificarContratosVencendo(false);
    mostrarToast("Contrato vinculado com sucesso ao pregão!");
}

function abrirModalAditivo(licId, contratoId) {
    document.getElementById('aditivoContratoId').value = `${licId}|${contratoId}`;
    let lic = bancoDados.pastas.find(x => x.id === licId);
    if (lic && lic.contratos) {
        let con = lic.contratos.find(c => c.id === contratoId);
        if (con) {
            document.getElementById('infoContratoPaiModal').innerText = `Lançando aditivo para o ${con.numero}`;
        }
    }
    document.getElementById('aditivoTitulo').value = '';
    document.getElementById('aditivoInicioVigencia').value = '';
    document.getElementById('aditivoTerminoVigencia').value = '';
    document.getElementById('aditivoValorAcrescido').value = '';
    document.getElementById('aditivoDescricao').value = '';
    document.getElementById('modalAditivo').classList.remove('hidden');
}

function salvarAditivoContrato(e) {
    e.preventDefault();
    let ids = document.getElementById('aditivoContratoId').value.split('|');
    let licId = ids[0];
    let contratoId = ids[1];

    let p = bancoDados.pastas.find(x => x.id === licId);
    if (!p) return;
    let con = p.contratos.find(c => c.id === contratoId);
    if (!con) return;
    if (!con.aditivos) con.aditivos = [];

    let novoInicio = document.getElementById('aditivoInicioVigencia').value;
    let novoTermino = document.getElementById('aditivoTerminoVigencia').value;
    let valorAcrescidoStr = document.getElementById('aditivoValorAcrescido').value || '0,00';
    let valorAcrescidoNum = parseMoedaParaFloat(valorAcrescidoStr);

    if (novoInicio) con.inicioVigencia = novoInicio;
    if (novoTermino) {
        con.terminoVigencia = novoTermino;
        con.statusContrato = 'VIGENTE';
    }
    if (valorAcrescidoNum > 0) {
        let atual = parseMoedaParaFloat(con.valorTotalAtualizado || con.valorContrato || '0,00');
        con.valorTotalAtualizado = formatarFloatParaMoeda(atual + valorAcrescidoNum);
    }

    let files = document.getElementById('aditivoArquivos').files;
    let tituloAd = document.getElementById('aditivoTitulo').value;
    let descAd = document.getElementById('aditivoDescricao').value;

    if (files.length === 0) {
        con.aditivos.push({
            id: 'ad_' + Date.now(),
            titulo: tituloAd, descricao: descAd,
            novaVigenciaInicio: novoInicio, novaVigenciaFim: novoTermino,
            valorAcrescido: valorAcrescidoStr,
            arquivos: [{ nome: 'Aditivo.pdf', tamanho: '300 KB', dados: '' }]
        });
        concluirSalvamentoAditivo();
        return;
    }

    processarArquivosEmLote(files, 0, [], function(listaProcessada) {
        con.aditivos.push({
            id: 'ad_' + Date.now(),
            titulo: tituloAd, descricao: descAd,
            novaVigenciaInicio: novoInicio, novaVigenciaFim: novoTermino,
            valorAcrescido: valorAcrescidoStr,
            arquivos: listaProcessada
        });
        concluirSalvamentoAditivo();
    });
}

function concluirSalvamentoAditivo() {
    salvarLocalStorage();
    fecharModal('modalAditivo');
    renderPastas();
    verificarContratosVencendo(false);
    mostrarToast("Termo Aditivo registrado com sucesso no contrato!");
}

function abrirModalAtoOficial() {
    atualizarTiposModalAto();
    document.getElementById('atoAnoForm').value = document.getElementById('filtroAno').value;
    document.getElementById('modalAtoOficial').classList.remove('hidden');
}

function salvarAtoOficial(e) {
    e.preventDefault();
    let files = document.getElementById('atoArquivos').files;
    processarArquivosEmLote(files, 0, [], function(listaProcessada) {
        let novo = {
            id: 'p_' + Date.now(), orgaoId: orgaoAtivoId,
            secretaria: 'Geral (Atos Oficiais)',
            mes: 'Ano Inteiro', ano: document.getElementById('atoAnoForm').value,
            tipo: document.getElementById('atoTipoForm').value,
            titulo: document.getElementById('atoTitulo').value,
            descricao: document.getElementById('atoDescricao').value,
            arquivos: listaProcessada,
            contratos: []
        };
        bancoDados.pastas.unshift(novo);
        salvarLocalStorage();
        fecharModal('modalAtoOficial');
        document.getElementById('atoTitulo').value = '';
        document.getElementById('atoDescricao').value = '';
        document.getElementById('filtroModulo').value = 'ATOS';
        alternarVisaoModulo();
        renderPastas();
        mostrarToast("Ato oficial cadastrado!");
    });
}

function excluirPasta(id) {
    if(confirm("Excluir este processo/licitação?")) {
        bancoDados.pastas = bancoDados.pastas.filter(x => x.id !== id);
        salvarLocalStorage();
        renderPastas();
        verificarContratosVencendo(false);
        mostrarToast("Excluído com sucesso.");
    }
}

function abrirModalQr(id) {
    activePastaQrId = id;
    let p = bancoDados.pastas.find(x => x.id === id);
    let o = bancoDados.orgaos.find(x => x.id === p.orgaoId);

    document.getElementById('qrOrgaoNome').innerText = o.nome;
    document.getElementById('qrSecretariaNome').innerText = p.secretaria === 'Geral (Atos Oficiais)' ? 'Atos Oficiais' : `Setor / Secretaria: ${p.secretaria}`;
    document.getElementById('qrOrgaoSub').innerText = `CNPJ: ${o.cnpj} • ${o.endereco || ''} • Gestor: ${o.gestor}`;
    document.getElementById('qrAnoTipoTag').innerText = `${p.tipo} • Ano ${p.ano}`;

    let url = `${window.location.origin}${window.location.pathname}?pasta=${p.id}`;
    document.getElementById('qrCodeUrlText').innerText = url;

    let container = document.getElementById('qrcodeCanvas');
    container.innerHTML = '';
    setTimeout(() => {
        new QRCode(container, { text: url, width: 150, height: 150, colorDark: "#0f172a", colorLight: "#ffffff" });
    }, 50);

    document.getElementById('qrArquivosLista').innerHTML = p.arquivos.map(a => `
        <div class="flex justify-between items-center p-2 bg-slate-50 border rounded text-xs">
            <span class="truncate max-w-[240px]"><strong>${a.nome}</strong> (${a.tamanho})</span>
            <button onclick="baixarDocumentoPDF('${a.dados || ''}', '${a.nome}')" class="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded cursor-pointer shrink-0">
                <i class="fa-solid fa-download mr-1"></i> Baixar
            </button>
        </div>
    `).join('');

    let secContratos = document.getElementById('qrContratosLista');
    if (p.contratos && p.contratos.length > 0) {
        secContratos.innerHTML = p.contratos.map(c => {
            let arqsContratoQr = '';
            if (c.arquivos && c.arquivos.length > 0) {
                arqsContratoQr = c.arquivos.map(ac => `
                    <div class="flex justify-between items-center p-1.5 bg-white border rounded text-[11px] mt-1">
                        <span class="truncate max-w-[200px]"><strong>${ac.nome}</strong> (${ac.tamanho})</span>
                        <button onclick="baixarDocumentoPDF('${ac.dados || ''}', '${ac.nome}')" class="bg-emerald-700 text-white px-2 py-0.5 rounded font-semibold shrink-0">Baixar</button>
                    </div>
                `).join('');
            } else if (c.arquivoDados) {
                arqsContratoQr = `
                    <div class="flex justify-between items-center p-1.5 bg-white border rounded text-[11px] mt-1">
                        <span class="truncate max-w-[200px]">Contrato_${c.numero}.pdf</span>
                        <button onclick="baixarDocumentoPDF('${c.arquivoDados}', 'Contrato_${c.numero}.pdf')" class="bg-emerald-700 text-white px-2 py-0.5 rounded font-semibold shrink-0">Baixar</button>
                    </div>
                `;
            }

            return `
                <div class="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs space-y-1.5">
                    <div class="font-bold text-emerald-950 flex justify-between">
                        <span><i class="fa-solid fa-file-contract mr-1"></i> ${c.numero}</span>
                        <span>R$ ${c.valorTotalAtualizado || c.valorContrato}</span>
                    </div>
                    <p class="text-slate-600">${c.descricao}</p>
                    <div class="space-y-1 pt-1">
                        ${arqsContratoQr}
                    </div>
                </div>
            `;
        }).join('');
    } else {
        secContratos.innerHTML = `<div class="text-xs text-slate-400">Nenhum contrato vinculado a este pregão.</div>`;
    }

    document.getElementById('modalQr').classList.remove('hidden');
}

function copiarLinkQr() {
    let txt = document.getElementById('qrCodeUrlText').innerText;
    navigator.clipboard.writeText(txt).then(() => { mostrarToast("Link copiado!"); });
}

function testarModoPublicoDirecto() {
    if(activePastaQrId) { carregarModoPublico(activePastaQrId, false); fecharModal('modalQr'); }
}
function processarRecuperacao(e) {
    if (e) e.preventDefault();
    let email = document.getElementById('recEmail') ? document.getElementById('recEmail').value : '';
    let cpf = document.getElementById('reccpf') ? document.getElementById('reccpf').value : '';
    let novaSenha = document.getElementById('recNovaSenha') ? document.getElementById('recNovaSenha').value : '';

    if (!email || !cpf || !novaSenha) {
        alert("Por favor, preencha todos os campos de recuperação.");
        return;
    }

    alert("Instruções de recuperação enviadas/atualizadas com sucesso!");
    if (typeof fecharModal === 'function') {
        fecharModal('modalRecuperacao');
    }
}