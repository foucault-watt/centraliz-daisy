import Logo from "../assets/Logo.jsx"; // Ajustez le chemin si nécessaire

const LoadingScreen = () => {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-base-100">
      <div className="h-28 w-28 animate-pulse animate-zoom-in-out">
        {" "}
        {/* Taille du logo et animation pulse */}
        <Logo />
      </div>
      <p className="mt-4 text-lg text-base-content">Chargement en cours...</p>
      {/* Optionnel: ajouter un spinner en plus du logo si désiré */}
      {/* <span className="loading loading-spinner loading-md mt-2 text-primary"></span> */}
    </div>
  );
};

export default LoadingScreen;
