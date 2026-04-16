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
let pacienteSelecionado = "";

// LOGIN
onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "login.html";
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
  const hora = document.getElementById("hora").value;
  const nota = parseInt(document.getElementById("nota").value);
  const obs = document.getElementById("obs").value;

  await addDoc(collection(db, "evolucoes"), {
    userId: userAtual.uid,
    paciente,
    data,
    hora,
    nota,
    obs
  });

  carregarDados();
  e.target.reset();
});

// SELECT PACIENTE
document.getElementById("selectPaciente").addEventListener("change", (e) => {
  pacienteSelecionado = e.target.value.toLowerCase();
  carregarDados();
});

// FILTRO TEXTO
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
      chave = `${d.data} ${d.hora}`;
    }

    if (!grupos[chave]) {
      grupos[chave] = { soma: 0, count: 0 };
    }

    grupos[chave].soma += d.valor;
    grupos[chave].count++;
  });

  return {
    labels: Object.keys(grupos),
    valores: Object.values(grupos).map(g => g.soma / g.count)
  };
}

// PREENCHER SELECT
function preencherPacientes(lista) {
  const select = document.getElementById("selectPaciente");
  const nomes = [...new Set(lista.map(d => d.paciente))];

  select.innerHTML = `<option value="">Todos os pacientes</option>`;

  nomes.forEach(nome => {
    select.innerHTML += `<option value="${nome}">${nome}</option>`;
  });
}

// CARREGAR
async function carregarDados() {
  const tabela = document.getElementById("tabelaDados");
  tabela.innerHTML = "";

  let total = 0, soma = 0, melhoras = 0, pioras = 0;
  let dadosBrutos = [];
  let ultimo = {};
  let todos = [];

  const q = query(
    collection(db, "evolucoes"),
    where("userId", "==", userAtual.uid),
    orderBy("data"),
    orderBy("hora")
  );

  const snapshot = await getDocs(q);

  snapshot.forEach(doc => {
    const d = doc.data();
    todos.push(d);

    if (pacienteSelecionado && d.paciente.toLowerCase() !== pacienteSelecionado) return;
    if (filtroAtual && !d.paciente.toLowerCase().includes(filtroAtual)) return;

    let status = "—";

    if (ultimo[d.paciente] !== undefined) {
      if (d.nota > ultimo[d.paciente]) status = "Melhora";
      else if (d.nota < ultimo[d.paciente]) status = "Piora";
      else status = "Estável";
    }

    ultimo[d.paciente] = d.nota;

    tabela.innerHTML += `
      <tr>
        <td>${d.paciente}</td>
        <td>${d.data}</td>
        <td>${d.hora}</td>
        <td>${d.nota}</td>
        <td>${status}</td>
        <td>${d.obs}</td>
      </tr>
    `;

    total++;
    soma += d.nota;
    if (status === "Melhora") melhoras++;
    if (status === "Piora") pioras++;

    dadosBrutos.push({
      ...d,
      valor: status === "Melhora" ? d.nota :
             status === "Piora" ? -d.nota : 0
    });
  });

  preencherPacientes(todos);

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
