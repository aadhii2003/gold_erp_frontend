export const calculateDensity = (actualProcessWeight: number, secondProcessWeight: number) => {
    if (actualProcessWeight - secondProcessWeight === 0) return 0;
    return actualProcessWeight / (actualProcessWeight - secondProcessWeight);
};

export const calculatePurity = (density: number) => {
    if (density >= 19.3) return 100.0;
    if (density <= 10.5) return 0.0;
    
    // Physics-based interpolation with clamp
    const factor = (1/density - 1/10.5) / (1/19.3 - 1/10.5);
    return Math.max(0, Math.min(factor * 100, 100));
};

export const calculateUnitPrice = (marketPrice: number, additions: number = 0) => {
    // Return unit price per 1/3 Tola as per requirement
    return (marketPrice + additions) / 3;
};

export const calculateSubtotal = (unitPrice: number, purity: number, weightInGrams: number) => {
    // Subtotal = (UnitPrice * 3 * (Purity / 100)) * (Weight / 11.664)
    // UnitPrice * 3 = Price per 1 Tola
    // Weight / 11.664 = Grams converted to Tola
    return (unitPrice * 3 * (purity / 100)) * (weightInGrams / 11.664);
};
