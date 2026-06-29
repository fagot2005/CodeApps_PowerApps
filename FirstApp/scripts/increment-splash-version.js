import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const splashScreenPath = resolve("src/screens/SplashScreen.tsx");
const source = readFileSync(splashScreenPath, "utf8");
const versionPattern = /ver\. (\d+)\.(\d+)\.(\d+)/;
const match = source.match(versionPattern);

if (!match) {
  throw new Error("Splash screen version text was not found.");
}

const [, major, minor, patch] = match;
const nextPatch = String(Number(patch) + 1).padStart(patch.length, "0");
const nextVersion = `ver. ${major}.${minor}.${nextPatch}`;
const updatedSource = source.replace(versionPattern, nextVersion);

writeFileSync(splashScreenPath, updatedSource);
console.log(`Splash screen version updated to ${nextVersion}`);
