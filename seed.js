import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('./service-account.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const initialData = [
  {
    clientName: 'Apto 124 - Jardins',
    architectName: 'Studio MK27',
    hasDesign: true,
    serviceDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0],
    presentationDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
    estimatedDays: 4,
    status: 'elaboracao',
    isReady: true,
    notes: 'Reunião inicial produtiva. Deseja móveis planejados em tons neutros, amadeirados leves para toda a suíte master e sala de estar integrada.',
    progressNotes: 'Medidas confirmadas in loco. Arquiteto enviou o arquivo final em DWG. Iniciando a modelagem do painel ripado da sala.',
    order: 0,
    createdAt: new Date().toISOString()
  },
  {
    clientName: 'Casa Alphaville',
    architectName: 'Cliente Direto',
    hasDesign: false,
    serviceDate: new Date().toISOString().split('T')[0],
    presentationDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
    estimatedDays: 10,
    status: 'briefing',
    isReady: false,
    notes: 'Cliente não possui projeto técnico estruturado. Será necessário fazer levantamento in loco das medidas da cozinha gourmet e área da ilha.',
    progressNotes: 'Agendado visita de medição técnica para próxima terça-feira às 14h.',
    order: 1,
    createdAt: new Date().toISOString()
  },
  {
    clientName: 'Consultório Odonto',
    architectName: 'Arq. Beatriz Linhares',
    hasDesign: true,
    serviceDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0],
    presentationDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0], 
    estimatedDays: 3,
    status: 'elaboracao',
    isReady: false,
    notes: 'Arquiteta parceira enviou DWG completo. Exigência de gaveteiros com corrediças ocultas e click system em todas as frentes de armário clínico.',
    progressNotes: 'Modelagem 3D finalizada. Estrutura de gaveteiros detalhada. Iniciando o plano de corte para precificação fina de ferragens Blum.',
    order: 2,
    createdAt: new Date().toISOString()
  }
];

async function seed() {
  console.log("Iniciando semeadura do Firestore...");
  const collectionRef = db.collection('projects');
  
  // Limpar dados anteriores
  const snapshot = await collectionRef.get();
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log("Projetos anteriores limpos.");

  // Adicionar dados iniciais
  for (const proj of initialData) {
    const docRef = await collectionRef.add(proj);
    console.log(`Adicionado: ${proj.clientName} com ID: ${docRef.id}`);
  }
  
  console.log("Firestore semeado com sucesso!");
}

seed().catch(err => {
  console.error("Erro ao semear Firestore:", err);
});
