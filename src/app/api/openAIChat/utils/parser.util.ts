import { MenuItem } from "../types"
import { ITEM_REGEX } from "../constants/regex.const"

interface ProcessedCommand {
    type: 'remove' | 'edit';
    items: { id: number; quant: number }[];
}

export function extractItemsWithQuantity(
    response: string,
    menu: MenuItem[],
    isRemoval = false
): { id: number, quant: number }[] {
    const extractedItems: { id: number, quant: number }[] = [];
    const relevantResponse = response.split('Deseja adicionar mais itens ao pedido?')[0] || response;

    for (const item of menu) {
        const quantity = findQuantityInText(item.nome, relevantResponse, isRemoval);

        if (!isNaN(quantity) && quantity !== 0) {
            extractedItems.push({ id: item.id, quant: quantity })
        }
    }

    return extractedItems;
}

// Atualize findQuantityInText
function findQuantityInText(itemName: string, text: string, isRemoval: boolean): number {
    const lowerName = itemName.toLowerCase();
    const lowerText = text.toLowerCase();
    let quantity = 0;

    for (const { regex, groupIndex } of ITEM_REGEX) {
        const pattern = new RegExp(regex.replace('{item}', lowerName), 'i');
        const match = lowerText.match(pattern);

        if (match && match[groupIndex]) {
            const extractedQuant = parseInt(match[groupIndex]);
            if (!isNaN(extractedQuant)) {
                quantity = isRemoval ? -extractedQuant : extractedQuant;
                break;
            }
        }
    }

    // Se não encontrou quantidade mas o item está mencionado
    if (quantity === 0 && lowerText.includes(lowerName)) {
        quantity = isRemoval ? -1 : 1;
    }

    return quantity;
}

// Nova função para processar comandos múltiplos
export function processMultipleCommands(response: string, menu: MenuItem[]): ProcessedCommand[] {
    const commands: ProcessedCommand[] = [];
    let currentType: 'remove' | 'edit' | null = null;

    // Divide a resposta em partes usando os marcadores
    const parts = response.split(/(\[.*?\])/g);

    parts.forEach(part => {
        if (part === '[removerItem]') {
            currentType = 'remove';
        } else if (part === '[editarItem]') {
            currentType = 'edit';
        } else if (currentType) {
            const items = extractItemsWithQuantity(part, menu, currentType === 'remove');
            if (items.length > 0) {
                commands.push({
                    type: currentType,
                    items
                });
            }
        }
    });

    return commands;
}

export function cleanAiResponse(response: string): string {
    return response.replace(/\[.*?\]/g, '');
}

export function hasSpecialCommand(response: string, command: string): boolean {
    return response.includes(`[${command}]`)
}
