import { User } from "lucide-react";

export function Header() {
    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            {/* Cordinha Decorativa no Topo */}
            <div className="h-1.5 w-full bg-bemol-stripe" />

            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo Bemol (Simulada com texto, substitua por SVG se tiver) */}
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold tracking-tighter text-bemol-blue">Bemol</span>
                    <span className="text-sm font-medium text-bemol-gray-medium bg-bemol-gray-light px-2 py-0.5 rounded-full">
                        Insight
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-bemol-gray-dark">Kaíky (Colaborador)</p>
                        <p className="text-xs text-bemol-gray-medium">Matrícula: 12345</p>
                    </div>
                    <div className="h-10 w-10 bg-bemol-gray-light rounded-full flex items-center justify-center border border-gray-200">
                        <User className="text-bemol-blue" size={20} />
                    </div>
                </div>
            </div>
        </header>
    );
}