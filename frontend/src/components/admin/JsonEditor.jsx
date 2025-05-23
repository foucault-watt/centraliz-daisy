import { useEffect, useState } from "react";

// Utilisez une bibliothèque d'édition JSON comme react-json-editor-ajrm
// ou construisez une interface simple avec un textarea.
// Pour cet exemple, nous allons utiliser un simple textarea.

const JsonEditor = ({ initialJson, onSave }) => {
  const [jsonString, setJsonString] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setJsonString(JSON.stringify(initialJson, null, 2));
      setError("");
    } catch (e) {
      setError("Erreur lors de la sérialisation du JSON initial.");
      setJsonString("{}");
    }
  }, [initialJson]);

  const handleSave = () => {
    try {
      const parsedJson = JSON.parse(jsonString);
      onSave(parsedJson);
      setError("");
    } catch (e) {
      setError(
        "JSON invalide. Veuillez corriger les erreurs avant de sauvegarder."
      );
    }
  };

  return (
    <div className="space-y-6 p-4 bg-base-100 rounded-box shadow-lg">
      <div>
        <label htmlFor="jsonTextarea" className="label">
          <span className="label-text text-lg font-semibold text-neutral-content">
            Éditeur JSON des Coefficients
          </span>
        </label>
        <textarea
          id="jsonTextarea"
          className="textarea textarea-bordered w-full h-[60vh] font-mono text-sm leading-relaxed p-4 bg-base-200 text-base-content focus:textarea-primary"
          value={jsonString}
          onChange={(e) => setJsonString(e.target.value)}
          placeholder="Entrez votre configuration JSON ici"
        />
      </div>
      {error && (
        <div role="alert" className="alert alert-warning shadow-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="font-semibold">Attention:</span> {error}
        </div>
      )}
      <div className="flex justify-end">
        <button className="btn btn-primary btn-wide group" onClick={handleSave}>
          <span className="group-hover:scale-105 transition-transform duration-200 ease-in-out">
            Enregistrer les Modifications
          </span>
        </button>
      </div>
    </div>
  );
};

export default JsonEditor;
