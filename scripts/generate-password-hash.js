#!/usr/bin/env node

const crypto = require("crypto");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("📝 輸入你的網站密碼（不會顯示）：", (password) => {
  if (!password) {
    console.log("❌ 密碼不能為空");
    rl.close();
    return;
  }

  const hash = crypto.createHash("sha256").update(password).digest("hex");

  console.log("\n✅ 密碼雜湊已生成");
  console.log("═".repeat(60));
  console.log(`\n🔐 雜湊值（請複製）：\n${hash}\n`);
  console.log("═".repeat(60));
  console.log("\n📌 接下來的步驟：\n");
  console.log("1️⃣  本機開發：");
  console.log("   在 .env.local 新增：");
  console.log(`   SITE_PASSWORD_HASH=${hash}\n`);
  console.log("2️⃣  Vercel 部署：");
  console.log("   Settings → Environment Variables → 新增：");
  console.log("   Key: SITE_PASSWORD_HASH");
  console.log(`   Value: ${hash}\n`);
  console.log("3️⃣  本機測試：");
  console.log("   npm run dev");
  console.log("   打開 http://localhost:3000");
  console.log("   輸入剛剛設定的密碼\n");

  rl.close();
});
