// Test simple
console.log("Début du test");

try {
  const module = await import("./src/services/notesProcessingService.js");
  console.log("✅ Import réussi");
  console.log("Exports disponibles:", Object.keys(module));
  console.log("getCSVContent:", typeof module.getCSVContent);
  console.log("cleanupCSVFile:", typeof module.cleanupCSVFile);
} catch (error) {
  console.error("❌ Erreur d'import:", error.message);
}
