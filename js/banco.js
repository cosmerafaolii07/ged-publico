// ==========================================
// MÓDULO DE BANCO DE DADOS E ESTADO (GED PÚBLICO)
// ==========================================

const CHAVE_DB = 'ged_publico_db_v1';

// Dados do Usuário Master / Administrador
let usuarioMaster = JSON.parse(localStorage.getItem('ged_master')) || {
    usuario: 'rafael Oliveira',
    senha: '96413026',
    email: 'cosmerafaolii.07@gmail.com',
    cpf: '070.326.663-29'
};

let listaUsuarios = JSON.parse(localStorage.getItem('ged_usuarios')) || [];

// Dados Iniciais Padrão para Órgãos Municipais
const dadosIniciais = {
    orgaos: [
        {
            id: '1',
            nome: 'Prefeitura Municipal de Ereré',
            cnpj: '01.987.654/0001-10',
            tipo: 'Prefeitura Municipal',
            gestor: 'Prefeito Municipal',
            endereco: 'Rua Principal, Centro, Ereré - CE',
            secretarias: ['Gabinete do Prefeito', 'Secretaria de Administração', 'Secretaria de Finanças', 'Secretaria de Educação', 'Secretaria de Saúde', 'Secretaria de Obras'],
            anos: ['2026', '2025', '2024'],
            tiposDoc: ['Processo de Pagamento'],
            tiposAtos: ['Decreto', 'Portaria', 'Lei', 'Ofício', 'Requerimento']
        },
        {
            id: '2',
            nome: 'Câmara Municipal de Ereré',
            cnpj: '07.123.456/0001-90',
            tipo: 'Câmara Municipal',
            gestor: 'Presidente da Câmara',
            endereco: 'Rua da Assembleia, Centro, Ereré - CE',
            secretarias: ['Gabinete da Presidência', 'Secretaria Legislativa', 'Setor Financeiro', 'Setor de Licitações'],
            anos: ['2026', '2025'],
            tiposDoc: ['Processo de Pagamento'],
            tiposAtos: ['Decreto Legislativo', 'Portaria', 'Resolução', 'Ofício Expedido', 'Requerimento']
        }
    ],
    pastas: []
};

// Carregamento do Banco de Dados Local
let bancoDados = {
    orgaos: JSON.parse(localStorage.getItem('ged_orgaos')) || dadosIniciais.orgaos,
    pastas: JSON.parse(localStorage.getItem('ged_pastas')) || dadosIniciais.pastas
};

// Validação e normalização de estruturas antigas
bancoDados.orgaos.forEach(org => {
    if (!org.secretarias) org.secretarias = ['Gabinete', 'Administração'];
    if (!org.tiposDoc) org.tiposDoc = ['Processo de Pagamento'];
    if (!org.tiposAtos) {
        if (org.tiposDoc.length > 1) {
            org.tiposAtos = org.tiposDoc.filter(t => t !== 'Processo de Pagamento');
            org.tiposDoc = ['Processo de Pagamento'];
        } else {
            org.tiposAtos = ['Decreto', 'Portaria', 'Lei', 'Ofício'];
        }
    }
    if (!org.anos) org.anos = ['2026', '2025'];
    if (!org.endereco) org.endereco = 'Endereço não informado';
});

// Função centralizada para salvar no localStorage
function salvarLocalStorage() {
    try {
        localStorage.setItem('ged_orgaos', JSON.stringify(bancoDados.orgaos));
        localStorage.setItem('ged_pastas', JSON.stringify(bancoDados.pastas));
        localStorage.setItem('ged_master', JSON.stringify(usuarioMaster));
        localStorage.setItem('ged_usuarios', JSON.stringify(listaUsuarios));
    } catch (e) {
        console.error("Erro no localStorage:", e);
        alert("⚠️ ATENÇÃO: O armazenamento local atingiu o limite máximo de tamanho devido aos arquivos PDF grandes em Base64. Remova algum documento antigo ou envie arquivos mais leves para conseguir salvar.");
    }
}