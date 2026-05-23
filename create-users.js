import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('./service-account.json', 'utf8')
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const auth = admin.auth();
const db = admin.firestore();

const usersToCreate = [
  {
    email: 'carlos@idelli.com.br',
    password: 'mudar123',
    displayName: 'Carlos',
    role: 'master' // Gestor
  },
  {
    email: 'julio@idelli.com.br',
    password: 'mudar123',
    displayName: 'Julio',
    role: 'designer' // Consultor
  }
];

async function createUsers() {
  console.log("Iniciando criação de usuários no Firebase Auth e Firestore...");

  for (const userData of usersToCreate) {
    try {
      // 1. Criar ou obter usuário no Firebase Auth
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(userData.email);
        console.log(`Usuário ${userData.displayName} (${userData.email}) já existe no Auth.`);
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          userRecord = await auth.createUser({
            email: userData.email,
            password: userData.password,
            displayName: userData.displayName
          });
          console.log(`Usuário ${userData.displayName} criado com sucesso no Auth com UID: ${userRecord.uid}`);
        } else {
          throw err;
        }
      }

      // 2. Criar/atualizar perfil de usuário no Firestore (tabela 'users')
      await db.collection('users').doc(userRecord.uid).set({
        name: userData.displayName,
        email: userData.email,
        role: userData.role,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      console.log(`Perfil de ${userData.displayName} cadastrado no Firestore com o papel: ${userData.role}`);
    } catch (error) {
      console.error(`Erro ao processar ${userData.displayName}:`, error);
    }
  }

  console.log("Criação de usuários finalizada!");
}

createUsers().catch(err => {
  console.error("Erro geral na criação de usuários:", err);
});
