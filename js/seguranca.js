// ==========================================
// MÓDULO DE SEGURANÇA, UTILITÁRIOS E ARQUIVOS
// ==========================================

function mostrarToast(mensagem) {
    const toast = document.getElementById('toastNotification');
    document.getElementById('toastText').innerText = mensagem;
    toast.classList.remove('hidden');
    setTimeout(() => { toast.classList.add('hidden'); }, 3000);
}

function formatarMoedaInput(input) {
    let v = input.value.replace(/\D/g, '');
    if (!v) { input.value = ''; return; }
    v = (parseInt(v, 10) / 100).toFixed(2) + '';
    v = v.replace('.', ',');
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    input.value = v;
}

function parseMoedaParaFloat(str) {
    if (!str) return 0;
    let limpo = str.toString().replace(/\./g, '').replace(',', '.');
    let val = parseFloat(limpo);
    return isNaN(val) ? 0 : val;
}

function formatarFloatParaMoeda(num) {
    return (num || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatarDataBR(isoDate) {
    if (!isoDate) return '-';
    let partes = isoDate.split('-');
    if (partes.length !== 3) return isoDate;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// Função de Download Seguro de Documentos em PDF/Base64
function baixarDocumentoPDF(base64Data, nomeArquivo = 'documento.pdf') {
    try {
        if (!base64Data || base64Data.trim() === '') {
            alert("Este arquivo de demonstração não possui conteúdo binário salvo. Faça um novo upload para testar o download real.");
            return;
        }

        let base64Limpo = base64Data;
        let mimeType = 'application/pdf';

        if (base64Data.includes('base64,')) {
            let partes = base64Data.split('base64,');
            mimeType = base64Data.split(';')[0].replace('data:', '');
            base64Limpo = partes[1];
        }

        const byteCharacters = atob(base64Limpo);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = nomeArquivo;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { 
            document.body.removeChild(a); 
            URL.revokeObjectURL(url); 
        }, 200);
        mostrarToast("Download iniciado com sucesso!");
    } catch (erro) {
        console.error("Erro ao baixar documento:", erro);
        alert("Não foi possível transferir o arquivo. O arquivo pode estar corrompido ou exceder o limite de armazenamento.");
    }
}

// Leitura de Múltiplos Arquivos em Lote (Base64)
function processarArquivosEmLote(files, index, acumulador, callback) {
    if (index >= files.length) { 
        callback(acumulador); 
        return; 
    }
    let file = files[index];
    let reader = new FileReader();
    
    reader.onload = function(evt) {
        let tamanhoMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
        if (file.size < 1024) tamanhoMB = '1 KB';
        
        acumulador.push({ 
            nome: file.name, 
            tamanho: tamanhoMB, 
            dados: evt.target.result 
        });
        processarArquivosEmLote(files, index + 1, acumulador, callback);
    };
    
    reader.onerror = function() {
        alert(`Erro ao ler o arquivo ${file.name}. Tente um arquivo menor.`);
        processarArquivosEmLote(files, index + 1, acumulador, callback);
    };

    reader.readAsDataURL(file);
}