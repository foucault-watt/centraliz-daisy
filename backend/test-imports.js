// Test d'import pour vérifier que tout fonctionne
import { downloadCSV } from "./src/services/notesDownloadService.js";
import {
  cleanupCSVFile,
  getCSVContent,
} from "./src/services/notesProcessingService.js";

console.log("✅ Imports réussis !");
console.log("📁 getCSVContent:", typeof getCSVContent);
console.log("📁 cleanupCSVFile:", typeof cleanupCSVFile);

// Test rapide des fonctions
try {
  console.log("🔧 Test des fonctions...");
  console.log("✅ downloadCSV:", typeof downloadCSV);
  console.log("✅ getCSVContent:", typeof notesProcessing.getCSVContent);
  console.log("✅ cleanupCSVFile:", typeof notesProcessing.cleanupCSVFile);
  console.log("🎉 Tous les tests d'import sont passés !");
} catch (error) {
  console.error("❌ Erreur lors du test:", error);
}
