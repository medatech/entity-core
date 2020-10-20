import { createEntity, placeEntity, getParents } from "."

import { Context } from "@entity-core/context"
import { beforeEachTest, afterAllTests, dataSource } from "../fixtures"
import { Entity } from "../interfaces"

interface Team extends Entity {
    type: "Team"
    props: {
        name: string
    }
}

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

describe(`getParents`, () => {
    beforeEach(beforeEachTest)

    afterEach(afterAllTests)

    it(`should get all the parents from a child node`, async () => {
        const context = new Context({
            dataSource,
        })

        function createTeam(name: string): Promise<Project> {
            return createEntity<Project>({
                context,
                entity: {
                    type: `Team`,
                    props: {
                        name: name,
                    },
                },
            })
        }

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

        function makeChild(
            child: Project | Task,
            parent: Team | Project | Task
        ): Promise<void> {
            return placeEntity({
                context,
                id: child.id,
                type: child.type,
                placement: {
                    type: `child`,
                    entityID: parent.id,
                    entityType: parent.type,
                },
            })
        }

        const team = await createTeam(`Amazing Team`)
        const project = await createProject(`Project`)
        const task = await createTask(`task1`)
        const subTask = await createTask(`task2`)

        await makeChild(project, team)
        await makeChild(task, project)
        await makeChild(subTask, task)

        const parents = await getParents({
            context,
            id: subTask.id,
            type: subTask.type,
        })

        expect(parents).toEqual([
            { id: task.id, type: `Task` },
            { id: project.id, type: `Project` },
            { id: team.id, type: `Team` },
        ])

        await context.end()
    })
})
