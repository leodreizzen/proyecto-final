"use client"

import {z} from "zod"
import {zodResolver} from "@hookform/resolvers/zod"
import {useForm} from "react-hook-form"
import {Button} from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {Input} from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {Plus, Loader2} from "lucide-react"
import {useState} from "react"
import {CreateUserSchema, excludedRoles} from "@/lib/form-schemas/admin/create-user";
import {UserRole} from "@repo/db/prisma/enums";
import {formatRole} from "@/lib/utils/role-formatters";
import {useMutation} from "@tanstack/react-query";
import {toast} from "sonner";
import {createUserAction} from "@/lib/actions/server/users";


export function CreateUserDialog() {
    const [open, setOpen] = useState(false)
    const form = useForm<z.infer<typeof CreateUserSchema>>({
        resolver: zodResolver(CreateUserSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            role: "ADMIN",
        },
    })

    const {mutate, status} = useMutation({
        mutationFn: async (userData: z.infer<typeof CreateUserSchema>) => {
            const res = await createUserAction(userData);
            if (!res.success) {
                throw new Error();
            }
        },
        onSuccess: () => {
            toast.success("Usuario creado correctamente");
        },
        onError: (_error) => {
            toast.error("Error al crear usuario");
        }
    })

    const isPending = status === "pending";

    function onSubmit(values: z.infer<typeof CreateUserSchema>) {
        mutate(values);
        setOpen(false);
        form.reset();
    }

    const roleOptions = Object.values(UserRole).filter(r => !excludedRoles.includes(r)).map(val => ({
        value: val,
        text: formatRole(val)
    }))


    return (
        <Dialog open={open} onOpenChange={(val) => !isPending && setOpen(val)}>
            <DialogTrigger asChild>
                <Button className="gap-2" disabled={isPending}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Plus className="h-4 w-4"/>}
                    {isPending ? "Creando..." : "Crear usuario"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear nuevo usuario</DialogTitle>
                    <DialogDescription>
                        Completa los datos para registrar un nuevo usuario.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Nombre completo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Juan Perez" {...field} disabled={isPending}/>
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="juan@ejemplo.com" {...field} disabled={isPending}/>
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="password"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Contraseña</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} disabled={isPending}/>
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Confirmar</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} disabled={isPending}/>
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="role"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Rol</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona un rol"/>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {roleOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>{option.text}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={isPending} className="min-w-[120px]">
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : "Crear usuario"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
