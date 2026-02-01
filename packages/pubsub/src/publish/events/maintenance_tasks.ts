import {publish} from "../publish";
import {MaintenanceTaskMessage} from "../../channels/maintenance_tasks";

export async function publishMaintenanceTaskUpdate(maintenanceTaskId: string, fields: MaintenanceTaskMessage["fields"]) {
    await publish("MAINTENANCE_TASKS_SPECIFIC", {
        type: "UPDATE",
        maintenanceTaskId: maintenanceTaskId,
        fields
    }, {id: maintenanceTaskId});
}

export async function publishNewMaintenanceTasks(maintenanceTaskIds: string[] ) {
    await publish("MAINTENANCE_TASKS_GLOBAL", {
        type: "NEW",
        maintenanceTaskIds: maintenanceTaskIds
    })
}

export async function publishDeletedMaintenanceTasks(maintenanceTaskIds: string[] ) {
    await publish("MAINTENANCE_TASKS_GLOBAL", {
        type: "DELETE",
        maintenanceTaskIds: maintenanceTaskIds
    })
}