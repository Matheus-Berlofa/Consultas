import { db, auth } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let userAtual;
let chart;
let filtroAtual = "";
let periodo = "dia";

// LOGIN
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  userAtual = user;
  carregarDados();
});

// LOGOUT
document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth);
  window.location.href = "login.html";
});

// SALVAR
document.getElementById("formEvolucao").addEventListener("submit", async (e) => {
  e.preventDefault();

  const paciente = document.getElementById("paciente").value;
  const data = document.getElementById("data").value;
  const status = document.getElementById("status").value;
  const nota = parseInt(document.getElementById("nota").value);
  const obs = document.getElementById("obs").value;

  await addDoc(collection(db, "evolucoes"), {
    userId: userAtual.uid,
    paciente,
    data,
    status,
    nota,
    obs
  });

  carregarDados();
  e.target.reset();
});

// FILTRO
document.getElementById("filtroPaciente").addEventListener("input", (e) => {
  filtroAtual = e.target.value.toLowerCase();
  carregarDados();
});

document.getElementById("btnLimpar").addEventListener("click", () => {
  filtroAtual = "";
  document.getElementById("filtroPaciente").value = "";
  carregarDados();
});

// PERÍODO
window.mudarPeriodo = function(p) {
  periodo = p;
  carregarDados();
};

// AGRUPAMENTO
function agruparDados(dados) {
  const grupos = {};

  dados.forEach(d => {
    let chave;
    const data = new Date(d.data);

    if (periodo === "semana") {
      const semana = Math.ceil(data.getDate() / 7);
      chave = `S${semana}/${data.getMonth()+1}`;
    } else if (periodo === "mes") {
      chave = `${data.getMonth()+1}/${data.getFullYear()}`;
    } else {
      chave = d.data;
    }

    if (!grupos[chave]) {
      grupos[chave] = { soma: 0, count: 0 };
    }

    grupos[chave].soma += (d.status === "melhora" ? d.nota : -d.nota);
    grupos[chave].count++;
  });

  const labels = [];
  const valores = [];

  for (let key in grupos) {
    labels.push(key);
    valores.push(grupos[key].soma / grupos[key].count);
  }

  return { labels, valores };
}

// CARREGAR DADOS
async function carregarDados() {
  const tabela = document.getElementById("tabelaDados");
  tabela.innerHTML = "";

  let total = 0, soma = 0, melhoras = 0, pioras = 0;
  let dadosBrutos = [];

  const q = query(
    collection(db, "evolucoes"),
    where("userId", "==", userAtual.uid),
    orderBy("data")
  );

  const snapshot = await getDocs(q);

  snapshot.forEach(doc => {
    const d = doc.data();

    if (filtroAtual && !d.paciente.toLowerCase().includes(filtroAtual)) return;

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
    soma += d.nota;
    d.status === "melhora" ? melhoras++ : pioras++;

    dadosBrutos.push(d);
  });

  document.getElementById("total").innerText = total;
  document.getElementById("media").innerText = total ? (soma/total).toFixed(1) : 0;
  document.getElementById("melhoras").innerText = melhoras;
  document.getElementById("pioras").innerText = pioras;

  const { labels, valores } = agruparDados(dadosBrutos);
  atualizarGrafico(labels, valores);
}

// GRÁFICO
function atualizarGrafico(labels, valores) {
  const ctx = document.getElementById("grafico");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Evolução",
        data: valores,
        tension: 0.3
      }]
    }
  });
}
