import axios from 'axios'

// Keep storage requests isolated from the authenticated API client's interceptors.
export const storageClient = axios.create({
  withCredentials: false,
})
