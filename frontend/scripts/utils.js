const readline = require("readline");
const { PrismaClient } = require("@prisma/client");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

let prisma;

function initPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

let rl;

function getRL() {
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }
  return rl;
}

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
};

function colorize(text, color) {
  return (colors[color] || "") + text + colors.reset;
}

function askQuestion(promptText, defaultValue = "") {
  const rlInstance = getRL();
  const prompt = defaultValue
    ? `${promptText} [${defaultValue}]: `
    : `${promptText}: `;
  return new Promise((resolve) => {
    rlInstance.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

function askYesNo(promptText, defaultVal = "n") {
  return new Promise(async (resolve) => {
    const hint = defaultVal.toLowerCase() === "y" ? "Y/n" : "y/N";
    const ans = await askQuestion(`${promptText} (${hint})`);
    if (!ans) return resolve(defaultVal.toLowerCase() === "y");
    resolve(ans.toLowerCase().startsWith("y"));
  });
}

async function askOptions(promptText, options) {
  console.log(`\n${colorize(promptText, "bold")}`);
  options.forEach((opt, idx) => {
    console.log(`  ${colorize(String(idx + 1) + ".", "cyan")} ${opt.label}`);
  });
  while (true) {
    const choice = await askQuestion(colorize("\nSelect an option", "blue"));
    const num = parseInt(choice, 10);
    if (!isNaN(num) && num >= 1 && num <= options.length) {
      return options[num - 1].value;
    }
    const found = options.find(
      (o) => o.value.toLowerCase() === choice.toLowerCase()
    );
    if (found) return found.value;
    console.log(colorize("❌ Invalid selection. Please choose a valid number.", "red"));
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.trim() || "");
}

function validatePassword(pwd) {
  const errors = [];
  if (pwd.length < 6) errors.push("at least 6 characters");
  return errors;
}

async function promptForPassword(label = "Password") {
  while (true) {
    const p1 = await askQuestion(colorize(label, "blue"));
    if (!p1) {
      console.log(colorize("❌ Password cannot be empty", "red"));
      continue;
    }
    const p2 = await askQuestion(colorize("Confirm " + label, "blue"));
    if (p1 !== p2) {
      console.log(colorize("❌ Passwords do not match", "red"));
      continue;
    }
    const errors = validatePassword(p1);
    if (errors.length) {
      console.log(colorize(`❌ Password must contain: ${errors.join(", ")}`, "red"));
      continue;
    }
    return p1;
  }
}

function closeRL() {
  if (rl) {
    rl.close();
    rl = null;
  }
}

module.exports = {
  initPrisma,
  colorize,
  askQuestion,
  askYesNo,
  askOptions,
  isValidEmail,
  validatePassword,
  promptForPassword,
  closeRL,
};
