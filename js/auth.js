import { auth } from "./firebase.js";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// LOGIN
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    try {
      await signInWithEmailAndPassword(auth, email, senha);
      window.location.href = "index.html";
    } catch (erro) {
      alert("Erro no login: " + erro.message);
    }
  });
}

// CADASTRO
const cadastroForm = document.getElementById("cadastroForm");

if (cadastroForm) {
  cadastroForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    try {
      await createUserWithEmailAndPassword(auth, email, senha);
      alert("Conta criada!");
      window.location.href = "login.html";
    } catch (erro) {
      alert("Erro: " + erro.message);
    }
  });
}

// PROTEÇÃO DE PÁGINA
onAuthStateChanged(auth, (user) => {
  const pagina = window.location.pathname;

  if (!user && pagina.includes("index.html")) {
    window.location.href = "login.html";
  }
});