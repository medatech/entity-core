import { createEntity, placeEntity, countChildren } from "."

import { Context } from "@entity-core/context"
import { beforeEachTest, afterAllTests, dataSource } from "../Fixtures"
import { Entity } from "../interfaces"

interface Project extends Entity {
    type: "Project"
    props: {
        title: string
    }
}

interface Task extends Entity {
    type: "Task"
    props: {
        title: string
        status: "todo" | "doing" | "done"
    }
}

interface Thing extends Entity {
    type: "Thing"
}

describe(`countChildren`, () => {
    beforeEach(beforeEachTest)

    afterEach(afterAllTests)

    it(`should return zero when there aren't any children`, async () => {
        const context = new Context({
            dataSource,
        })

        const project = await createEntity<Project>({
            context,
            entity: {
                type: `Project`,
                props: {
                    title: `Daily Tasks`,
                },
            },
        })

        const count = await countChildren({
            context,
            parentID: project.id,
            childEntityType: `Task`,
        })

        expect(count).toBe(0)

        context.end()
    })

    it(`should return the correct number of children`, async () => {
        const context = new Context({
            dataSource,
        })

        function createProject(name: string): Promise<Project> {
            return createEntity<Project>({
                context,
                entity: {
                    type: `Project`,
                    props: {
                        title: name,
                    },
                },
            })
        }

        function createTask(title: string): Promise<Task> {
            return createEntity<Task>({
                context,
                entity: {
                    type: `Task`,
                    props: {
                        title: title,
                        status: `todo`,
                    },
                },
            })
        }

        function addTaskToProject(task: Task, project: Project): Promise<void> {
            return placeEntity({
                context,
                id: task.id,
                type: task.type,
                placement: {
                    type: `child`,
                    entityID: project.id,
                    entityType: project.type,
                },
            })
        }

        const project = await createProject(`Project`)
        const task1 = await createTask(`Task 1`)
        const task2 = await createTask(`Task 2`)
        const task3 = await createTask(`Task 3`)

        await addTaskToProject(task1, project)
        await addTaskToProject(task2, project)
        await addTaskToProject(task3, project)

        const count = await countChildren({
            context,
            parentID: project.id,
            childEntityType: `Task`,
        })

        expect(count).toBe(3)

        context.end()
    })
})
