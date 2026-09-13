const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const qrcode = require("qrcode-terminal");

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("auth_info_baileys");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    browser: ["WhatsApp MD Bot", "Chrome", "1.0.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log("\n📱 SCANNE CE QR CODE AVEC WHATSAPP :\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "connecting") {
      console.log("🔄 Connexion à WhatsApp...");
    }

    if (connection === "open") {
      console.log("✅ BOT CONNECTÉ À WHATSAPP !");
      console.log("🤖 Ton bot MD est prêt.");
    }

    if (connection === "close") {
      const statusCode =
        lastDisconnect?.error?.output?.statusCode;

      if (statusCode !== DisconnectReason.loggedOut) {
        console.log("🔄 Connexion perdue. Reconnexion...");
        setTimeout(startBot, 3000);
      } else {
        console.log("🚪 Session déconnectée.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;

    const text =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      "";

    if (!text.trim()) return;

    console.log(`📩 ${jid}: ${text}`);

    const command = text.trim().toLowerCase();

    if (command === "!ping") {
      await sock.sendMessage(jid, {
        text: "🏓 Pong ! Le bot fonctionne."
      });
    }

    if (command === "!hello") {
      await sock.sendMessage(jid, {
        text: "👋🏾 Salut bro ! Je suis connecté."
      });
    }

    if (command === "!info") {
      await sock.sendMessage(jid, {
        text:
          "🤖 WhatsApp MD Bot\n\n" +
          "🟢 Statut : connecté\n" +
          "⚡ Baileys Multi-Device\n\n" +
          "Commandes :\n" +
          "!ping\n" +
          "!hello\n" +
          "!info"
      });
    }
  });
}

console.log("🚀 Démarrage du bot...");

startBot().catch((error) => {
  console.error("❌ Erreur :", error);
});
