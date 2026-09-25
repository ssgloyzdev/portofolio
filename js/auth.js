// ==== Autentikasi & status admin ====
const Auth = {
  session: null,
  isAdmin: false,
  settings: { login_hidden: false, admin_user_id: null },

  async init() {
    const { data } = await supabaseClient.auth.getSession();
    this.session = data.session;

    supabaseClient.auth.onAuthStateChange((_event, session) => {
      this.session = session;
      this.refreshUI();
    });

    await this.loadSettings();
    await this.refreshAdminStatus();
    this.refreshUI();
  },

  async loadSettings() {
    const { data } = await supabaseClient
      .from("app_settings")
      .select("login_hidden, admin_user_id")
      .eq("id", 1)
      .maybeSingle();
    if (data) this.settings = data;
  },

  async refreshAdminStatus() {
    if (!this.session) { this.isAdmin = false; return; }
    if (!this.settings.admin_user_id) { this.isAdmin = false; return; }
    this.isAdmin = this.session.user.id === this.settings.admin_user_id;
  },

  // Dipanggil otomatis kalau belum ada admin sama sekali & user sudah login GitHub
  async claimAdminIfEmpty() {
    if (!this.session || this.settings.admin_user_id) return false;
    const { error } = await supabaseClient
      .from("app_settings")
      .update({ admin_user_id: this.session.user.id })
      .eq("id", 1)
      .is("admin_user_id", null);
    if (!error) {
      this.settings.admin_user_id = this.session.user.id;
      this.isAdmin = true;
      return true;
    }
    return false;
  },

  async loginGithub() {
    await supabaseClient.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: SITE_URL }
    });
  },

  // true = boleh logout, false = diblokir
  async tryLogout() {
    const forcedVisible = new URLSearchParams(location.search).has(RECOVERY_PARAM);
    if (this.isAdmin && this.settings.login_hidden && !forcedVisible) {
      return false; // diblokir, tampilkan peringatan
    }
    await supabaseClient.auth.signOut();
    this.session = null;
    this.isAdmin = false;
    return true;
  },

  async setLoginHidden(hidden) {
    const { error } = await supabaseClient
      .from("app_settings")
      .update({ login_hidden: hidden })
      .eq("id", 1);
    if (!error) this.settings.login_hidden = hidden;
    return !error;
  },

  loginButtonShouldShow() {
    const forcedVisible = new URLSearchParams(location.search).has(RECOVERY_PARAM);
    if (this.session) return false; // sudah login, tak perlu tombol masuk
    return forcedVisible || !this.settings.login_hidden;
  },

  refreshUI() {
    document.dispatchEvent(new CustomEvent("auth:changed"));
  }
};
