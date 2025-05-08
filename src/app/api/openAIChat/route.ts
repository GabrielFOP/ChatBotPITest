import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from './services/order.service';
import { AIService } from './services/ai.service';
import { extractItemsWithQuantity, cleanAiResponse, hasSpecialCommand } from "./utils/parser.util";
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
      process.env.OPEN_API_KEY || '',
      'https://models.github.ai/inference',
      AI_CONFIG
    );

    // Gera resposta da IA
    const orderSummary = orderService.getOrderSummary(MENU);
    const aiResponse = await aiService.generateResponse(messages, MENU, orderSummary);
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

    // Processa itens do pedido
    const extractedItems = extractItemsWithQuantity(aiResponse, MENU);
    orderService.updateItems(extractedItems);

    if (hasSpecialCommand(aiResponse, 'removerItem')) {
      const itemsToRemove = extractItemsWithQuantity(aiResponse, MENU, true);
      itemsToRemove.forEach((item: { id: number; quant: number; }) => orderService.removeItem(item.id, item.quant));
    }

    if (hasSpecialCommand(aiResponse, 'editarItem')) {
      const itemsToEdit = extractItemsWithQuantity(aiResponse, MENU);
      itemsToEdit.forEach((item: { id: number; quant: number; }) => {
        orderService.removeItem(item.id, orderService.getCurrentOrder()[item.id]?.quant || 0);
        orderService.addItem(item.id, item.quant);
      });
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