import { createEntity, placeEntity, getChildren } from "."

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

describe(`placeEntity`, () => {
    beforeEach(beforeEachTest)

    afterEach(afterAllTests)

    it(`should allow me to create a parent/child relationship`, async () => {
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

        // Create a task
        const task = await createEntity<Task>({
            context,
            entity: {
                type: `Task`,
                props: {
                    title: `Design App`,
                    status: `todo`,
                },
            },
        })

        // Place this task as a child of the project
        await placeEntity({
            context,
            id: task.id,
            type: task.type,
            placement: {
                type: `child`,
                entityID: project.id,
                entityType: project.type,
            },
        })

        const children = await getChildren<Task>({
            context,
            parentID: project.id,
            parentType: project.type,
            childType: `Task`,
            fromID: null,
        })

        expect(children).toEqual([task])

        await context.end()
    })

    it(`should allow me to place multiple entities in different positions`, async () => {
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

        function createTask(title: string) {
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

        // Create a task
        const task1 = await createTask(`task1`)
        const task2 = await createTask(`task2`)
        const task3 = await createTask(`task3`)
        const task4 = await createTask(`task4`)
        const task5 = await createTask(`task5`)

        // Place task2
        await placeEntity({
            context,
            id: task2.id,
            type: task2.type,
            placement: {
                type: `child`,
                entityID: project.id,
                entityType: project.type,
            },
        })

        // Place task1 before task2
        await placeEntity({
            context,
            id: task1.id,
            type: task1.type,
            placement: {
                type: `before`,
                entityID: task2.id,
                entityType: task2.type,
            },
        })

        // Place task3 after task2
        await placeEntity({
            context,
            id: task3.id,
            type: task3.type,
            placement: {
                type: `after`,
                entityID: task2.id,
                entityType: task2.type,
            },
        })

        // Place task4 at the end as a child
        await placeEntity({
            context,
            id: task4.id,
            type: task4.type,
            placement: {
                type: `child`,
                entityID: project.id,
                entityType: project.type,
            },
        })

        // Place task5 after task4
        await placeEntity({
            context,
            id: task5.id,
            type: task5.type,
            placement: {
                type: `after`,
                entityID: task4.id,
                entityType: task4.type,
            },
        })

        const children = await getChildren<Task>({
            context,
            parentID: project.id,
            parentType: project.type,
            childType: `Task`,
            fromID: null,
        })

        expect(children.map((child) => child.props.title)).toEqual([
            `task1`,
            `task2`,
            `task3`,
            `task4`,
            `task5`,
        ])

        await context.end()
    })
})
