export const ITEM_REGEX = [
  { 
    regex: '{item}s?.*?\\(.*?quantidade\\s*[:=]\\s*(\\d+)\\)',
    groupIndex: 1,
    description: "Captura '3 hambúrgueres (quantidade: 3)'"
  },
  { 
    regex: 'mais\\s*(\\d+)\\s*{item}[a-z]*',
    groupIndex: 1,
    description: "Captura 'mais 2 hamburgueras' (com plural e erros de digitação)"
  },
  { 
    regex: '(?:\\b|\\D)(\\d+)\\s*{item}[a-z]*\\b',
    groupIndex: 1,
    description: "Captura '3 hambúrguer' (forma básica)"
  },
  {
    regex: 'adicionar\\s*(\\d+)\\s*{item}[a-z]*',
    groupIndex: 1,
    description: "Captura 'adicionar 2 hambúrgueres'"
  },
  {
    regex: 'quero\\s*(\\d+)\\s*{item}[a-z]*',
    groupIndex: 1,
    description: "Captura 'quero 1 hamburguesa'"
  },
  {
    regex: 'pedir\\s*(\\d+)\\s*{item}[a-z]*',
    groupIndex: 1,
    description: "Captura 'pedir 4 hambúrgueres'"
  },
  {
    regex: '{item}[a-z]*\\s*[:=]?\\s*(\\d+)',
    groupIndex: 1,
    description: "Captura 'hamburgueras: 2' ou 'hambúrguer=1'"
  },
  {
    regex: '(\\d+)\\s*{item}[a-z]*',
    groupIndex: 1,
    description: "Captura genérica '5 hambúrgueres'"
  }
];