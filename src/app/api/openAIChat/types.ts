export interface MenuItem{
    id: number,
    nome: string
}

export interface OrderItem {
    quant: number
}

export interface Order{
    [id: number]: OrderItem
}

export interface AIconfig{
    model: string,
    temperature: number,
    top_p: number
}

export interface APIResponse {
    status: 'sucess' | 'error',
    message: string,
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant',
    content: string
}
