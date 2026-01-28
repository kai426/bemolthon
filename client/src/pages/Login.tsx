import { useState } from "react";
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

export function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simula delay de autenticação
        setTimeout(() => {
            navigate("/queue");
        }, 1000);
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bemol-blue to-bemol-blue-hover p-4">
            <Card className="w-full max-w-md shadow-2xl border-none">
                <div className="h-2 w-full bg-bemol-stripe rounded-t-xl" />
                <CardHeader className="text-center pb-2">
                    <h1 className="text-3xl font-bold text-bemol-blue mb-1">Bemol</h1>
                    <CardTitle className="text-bemol-gray-dark">Acesso ao Colaborador</CardTitle>
                    <p className="text-sm text-bemol-gray-medium">Entre com sua matrícula para iniciar</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Matrícula</label>
                            <input
                                required
                                type="text"
                                placeholder="Ex: 12345"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bemol-blue focus:border-bemol-blue outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Senha</label>
                            <input
                                required
                                type="password"
                                placeholder="••••••"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bemol-blue focus:border-bemol-blue outline-none transition-all"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-bemol-red hover:bg-bemol-red-hover text-white font-bold h-12 text-lg shadow-md"
                            disabled={loading}
                        >
                            {loading ? "Entrando..." : "Entrar"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}