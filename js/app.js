import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let chart;
let userAtual = null;


// VERIFICA LOGIN
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  userAtual = user;

  await carregarDados(); // garante execução correta
});
// LOGOUT
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth);
  window.location.href = "login.html";
});

// SALVAR DADOS
document.getElementById("formEvolucao").addEventListener("submit", async function (e) {
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

// CARREGAR DADOS
async function carregarDados() {
  if (!userAtual) return;

  const tabela = document.getElementById("tabelaDados");
  tabela.innerHTML = "";

  let filtroAtual = "";
  let total = 0;
  let soma = 0;
  let melhoras = 0;
  let pioras = 0;

  let labels = [];
  let valores = [];

  try {
    const q = query(
     collection(db, "evolucoes"),
     where("userId", "==", userAtual.uid),
     orderBy("data")
    );

    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
      const d = doc.data();

      tabela.innerHTML += `
        <tr>
          <td>${d.paciente}</td>
          <td>${d.data}</td>
          <td>${d.status}</td>
          <td>${d.nota}</td>
          <td>${d.obs}</td>
        </tr>
      `;

      total++;
      soma += Number(d.nota);

      if (d.status === "melhora") melhoras++;
      else pioras++;

      labels.push(d.data);
      valores.push(d.status === "melhora" ? d.nota : -d.nota);
    });

    // Atualiza métricas
    document.getElementById("total").innerText = total;
    document.getElementById("media").innerText = total ? (soma / total).toFixed(1) : 0;
    document.getElementById("melhoras").innerText = melhoras;
    document.getElementById("pioras").innerText = pioras;

    atualizarGrafico(labels, valores);

  } catch (erro) {
    console.error("Erro ao carregar dados:", erro);
  }
}

  // DASHBOARD
  document.getElementById("total").innerText = total;
  document.getElementById("media").innerText = total ? (soma / total).toFixed(1) : 0;
  document.getElementById("melhoras").innerText = melhoras;
  document.getElementById("pioras").innerText = pioras;

  atualizarGrafico(labels, valores);

// GRÁFICO
function atualizarGrafico(labels, valores) {
  const ctx = document.getElementById("grafico").getContext("2d");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Evolução",
        data: valores,
        borderWidth: 2,
        tension: 0.3
      }]
    }
  });
}
