"use client"
import React, { useRef, useState, useEffect } from "react";

interface Conversation {
  role: string;
  content: string;
}

interface OrderState {
  currentOrder: Record<number, { quant: number }>;
  orderConfirmed: boolean;
  paymentMethod?: string;
}

export default function ChatInterface() {
  const [inputValue, setInputValue] = useState<string>("");
  const [conversation, setConversation] = useState<Conversation[]>([]);
  const [orderState, setOrderState] = useState<OrderState>({
    currentOrder: {},
    orderConfirmed: false,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Rola para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    try {
      setIsLoading(true);
      const userMessage = { role: "user", content: inputValue };
      const updatedConversation = [...conversation, userMessage];
      
      setConversation(updatedConversation);
      setInputValue("");

      const response = await fetch("/api/openAIChat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: updatedConversation,
          currentOrder: orderState.currentOrder 
        }),
      });

      const data = await response.json();

      if (data.status === "error") {
        setConversation([...updatedConversation, { 
          role: "assistant", 
          content: data.message 
        }]);
      } else {
        setConversation([...updatedConversation, { 
          role: "assistant", 
          content: data.message 
        }]);
        
        // Atualiza o estado do pedido se retornado pelo backend
        if (data.currentOrder) {
          setOrderState(prev => ({ 
            ...prev, 
            currentOrder: data.currentOrder 
          }));
        }

        // Marca como confirmado se for a mensagem de confirmação
        if (data.message.includes("Pedido confirmado com sucesso")) {
          setOrderState(prev => ({ ...prev, orderConfirmed: true }));
        }

        // Captura método de pagamento
        if (data.message.includes("Qual será a forma de pagamento?")) {
          const paymentMethod = inputValue.trim().toLowerCase();
          if (["dinheiro", "cartão", "pix"].includes(paymentMethod)) {
            setOrderState(prev => ({ ...prev, paymentMethod }));
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setConversation([...conversation, { 
        role: "assistant", 
        content: "Desculpe, houve um erro ao processar sua solicitação. Tente novamente." 
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const resetConversation = () => {
    setConversation([]);
    setOrderState({ currentOrder: {}, orderConfirmed: false });
    setInputValue("");
    inputRef.current?.focus();
  };

  // Componente de mensagem reutilizável
  const MessageBubble = ({ role, content }: Conversation) => {
    const isAssistant = role === "assistant";
    return (
      <div className={`chat ${isAssistant ? 'chat-end' : 'chat-start'}`}>
        <div className={`chat-bubble ${isAssistant ? 'chat-bubble-secondary' : 'chat-bubble-primary'}`}>
          <strong className="badge badge-primary">
            {isAssistant ? 'Atendente' : 'Você'}
          </strong>
          <div className="mt-1 whitespace-pre-wrap">{content}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-4xl font-bold text-center my-6">Faça seu Pedido</h1>
      
      {/* Área de conversa */}
      <div className="bg-base-200 rounded-lg p-4 h-96 overflow-y-auto mb-4">
        {conversation.length === 0 ? (
          <div className="text-center text-gray-500 h-full flex items-center justify-center">
            <p>Digite seu pedido para começar...</p>
          </div>
        ) : (
          conversation.map((msg, index) => (
            <MessageBubble key={index} role={msg.role} content={msg.content} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Controles */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder={isLoading ? "Processando..." : "Digite sua mensagem..."}
          className="input input-bordered flex-1"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button
          className="btn btn-primary"
          onClick={handleSendMessage}
          disabled={isLoading || !inputValue.trim()}
        >
          {isLoading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            "Enviar"
          )}
        </button>
        <button className="btn btn-outline" onClick={resetConversation}>
          Novo Pedido
        </button>
      </div>

      {/* Resumo do Pedido (opcional) */}
      {Object.keys(orderState.currentOrder).length > 0 && (
        <div className="mt-6 bg-base-100 p-4 rounded-lg">
          <h2 className="font-bold mb-2">Seu Pedido Atual:</h2>
          <ul>
            {Object.entries(orderState.currentOrder).map(([id, item]) => (
              <li key={id}>
                Item {id}: {item.quant}x
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}