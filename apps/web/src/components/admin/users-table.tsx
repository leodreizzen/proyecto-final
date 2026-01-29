"use client"

import {TableVirtuoso, TableVirtuosoHandle, Virtuoso, VirtuosoHandle} from 'react-virtuoso'
import React, {useImperativeHandle, useRef, useState} from "react";
import {UserListItem} from "@/lib/data/users";
import {formatDateTime} from "@/lib/utils";
import {Shield, User, Trash2, KeyRound, Loader2, Plus} from "lucide-react";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {ChangePasswordDialog} from "@/components/admin/change-password-dialog";
import {useMutation} from "@tanstack/react-query";
import {NewPasswordSchema} from "@/lib/form-schemas/admin/create-user";
import {toast} from "sonner";
import {changUserPasswordAction, deleteUserAction} from "@/lib/actions/server/users";
import {z} from "zod";

export type UsersTableHandle = {
    scrollToTop: () => void;
}

interface UsersTableProps {
    users: UserListItem[],
    fetchNextPage: () => void,
    ref?: React.Ref<UsersTableHandle>
}

function DeleteConfirmationModal({user, onClick, disabled = false, inProgress = false}: {
    user: UserListItem,
    onClick: () => void,
    disabled: boolean,
    inProgress: boolean
}) {
    return <AlertDialog>
        <AlertDialogTrigger asChild>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                title="Eliminar usuario"
                disabled={disabled}
            >
                {inProgress ? <Loader2 className="h-4 w-4 animate-spin"/> :
                    <Trash2 className="h-4 w-4"/>
                }
            </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará permanentemente al
                    usuario <strong>{user.name}</strong> ({user.email}).
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                    onClick={onClick}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                    Eliminar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>;
}

export function UsersTable({users, fetchNextPage, ref}: UsersTableProps) {
    const desktopRef = useRef<TableVirtuosoHandle | null>(null);
    const mobileRef = useRef<VirtuosoHandle>(null);
    const [userToChangePassword, setUserToChangePassword] = useState<UserListItem | null>(null);

    const {
        mutate: mutateChangePassword,
        status: changePasswordStatus,
        variables: changePasswordVariables
    } = useMutation({
        mutationFn: async ({user, passwordData}: {
            user: UserListItem,
            passwordData: z.infer<typeof NewPasswordSchema>
        }) => {
            const res = await changUserPasswordAction(user.id, passwordData);
            if (!res.success) {
                throw new Error();
            }
        },
        onSuccess: (_, {user}) => {
            toast.success(`Contraseña del usuario ${user.name} actualizada correctamente`);
        },
        onError: (_error, {user}) => {
            toast.error(`Error al cambiar la contraseña del usuario ${user.name}`);
        }
    })

    const {mutate: mutateDeleteuser, status: deleteUserStatus, variables: deleteUserVariables} = useMutation({
        mutationFn: async ({user}: { user: UserListItem }) => {
            const res = await deleteUserAction(user.id);
            if (!res.success) {
                throw new Error();
            }
        },
        onSuccess: (_, {user}) => {
            toast.success(`Usuario ${user.name} eliminado correctamente`);
        },
        onError: (_error, {user}) => {
            toast.error(`Error al eliminar el usuario ${user.name}`);
        }
    })

    const processing = changePasswordStatus === "pending" || deleteUserStatus === "pending";

    useImperativeHandle(ref, () => ({
        scrollToTop: () => {
            desktopRef.current?.scrollToIndex({index: 0, align: "start"});
            mobileRef.current?.scrollToIndex({index: 0, align: "start"});
        }
    }))

    function handleDeleteUser(user: UserListItem) {
        mutateDeleteuser({user});
    }

    function handleChangePassword(user: UserListItem, passwordData: z.infer<typeof NewPasswordSchema>) {
        mutateChangePassword({user, passwordData});
    }

    return (
        <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden">
            <ChangePasswordDialog
                user={userToChangePassword}
                open={!!userToChangePassword}
                onOpenChange={(open) => !open && setUserToChangePassword(null)}
                onSubmit={handleChangePassword}
            />

            {/* Desktop table */}
            <div className="hidden md:block size-full">
                <TableVirtuoso ref={desktopRef} className="w-full" overscan={500} fixedHeaderContent={() => (
                    <tr className="bg-card">
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/30 shadow-[inset_0px_-1.5px_0px_0px_var(--border)]">
                            Nombre
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/30 shadow-[inset_0px_-1.5px_0px_0px_var(--border)]">
                            Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-40 bg-muted/30 shadow-[inset_0px_-1.5px_0px_0px_var(--border)]">
                            Rol
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-48 bg-muted/30 shadow-[inset_0px_-1.5px_0px_0px_var(--border)]">
                            Fecha de Registro
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-32 bg-muted/30 shadow-[inset_0px_-1.5px_0px_0px_var(--border)]">
                            Acciones
                        </th>
                    </tr>
                )} data={users} endReached={fetchNextPage} components={{
                    Table: (props) => (
                        <table {...props} className="w-full"/>
                    ),
                    TableRow: (props) => (
                        <tr {...props} className="hover:bg-muted/20 transition-colors"/>
                    ),
                    TableBody: (props) => (
                        <tbody {...props} className="divide-y divide-border"/>
                    )
                }} computeItemKey={(_, item) => item.id} itemContent={
                    (index, user) => {
                        return (
                            <>
                                <td className="px-4 py-3">
                                    <span className="font-medium text-sm">{user.name}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-sm text-muted-foreground">{user.email}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={cn(
                                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                                        user.role === "ADMIN"
                                            ? "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400"
                                            : "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"
                                    )}>
                                        {user.role === "ADMIN" ? <Shield className="h-3.5 w-3.5"/> :
                                            <User className="h-3.5 w-3.5"/>}
                                        {user.role === "ADMIN" ? "Administrador" : "Usuario"}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="text-sm text-muted-foreground">
                                        {formatDateTime(user.createdAt)}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            onClick={() => setUserToChangePassword(user)}
                                            disabled={processing}
                                            title="Cambiar contraseña"
                                        >
                                            {(changePasswordStatus === "pending" && changePasswordVariables?.user.id === user.id) ?
                                                <Loader2 className="h-4 w-4 animate-spin"/> :
                                                <KeyRound className="h-4 w-4"/>
                                            }
                                        </Button>

                                        <DeleteConfirmationModal disabled={processing} inProgress={
                                            deleteUserStatus === "pending" && deleteUserVariables?.user.id === user.id
                                        } user={user} onClick={() => handleDeleteUser(user)}/>
                                    </div>
                                </td>
                            </>
                        )
                    }
                }/>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden size-full">
                <Virtuoso data={users}
                          ref={mobileRef}
                          overscan={500}
                          endReached={fetchNextPage}
                          computeItemKey={(_, item) => item.id}
                          components={{
                              List: (props) => (
                                  <div {...props} className="divide-y divide-border"/>
                              )
                          }}
                          itemContent={(_, user) => {
                              return (
                                  <div className="p-4 space-y-3">
                                      <div className="flex items-start justify-between">
                                          <div>
                                              <p className="font-medium text-foreground">{user.name}</p>
                                              <p className="text-sm text-muted-foreground">{user.email}</p>
                                          </div>
                                          <span className={cn(
                                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0",
                                              user.role === "ADMIN"
                                                  ? "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400"
                                                  : "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"
                                          )}>
                                        {user.role === "ADMIN" ? <Shield className="h-3.5 w-3.5"/> :
                                            <User className="h-3.5 w-3.5"/>}
                                              {user.role === "ADMIN" ? "Admin" : "Usuario"}
                                    </span>
                                      </div>

                                      <div className="flex items-center justify-between">
                                          <p className="text-xs text-muted-foreground">
                                              Registrado el {formatDateTime(user.createdAt)}
                                          </p>
                                          <div className="flex items-center gap-2">
                                              <Button
                                                  variant="outline"
                                                  size="sm"
                                                  className="h-8 gap-1.5"
                                                  onClick={() => setUserToChangePassword(user)}
                                                  disabled={processing}
                                              >
                                                  {(changePasswordStatus === "pending" && changePasswordVariables?.user.id === user.id) ?
                                                      <Loader2 className="h-4 w-4 animate-spin"/> :
                                                      <KeyRound className="h-4 w-4"/>
                                                  }
                                                  Contraseña
                                              </Button>
                                              <DeleteConfirmationModal
                                                  disabled={processing} inProgress={
                                                  deleteUserStatus === "pending" && deleteUserVariables?.user.id === user.id
                                              }
                                                  user={user}
                                                  onClick={() => handleDeleteUser(user)}/>
                                          </div>
                                      </div>
                                  </div>
                              )
                          }}/>
            </div>
            {users.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">No se encontraron usuarios</div>
            )}
        </div>
    )
}
