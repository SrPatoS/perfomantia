const { execSync } = require('child_process');
const version = process.argv[2];

if (!version) {
  console.error('❌ Erro: Você DEVE passar a versão como argumento! Exemplo: bun run release 1.0.0');
  process.exit(1);
}

const IMAGE = 'srvini/perfomantia';

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
