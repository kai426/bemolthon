import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { CheckCircle } from "lucide-react";

export function Success() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-bemol-gray-light p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6 animate-in zoom-in duration-300">
        <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
           <CheckCircle size={48} />
        </div>
        
        <div className="space-y-2">
           <h1 className="text-2xl font-bold text-gray-900">Resposta Recebida!</h1>
           <p className="text-gray-500">
             Sua contribuição foi analisada em tempo real com sucesso.
           </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
           🔒 <strong>Segurança:</strong> Nenhum dado sensível foi armazenado.
        </div>

        <Button 
          onClick={() => navigate("/queue")}
          className="w-full bg-bemol-blue hover:bg-bemol-blue-hover font-bold h-12"
        >
          Voltar para Pesquisas
        </Button>
      </div>
    </div>
  );
}