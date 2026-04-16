import { db } from "./firebase.js";
import { collection, addDoc, getDocs, query, orderBy } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let chart;

// SALVAR DADOS
document.getElementById("formEvolucao").addEventListener("submit", async function(e) {
  e.preventDefault();

  const paciente = document.getElementById("paciente").value;
  const data = document.getElementById("data").value;
  const status = document.getElementById("status").value;
  const nota = parseInt(document.getElementById("nota").value);
  const obs = document.getElementById("obs").value;

  try {
    await addDoc(collection(db, "evolucoes"), {
      paciente,
      data,
      status,
      nota,
      obs
    });

    alert("Salvo com sucesso!");
    carregarDados();
    this.reset();

  } catch (erro) {
    alert("Erro: " + erro.message);
  }
});

// BUSCAR DADOS
async function carregarDados() {
  const tabela = document.getElementById("tabelaDados");
  tabela.innerHTML = "";

  const q = query(collection(db, "evolucoes"), orderBy("data"));
  const querySnapshot = await getDocs(q);

  let labels = [];
  let valores = [];

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

    labels.push(d.data);
    valores.push(d.status === "melhora" ? d.nota : -d.nota);
  });

  atualizarGrafico(labels, valores);
}

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

// CARREGA AO ABRIR
carregarDados();