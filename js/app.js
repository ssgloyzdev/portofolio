// ==== Wiring UI utama ====
const $ = (sel) => document.querySelector(sel);

function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (el.hidden = true), 2600);
}

function openModal(id) { $(`#${id}`).hidden = false; }
function closeModal(id) { $(`#${id}`).hidden = true; }

document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => closeModal(btn.dataset.close));
});

// ---------- Render status login/admin ----------
async function renderAuthUI() {
  $("#btnLogin").hidden = !Auth.loginButtonShouldShow();
  $("#btnLogout").hidden = !Auth.session;
  $("#btnAdminPanel").hidden = !Auth.isAdmin;
  $("#btnNewKarya").hidden = !Auth.isAdmin;

  if (Auth.session && !Auth.settings.admin_user_id) {
    const claimed = await Auth.claimAdminIfEmpty();
    if (claimed) {
      toast("Akun ini sekarang jadi admin ✨");
      $("#btnAdminPanel").hidden = false;
      $("#btnNewKarya").hidden = false;
    }
  }
}

document.addEventListener("auth:changed", renderAuthUI);

$("#btnLogin").addEventListener("click", () => Auth.loginGithub());

$("#btnLogout").addEventListener("click", async () => {
  const ok = await Auth.tryLogout();
  if (!ok) {
    openModal("logoutBlockedModal");
    return;
  }
  toast("Berhasil keluar");
  renderAuthUI();
});

$("#btnGoUnhide").addEventListener("click", () => {
  closeModal("logoutBlockedModal");
  openModal("adminPanelModal");
});

// ---------- Panel admin ----------
$("#btnAdminPanel").addEventListener("click", () => {
  $("#toggleHideLogin").checked = !!Auth.settings.login_hidden;
  openModal("adminPanelModal");
});

$("#toggleHideLogin").addEventListener("change", async (e) => {
  const ok = await Auth.setLoginHidden(e.target.checked);
  if (ok) {
    toast(e.target.checked ? "Tombol login disembunyikan" : "Tombol login ditampilkan lagi");
    renderAuthUI();
  } else {
    toast("Gagal menyimpan pengaturan");
    e.target.checked = !e.target.checked;
  }
});

// ---------- Navigasi Landing <-> Gallery ----------
$("#btnBrowse").addEventListener("click", async () => {
  $("#viewLanding").hidden = true;
  $("#viewGallery").hidden = false;
  await loadGallery();
});
$("#btnBackHome").addEventListener("click", () => {
  $("#viewGallery").hidden = true;
  $("#viewLanding").hidden = false;
});

async function loadGallery() {
  const grid = $("#karyaGrid");
  grid.innerHTML = "";
  const list = await Karya.fetchAll();
  $("#karyaEmpty").hidden = list.length > 0;

  list.forEach((k) => {
    const card = document.createElement("div");
    card.className = "karya-card";
    card.innerHTML = `
      <h4>${escapeHtml(k.title || "Tanpa judul")}</h4>
      <div class="karya-meta">${new Date(k.created_at).toLocaleDateString("id-ID")}</div>
      <div class="karya-card-actions">
        <button class="btn btn-outline btn-sm act-view">👁️ Lihat</button>
        ${Auth.isAdmin ? '<button class="btn btn-ghost btn-sm act-edit">✏️ Edit</button>' : ""}
      </div>`;
    card.querySelector(".act-view").addEventListener("click", () => openViewer(k));
    const editBtn = card.querySelector(".act-edit");
    if (editBtn) editBtn.addEventListener("click", () => openEditor(k));
    grid.appendChild(card);
  });
}

function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------- Viewer fullscreen ----------
function openViewer(k) {
  $("#viewerTitle").textContent = k.title || "Tanpa judul";
  Karya.renderInto($("#viewerFrame"), { html: k.html, css: k.css, js: k.js, combine: k.combine_html_js });
  $("#btnViewerEdit").hidden = !Auth.isAdmin;
  $("#btnViewerEdit").onclick = () => { closeOverlay(); openEditor(k); };
  openModal("viewerOverlay");
}
$("#btnViewerClose").addEventListener("click", closeOverlay);
function closeOverlay() { closeModal("viewerOverlay"); $("#viewerFrame").srcdoc = ""; }

// ---------- Editor ----------
function openEditor(k) {
  Karya.editingId = k ? k.id : null;
  $("#editorHeading").textContent = k ? "✏️ Edit Karya" : "✨ Buat Karya Baru";
  $("#karyaTitle").value = k ? k.title || "" : "";
  $("#codeHtml").value = k ? k.html || "" : "";
  $("#codeJs").value = k ? k.js || "" : "";
  $("#codeCss").value = k ? k.css || "" : "";
  $("#combineHtmlJs").checked = k ? !!k.combine_html_js : false;
  $("#btnDeleteKarya").hidden = !k;
  toggleCombineColumn();
  switchTab("code");
  openModal("editorModal");
}
$("#btnNewKarya").addEventListener("click", () => openEditor(null));

$("#combineHtmlJs").addEventListener("change", toggleCombineColumn);
function toggleCombineColumn() {
  const combine = $("#combineHtmlJs").checked;
  $("#jsColumn").style.display = combine ? "none" : "";
  $("#jsInlineNote").hidden = !combine;
}

function switchTab(name) {
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  $("#tabCode").classList.toggle("active", name === "code");
  $("#tabPreview").classList.toggle("active", name === "preview");
}
document.querySelectorAll(".tab-btn").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));

$("#btnRenderPreview").addEventListener("click", () => {
  Karya.renderInto($("#previewFrame"), currentEditorPayload());
});

function currentEditorPayload() {
  return {
    html: $("#codeHtml").value,
    css: $("#codeCss").value,
    js: $("#combineHtmlJs").checked ? "" : $("#codeJs").value,
    combine: $("#combineHtmlJs").checked
  };
}

$("#btnSaveKarya").addEventListener("click", async () => {
  const title = $("#karyaTitle").value.trim();
  if (!title) { toast("Judul karya wajib diisi"); return; }
  const ok = await Karya.save({ id: Karya.editingId, title, ...currentEditorPayload() });
  if (ok) {
    toast("Karya tersimpan 🔥");
    closeModal("editorModal");
    loadGallery();
  } else {
    toast("Gagal menyimpan (cek RLS/koneksi Supabase)");
  }
});

$("#btnDeleteKarya").addEventListener("click", async () => {
  if (!Karya.editingId) return;
  if (!confirm("Hapus karya ini?")) return;
  const ok = await Karya.remove(Karya.editingId);
  if (ok) {
    toast("Karya dihapus");
    closeModal("editorModal");
    loadGallery();
  } else {
    toast("Gagal menghapus");
  }
});

// ---------- Init ----------
(async function boot() {
  await Auth.init();
})();
