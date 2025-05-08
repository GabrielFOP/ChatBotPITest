import { MenuItem } from "../types"
import {ITEM_REGEX} from "../constants/regex.const"

export function extractItemsWithQuantity(
    response: string,
    menu: MenuItem[],
    allowWithoutQuantity = false
):{id: number, quant:number}[]{
    const extractedItems: {id: number, quant: number}[] = []
    const relevantResponse = response.split('Deseja adicionar mais itens ao pedido?')[0] || response;

    for(const item of menu){
        const quantity = findQuantityInText(item.nome, relevantResponse)

        if(!isNaN(quantity) && quantity > 0){
            extractedItems.push({id: item.id, quant: quantity})
        }
        else if (allowWithoutQuantity && relevantResponse.toLowerCase().includes(item.nome.toLowerCase())){
            extractedItems.push({id: item.id, quant: 0})
        }
    }

    return extractedItems
}

function findQuantityInText(itemName: string, text: string): number {
    const lowerName = itemName.toLowerCase()
    const lowerText = text.toLowerCase()

    for(const {regex, groupIndex} of ITEM_REGEX){
        const pattern = new RegExp (regex.replace('{item}', lowerName), 'i')
        const match = lowerText.match(pattern)
        if(match && match[groupIndex]){
            const quantity = parseInt(match[groupIndex])
            if(!isNaN(quantity)) return quantity
        } 
    }
    
    return lowerText.includes(lowerName) ? 1 : 0;
}

export function cleanAiResponse(response: string): string{
    return response.replace(/\[.*?\]/g, '');
}

export function hasSpecialCommand(response: string, command: string) : boolean{
    return response.includes(`[${command}]`)
}
