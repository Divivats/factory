import axios from 'axios'
import type {
    PCDetails,
    ModelFile,
    Stats,
    ApplyModelRequest,
    LineModelOption,
} from '../types'

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
})

// Add error interceptor for better error messages
api.interceptors.response.use(
    response => response,
    error => {
        if (error.code === 'ECONNABORTED') {
            throw new Error('Request timeout - backend server may be slow or not responding')
        }
        if (error.code === 'ERR_NETWORK' || !error.response) {
            throw new Error('Cannot connect to backend server. Please ensure ASP.NET Core backend is running on http://localhost:5000')
        }
        if (error.response) {
            throw new Error(`Server error: ${error.response.status} - ${error.response.statusText}`)
        }
        throw error
    }
)

export const factoryApi = {
    // Get versions
    getVersions: async (): Promise<string[]> => {
        const { data } = await api.get('/Api/versions')
        return data
    },

    // Get lines
    getLines: async (): Promise<number[]> => {
        const { data } = await api.get('/Api/lines')
        return data
    },

    // Get PCs
    getPCs: async (version?: string, line?: number) => {
        const params = new URLSearchParams()
        if (version) params.append('version', version)
        if (line) params.append('line', line.toString())
        const { data } = await api.get(`/Api/pcs?${params}`)
        return data
    },

    // Get PC by ID
    getPC: async (id: number): Promise<PCDetails> => {
        const { data } = await api.get(`/Api/pc/${id}`)
        return data
    },

    // Get statistics
    getStats: async (): Promise<Stats> => {
        const { data } = await api.get('/Api/stats')
        return data
    },

    // Model Library
    getLibraryModels: async (): Promise<ModelFile[]> => {
        const { data } = await api.get('/ModelLibrary')
        return data
    },

    uploadModelToLibrary: async (
        file: File,
        modelName: string,
        description?: string,
        category?: string
    ) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('modelName', modelName)
        if (description) formData.append('description', description)
        if (category) formData.append('category', category)

        const { data } = await api.post('/ModelLibrary/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return data
    },

    applyModel: async (request: ApplyModelRequest) => {
        const { data } = await api.post('/ModelLibrary/apply', request)
        return data
    },

    deleteModel: async (id: number) => {
        const { data } = await api.delete(`/ModelLibrary/${id}`)
        return data
    },

    // PC Actions
    changeModel: async (pcId: number, modelName: string) => {
        const formData = new URLSearchParams()
        formData.append('pcId', pcId.toString())
        formData.append('modelName', modelName)
        const { data } = await api.post('/PC/ChangeModel', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
        return data
    },

    downloadConfig: async (pcId: number) => {
        const response = await api.get(`/Pc/downloadconfig?pcId=${pcId}`, {
            responseType: 'blob',
        })
        return response.data
    },

    downloadModelTemplate: async (modelFileId: number) => {
        const response = await api.get(`/Model/DownloadModelFile?modelFileId=${modelFileId}`, {
            responseType: 'blob',
        })
        return response.data
    },

    // Line Model Management
    getLineAvailableModels: async (lineNumber: number): Promise<LineModelOption[]> => {
        const { data } = await api.get(`/ModelLibrary/line-available/${lineNumber}`)
        return data
    },

    deleteLineModel: async (lineNumber: number, modelName: string) => {
        const { data } = await api.post('/ModelLibrary/line-delete', { lineNumber, modelName })
        return data
    },

    applyModelToTargets: async (data: {
        modelFileId: number,
        targetType: string,
        lineNumber?: number,
        version?: string,
        applyImmediately: boolean,
        checkOnly?: boolean,
        forceOverwrite?: boolean,
        modelName?: string
    }) => {
        const { data: res } = await api.post('/ModelLibrary/apply', data)
        return res
    },

    uploadModelToPC: async (pcId: number, file: File) => {
        const formData = new FormData()
        formData.append('modelFile', file)
        formData.append('pcId', pcId.toString())
        const { data } = await api.post('/Model/UploadModel', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return data
    },

    downloadModelFromPC: async (pcId: number, modelName: string) => {
        const formData = new URLSearchParams()
        formData.append('pcId', pcId.toString())
        formData.append('modelName', modelName)
        const { data } = await api.post('/PC/DownloadModel', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
        return data
    },



    deleteModelFromPC: async (pcId: number, modelName: string) => {
        const formData = new URLSearchParams()
        formData.append('pcId', pcId.toString())
        formData.append('modelName', modelName)
        const { data } = await api.post('/PC/DeleteModel', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
        return data
    },

    uploadConfig: async (pcId: number, file: File) => {
        const formData = new FormData()
        formData.append('configFile', file)
        formData.append('pcId', pcId.toString())
        const { data } = await api.post('/PC/UploadConfig', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return data
    },

    // Agent Download Flow
    requestDownloadFromPC: async (pcId: number, modelName: string) => {
        const { data } = await api.post('/ModelLibrary/request-download', { pcId, modelName })
        return data
    },

    checkDownloadStatus: async (requestId: string) => {
        const { data } = await api.get(`/ModelLibrary/check-status/${requestId}`)
        return data
    },

    getDownloadUrl: (requestId: string) => `/api/ModelLibrary/serve-download/${requestId}`,

    // Delete PC from database
    deletePC: async (pcId: number) => {
        const { data } = await api.post('/PC/DeletePC', null, { params: { pcId } })
        return data
    },
}