import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { fileURLToPath } from "url";
import logger from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const downloadCSV = async (username, password) => {
  logger.info(
    `Début du téléchargement des notes pour l'utilisateur: ${username}`
  );

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1920, height: 1080 },
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // Pour la compatibilité serveur
  });

  logger.info("Navigateur lancé");

  const page = await browser.newPage();

  try {
    // Configuration du dossier de téléchargement
    const downloadPath = path.resolve(__dirname, "../downloads");
    if (!fs.existsSync(downloadPath)) {
      fs.mkdirSync(downloadPath, { recursive: true });
    }

    await page._client().send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: downloadPath,
    });

    // Navigation et connexion
    logger.info("Navigation vers la page de connexion");
    await page.goto("https://webaurion.centralelille.fr/", {
      waitUntil: "networkidle2",
    });

    await page.type("#username", username);
    await page.type("#password", password);
    logger.info("Identifiants saisis");

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2" }),
      page.evaluate(() => document.querySelector("#formulaireSpring").submit()),
    ]);
    logger.info("Connexion réussie");

    // Navigation dans l'interface pour télécharger le CSV
    await page.waitForSelector("#form\\:sidebar", {
      visible: true,
      timeout: 10000,
    });
    logger.info("Sidebar chargée");

    const resultSelector =
      "#form\\:sidebar > div > div.ui-slidemenu-content > ul > li.ui-widget.ui-menuitem.ui-corner-all.ui-menu-parent.submenu_44413.null > a";
    await page.waitForSelector(resultSelector, {
      visible: true,
      timeout: 10000,
    });
    await page.click(resultSelector);
    logger.info("Clic sur l'élément résultat");

    const iteemSelector =
      "#form\\:sidebar > div > div.ui-slidemenu-content > ul > li.ui-widget.ui-menuitem.ui-corner-all.ui-menu-parent.submenu_44413.null.enfants-entierement-charges > ul > li > a";
    await page.waitForSelector(iteemSelector, {
      visible: true,
      timeout: 10000,
    });
    await page.click(iteemSelector);
    logger.info("Clic sur l'élément item");

    const notesSelector =
      "#form\\:sidebar > div > div.ui-slidemenu-content > ul > li.ui-widget.ui-menuitem.ui-corner-all.ui-menu-parent.submenu_44413.null.enfants-entierement-charges > ul > li > ul > li:nth-child(1) > a";
    await page.waitForSelector(notesSelector, {
      visible: true,
      timeout: 10000,
    });
    await page.click(notesSelector);
    logger.info("Clic sur l'élément notes");

    const exportSelector = "#form\\:exportButton";
    await page.waitForSelector(exportSelector, {
      visible: true,
      timeout: 10000,
    });
    await page.click(exportSelector);
    logger.info("Clic sur l'élément export");

    const csvSelector = "#form\\:j_idt158 > ul > li:nth-child(3) > a";
    await page.waitForSelector(csvSelector, { visible: true, timeout: 10000 });
    await page.click(csvSelector);
    logger.info("Clic sur l'élément CSV");

    // Attendre le téléchargement du fichier
    const csvFile = await waitForFileDownload(
      downloadPath,
      "Mes Notes aux épreuves"
    );

    if (csvFile) {
      logger.info(`CSV téléchargé: ${csvFile}`);
      const oldPath = csvFile;
      const newFileName = `${username}_notes.csv`;
      const newPath = path.resolve(downloadPath, newFileName);

      // Supprimer le fichier existant s'il existe
      if (fs.existsSync(newPath)) {
        fs.unlinkSync(newPath);
      }

      // Renommer le fichier
      fs.renameSync(oldPath, newPath);
      logger.info(`CSV renommé en: ${newFileName}`);

      return newPath;
    } else {
      throw new Error("Le fichier CSV n'a pas été téléchargé");
    }
  } catch (error) {
    logger.error(
      `Erreur lors du processus de téléchargement pour ${username}:`,
      error
    );
    throw error;
  } finally {
    await browser.close();
    logger.info("Navigateur fermé");
  }
};

const waitForFileDownload = async (downloadPath, fileName) => {
  return new Promise((resolve, reject) => {
    const checkInterval = 1000; // Vérifier toutes les 1 seconde
    const timeout = 30000; // Timeout après 30 secondes
    let timeElapsed = 0;

    const intervalId = setInterval(() => {
      const files = fs.readdirSync(downloadPath);
      const foundFile = files.find(
        (file) => file.startsWith(fileName) && file.endsWith(".csv")
      );

      if (foundFile) {
        clearInterval(intervalId);
        resolve(path.resolve(downloadPath, foundFile));
      }

      timeElapsed += checkInterval;
      if (timeElapsed >= timeout) {
        clearInterval(intervalId);
        reject(new Error("Timeout du téléchargement du fichier"));
      }
    }, checkInterval);
  });
};
