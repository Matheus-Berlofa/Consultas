import { db, auth } from "./firebase.js";
import { 
  collection, addDoc, getDocs, query, orderBy, where 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let chart;
let userAtual = null;

// GARANTE USUÁRIO LOGADO
onAuthStateChanged(auth, (user) => {
  if (user) {
    userAtual = user;
    carregarDados();
  }
});

// SALVAR DADOS COM USER ID
document.getElementById("formEvolucao").addEventListener("submit", async function(e) {
  e.preventDefault();

  const paciente = document.getElementById("paciente").value;
  const data = document.getElementById("data").value;
  const status = document.getElementById("status").value;
  const nota = parseInt(document.getElementById("nota").value);
  const obs = document.getElementById("obs").value;

  try {
    await addDoc(collection(db, "evolucoes"), {
      userId: userAtual.uid,
      paciente,
      data,
      status,
      nota,
      obs
    });

    carregarDados();
    this.reset();

  } catch (erro) {
    alert("Erro: " + erro.message);
  }
});
