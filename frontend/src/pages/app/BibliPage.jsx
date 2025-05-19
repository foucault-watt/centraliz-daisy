function BibliPage() {
  return (
    <div>
      <div className="p-6 bg-base-200">
        <div className="status status-error animate-bounce"></div>
        {" "}
        Cilien Cad's Cabart is still offline ...
        <h1 className="text-2xl font-bold">Bibli</h1>
        <p className="mt-4">
          Regardez ici tout ce qui est dispo dans notre belle bibli !
        </p>
      </div>
      <ul className="steps pt-7 mr-auto">
        <li className="step step-primary">Register</li>
        <li className="step step-primary">Choose plan</li>
        <li className="step step-success">Purchase</li>
        <li className="step step-success">Receive Product</li>
      </ul>
    </div>
  );
}

export default BibliPage;
