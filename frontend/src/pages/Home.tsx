import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState("pt");

  const handleLogout = () => {
    navigate("/");
  };

  const navigateToSupplierForms = () => {
    navigate("/supplierForms");
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
  };

  return (
    <div className="home-page">
      {/* Bandeiras para troca de idioma */}
      <div className="language-switcher">
        <img
          src="/Brasil.png"
          alt="Português"
          onClick={() => handleLanguageChange("pt")}
          className="flag"
        />
        <img
          src="/USA.png"
          alt="English"
          onClick={() => handleLanguageChange("en")}
          className="flag"
        />
      </div>

      <h1>
        {language === "pt" ? "Bem-vindo, FORNECEDOR!" : "Welcome, SUPPLIER!"}
      </h1>
      <p>
        {language === "pt"
          ? "Esta aplicação é sobre um formulário de cadastro de fornecedores."
          : "This application is about a supplier registration form."}
      </p>

      <button onClick={navigateToSupplierForms}>
        {language === "pt" ? "FORMULÁRIO DE FORNECEDORES" : "SUPPLIER FORM"}
      </button>
      <button onClick={handleLogout}>
        {language === "pt" ? "SAIR" : "LOGOUT"}
      </button>
    </div>
  );
};

export default Home;
