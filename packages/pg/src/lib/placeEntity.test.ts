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

    it(`should allow me to move one child entity from one parent to antoher`, async () => {
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

        function getTasks(project: Project): Promise<Task[]> {
            return getChildren({
                context,
                parentID: project.id,
                parentType: project.type,
                childType: `Task`,
            })
        }

        const project1 = await createProject(`Project 1`)
        const project2 = await createProject(`Project 2`)
        const task = await createTask(`task`)

        await addTaskToProject(task, project1)

        // Now move it to project2
        await addTaskToProject(task, project2)

        const project1Tasks = await getTasks(project1)
        expect(project1Tasks.length).toBe(0)

        const project2Tasks = await getTasks(project2)
        expect(project2Tasks.length).toBe(1)

        await context.end()
    })

    it(`should allow me to place the same child twice`, async () => {
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

        function getTasks(project: Project): Promise<Task[]> {
            return getChildren({
                context,
                parentID: project.id,
                parentType: project.type,
                childType: `Task`,
            })
        }

        const project = await createProject(`Project`)
        const task = await createTask(`task`)

        await addTaskToProject(task, project)
        await addTaskToProject(task, project)

        const projectTasks = await getTasks(project)
        expect(projectTasks.length).toBe(1)

        await context.end()
    })

    it(`should stop me making the same thing the child and parent`, async () => {
        const context = new Context({
            dataSource,
        })

        const thing = await createEntity<Thing>({
            context,
            entity: {
                type: `Thing`,
                props: null,
            },
        })

        await expect(
            placeEntity({
                context,
                id: thing.id,
                type: thing.type,
                placement: {
                    type: `child`,
                    entityID: thing.id,
                    entityType: thing.type,
                },
            })
        ).rejects.toEqual({
            error: `Parent and child cannot be the same entity`,
        })

        await context.end()
    })

    it(`should stop me creating a descendant child where it's also the parent`, async () => {
        const context = new Context({
            dataSource,
        })

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

        const parentTask = await createTask(`parent`)
        const subTask = await createTask(`sub task`)

        // Make the sub task a child of the parent task
        await placeEntity({
            context,
            id: subTask.id,
            type: subTask.type,
            placement: {
                type: `child`,
                entityID: parentTask.id,
                entityType: parentTask.type,
            },
        })

        // Now try to make the parent task a child of the sub task
        await expect(
            placeEntity({
                context,
                id: parentTask.id,
                type: parentTask.type,
                placement: {
                    type: `child`,
                    entityID: subTask.id,
                    entityType: subTask.type,
                },
            })
        ).rejects.toEqual({
            error: `Child cannot also be a grandparent`,
        })

        await context.end()
    })

    it(`should stop a child being placed before itself`, async () => {
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
        const task = await createTask(`task`)

        await addTaskToProject(task, project)

        // Now try to place the task before itself
        await expect(
            await placeEntity({
                context,
                id: task.id,
                type: task.type,
                placement: {
                    type: `before`,
                    entityID: task.id,
                    entityType: task.type,
                },
            })
        ).rejects.toEqual({
            error: `An entity cannot be placed before itself`,
        })

        await context.end()
    })

    it(`should stop a child being placed after itself`, async () => {
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
        const task = await createTask(`task`)

        await addTaskToProject(task, project)

        // Now try to place the task before itself
        await expect(
            await placeEntity({
                context,
                id: task.id,
                type: task.type,
                placement: {
                    type: `after`,
                    entityID: task.id,
                    entityType: task.type,
                },
            })
        ).rejects.toEqual({
            error: `An entity cannot be placed after itself`,
        })

        await context.end()
    })
})
