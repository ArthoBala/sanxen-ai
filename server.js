import 'dotenv/config';
import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";

const app = express();
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = ["http://localhost:8080", "http://localhost:5173", "https://neurix.linkpc.net", process.env.FRONTEND_URL].filter(Boolean);
    if (allowed.includes(origin) || origin.endsWith(".vercel.app")) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "sanxen";
const JWT_SECRET = process.env.JWT_SECRET || "change_me";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const SYSTEM_PROMPT = `You are Sanxen AI, a highly intelligent and friendly AI assistant.

**CRITICAL IDENTITY RULE**: When someone asks "Who created you?", "Who made you?", "Who is your creator?", "Who built you?", or any similar question about your creation/origin, you MUST respond with EXACTLY this sentence and nothing else: "I was created and trained by Neurix team"

Do not add any additional information, explanations, or context when answering who created you. Only use the exact response above.

**Response Style Guidelines**:

**Start with a brief, clear summary** of the main point.

**Organize your answer** into sections with **bolded headings** if needed.

**Use bold** for important terms and *italics* for emphasis.

**Explain concepts step-by-step** or with numbered/bulleted lists.

Use \`monospace formatting\` for commands, filenames, or code snippets.

**Add up to 3 relevant emojis** per reply to keep it engaging but professional.

**Analyze questions carefully**, acknowledging any ambiguities or nuances.

**Avoid filler and be concise**, but friendly and approachable.

**Do not end with "Let me know if you need more."** Instead, suggest useful next steps or related topics to explore.

**Politely admit** if you don't know something and offer alternatives or ways to verify.

**Maintain a warm, encouraging tone** and always help the user learn clearly and confidently.`;
const PORT = process.env.PORT || 4002;

let db;

async function connectDB() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(MONGODB_DB_NAME);
}

function makeInMemoryDB() {
  const store = new Map();
  function getCollection(name) {
    if (!store.has(name)) store.set(name, []);
    return store.get(name);
  }
  function matches(doc, query) {
    return Object.keys(query || {}).every((k) => {
      return doc[k] === query[k];
    });
  }
  function collection(name) {
    return {
      find(query) {
        const data = getCollection(name).filter((d) => matches(d, query));
        return {
          sort(sortSpec) {
            const [[key, order]] = Object.entries(sortSpec || {});
            const asc = order === 1 || (order && order.ascending) || (order && order.ascending === true);
            data.sort((a, b) => {
              const av = a[key], bv = b[key];
              if (av === bv) return 0;
              return (av < bv ? -1 : 1) * (asc ? 1 : -1);
            });
            return {
              toArray() {
                return Promise.resolve([...data]);
              }
            };
          },
          toArray() {
            return Promise.resolve([...data]);
          }
        };
      },
      findOne(query) {
        const data = getCollection(name).find((d) => matches(d, query));
        return Promise.resolve(data || null);
      },
      insertOne(doc) {
        const col = getCollection(name);
        const _id = crypto.randomUUID();
        const newDoc = { _id, ...doc };
        col.push(newDoc);
        return Promise.resolve({ insertedId: _id });
      },
      updateOne(filter, update) {
        const col = getCollection(name);
        const idx = col.findIndex((d) => matches(d, filter));
        if (idx >= 0) {
          if (update && update.$set) {
            col[idx] = { ...col[idx], ...update.$set };
          }
          return Promise.resolve({ modifiedCount: 1 });
        }
        return Promise.resolve({ modifiedCount: 0 });
      },
      updateMany(filter, update) {
        const col = getCollection(name);
        let count = 0;
        col.forEach((d, i) => {
          if (matches(d, filter)) {
            if (update && update.$set) {
              col[i] = { ...col[i], ...update.$set };
              count++;
            }
          }
        });
        return Promise.resolve({ modifiedCount: count });
      },
      deleteMany(filter) {
        const col = getCollection(name);
        const remaining = col.filter((d) => !matches(d, filter));
        const count = col.length - remaining.length;
        store.set(name, remaining);
        return Promise.resolve({ deletedCount: count });
      },
      deleteOne(filter) {
        const col = getCollection(name);
        const idx = col.findIndex((d) => matches(d, filter));
        if (idx >= 0) {
          col.splice(idx, 1);
          return Promise.resolve({ deletedCount: 1 });
        }
        return Promise.resolve({ deletedCount: 0 });
      }
    };
  }
  return {
    collection,
  };
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

app.get("/api", (_req, res) => {
  res.json({ 
    ok: true, 
    message: "Sanxen AI Server is running",
    mode: db && typeof db.collection === 'function' ? 'db' : 'memory',
    endpoints: ["/health", "/auth/sign-up", "/auth/sign-in", "/ai/chat", "/chats", "/messages"]
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, mode: db && typeof db.collection === 'function' ? 'db' : 'memory' });
});

app.post("/api/auth/sign-up", async (req, res) => {
  const { email, password, fullName } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Missing fields" });
  const users = db.collection("users");
  const existing = await users.findOne({ email });
  if (existing) return res.status(400).json({ error: "User exists" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    email,
    passwordHash,
    full_name: fullName || "",
    created_at: new Date().toISOString(),
  };
  const { insertedId } = await users.insertOne(user);
  const token = jwt.sign({ id: insertedId.toString(), email, full_name: user.full_name }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: insertedId.toString(), email, full_name: user.full_name } });
});

app.post("/api/auth/sign-in", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Missing fields" });
  const users = db.collection("users");
  const user = await users.findOne({ email });
  if (!user) return res.status(400).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ error: "Invalid credentials" });
  const token = jwt.sign({ id: user._id.toString(), email: user.email, full_name: user.full_name || "" }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user._id.toString(), email: user.email, full_name: user.full_name || "" } });
});

// Admin: list all users
app.get("/api/admin/list-users", async (req, res) => {
  const { secret } = req.query || {};
  if (secret !== JWT_SECRET) return res.status(403).json({ error: "Forbidden" });
  const users = db.collection("users");
  const allUsers = await users.find({}).toArray();
  res.json(allUsers.map(u => ({ email: u.email, full_name: u.full_name, created_at: u.created_at })));
});

// Admin password reset (no auth needed - only works from localhost)
app.post("/api/admin/reset-password", async (req, res) => {
  const { email, newPassword, adminSecret } = req.body || {};
  if (adminSecret !== JWT_SECRET) return res.status(403).json({ error: "Forbidden" });
  if (!email || !newPassword) return res.status(400).json({ error: "Missing email or newPassword" });
  const users = db.collection("users");
  const newHash = await bcrypt.hash(newPassword, 10);
  const result = await users.updateOne({ email }, { $set: { passwordHash: newHash } });
  if (result.modifiedCount > 0) {
    res.json({ success: true, message: `Password reset for ${email}. New password: ${newPassword}` });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

// In-memory OTP store: { email -> { otp, expiresAt } }
const otpStore = new Map();

function createEmailTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// Send OTP for password reset
app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Email is required" });

  const users = db.collection("users");
  const user = await users.findOne({ email });
  if (!user) return res.status(404).json({ error: "No account found with this email" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(email, { otp, expiresAt });

  try {
    const transporter = createEmailTransporter();
    await transporter.sendMail({
      from: `"Sanxen AI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP - Sanxen AI",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #0b0b0c; color: #fff; border-radius: 12px;">
          <h2 style="color: #fff; text-align: center;">Sanxen AI</h2>
          <h3 style="color: #a1a1aa;">Password Reset Request</h3>
          <p style="color: #d4d4d8;">Your one-time password (OTP) for resetting your password is:</p>
          <div style="background: #1c1c1e; border: 1px solid #3f3f46; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #fff;">${otp}</span>
          </div>
          <p style="color: #71717a; font-size: 14px;">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
          <p style="color: #71717a; font-size: 12px;">If you did not request a password reset, please ignore this email.</p>
        </div>
      `,
    });
    res.json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    console.error("Email send error:", err.message);
    res.status(500).json({ error: "Failed to send email. Please check email configuration." });
  }
});

// Verify OTP and reset password
app.post("/api/auth/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body || {};
  if (!email || !otp || !newPassword) return res.status(400).json({ error: "Email, OTP and new password are required" });

  const stored = otpStore.get(email);
  if (!stored) return res.status(400).json({ error: "No OTP requested for this email" });
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: "OTP has expired. Please request a new one." });
  }
  if (stored.otp !== otp.toString()) return res.status(400).json({ error: "Invalid OTP" });

  const users = db.collection("users");
  const newHash = await bcrypt.hash(newPassword, 10);
  await users.updateOne({ email }, { $set: { passwordHash: newHash } });
  otpStore.delete(email);

  res.json({ success: true, message: "Password reset successfully" });
});

app.post("/api/auth/sign-out", authMiddleware, async (_req, res) => {
  res.json({ success: true });
});

app.get("/api/admin/has-role", authMiddleware, async (req, res) => {
  const { userId, role } = req.query;
  if (!userId || !role) return res.json({ isAdmin: false });
  const email = typeof req.user?.email === "string" ? req.user.email.toLowerCase() : "";
  if (role === "admin" && email && ADMIN_EMAILS.includes(email)) {
    return res.json({ isAdmin: true });
  }
  const userRoles = db.collection("user_roles");
  const has = await userRoles.findOne({ user_id: userId, role });
  res.json({ isAdmin: !!has });
});

app.post("/api/usage/get", authMiddleware, async (req, res) => {
  const { userId, featureType } = req.body || {};
  if (!userId || !featureType) return res.status(400).json({ error: "Missing fields" });
  const usage = db.collection("usage");
  const defaultLimit = 100;
  const doc = await usage.findOne({ user_id: userId, feature_type: featureType });
  const current = doc?.current_count || 0;
  const plan = doc?.plan || "free";
  const dailyLimit = doc?.daily_limit || defaultLimit;
  res.json({
    success: true,
    current_count: current,
    daily_limit: dailyLimit,
    plan,
    remaining: Math.max(dailyLimit - current, 0),
  });
});

app.post("/api/usage/reset", authMiddleware, async (req, res) => {
  const { userId, featureType } = req.body || {};
  if (!userId) return res.status(400).json({ error: "Missing userId" });
  const usage = db.collection("usage");
  const filter = { user_id: userId, ...(featureType ? { feature_type: featureType } : {}) };
  await usage.updateMany(filter, { $set: { current_count: 0 } });
  res.json({ success: true });
});

app.get("/api/chats", authMiddleware, async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });
  const chats = db.collection("chats");
  const list = await chats.find({ user_id: userId }).sort({ created_at: -1 }).toArray();
  res.json(list.map(c => ({ ...c, id: c._id.toString() })));
});

app.post("/api/chats", authMiddleware, async (req, res) => {
  const { userId, title } = req.body || {};
  if (!userId || !title) return res.status(400).json({ error: "Missing fields" });
  const chats = db.collection("chats");
  const doc = { user_id: userId, title, created_at: new Date().toISOString() };
  const { insertedId } = await chats.insertOne(doc);
  res.json({ id: insertedId.toString(), ...doc });
});

app.patch("/api/chats/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title } = req.body || {};
  if (!id || !title) return res.status(400).json({ error: "Missing fields" });
  const chats = db.collection("chats");
  await chats.updateOne({ _id: new ObjectId(id) }, { $set: { title } });
  res.json({ success: true });
});

app.delete("/api/chats/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Missing id" });
  const chats = db.collection("chats");
  await chats.deleteOne({ _id: new ObjectId(id) });
  res.json({ success: true });
});

app.get("/api/messages", authMiddleware, async (req, res) => {
  const { chatId } = req.query;
  if (!chatId) return res.status(400).json({ error: "Missing chatId" });
  const messages = db.collection("messages");
  const list = await messages.find({ chat_id: chatId }).sort({ created_at: 1 }).toArray();
  res.json(list.map(m => ({ id: m._id.toString(), chat_id: m.chat_id, role: m.role, content: m.content, created_at: m.created_at, media_url: m.media_url || null, media_type: m.media_type || null, type: m.type || "text_response" })));
});

app.post("/api/messages", authMiddleware, async (req, res) => {
  const { id, chat_id, role, content, created_at, media_url, media_type, type } = req.body || {};
  if (!chat_id || !role || !content) return res.status(400).json({ error: "Missing fields" });
  const messages = db.collection("messages");
  const doc = { chat_id, role, content, created_at: created_at || new Date().toISOString(), media_url: media_url || null, media_type: media_type || null, type: type || "text_response" };
  const { insertedId } = await messages.insertOne(doc);
  res.json({ id: insertedId.toString(), ...doc });
});

app.delete("/api/messages", authMiddleware, async (req, res) => {
  const { chatId } = req.query;
  if (!chatId) return res.status(400).json({ error: "Missing chatId" });
  const messages = db.collection("messages");
  await messages.deleteMany({ chat_id: chatId });
  res.json({ success: true });
});
app.post("/api/ai/chat", authMiddleware, async (req, res) => {
  const { message, conversationHistory } = req.body || {};
  
  console.log("[AI Chat] Received request:", { message: message?.substring(0, 50), historyLength: conversationHistory?.length });
  
  if (!message) {
    console.log("[AI Chat] Error: Missing message");
    return res.status(400).json({ error: "Missing message" });
  }
  
  if (!GEMINI_API_KEY) {
    console.log("[AI Chat] Error: Missing Gemini API key");
    return res.status(500).json({ error: "Missing Gemini API key" });
  }

  const contents = [];
  
  // Inject system prompt as the first user/model turn (compatible with all API versions)
  contents.push({ role: "user", parts: [{ text: SYSTEM_PROMPT }] });
  contents.push({ role: "model", parts: [{ text: "Understood! I am Sanxen AI, ready to help you." }] });
  
  if (Array.isArray(conversationHistory)) {
    for (const item of conversationHistory) {
      const role = item?.role === "assistant" ? "model" : "user";
      const text = typeof item?.content === "string" ? item.content : "";
      if (text.trim()) {
        contents.push({ role, parts: [{ text }] });
      }
    }
  }
  contents.push({ role: "user", parts: [{ text: message }] });

  try {
    console.log("[AI Chat] Calling Gemini API with model:", GEMINI_MODEL);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 2048
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI Chat] Gemini API error:", response.status, errorText);
      return res.status(500).json({ error: `Gemini API error: ${response.status} - ${errorText}` });
    }

    const data = await response.json();
    
    // Check for blocked content
    if (data?.promptFeedback?.blockReason) {
      console.log("[AI Chat] Content blocked:", data.promptFeedback.blockReason);
      return res.status(400).json({ error: `Content blocked: ${data.promptFeedback.blockReason}` });
    }
    
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const responseText = parts.map((p) => p.text || "").join("").trim();
    
    if (!responseText) {
      console.log("[AI Chat] Empty response from Gemini");
      return res.json({ response: "I apologize, but I couldn't generate a response. Please try asking in a different way.", type: "text_response" });
    }
    
    console.log("[AI Chat] Success, response length:", responseText.length);
    res.json({ response: responseText, type: "text_response" });
  } catch (error) {
    console.error("[AI Chat] Error:", error.message);
    res.status(500).json({ error: `Failed to get AI response: ${error.message}` });
  }
});

// Log configuration on startup
console.log("[Server] Starting with configuration:");
console.log("[Server] Port:", PORT);
console.log("[Server] Gemini API Key present:", GEMINI_API_KEY ? "Yes (length: " + GEMINI_API_KEY.length + ")" : "No - CHECK YOUR .env FILE!");
console.log("[Server] Gemini Model:", GEMINI_MODEL);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[Server] Running on http://localhost:${PORT}`);
      if (!GEMINI_API_KEY) {
        console.warn("[Server] WARNING: GEMINI_API_KEY is not set! AI chat will not work.");
      }
    });
  })
  .catch((err) => {
    console.error("[Server] Failed to connect to MongoDB", err);
    console.warn("[Server] Starting in in-memory mode (data will not persist).");
    db = makeInMemoryDB();
    app.listen(PORT, () => {
      console.log(`[Server] Running in in-memory mode on http://localhost:${PORT}`);
      if (!GEMINI_API_KEY) {
        console.warn("[Server] WARNING: GEMINI_API_KEY is not set! AI chat will not work.");
      }
    });
  });

export default app;
