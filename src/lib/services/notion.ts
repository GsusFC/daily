import { Client } from "@notionhq/client";
import type { NotionTask, FormattedTask, FormattedTaskGroup, DatabaseGroup } from "@/types";
import {
    NOTION_STATUS_PROPERTY,
    NOTION_DONE_STATUS,
    NOTION_PAGE_SIZE,
} from "@/lib/constants";

/**
 * Obtiene las tareas pendientes de múltiples bases de datos de Notion.
 *
 * @param notionToken - Token de integración de Notion
 * @param databaseIds - Array de IDs de bases de datos
 * @returns Lista de tareas pendientes
 */
export async function fetchPendingTasks(
    notionToken: string,
    databaseIds: string[]
): Promise<DatabaseGroup[]> {
    if (!notionToken || databaseIds.length === 0) {
        return [];
    }

    const fetchPromises = databaseIds.map(async (id) => {
        try {
            // 1. Obtener info de la DB (para el título)
            const dbResponse = await fetch(`https://api.notion.com/v1/databases/${id}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${notionToken}`,
                    "Notion-Version": "2022-06-28",
                },
            });
            
            let dbTitle = "Base de Datos desconocida";
            if (dbResponse.ok) {
                const dbData = await dbResponse.json();
                dbTitle = dbData.title?.[0]?.plain_text || "Sin título";
            }

            // 2. Obtener tareas (Query)
            const response = await fetch(`https://api.notion.com/v1/databases/${id}/query`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${notionToken}`,
                    "Notion-Version": "2022-06-28",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    filter: {
                        and: [
                            {
                                property: NOTION_STATUS_PROPERTY,
                                status: {
                                    does_not_equal: NOTION_DONE_STATUS,
                                },
                            },
                            {
                                or: [
                                    {
                                        property: "Date",
                                        date: {
                                            on_or_before: new Date().toISOString().split('T')[0],
                                        },
                                    },
                                    {
                                        property: "Date",
                                        date: {
                                            is_empty: true,
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                    page_size: NOTION_PAGE_SIZE,
                }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error(`[Notion] API Error for DB ${id}: ${response.status}`, errorData);
                return { id, title: dbTitle, tasks: [] };
            }

            const data = await response.json();
            const tasks = data.results as NotionTask[];

            if (tasks.length > 0) {
                console.log(`[Notion] Detailed properties for DB ${dbTitle}:`, JSON.stringify(Object.keys(tasks[0].properties), null, 2));
            }

            return { id, title: dbTitle, tasks };
        } catch (error) {
            console.error(`[Notion] Error fetching DB ${id}:`, error);
            return { id, title: "Error", tasks: [] };
        }
    });

    return Promise.all(fetchPromises);
}

/**
 * Parsea los IDs de bases de datos desde variables de entorno.
 */
export function parseNotionDatabaseIds(): string[] {
    const dbIdsString =
        process.env.NOTION_DATABASE_IDS || process.env.NOTION_DATABASE_ID || "";
    return dbIdsString
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id.length > 0);
}

/**
 * Formatea tareas agrupadas para reducir tokens en prompts de Gemini.
 */
export function formatTasksForPrompt(dbGroups: DatabaseGroup[]): FormattedTaskGroup[] {
    return dbGroups.map(group => ({
        dbTitle: group.title,
        tasks: group.tasks.map((task) => {
            // Buscar responsables en cualquier propiedad de tipo 'people'
            const assignees: string[] = [];
            let title = "Sin título";
            
            Object.values(task.properties).forEach((prop: any) => {
                // Buscar responsables
                if (prop.type === "people" && prop.people) {
                    prop.people.forEach((person: any) => {
                        if (person.name) assignees.push(person.name);
                    });
                }
                
                // Buscar título dinámicamente (propiedad de tipo 'title')
                if (prop.type === "title" && prop.title && prop.title.length > 0) {
                    title = prop.title[0].plain_text;
                }
            });

            // Buscar contexto del proyecto (Relación o Select)
            let projectContext = "";
            const projectProp = task.properties["Projects Database"] || task.properties["Project"];
            
            if (projectProp) {
                if (projectProp.type === "select" && projectProp.select) {
                    projectContext = projectProp.select.name;
                } else if (projectProp.type === "relation" && projectProp.relation && projectProp.relation.length > 0) {
                    // Nota: Las relaciones solo dan el ID, no el nombre, a menos que usemos un Rollup o hagamos otro fetch.
                    // Pero intentaremos ver si hay algún metadato útil o si es un Rollup.
                    projectContext = "(Proyecto relacionado)"; 
                } else if (projectProp.type === "rollup" && projectProp.rollup) {
                     // Si es un rollup (muy común para traer el nombre del proyecto padre)
                     if (projectProp.rollup.type === "array" && projectProp.rollup.array.length > 0) {
                        // Intentar sacar el título del rollup
                        const firstItem = projectProp.rollup.array[0];
                        if (firstItem.type === "title" && firstItem.title.length > 0) {
                             projectContext = firstItem.title[0].plain_text;
                        } else if (firstItem.type === "rich_text" && firstItem.rich_text.length > 0) {
                             projectContext = firstItem.rich_text[0].plain_text;
                        }
                     }
                }
            }

            // Extraer fechas (start y end)
            const dateProp = task.properties["Due Date"]?.date || task.properties["Date"]?.date;
            const dueDate = dateProp?.start;
            const endDate = dateProp?.end || undefined;

            return {
                title: title,
                status: task.properties.Status?.status?.name || "Sin estado",
                priority: task.properties.Priority?.select?.name,
                dueDate: dueDate,
                endDate: endDate,
                assignees: assignees.length > 0 ? assignees : undefined,
                project: projectContext || undefined, 
            };
        })
    }));
}
