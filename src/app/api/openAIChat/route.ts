import { NextRequest, NextResponse } from 'next/server';
import OpenAI from "openai";

const token = process.env.OPEN_API_KEY;
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1";

const openai = new OpenAI({
  baseURL: endpoint,
  apiKey: token,
});

const cardapio = [  
 
 {nome: "Hamburguer", id: 3},
 {nome: "Pastel", id: 4}

]


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extrairItensDaRespostaGPT(resposta: string, cardapio: any[]): string[] {
  const respostaLower = resposta.toLowerCase();
  const itensReconhecidos: string[] = [];

  for (const item of cardapio) {
    if (respostaLower.includes(item.nome.toLowerCase())) {
      itensReconhecidos.push(item.nome);
    }
  }

  return itensReconhecidos;
}




export async function POST(req: NextRequest) {
  const body = await req.json();

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
`
      },
      ...body.messages,
    ],
    temperature: 0.7,
    top_p: 1,
    model: model,
  });

  const GPTResponse = completion.choices[0]?.message?.content || ""

  console.log(GPTResponse)

  if(GPTResponse === "[itemNaoEncontrado]"){ // caso item não encontrado
    return NextResponse.json({
      result: {
        status: "error",
        message: "Desculpe, não identifiquei nenhum dos itens que você informou em nosso cardápio. Poderia me informá-los novamente, por favor?"
      }
    })
  }else{ // Fluxo básico 
    
    const verifiedItens = extrairItensDaRespostaGPT(GPTResponse, cardapio)

    for(const item of verifiedItens){
      if(!item){ //Verificação em duas etapas, eliminar possiveis erros do gpt

        // inserir controle do db 

        return NextResponse.json({
          result: {
            status: "error",
            message: "Desculpe, não identifiquei nenhum dos itens que você informou em nosso cardápio. Poderia me informá-los novamente, por favor?"
          }
        })
      }
    }

    if(GPTResponse === "[pedidoCancelado]"){
      // inserir controle do db 

      return NextResponse.json({
        result: {
          status: "error",
          message: "Pedido cancelado. Se quiser começar de novo, é só me avisar."
        }
      })

    }


    //Vou adicionar o processo de editar ou cancelar um item ainda



    return NextResponse.json({ result: completion }); // retorno ideal. 
  }


}