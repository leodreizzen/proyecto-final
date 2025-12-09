"use client"

import type React from "react"

import {useState} from "react"
import {FileText, Loader2} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {authClient} from "@/lib/auth-client";

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)
        const res = await authClient.signIn.email({
            email, password, callbackURL: "/admin"
        })
        if (res.error) {
            switch (res.error.code) {
                case 'INVALID_EMAIL_OR_PASSWORD':
                    setError("Correo electrónico o contraseña inválidos.")
                    break;
                case "INVALID_EMAIL":
                    setError("El correo electrónico es inválido.")
                    break;
                default:
                    setError("Se produjo un error inesperado. Por favor, inténtalo de nuevo.")
                    break;
            }
        }
        setIsLoading(false)
    }


    return (
            <main className="flex-1 flex items-center justify-center p-4 size-full">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center space-y-4">
                        <div
                            className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            <FileText className="h-7 w-7"/>
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-bold">Inicio de sesión</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="tu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    autoComplete="email"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                />
                            </div>

                            {error && <p className="text-sm text-destructive text-center">{error}</p>}

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                        Iniciando sesión...
                                    </>
                                ) : (
                                    "Iniciar sesión"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>
    )
}
