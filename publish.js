const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const version = process.argv[2];

if (!version) {
  console.error('❌ Erro: Você DEVE passar a versão como argumento! Exemplo: bun run release 1.0.0');
  process.exit(1);
}

const IMAGE = 'srvini/perfomantia';

// Atualiza a versão nos package.json do projeto
const pkgPaths = [
  path.join(__dirname, 'package.json'),
  path.join(__dirname, 'core-server', 'package.json'),
  path.join(__dirname, 'webapp', 'package.json'),
];

console.log(`\n📦 [0/3] Atualizando versão nos package.json para ${version}...`);
for (const pkgPath of pkgPaths) {
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    pkg.version = version;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`   ✔ ${path.relative(__dirname, pkgPath)}`);
  }
}

try {
  console.log(`\n🐳 [1/3] Construindo Imagem Versão ${version}...`);
  execSync(`docker build -t ${IMAGE}:${version} .`, { stdio: 'inherit' });

  console.log(`\n🏷️ [2/3] Vinculando Tag 'latest'...`);
  execSync(`docker tag ${IMAGE}:${version} ${IMAGE}:latest`, { stdio: 'inherit' });

  console.log(`\n🚀 [3/3] Enviando para o Docker Hub...`);
  execSync(`docker push ${IMAGE}:${version}`, { stdio: 'inherit' });
  execSync(`docker push ${IMAGE}:latest`, { stdio: 'inherit' });

  console.log(`\n✅ Lançamento da versão ${version} concluído com sucesso com tag 'latest'! 🎉`);
} catch (error) {
  console.error('\n❌ Erro durante o processo de deploy:', error.message);
  process.exit(1);
}
