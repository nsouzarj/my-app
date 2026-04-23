/**
 * Utilitários para formatação e manipulação de valores monetários (BRL).
 */

/**
 * Converte um valor numérico para string formatada em Real (R$).
 */
export const formatToBRL = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

/**
 * Converte um valor numérico para string formatada apenas com decimais (0,00).
 */
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

/**
 * Transforma uma string de entrada em um valor monetário formatado (máscara de digitação).
 * Ex: "9999" -> "99,99"
 */
export const maskCurrency = (value: string | number): string => {
    if (value === undefined || value === null) return '0,00';
    
    // Converte para string se for número
    const stringValue = typeof value === 'number' ? value.toFixed(2).replace('.', '') : value;
    
    // Remove tudo que não é dígito
    const cleanValue = stringValue.replace(/\D/g, '');
    
    // Converte para número e divide por 100 para ter as decimais
    const numberValue = parseInt(cleanValue || '0', 10) / 100;
    
    return formatCurrency(numberValue);
};

/**
 * Converte uma string formatada (ex: "1.234,56") de volta para número.
 */
export const parseCurrencyToNumber = (value: string): number => {
    // Remove pontos (milhar) e troca vírgula por ponto (decimal)
    const cleanValue = value
        .replace(/\./g, '')
        .replace(',', '.');
    
    return parseFloat(cleanValue) || 0;
};
