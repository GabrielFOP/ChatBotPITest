export const ITEM_REGEX = [
    { 
      regex: '{item}s?.*?\\(.*?quantidade\\s*[:=]\\s*(\\d+)\\)',
      groupIndex: 1 
    },
    { 
      regex: 'mais\\s*(\\d+)\\s*{item}s?',
      groupIndex: 1 
    },
    { 
      regex: '(?:\\b|\\D)(\\d+)\\s*{item}s?\\b',
      groupIndex: 1 
    }
  ];