#!/usr/bin/env node

/**
 * Script para iniciar o servidor com melhor gerenciamento de processos
 */

const { spawn } = require('child_process');
const net = require('net');
const path = require('path');

// Função para verificar se a porta está em uso
const isPortInUse = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => {
        resolve(false);
      });
      server.close();
    });
    server.on('error', () => {
      resolve(true);
    });
  });
};

// Função para encontrar processo usando a porta
const findProcessUsingPort = async (port) => {
  return new Promise((resolve, reject) => {
    const cmd = process.platform === 'win32' ? 'netstat' : 'lsof';
    const args = process.platform === 'win32' 
      ? ['-ano', '|', 'findstr', `:${port}`]
      : ['-ti', `:${port}`];
    
    const child = spawn(cmd, args, { shell: true });
    let output = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0 && output.trim()) {
        resolve(output.trim());
      } else {
        resolve(null);
      }
    });
    
    child.on('error', reject);
  });
};

// Função para encerrar processo por PID
const killProcess = (pid) => {
  return new Promise((resolve, reject) => {
    const cmd = process.platform === 'win32' ? 'taskkill' : 'kill';
    const args = process.platform === 'win32' ? ['/PID', pid, '/F'] : ['-9', pid];
    
    const child = spawn(cmd, args);
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    child.on('error', reject);
  });
};

// Função principal
const startServer = async () => {
  const PORT = process.env.PORT || 3030;
  
  console.log(`🔍 Verificando porta ${PORT}...`);
  
  const portInUse = await isPortInUse(PORT);
  
  if (portInUse) {
    console.log(`⚠️  Porta ${PORT} está em uso.`);
    
    try {
      const processInfo = await findProcessUsingPort(PORT);
      
      if (processInfo) {
        console.log(`📋 Processo encontrado: ${processInfo}`);
        
        // Extrair PID do output do netstat (Windows)
        const pidMatch = processInfo.match(/\s+(\d+)$/);
        if (pidMatch) {
          const pid = pidMatch[1];
          console.log(`🔄 Tentando encerrar processo PID ${pid}...`);
          
          const killed = await killProcess(pid);
          if (killed) {
            console.log(`✅ Processo encerrado com sucesso.`);
            // Aguardar um pouco para a porta ser liberada
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            console.log(`❌ Não foi possível encerrar o processo.`);
          }
        }
      }
    } catch (error) {
      console.log(`⚠️  Erro ao verificar processo: ${error.message}`);
    }
  }
  
  console.log(`🚀 Iniciando servidor...`);
  
  // Iniciar o servidor usando nodemon
  const nodemon = spawn('npx', ['nodemon', 'server.js'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, '..')
  });
  
  nodemon.on('error', (error) => {
    console.error(`❌ Erro ao iniciar servidor: ${error.message}`);
    process.exit(1);
  });
  
  nodemon.on('exit', (code) => {
    console.log(`📴 Servidor encerrado com código ${code}`);
    process.exit(code);
  });
  
  // Tratamento de sinais para encerrar graciosamente
  process.on('SIGINT', () => {
    console.log(`\n🛑 Encerrando servidor...`);
    nodemon.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log(`\n🛑 Encerrando servidor...`);
    nodemon.kill('SIGTERM');
  });
};

// Executar se chamado diretamente
if (require.main === module) {
  startServer().catch(console.error);
}

module.exports = { startServer };

