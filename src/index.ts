import express, { Request, Response } from 'express'
import cors from 'cors'
import { db } from './database/knex'
import { TUsers, TTasks, TUserTasks, TTaskWithUsers } from './types'

const app = express()

app.use(cors())
app.use(express.json())

app.listen(3003, () => {
    console.log(`Servidor rodando na porta ${3003}`)
})

//teste
app.get("/ping", async (req: Request, res: Response) => {
    try {
        res.status(200).send({ message: "Pong!" })
    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})


//users
app.get("/users", async (req: Request, res: Response) => {
    try {
        const result = req.query.q as string

        if (result === undefined) {
            const result = await db("users")
            res.status(200).send(result)
        } else {
            const result2 = await db("users").where("name", "LIKE", `%${result}%`)
            res.status(200).send(result2)
        }
    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.post("/users", async (req: Request, res: Response) => {
    try {
        const { id, name, email, password } = req.body

        if (typeof id !== "string") {
            res.status(400)
            throw new Error("'id' deve ser string")
        }

        if (id.length < 4) {
            res.status(400)
            throw new Error("'id' deve possuir pelo menos 4 caracteres")
        }

        if (typeof name !== "string") {
            res.status(400)
            throw new Error("'name' deve ser string")
        }

        if (name.length < 2) {
            res.status(400)
            throw new Error("'name' deve possuir pelo menos 2 caracteres")
        }

        if (typeof email !== "string") {
            res.status(400)
            throw new Error("'email' deve ser string")
        }

        const [ userIdAlreadyExists ]: TUsers[] | undefined[] = await db("users").where({ id })

        if (userIdAlreadyExists) {
            res.status(400)
            throw new Error("'id' já existe")
        }

        const [ userEmailAlreadyExists ]: TUsers[] | undefined[] = await db("users").where({ email })

        if (userEmailAlreadyExists) {
            res.status(400)
            throw new Error("'email' já existe")
        }

        const newUser: TUsers = {
            id,
            name,
            email,
            password
        }

        await db("users").insert(newUser)

        res.status(201).send({
            message: "User criado com sucesso",
            user: newUser
        })

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.delete("/users/:id", async (req: Request, res: Response) => {
    try {
        const idToDelete = req.params.id

        if (idToDelete[0] !== "f") {
            res.status(400)
            throw new Error("'id' deve iniciar com a letra 'f'")
        }

        const [ userIdAlreadyExists ]: TUsers[] | undefined[] = await db("users").where({ id: idToDelete })

        if (!userIdAlreadyExists) {
            res.status(404)
            throw new Error("'id' não encontrado")
        }

        await db("users_tasks").del().where({ user_id: idToDelete })
        await db("users").del().where({ id: idToDelete })

        res.status(200).send({ message: "User deletado com sucesso" })

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})


//tasks
app.get("/tasks", async (req: Request, res: Response) => {
    try {
        const result = req.query.q as string | undefined

        if (result === undefined) {
            const result = await db("tasks")
            res.status(200).send(result)
        } else {
            const result2 = await db("tasks")
                .where("title", "LIKE", `%${result}%`)
                .orWhere("description", "LIKE", `%${result}%`)

            res.status(200).send(result2)
        }
    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.post("/tasks", async (req: Request, res: Response) => {
    try {
        const { id, title, description } = req.body

        if (typeof id !== "string") {
            res.status(400)
            throw new Error("'id' deve ser string")
        }

        if (id.length < 4) {
            res.status(400)
            throw new Error("'id' deve possuir pelo menos 4 caracteres")
        }

        if (typeof title !== "string") {
            res.status(400)
            throw new Error("'title' deve ser string")
        }

        if (title.length < 2) {
            res.status(400)
            throw new Error("'title' deve possuir pelo menos 2 caracteres")
        }

        if (typeof description !== "string") {
            res.status(400)
            throw new Error("'description' deve ser string")
        }

        const [ taskIdAlreadyExists ]: TTasks[] | undefined[] = await db("tasks").where({ id })

        if (taskIdAlreadyExists) {
            res.status(400)
            throw new Error("'id' já existe")
        }

        const newTask = {
            id,
            title,
            description
        }

        await db("tasks").insert(newTask)

        const [ insertedTask ]: TTasks[] = await db("tasks").where({ id })

        res.status(201).send({
            message: "Task criada com sucesso",
            task: insertedTask
        })

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.put("/tasks/:id", async (req: Request, res: Response) => {
    try {
        const idToEdit = req.params.id

        const newId = req.body.id
        const newTitle = req.body.title
        const newDescription = req.body.description
        const newCreatedAt = req.body.createdAt
        const newStatus = req.body.status

        if (newId !== undefined) {
            if (typeof newId !== "string") {
                res.status(400)
                throw new Error("'id' deve ser string")
            }
    
            if (newId.length < 4) {
                res.status(400)
                throw new Error("'id' deve possuir pelo menos 4 caracteres")
            }
        }

        if (newTitle !== undefined) {
            if (typeof newTitle !== "string") {
                res.status(400)
                throw new Error("'title' deve ser string")
            }
    
            if (newTitle.length < 2) {
                res.status(400)
                throw new Error("'title' deve possuir pelo menos 2 caracteres")
            }
        }

        if (newDescription !== undefined) {
            if (typeof newDescription !== "string") {
                res.status(400)
                throw new Error("'description' deve ser string")
            }
        }

        if (newCreatedAt !== undefined) {
            if (typeof newCreatedAt !== "string") {
                res.status(400)
                throw new Error("'createdAt' deve ser string")
            }
        }

        if (newStatus !== undefined) {
            if (typeof newStatus !== "number") {
                res.status(400)
                throw new Error("'status' deve ser number (0 para incompleta ou 1 para completa)")
            }
        }

        const [ task ]: TTasks[] | undefined[] = await db("tasks").where({ id: idToEdit })

        if (!task) {
            res.status(404)
            throw new Error("'id' não encontrada")
        }

        const newTask: TTasks = {
            id: newId || task.id,
            title: newTitle || task.title,
            description: newDescription || task.description,
            created_at: newCreatedAt || task.created_at,
            status: isNaN(newStatus) ? task.status : newStatus
        }

        await db("tasks").update(newTask).where({ id: idToEdit })

        res.status(200).send({
            message: "Task editada com sucesso",
            task: newTask
        })

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.delete("/tasks/:id", async (req: Request, res: Response) => {
    try {
        const idToDelete = req.params.id

        if (idToDelete[0] !== "t") {
            res.status(400)
            throw new Error("'id' deve iniciar com a letra 't'")
        }

        const [ taskIdToDelete ]: TTasks[] | undefined[] = await db("tasks").where({ id: idToDelete })

        if (!taskIdToDelete) {
            res.status(404)
            throw new Error("'id' não encontrado")
        }

        await db("users_tasks").del().where({ task_id: idToDelete })
        await db("tasks").del().where({ id: idToDelete })

        res.status(200).send({ message: "Task deletada com sucesso" })

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})


//tasks+users
app.post("/tasks/:taskId/users/:userId", async (req: Request, res: Response) => {
    try {
        const taskId = req.params.taskId
        const userId = req.params.userId

        if (taskId[0] !== "t") {
            res.status(400)
            throw new Error("'taskId' deve iniciar com a letra 't'")
        }

        if (userId[0] !== "f") {
            res.status(400)
            throw new Error("'userId' deve iniciar com a letra 'f'")
        }

        const [ task ]: TTasks[] | undefined[] = await db("tasks").where({ id: taskId })

        if (!task) {
            res.status(404)
            throw new Error("'taskId' não encontrado")
        }

        const [ user ]: TUsers[] | undefined[] = await db("users").where({ id: userId })

        if (!user) {
            res.status(404)
            throw new Error("'userId' não encontrado")
        }

        const newUserTask: TUserTasks = {
            task_id: taskId,
            user_id: userId
        }

        await db("users_tasks").insert(newUserTask)

        res.status(201).send({ message: "User atribuído à tarefa com sucesso" })

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.delete("/tasks/:taskId/users/:userId", async (req: Request, res: Response) => {
    try {
        const taskIdToDelete = req.params.taskId
        const userIdToDelete = req.params.userId

        if (taskIdToDelete[0] !== "t") {
            res.status(400)
            throw new Error("'taskId' deve iniciar com a letra 't'")
        }

        if (userIdToDelete[0] !== "f") {
            res.status(400)
            throw new Error("'userId' deve iniciar com a letra 'f'")
        }

        const [ task ]: TTasks[] | undefined[] = await db("tasks").where({ id: taskIdToDelete })

        if (!task) {
            res.status(404)
            throw new Error("'taskId' não encontrado")
        }

        const [ user ]: TUsers[] | undefined[] = await db("users").where({ id: userIdToDelete })

        if (!user) {
            res.status(404)
            throw new Error("'userId' não encontrado")
        }

        await db("users_tasks").del()
            .where({ task_id: taskIdToDelete })
            .andWhere({ user_id: userIdToDelete })

        res.status(200).send({ message: "User removido da tarefa com sucesso" })

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.get("/tasks/users", async (req: Request, res: Response) => {
    try {
        const tasks: TTasks[] = await db("tasks")

        const result: TTaskWithUsers[] = []

        for (let task of tasks) {
            const responsibles = []
            const users_tasks: TUserTasks[] = await db("users_tasks").where({ task_id: task.id })
            
            for (let user_task of users_tasks) {
                const [ user ]: TUsers[] = await db("users").where({ id: user_task.user_id })
                responsibles.push(user)
            }

            const newTaskWithUsers: TTaskWithUsers = {
                ...task,
                responsibles
            }

            result.push(newTaskWithUsers)
        }

        res.status(200).send(result)

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})