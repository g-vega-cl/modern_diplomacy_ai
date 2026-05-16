import type { User } from '../types'

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch('https://jsonplaceholder.typicode.com/users')
  if (!res.ok) {
    throw new Error('Failed to fetch users')
  }

  const data = (await res.json()) as Array<User>
  return data.slice(0, 10).map((u) => ({ 
    id: u.id, 
    name: u.name, 
    email: u.email 
  }))
}

export async function fetchUserById(id: string): Promise<User> {
  const res = await fetch(`https://jsonplaceholder.typicode.com/users/${id}`)
  if (!res.ok) {
    throw new Error(`Failed to fetch user with id: ${id}`)
  }

  const data = (await res.json()) as User
  return { id: data.id, name: data.name, email: data.email }
}
