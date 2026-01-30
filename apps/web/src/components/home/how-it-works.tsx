import { FileUp, Cpu, GitMerge, History } from "lucide-react";

const STEPS = [
    {
        title: "Digitalización",
        description: "El administrador carga los archivos PDF oficiales.",
        icon: FileUp,
    },
    {
        title: "Análisis Inteligente",
        description: "La inteligencia artificial procesa el texto para identificar automáticamente los componentes de la resolución y las modificaciones que aplica.",
        icon: Cpu,
    },
    {
        title: "Consolidación",
        description: "El sistema resuelve el grafo de validez, aplicando derogaciones y modificaciones para mostrar siempre el texto vigente.",
        icon: GitMerge,
    },
    {
        title: "Versiones Históricas",
        description: "Permite navegar por la evolución de una resolución, visualizando cómo era el texto en cualquier fecha específica. El chatbot siempre accede a las últimas versiones",
        icon: History,
    },
];

export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-12 border-t">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold font-serif mb-4">Cómo funciona</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Transformamos documentos estáticos en una base de conocimientos dinámica y siempre actualizada.
                </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {STEPS.map((step, i) => (
                    <div key={i} className="flex flex-col items-center text-center group">
                        <div className="mb-6 relative">
                            <div className="absolute -inset-1 bg-primary/20 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                            <div className="relative h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20">
                                <step.icon className="h-8 w-8" />
                            </div>
                            <div className="absolute -top-1 -right-1 h-6 w-6 bg-background border rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                                {i + 1}
                            </div>
                        </div>
                        <h3 className="text-lg font-bold mb-3">{step.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed px-4">
                            {step.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
