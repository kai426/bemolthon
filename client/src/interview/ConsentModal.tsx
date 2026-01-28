import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useState } from "react";

interface Props {
  onConfirm: () => void;
}

export function ConsentModal({ onConfirm }: Props) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="h-1 w-full bg-bemol-stripe rounded-t-xl" />
        <CardContent className="p-6 space-y-6">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-bemol-blue">
              <AlertCircle size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Termo de Consentimento</h2>
            <p className="text-sm text-gray-500 mt-1">Processamento Temporário em Tempo Real</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 space-y-2 border border-gray-100">
            <p>Declaro estar ciente de que:</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Minha imagem e voz serão processadas por IA.</li>
              <li><strong>Nenhum vídeo ou áudio será armazenado.</strong></li>
              <li>O processamento é efêmero e instantâneo.</li>
            </ul>
          </div>

          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="consent" 
              checked={checked} 
              onChange={(e) => setChecked(e.target.checked)}
              className="w-5 h-5 text-bemol-red rounded focus:ring-bemol-red border-gray-300"
            />
            <label htmlFor="consent" className="text-sm font-medium cursor-pointer select-none">
              Li e aceito os termos de processamento.
            </label>
          </div>

          <Button 
            onClick={onConfirm} 
            disabled={!checked}
            className="w-full bg-bemol-red hover:bg-bemol-red-hover text-lg font-bold py-6"
          >
            Continuar para Pesquisa
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}