export type TUsers = {
    id: string,
    name: string,
    email: string,
    password: string
}

export type TTasks = {
    id: string,
    title: string,
    description: string,
    created_at: string,
    status: number
}

export type TUserTasks = {
    user_id: string,
    task_id: string
}

export type TTaskWithUsers = {
    id: string,
    title: string,
    description: string,
    created_at: string,
    status: number,
    responsibles: TUsers[]
}