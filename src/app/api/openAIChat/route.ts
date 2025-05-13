import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from './services/order.service';
import { AIService } from './services/ai.service';
import { extractItemsWithQuantity, cleanAiResponse, hasSpecialCommand, processMultipleCommands } from "./utils/parser.util";
import { ERROR_MESSAGES } from './constants/messages.const';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { MenuItem, APIResponse, ChatMessage } from './types';

// Configurações
const AI_CONFIG = {
  model: 'openai/gpt-4.1',
  temperature: 0.7,
  top_p: 1
};

// Menu temporário (substituir por BD)
const MENU: MenuItem[] = [
  { id: 3, nome: 'Hamburguer' },
  { id: 4, nome: 'Pastel' }
];

export async function POST(req: NextRequest) {
  try {
    const { messages, currentOrder } = await req.json();

    // Inicializa serviços
    const orderService = new OrderService(currentOrder);
    const aiService = new AIService(
      process.env.OPEN_API_KEY || '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',
      'https://models.github.ai/inference',
      AI_CONFIG
    );

    // Gera resposta da IA
    const orderSummary = orderService.getOrderSummary(MENU);
    const aiResponse = await aiService.generateResponse(messages, MENU, orderSummary);
    console.log(aiResponse)
    const cleanResponse = cleanAiResponse(aiResponse);

    // Processa comandos especiais
    if (hasSpecialCommand(aiResponse, 'itemNaoEncontrado')) {
      return jsonResponse('error', ERROR_MESSAGES.ITEM_NOT_FOUND);
    }

    if (hasSpecialCommand(aiResponse, 'pedidoCancelado')) {
      if (Object.keys(orderService.getCurrentOrder()).length === 0) {
        return jsonResponse('error', ERROR_MESSAGES.INVALID_REQUEST);
      }
      orderService.clearOrder();
      return jsonResponse('error', ERROR_MESSAGES.ORDER_CANCELLED);
    }

    // Processa múltiplos comandos na mesma resposta
    const commands = processMultipleCommands(aiResponse, MENU);
    
    if (commands.length > 0) {
      for (const command of commands) {
        if (command.type === 'remove' && command.toDelete) {
            const idsToDelete = command.toDelete.map(item => item.id);  // Extrai os IDs de todos os itens
            orderService.deleteItems(idsToDelete);  // Passa o array de IDs para deleteItems
        } else {
          command.items.forEach((item: { id: number; quant: number; }) => {
            // Para edição, primeiro remove a quantidade existente
            const currentQuant = orderService.getCurrentOrder()[item.id]?.quant || 0;
            orderService.removeItem(item.id, currentQuant);
            orderService.addItem(item.id, item.quant);
            console.log("fui editado: " + orderService)
          });
        }
      }
    } else {
      // Processamento padrão se não houver comandos explícitos
      const extractedItems = extractItemsWithQuantity(aiResponse, MENU);
      console.log(extractedItems)
      orderService.updateItems(extractedItems);
      console.log(orderService)
    }   
    // Retorna resposta
    return NextResponse.json({
      status: 'success',
      message: cleanResponse,
      currentOrder: orderService.getCurrentOrder()
    });

  } catch (error) {
    console.error('API Error:', error);
    return jsonResponse('error', 'Ocorreu um erro ao processar seu pedido. Por favor, tente novamente.');
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function jsonResponse(status: 'success' | 'error', message: string, data?: any): NextResponse {
  return NextResponse.json({ status, message, ...(data && { data }) });
}