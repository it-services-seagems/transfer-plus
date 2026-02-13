// components/TransferButton.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

interface TransferButtonProps {
  data: any; // Idealmente, tipar isso depois
}

const TransferButton: React.FC<TransferButtonProps> = ({ data }) => {
  const navigate = useNavigate();

  const handleTransferClick = () => {
    navigate("/desembarque-transfer", { state: { transferData: data } });
  };

  return (
    <button className="transfer-btn" onClick={handleTransferClick}>
      Transferir
    </button>
  );
};

export default TransferButton;
