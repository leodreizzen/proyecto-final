import {publish} from "../publish";
import {UserMessage} from "../../channels/users";

export async function publishUserUpdate(userId: string, fields: UserMessage["fields"]): Promise<void> {
    await publish("USERS_SPECIFIC", {
        type: "UPDATE",
        userId,
        fields
    }, {id: userId});
}

export async function publishNewUser(userId: string) {
    await publish("USERS_GLOBAL", {
        type: "NEW",
        userId,
    })
}

export async function publishDeleteUser(userId: string) {
    await publish("USERS_GLOBAL", {
        type: "DELETE",
        userId,
    });
}