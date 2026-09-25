// ==== Karya (website statis buatan admin) ====
const Karya = {
  editingId: null,

  // CSS tema dasar yang SELALU disuntikkan sebelum CSS milik karya,
  // supaya semua karya konsisten 1 tema dengan situs portofolio.
  baseThemeCss() {
    return `
      :root{
        --hutao-bg:#f1dcbd; --hutao-bg-deep:#e3c299; --hutao-surface:#fbf0dd;
        --hutao-red:#c1272d; --hutao-red-dark:#7a1418; --hutao-gold:#d9a441;
        --hutao-brown:#5c3a21; --hutao-text:#402a18; --hutao-radius:14px;
        --hutao-shadow:0 8px 24px rgba(92,58,33,.25);
        --hutao-font:'Poppins',sans-serif; --hutao-font-deco:'Cinzel',serif;
      }
      html,body{margin:0;background:var(--hutao-bg);color:var(--hutao-text);font-family:var(--hutao-font);}
      #karya-root{min-height:100vh;padding:16px;}
    `;
  },

  async fetchAll() {
    const { data, error } = await supabaseClient
      .from("karya")
      .select("*")
      .order("created_at", { ascending: false });
    return error ? [] : data;
  },

  async fetchOne(id) {
    const { data } = await supabaseClient.from("karya").select("*").eq("id", id).maybeSingle();
    return data;
  },

  buildDoc({ html, css, js, combine }) {
    const bodyHtml = html || "";
    const scriptTag = combine ? "" : `<script>${js || ""}<\/script>`;
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${this.baseThemeCss()}\n${css || ""}</style></head>
<body><div id="karya-root">${bodyHtml}</div>${scriptTag}</body></html>`;
  },

  renderInto(iframeEl, payload) {
    iframeEl.srcdoc = this.buildDoc(payload);
  },

  async save({ id, title, html, css, js, combine }) {
    const row = { title, html, css, js, combine_html_js: combine };
    if (id) {
      const { error } = await supabaseClient.from("karya").update(row).eq("id", id);
      return !error;
    } else {
      row.owner = Auth.session ? Auth.session.user.id : null;
      const { error } = await supabaseClient.from("karya").insert(row);
      return !error;
    }
  },

  async remove(id) {
    const { error } = await supabaseClient.from("karya").delete().eq("id", id);
    return !error;
  }
};
