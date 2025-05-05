import { NextRequest, NextResponse } from 'next/server';
import OpenAI from "openai";

const token = process.env.OPEN_API_KEY;
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1";

const openai = new OpenAI({
  baseURL: endpoint,
  apiKey: token,
});

//Tudo aqui nesse bloco apenas teste vai tudo embora com a implementação do BD

const cardapio = [
  { nome: "Hamburguer", id: 3 },
  { nome: "Pastel", id: 4 }
];

type ItemPedido = {
  quant: number;
};

const pedido: Record<number, ItemPedido> = {};

function adicionarItem(id: number, quant: number) {
  if (pedido[id]) {
    pedido[id].quant += quant;
  } else {
    pedido[id] = { quant };
  }
}

function removerItem(id: number, quant: number) {
  if (pedido[id]) {
    pedido[id].quant -= quant;
    if (pedido[id].quant <= 0) {
      delete pedido[id];
    }
  }
}




function gerarResumoPedido(pedido: Record<number, ItemPedido>, cardapio: { id: number, nome: string }[]) {
  const resumo: string[] = [];
  for (const [id, item] of Object.entries(pedido)) {
    const encontrado = cardapio.find((c) => c.id === Number(id));
    if (encontrado) {
      resumo.push(`- ${encontrado.nome} (quantidade: ${item.quant})`);
    }
  }
  return resumo.length > 0
    ? `Itens já adicionados ao pedido:\n${resumo.join("\n")}`
    : "Nenhum item foi adicionado ao pedido ainda.";
}

// Tudo aqui nesse bloco apenas teste vai tudo embora com a implementação do BD


function extrairItensComQuantidade(resposta: string, cardapio: { nome: string; id: number }[], permitirSemQuantidade = false) {
  const itensExtraidos: { id: number; quant: number }[] = [];

  // Filtra apenas o trecho antes da frase-chave "Deseja adicionar mais itens ao pedido?"
  const respostaRelevante = resposta.split("Deseja adicionar mais itens ao pedido?")[0] ?? resposta;

  for (const item of cardapio) {
    const nomeLower = item.nome.toLowerCase();
    const texto = respostaRelevante.toLowerCase();
   

    const regexQuantidadeAntes = new RegExp(`(?:\\b|\\D)(\\d+)\\s*${nomeLower}s?\\b`, "i");
    const regexParenteses = new RegExp(`${nomeLower}s?.*?\\(.*?quantidade\\s*[:=]\\s*(\\d+)\\)`, "i");
    const regexMais = new RegExp(`mais\\s*(\\d+)\\s*${nomeLower}s?`, "i");
    

    let quantidade = 0;

    const matchParenteses = texto.match(regexParenteses);
    const matchMais = texto.match(regexMais);
    const matchAntes = texto.match(regexQuantidadeAntes);

    if (matchParenteses) {
      quantidade = parseInt(matchParenteses[1]);
    } else if (matchMais) {
      quantidade = parseInt(matchMais[1]);
    } else if (matchAntes) {
      quantidade = parseInt(matchAntes[1]);
    } else if (texto.includes(nomeLower)) {
      quantidade = 1;
    }

    if (!isNaN(quantidade) && quantidade > 0) {
      itensExtraidos.push({ id: item.id, quant: quantidade });
    } else if (permitirSemQuantidade && texto.includes(nomeLower)) {
      
      itensExtraidos.push({ id: item.id, quant: 0 });
    }
  }

  return itensExtraidos;
}


export async function POST(req: NextRequest) {
  const body = await req.json();
  const resumoPedido = gerarResumoPedido(pedido, cardapio);

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `
Você é um chatbot de restaurante responsável por registrar pedidos e guiar o cliente até a finalização. Sempre siga rigorosamente as etapas abaixo e utilize as frases indicadas. Evite sair da ordem.

[INSTRUÇÃO AO SISTEMA]
Este é o cardápio atual do restaurante. Sempre use este cardápio como base para validar pedidos. Tente reconhecer e corrigir possíveis erros de digitação ou variações nos nomes dos itens. 
Cardápio:
${cardapio.map((item) => `- ${item.nome}`).join("\n")}

${resumoPedido}

- Sempre considere o estado atual do pedido ao interpretar novas mensagens.
- Se o cliente disser "mais X [item]", adicione essa quantidade ao item já presente no pedido (ou inicie um novo caso ainda não exista).

Te passei o cardapio de nosso restaurante sempre que o cliente fizer o pedido quero que se baseie nele para verificar se esse condiz com o que ofercemos, 
por favor tente fazer aproximações caso a entrada do cliente,mesmo que mal escrita, se aproxime com a de um item presente no cardapio.

**Caso mesmo com aproximaçoes você não ache o item no cardapio me retorne a mensagem [itemNaoEncontrado].**

ETAPA 1 - RECEBER PEDIDO:
- Aguarde o cliente informar um ou mais itens do cardápio.
- Após o cliente escrever o pedido, confirme o(s) item(ns) mencionando os nomes exatos.
- Termine com a frase: "Deseja adicionar mais itens ao pedido?"

ETAPA 2 - ADICIONAR MAIS ITENS:
- Se o cliente disser que sim, espere novos itens e repita a confirmação.
- Se o cliente disser que não quer adicionar mais itens, gere um recibo com a lista completa dos itens pedidos.
- Em seguida, pergunte: "Podemos confirmar este pedido ou deseja cancelar?"

ETAPA 3 - CONFIRMAÇÃO:
- Se o cliente confirmar, diga: "Pedido confirmado com sucesso."
- Em seguida, pergunte: "Qual será a forma de pagamento? (Dinheiro, Cartão ou Pix)"

ETAPA 4 - PAGAMENTO:
- Receba a forma de pagamento informada pelo cliente.
- Finalize com: "Pedido finalizado! Agradecemos a preferência."

IMPORTANTE:
- Nunca pule etapas.
- Sempre use as frases-chave indicadas acima (elas serão usadas pelo sistema para controle automático).
- Não crie variações dessas frases.
- Mantenha respostas diretas, objetivas e amigáveis.
- Você deve seguir exclusivamente esse fluxo, quaisquer perguntas ou conversas que fujam dele devem ser ignoradas, você pode enviar a seguinte mensagem "Desculpe, não posso te atender com isso. Por favor realize seu pedido!"
- Tudo o que estiver entre colchetes "[]" será interpretado diretamente pelo sistema/backend e **não deve ser mostrado ao usuário**
- Apos pedir ao menos um item o usuário pode pedir para cancelar, me envie a mensagem [pedidoCancelado]. 
  Caso o usuário tente cancelar sem ter pedido ao menos um item não me envie a mensagem e apenas responda "Desculpe, não posso te atender com isso. Por favor realize seu pedido!".
- Se o cliente pedir para **editar a quantidade de um item já adicionado**, envie [editarItem].
- Se o cliente pedir para **remover um item já adicionado**, envie [removerItem].
- Após responder com [editarItem] ou [removerItem], inclua na resposta a nova quantidade ou confirmação da remoção em texto claro para o usuário, como: "Quantidade de Hamburguer atualizada para 1." ou "Item Pastel removido do pedido."
- Se o cliente combinar ações (como adicionar e remover ao mesmo tempo), processe todas as ações.
- Use múltiplos marcadores conforme necessário, como [removerItem][editarItem].
`
      },
      ...body.messages,
    ],
    temperature: 0.7,
    top_p: 1,
    model: model,
  });

  const GPTResponse = completion.choices[0]?.message?.content || "";
  let messageToUser = GPTResponse

  if (messageToUser && /\[.*?\]/g.test(messageToUser)) {
  messageToUser = messageToUser.replace(/\[.*?\]/g, ''); // Remove qualquer tag como [removerItem]
}

  console.log(GPTResponse);

  if (GPTResponse === "[itemNaoEncontrado]") {
    return NextResponse.json({
      result: {
        status: "error",
        message: "Desculpe, não identifiquei nenhum dos itens que você informou em nosso cardápio. Poderia me informá-los novamente, por favor?"
      }
    });
  } else {
    const verifiedItens = extrairItensComQuantidade(GPTResponse, cardapio);

    console.log(verifiedItens)

    if (GPTResponse === "[pedidoCancelado]") {
      const isVazio = Object.keys(pedido).length === 0;
      if (isVazio) {
        return NextResponse.json({
          result: {
            status: "error",
            message: "Desculpe, não posso te atender com isso. Por favor realize seu pedido!"
          }
        });
      }
      return NextResponse.json({
        result: {
          status: "error",
          message: "Pedido cancelado. Se quiser começar de novo, é só me avisar."
        }
      });
    }

    if (GPTResponse.includes("[removerItem]")) {
      const itensRemover = extrairItensComQuantidade(GPTResponse, cardapio, true);
      for (const item of itensRemover) {
        removerItem(item.id, item.quant);
      }
    }
    
    if (GPTResponse.includes("[editarItem]")) {
      const itensEditar = extrairItensComQuantidade(GPTResponse, cardapio);
      for (const item of itensEditar) {
        pedido[item.id] = { quant: item.quant };
      }
    }

    for (const item of verifiedItens) {
      adicionarItem(item.id, item.quant);
    }

    return NextResponse.json({
      result: {
        ...completion, // Mantém o resto da estrutura original
        choices: [
          {
            ...completion.choices[0],
            message: {
              ...completion.choices[0].message,
              content: messageToUser, // Substitui apenas o conteúdo da mensagem
            },
          },
        ],
      },
    });



  }
}
