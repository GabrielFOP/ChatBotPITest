import OpenAI from "openai"
import { AIconfig,ChatMessage } from "../types"
import {SYSTEM_PROMT} from "../constants/messages.const"

export class AIService {
    private openai: OpenAI
    private config: AIconfig

    constructor(apiKey: string, baseURL: string, config: AIconfig){
        this.openai = new OpenAI({
            apiKey: apiKey,
            baseURL: baseURL
        })
        this.config = config
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async generateResponse(messages: ChatMessage[], menu: any[], orderSummary: string): Promise<string>{
        try{
            const completion = await this.openai.chat.completions.create({
              messages: [
                {
                    role: 'system',
                    content: SYSTEM_PROMT(menu, orderSummary)
                },
                ...messages
              ],
              model: this.config.model,
              temperature: this.config.temperature,
              top_p: this.config.top_p  
            })

            return completion.choices[0]?.message?.content || ''
        }catch(error){
            console.error('AI Service Error', error)
            throw new Error('Failed to generate AI response')
        }
    }
}