export const $fetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
  })
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
  return response.json() as Promise<T>
}

export const fetcher = $fetch
export const fetch = $fetch
export type ErrorType<Error> = Error
export type BodyType<BodyData> = BodyData
export default $fetch
